import { builtSessionSecret } from "@/generated/session-secret";

export const SESSION_COOKIE = "bd_session";

export function getSessionSecret(): Uint8Array | null {
  const fromEnv = process.env.SESSION_SECRET || "";
  const fromBuild = builtSessionSecret || "";
  const secret = fromEnv.length >= 32 ? fromEnv : fromBuild;
  if (secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}
