import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/secret";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function apiBase(): string {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const headers = new Headers();
  if (init?.body !== undefined) headers.set("content-type", "application/json");
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) headers.set("authorization", `Bearer ${token}`);
  } catch {
    // Catalogue reads can run without a request cookie jar.
  }
  const response = await fetch(`${apiBase()}${path}`, {
    method: init?.method ?? (init?.body === undefined ? "GET" : "POST"),
    headers,
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as { error?: string }) : null;
  if (!response.ok) throw new ApiError(data?.error || "Request failed.", response.status);
  return data as T;
}
