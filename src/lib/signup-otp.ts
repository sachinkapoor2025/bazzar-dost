import crypto from "node:crypto";

export const OTP_TTL_MS = 5 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;

export function createOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(email: string, otp: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`${email.trim().toLowerCase()}:${otp}`).digest("hex");
}

export function otpMatches(email: string, otp: string, secret: string, otpHash: string): boolean {
  const next = hashOtp(email, otp, secret);
  const left = Buffer.from(next);
  const right = Buffer.from(otpHash);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function resendWaitSeconds(resendAt: Date, now = Date.now()): number {
  return Math.max(0, Math.ceil((resendAt.getTime() - now) / 1000));
}

export type OtpCheck = { ok: true } | { ok: false; reason: "expired" | "locked" | "invalid" };

export function assessOtp(input: {
  expiresAt: Date;
  attempts: number;
  email: string;
  otp: string;
  secret: string;
  otpHash: string;
  now?: number;
}): OtpCheck {
  const now = input.now ?? Date.now();
  if (input.expiresAt.getTime() <= now) return { ok: false, reason: "expired" };
  if (input.attempts >= MAX_OTP_ATTEMPTS) return { ok: false, reason: "locked" };
  if (!otpMatches(input.email, input.otp, input.secret, input.otpHash)) return { ok: false, reason: "invalid" };
  return { ok: true };
}
