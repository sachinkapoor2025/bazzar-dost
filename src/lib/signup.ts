import "server-only";
import { hashPassword } from "@/lib/auth";
import { prisma, databaseConfigured, isUniqueConstraint } from "@/lib/db";
import { mailConfigured, sendMail } from "@/lib/mail";
import { roleForEmail } from "@/lib/staff";
import {
  MAX_OTP_ATTEMPTS,
  OTP_TTL_MS,
  RESEND_COOLDOWN_MS,
  assessOtp,
  createOtpCode,
  hashOtp,
  resendWaitSeconds,
} from "@/lib/signup-otp";

export type SignupFailure = { ok: false; status: number; error: string; resendIn?: number };
export type SignupPending = { ok: true; email: string; resendIn: number; message: string };
export type SignupVerified = { ok: true; userId: string; role: string; message: string };

type Mailer = (to: string, subject: string, text: string) => Promise<boolean>;

const MAIL_MISSING = "Email verification is not set up yet, so a new account cannot be created.";
const MAIL_FAILED = "The verification email could not be sent. Try again in a minute.";
const ACCOUNTS_OFF = "Accounts are not configured.";
function registrationConfigError(): SignupFailure | null {
  const missing = [
    databaseConfigured() ? "" : "a PostgreSQL DATABASE_URL",
    mailConfigured() ? "" : "SMTP_HOST, SMTP_PORT, and SMTP_FROM",
  ].filter(Boolean);
  if (missing.length === 0) return null;
  return {
    ok: false,
    status: 503,
    error: `Registration cannot send a verification code yet. Add ${missing.join(" and ")}.`,
  };
}
const DUPLICATE = "An account with this email already exists.";
const RESTART = "Start registration again. That code is no longer valid.";

function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return secret;
}

function otpMessage(email: string, otp: string): string {
  return `Your BazaarDost verification code is ${otp}.\nIt expires in 5 minutes.\nIf you did not create an account, you can ignore this email.\n`;
}

async function deliverOtp(email: string, otp: string, send: Mailer): Promise<SignupFailure | null> {
  try {
    const sent = await send(email, "Your BazaarDost verification code", otpMessage(email, otp));
    if (!sent) return { ok: false, status: 503, error: MAIL_MISSING };
    return null;
  } catch (error) {
    console.error(error);
    return { ok: false, status: 503, error: MAIL_FAILED };
  }
}

export async function startSignup(
  input: { name: string; email: string; phone: string; password: string },
  send: Mailer = sendMail,
): Promise<SignupPending | SignupFailure> {
  const secret = sessionSecret();
  if (!secret) return { ok: false, status: 500, error: ACCOUNTS_OFF };
  const configError = registrationConfigError();
  if (configError) return configError;

  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { ok: false, status: 400, error: DUPLICATE };

  const now = Date.now();
  const pending = await prisma.signupChallenge.findUnique({ where: { email } });
  if (pending && pending.expiresAt.getTime() > now && pending.resendAt.getTime() > now) {
    const resendIn = resendWaitSeconds(pending.resendAt, now);
    return {
      ok: true,
      email,
      resendIn,
      message: `A code was already sent to ${email}. You can request another in ${resendIn} seconds.`,
    };
  }

  const passwordHash = await hashPassword(input.password);

  const otp = createOtpCode();
  const failure = await deliverOtp(email, otp, send);
  if (failure) return failure;

  const data = {
    name: input.name,
    phone: input.phone,
    passwordHash,
    otpHash: hashOtp(email, otp, secret),
    expiresAt: new Date(now + OTP_TTL_MS),
    resendAt: new Date(now + RESEND_COOLDOWN_MS),
    attempts: 0,
  };
  await prisma.signupChallenge.upsert({
    where: { email },
    create: { email, ...data },
    update: data,
  });
  return {
    ok: true,
    email,
    resendIn: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    message: `We sent a 6-digit code to ${email}. It expires in 5 minutes.`,
  };
}

export async function resendSignup(emailInput: string, send: Mailer = sendMail): Promise<SignupPending | SignupFailure> {
  const secret = sessionSecret();
  if (!secret) return { ok: false, status: 500, error: ACCOUNTS_OFF };
  const configError = registrationConfigError();
  if (configError) return configError;

  const email = emailInput.toLowerCase();
  const pending = await prisma.signupChallenge.findUnique({ where: { email } });
  if (!pending) return { ok: false, status: 400, error: RESTART };

  const now = Date.now();
  const resendIn = resendWaitSeconds(pending.resendAt, now);
  if (resendIn > 0) {
    return { ok: false, status: 429, error: `Wait ${resendIn} seconds before requesting another code.`, resendIn };
  }

  const otp = createOtpCode();
  const failure = await deliverOtp(email, otp, send);
  if (failure) return failure;

  await prisma.signupChallenge.update({
    where: { email },
    data: {
      otpHash: hashOtp(email, otp, secret),
      expiresAt: new Date(now + OTP_TTL_MS),
      resendAt: new Date(now + RESEND_COOLDOWN_MS),
      attempts: 0,
    },
  });
  return {
    ok: true,
    email,
    resendIn: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    message: `A new code was sent to ${email}. It expires in 5 minutes.`,
  };
}

export async function verifySignup(emailInput: string, otp: string): Promise<SignupVerified | SignupFailure> {
  const secret = sessionSecret();
  if (!secret) return { ok: false, status: 500, error: ACCOUNTS_OFF };
  if (!databaseConfigured()) {
    return { ok: false, status: 503, error: "The account database is not configured, so registration cannot be completed." };
  }

  const email = emailInput.toLowerCase();
  const pending = await prisma.signupChallenge.findUnique({ where: { email } });
  if (!pending) return { ok: false, status: 400, error: RESTART };

  const assessment = assessOtp({
    expiresAt: pending.expiresAt,
    attempts: pending.attempts,
    email,
    otp,
    secret,
    otpHash: pending.otpHash,
  });
  if (!assessment.ok) {
    if (assessment.reason === "expired") {
      return { ok: false, status: 400, error: "That code has expired. Request a new one." };
    }
    if (assessment.reason === "locked") {
      return { ok: false, status: 400, error: "Too many incorrect codes. Request a new one." };
    }
    const updated = await prisma.signupChallenge.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    if (updated.attempts >= MAX_OTP_ATTEMPTS) {
      return { ok: false, status: 400, error: "Too many incorrect codes. Request a new one." };
    }
    return { ok: false, status: 400, error: "That code is not correct." };
  }

  try {
    const user = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.user.findUnique({ where: { email }, select: { id: true } });
      if (duplicate) {
        await tx.signupChallenge.delete({ where: { email } });
        return null;
      }
      const created = await tx.user.create({
        data: {
          email,
          name: pending.name,
          phone: pending.phone,
          passwordHash: pending.passwordHash,
          role: roleForEmail(email),
        },
      });
      await tx.signupChallenge.delete({ where: { email } });
      return created;
    });
    if (!user) return { ok: false, status: 400, error: DUPLICATE };
    return { ok: true, userId: user.id, role: user.role, message: "Email verified. Your account is ready." };
  } catch (error) {
    if (isUniqueConstraint(error)) return { ok: false, status: 400, error: DUPLICATE };
    throw error;
  }
}
