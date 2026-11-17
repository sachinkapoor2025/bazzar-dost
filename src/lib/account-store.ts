import "server-only";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { ApiError, api } from "@/lib/backend";
import { prisma, databaseConfigured, isUniqueConstraint } from "@/lib/db";
import { roleForEmail } from "@/lib/staff";
import type { PublicUser } from "@/lib/types";

type StoredAccount = PublicUser & { passwordHash: string };
type AccountResult = { ok: true; user: PublicUser } | { ok: false; status: number; error: string };

const DUPLICATE = "An account with this email already exists.";
const BAD_LOGIN = "Email or password is not correct.";
const DIRECTORY_COOKIE = "bd_accounts";

function remoteApi(): boolean {
  return Boolean(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL);
}

function accountFiles(): string[] {
  return [path.join(process.cwd(), "data", "accounts.json"), path.join(os.tmpdir(), "bazaardost-accounts.json")];
}

function toPublic(account: StoredAccount): PublicUser {
  return { id: account.id, email: account.email, name: account.name, phone: account.phone, role: account.role };
}

function readAccounts(): StoredAccount[] {
  const byEmail = new Map<string, StoredAccount>();
  for (const file of accountFiles()) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
      if (!Array.isArray(parsed)) continue;
      for (const row of parsed) rememberAccount(byEmail, row);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : "";
      if (code !== "ENOENT") console.error(error);
    }
  }
  return [...byEmail.values()];
}

function rememberAccount(byEmail: Map<string, StoredAccount>, row: unknown) {
  if (!row || typeof row !== "object") return;
  const account = row as StoredAccount;
  if (!account.id || !account.email || !account.passwordHash) return;
  byEmail.set(account.email.toLowerCase(), account);
}

async function readDirectory(): Promise<StoredAccount[]> {
  try {
    const raw = (await cookies()).get(DIRECTORY_COOKIE)?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const byEmail = new Map<string, StoredAccount>();
    for (const row of parsed) rememberAccount(byEmail, row);
    return [...byEmail.values()];
  } catch {
    return [];
  }
}

async function knownAccounts(): Promise<StoredAccount[]> {
  const byEmail = new Map<string, StoredAccount>();
  for (const account of readAccounts()) byEmail.set(account.email.toLowerCase(), account);
  for (const account of await readDirectory()) byEmail.set(account.email.toLowerCase(), account);
  return [...byEmail.values()];
}

async function saveAccounts(rows: StoredAccount[], touched: StoredAccount): Promise<boolean> {
  const savedFile = writeAccounts(rows);
  const current = await readDirectory();
  const next = [...current.filter((item) => item.email.toLowerCase() !== touched.email.toLowerCase()), touched];
  try {
    const jar = await cookies();
    jar.set(DIRECTORY_COOKIE, JSON.stringify(next), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return true;
  } catch (error) {
    console.error(error);
    return savedFile;
  }
}

function writeAccounts(rows: StoredAccount[]): boolean {
  const body = JSON.stringify(rows);
  for (const file of accountFiles()) {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      fs.writeFileSync(tmp, body);
      fs.copyFileSync(tmp, file);
      fs.unlinkSync(tmp);
      return true;
    } catch (error) {
      console.error(error);
    }
  }
  return false;
}

export async function registerAccount(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<AccountResult> {
  const email = input.email.toLowerCase();
  if (remoteApi()) {
    try {
      const user = await api<PublicUser>("/auth/register", { body: { ...input, email } });
      return { ok: true, user };
    } catch (error) {
      if (error instanceof ApiError) return { ok: false, status: error.status, error: error.message };
      throw error;
    }
  }

  if (databaseConfigured()) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return { ok: false, status: 400, error: DUPLICATE };
    try {
      const user = await prisma.user.create({
        data: {
          email,
          name: input.name,
          phone: input.phone,
          passwordHash: await bcrypt.hash(input.password, 12),
          role: roleForEmail(email),
        },
        select: { id: true, email: true, name: true, phone: true, role: true },
      });
      return { ok: true, user };
    } catch (error) {
      if (isUniqueConstraint(error)) return { ok: false, status: 400, error: DUPLICATE };
      throw error;
    }
  }

  const rows = await knownAccounts();
  if (rows.some((account) => account.email.toLowerCase() === email)) return { ok: false, status: 400, error: DUPLICATE };
  const account: StoredAccount = {
    id: randomUUID(),
    email,
    name: input.name,
    phone: input.phone,
    role: roleForEmail(email),
    passwordHash: await bcrypt.hash(input.password, 12),
  };
  if (!(await saveAccounts([...rows, account], account))) {
    return { ok: false, status: 503, error: "Accounts cannot be saved right now." };
  }
  return { ok: true, user: toPublic(account) };
}

export async function loginAccount(emailInput: string, password: string): Promise<AccountResult> {
  const email = emailInput.toLowerCase();
  if (remoteApi()) {
    try {
      const user = await api<PublicUser>("/auth/login", { body: { email, password } });
      return { ok: true, user };
    } catch (error) {
      if (error instanceof ApiError) return { ok: false, status: error.status, error: error.message };
      throw error;
    }
  }

  if (databaseConfigured()) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { ok: false, status: 401, error: BAD_LOGIN };
    let role = user.role;
    if (roleForEmail(user.email) === "admin" && role !== "admin") {
      await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
      role = "admin";
    }
    return { ok: true, user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role } };
  }

  const rows = await knownAccounts();
  const account = rows.find((item) => item.email.toLowerCase() === email);
  if (!account || !(await bcrypt.compare(password, account.passwordHash))) return { ok: false, status: 401, error: BAD_LOGIN };
  if (roleForEmail(account.email) === "admin" && account.role !== "admin") account.role = "admin";
  await saveAccounts(rows, account);
  return { ok: true, user: toPublic(account) };
}

export async function updateAccountProfile(userId: string, input: { name: string; phone: string }): Promise<AccountResult> {
  if (remoteApi()) {
    try {
      const user = await api<PublicUser>("/account/profile", { method: "PATCH", body: input });
      return { ok: true, user: { ...user, id: user.id || userId } };
    } catch (error) {
      if (error instanceof ApiError) return { ok: false, status: error.status, error: error.message };
      throw error;
    }
  }
  if (databaseConfigured()) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: input.name, phone: input.phone },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
    return { ok: true, user };
  }
  const rows = await knownAccounts();
  const account = rows.find((item) => item.id === userId);
  if (!account) return { ok: false, status: 404, error: "Account not found." };
  account.name = input.name;
  account.phone = input.phone;
  if (!(await saveAccounts(rows, account))) return { ok: false, status: 503, error: "The profile cannot be saved right now." };
  return { ok: true, user: toPublic(account) };
}
