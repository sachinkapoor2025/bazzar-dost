import { builtSessionSecret } from "@/generated/session-secret";

export const SESSION_COOKIE = "bd_session";

export function getSessionSecret(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET || builtSessionSecret || "";
  if (secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}
