import "server-only";
import { api } from "@/lib/backend";
import { mailConfigured, sendMail } from "@/lib/mail";
import { createOtpCode, hashOtp, OTP_TTL_MS, resendWaitSeconds } from "@/lib/signup-otp";
import type { PublicUser } from "@/lib/types";

const mailError = "Registration cannot send a verification code yet. Add SMTP_HOST, SMTP_PORT, and SMTP_FROM.";

function sessionSecret(): string {
  return process.env.SESSION_SECRET || "";
}

function codeMessage(otp: string): string {
  return `Your BazaarDost verification code is ${otp}. It expires in 5 minutes. If you did not create an account, you can ignore this email.`;
}

async function deliver(email: string, otp: string): Promise<boolean> {
  return sendMail(email, "Your BazaarDost verification code", codeMessage(otp));
}

export async function startLiveSignup(input: { email: string; name: string; phone: string; password: string }): Promise<
  { ok: true; resendIn: number; message: string } | { ok: false; status: number; error: string }
> {
  if (!mailConfigured()) return { ok: false, status: 503, error: mailError };
  const email = input.email.toLowerCase();
  const otp = createOtpCode();
  const result = await api<{ status: "sent" | "cooldown"; resendAt: string }>("/auth/signup/start", {
    body: {
      email,
      name: input.name,
      phone: input.phone,
      password: input.password,
      otpHash: hashOtp(email, otp, sessionSecret()),
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    },
  });
  if (result.status === "sent") {
    const sent = await deliver(email, otp);
    if (!sent) return { ok: false, status: 503, error: mailError };
  }
  return {
    ok: true,
    resendIn: resendWaitSeconds(new Date(result.resendAt)),
    message: result.status === "sent"
      ? "We sent a 6-digit code to your email."
      : "A code was already sent. You can request another when the timer ends.",
  };
}

export async function resendLiveSignup(emailInput: string): Promise<
  { ok: true; resendIn: number; message: string } | { ok: false; status: number; error: string; resendIn?: number }
> {
  if (!mailConfigured()) return { ok: false, status: 503, error: mailError };
  const email = emailInput.toLowerCase();
  const otp = createOtpCode();
  const result = await api<{ status: "sent" | "cooldown"; resendAt: string }>("/auth/signup/resend", {
    body: {
      email,
      otpHash: hashOtp(email, otp, sessionSecret()),
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    },
  });
  const resendIn = resendWaitSeconds(new Date(result.resendAt));
  if (result.status === "cooldown") {
    return { ok: false, status: 429, error: `Wait ${resendIn} seconds before requesting another code.`, resendIn };
  }
  const sent = await deliver(email, otp);
  if (!sent) return { ok: false, status: 503, error: mailError };
  return { ok: true, resendIn, message: "A new code was sent." };
}

export async function verifyLiveSignup(emailInput: string, otp: string): Promise<PublicUser> {
  const email = emailInput.toLowerCase();
  return api<PublicUser>("/auth/signup/verify", {
    body: { email, otpHash: hashOtp(email, otp, sessionSecret()) },
  });
}
