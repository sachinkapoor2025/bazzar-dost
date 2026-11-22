import "server-only";
import nodemailer from "nodemailer";
import { readSingleton, saveSingleton } from "@/lib/admin-records";

type MailConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  source: "environment" | "saved";
};

const MAIL_KIND = "mail";
let cached: { at: number; config: MailConfig | null } | null = null;

function envValue(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

function fromEnvironment(): MailConfig | null {
  const host = envValue("SMTP_HOST", "MARKETING_SMTP_HOST");
  const portText = envValue("SMTP_PORT", "MARKETING_SMTP_PORT") || (host ? "587" : "");
  const from = envValue("SMTP_FROM", "MARKETING_SMTP_FROM");
  const user = envValue("SMTP_USER", "MARKETING_SMTP_USER");
  const pass = envValue("SMTP_PASSWORD", "SMTP_PASS", "MARKETING_SMTP_PASSWORD", "MARKETING_SMTP_PASS");
  const port = Number(portText);
  if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host, port, user, pass, from, source: "environment" };
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function clearMailCache(): void {
  cached = null;
}

async function resolveMail(): Promise<MailConfig | null> {
  if (cached && Date.now() - cached.at < 30_000) return cached.config;
  const fromEnv = fromEnvironment();
  if (fromEnv) {
    cached = { at: Date.now(), config: fromEnv };
    return fromEnv;
  }
  const saved = await readSingleton(MAIL_KIND);
  const host = asText(saved?.host);
  const port = Number(asText(saved?.port) || "587");
  const from = asText(saved?.from);
  const user = asText(saved?.user);
  const pass = asText(saved?.password);
  const config = host && from && Number.isInteger(port) && port >= 1 && port <= 65535
    ? { host, port, user, pass, from, source: "saved" as const }
    : null;
  cached = { at: Date.now(), config };
  return config;
}

export async function mailConfigured(): Promise<boolean> {
  return Boolean(await resolveMail());
}

export async function mailPublicStatus(): Promise<{
  ready: boolean;
  source: "environment" | "saved" | "none";
  host: string;
  port: string;
  user: string;
  from: string;
  passwordSet: boolean;
}> {
  const env = fromEnvironment();
  const saved = await readSingleton(MAIL_KIND);
  if (env) {
    return { ready: true, source: "environment", host: "", port: "", user: "", from: "", passwordSet: Boolean(env.pass || env.user) };
  }
  const host = asText(saved?.host);
  const port = asText(saved?.port);
  const user = asText(saved?.user);
  const from = asText(saved?.from);
  const passwordSet = Boolean(asText(saved?.password));
  return {
    ready: Boolean(host && from && port),
    source: host || from || user || passwordSet ? "saved" : "none",
    host,
    port: port || "587",
    user,
    from,
    passwordSet,
  };
}

export async function saveMailSettings(input: { host: string; port: string; user: string; from: string; password?: string }): Promise<void> {
  const current = await readSingleton(MAIL_KIND);
  const password = input.password?.trim() ? input.password.trim() : asText(current?.password);
  await saveSingleton(MAIL_KIND, "Mail", {
    host: input.host.trim(),
    port: input.port.trim(),
    user: input.user.trim(),
    from: input.from.trim(),
    password,
  });
  clearMailCache();
}

export function mailFailure(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
  const responseCode = typeof error === "object" && error && "responseCode" in error ? Number((error as { responseCode?: number }).responseCode) : 0;
  if (code === "EAUTH" || responseCode === 535 || responseCode === 534) return "The mail server rejected the username or password.";
  if (code === "ECONNECTION" || code === "ETIMEDOUT" || code === "ENOTFOUND" || code === "ESOCKET" || code === "ECONNREFUSED") return "The mail server could not be reached.";
  return "The mail server did not accept the message.";
}

export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const config = await resolveMail();
  if (!config) return false;
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
  });
  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text,
  });
  return true;
}
