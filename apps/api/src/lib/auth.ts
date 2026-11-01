import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { decodeJwt, jwtVerify } from "jose";
import { getUser } from "./store";
import type { PublicUser } from "./types";

export async function readUser(event: APIGatewayProxyEventV2): Promise<PublicUser | null> {
  const header = event.headers?.authorization ?? event.headers?.Authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      if (payload.sub) {
        const user = await getUser(payload.sub);
        if (user) return { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role };
      }
    } catch {
      // A Cognito token is checked below when this is not a shop session cookie.
    }
  }
  try {
    const payload = decodeJwt(token);
    const pool = process.env.COGNITO_USER_POOL_ID;
    if (!pool || !String(payload.iss ?? "").includes(pool)) return null;
    const groups = Array.isArray(payload["cognito:groups"]) ? (payload["cognito:groups"] as string[]) : [];
    return {
      id: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? payload.email ?? "Customer"),
      phone: "",
      role: groups.includes("admin") ? "admin" : "customer",
    };
  } catch {
    return null;
  }
}

export async function requireUser(event: APIGatewayProxyEventV2): Promise<PublicUser | null> {
  return readUser(event);
}

export async function requireAdmin(event: APIGatewayProxyEventV2): Promise<PublicUser | null> {
  const user = await readUser(event);
  if (!user || user.role !== "admin") return null;
  return user;
}
