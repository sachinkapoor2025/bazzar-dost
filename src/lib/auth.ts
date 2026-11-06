import "server-only";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { api } from "@/lib/backend";
import { getSessionSecret, SESSION_COOKIE } from "@/lib/secret";
import type { PublicUser } from "@/lib/types";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};

export async function signSession(userId: string, role = "customer"): Promise<string | null> {
  const secret = getSessionSecret();
  if (!secret) return null;
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret);
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions);
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const secret = getSessionSecret();
  if (!secret) return null;
  const jar = await cookies();
  if (!jar.get(SESSION_COOKIE)?.value) return null;
  try {
    return await api<PublicUser>("/auth/me");
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    const error = new Error("Sign in required.");
    (error as Error & { status?: number }).status = 401;
    throw error;
  }
  return user;
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    const error = new Error("Admin access is required.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
  return user;
}
