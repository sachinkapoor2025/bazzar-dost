import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma, databaseConfigured } from "@/lib/db";
import { readJsonArray, writeJsonArray } from "@/lib/local-json";
import { parseAdminWrite } from "@/lib/admin-record-schema";
import { cleanCountry, cleanReferrer } from "@/lib/visit-report";

const FILE = path.join(process.cwd(), "data", "admin-records.json");

export type StoredRecord = {
  id: string;
  kind: string;
  title: string;
  status: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

let storeMode: "unknown" | "prisma" | "file" = "unknown";
let importedFileRecords = false;

function storageError(message: string, status: number): Error {
  const error = new Error(message);
  (error as Error & { status?: number }).status = status;
  return error;
}

function missingAdminTable(error: unknown): boolean {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
  const message = error instanceof Error ? error.message : "";
  return code === "P2021" || (/AdminRecord/i.test(message) && /does not exist|not exist/i.test(message));
}

async function ensureAdminRecordTable(error: unknown): Promise<boolean> {
  if (!missingAdminTable(error)) return false;
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AdminRecord" (
      "id" TEXT NOT NULL,
      "kind" TEXT NOT NULL,
      "title" TEXT NOT NULL DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'active',
      "payload" TEXT NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AdminRecord_pkey" PRIMARY KEY ("id")
    )`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AdminRecord_kind_createdAt_idx" ON "AdminRecord"("kind", "createdAt")`);
    return true;
  } catch (createError) {
    console.error(createError instanceof Error ? createError.message : "AdminRecord table was not created");
    return false;
  }
}

async function importFileRecordsOnce(): Promise<void> {
  if (importedFileRecords) return;
  importedFileRecords = true;
  const fileRows = readFile();
  if (!fileRows.length) return;
  const kinds = [...new Set(fileRows.map((row) => row.kind))];
  for (const kind of kinds) {
    const existing = await prisma.adminRecord.count({ where: { kind } });
    if (existing > 0) continue;
    const batch = fileRows.filter((row) => row.kind === kind).slice(0, 2000);
    const data = batch.flatMap((row) => {
      const createdAt = new Date(row.createdAt);
      const updatedAt = new Date(row.updatedAt || row.createdAt);
      if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) return [];
      return [{
        id: row.id,
        kind: row.kind,
        title: row.title || "",
        status: row.status || "active",
        payload: JSON.stringify(row.payload || {}),
        createdAt,
        updatedAt,
      }];
    });
    if (data.length) await prisma.adminRecord.createMany({ data, skipDuplicates: true });
  }
}

function asPayload(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
  return {};
}

function fromDb(row: { id: string; kind: string; title: string; status: string; payload: string; createdAt: Date; updatedAt: Date }): StoredRecord {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    status: row.status,
    payload: asPayload(row.payload),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function usePrisma(): Promise<boolean> {
  if (!databaseConfigured()) {
    storeMode = "file";
    return false;
  }
  if (storeMode === "prisma") return true;
  try {
    await prisma.adminRecord.findFirst({ select: { id: true } });
  } catch (error) {
    if (!(await ensureAdminRecordTable(error))) return false;
  }
  storeMode = "prisma";
  try {
    await importFileRecordsOnce();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Stored admin records were not imported");
  }
  return true;
}

function readFile(): StoredRecord[] {
  return readJsonArray<StoredRecord>(FILE).filter((row) => row && typeof row.id === "string" && typeof row.kind === "string");
}

export async function listRecords(kind: string, take = 200): Promise<StoredRecord[]> {
  if (await usePrisma()) {
    const rows = await prisma.adminRecord.findMany({ where: { kind }, orderBy: { createdAt: "desc" }, take });
    return rows.map(fromDb);
  }
  return readFile().filter((row) => row.kind === kind).slice(0, take);
}

export async function createRecord(kind: string, input: unknown): Promise<StoredRecord> {
  const parsed = parseAdminWrite(kind, input);
  const now = new Date();
  if (await usePrisma()) {
    const row = await prisma.adminRecord.create({
      data: { kind, title: parsed.title, status: parsed.status, payload: JSON.stringify(parsed.payload) },
    });
    return fromDb(row);
  }
  const saved: StoredRecord = {
    id: randomUUID(),
    kind,
    title: parsed.title,
    status: parsed.status,
    payload: parsed.payload,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const rows = readFile();
  if (!writeJsonArray(FILE, [saved, ...rows])) {
    const error = new Error("The record cannot be saved right now.");
    (error as Error & { status?: number }).status = 503;
    throw error;
  }
  return saved;
}

export async function updateRecord(id: string, input: unknown): Promise<StoredRecord> {
  const current = await findRecord(id);
  if (!current) {
    const error = new Error("That record was not found.");
    (error as Error & { status?: number }).status = 404;
    throw error;
  }
  if (current.kind === "cart") {
    const status = typeof input === "object" && input && "status" in input ? String((input as { status?: unknown }).status) : "";
    if (!["open", "recovered", "ordered"].includes(status)) {
      const error = new Error("Choose open, recovered, or ordered.");
      (error as Error & { status?: number }).status = 400;
      throw error;
    }
    return writeExisting({ ...current, status, updatedAt: new Date().toISOString() });
  }
  const parsed = parseAdminWrite(current.kind, input);
  return writeExisting({ ...current, title: parsed.title, status: parsed.status, payload: parsed.payload, updatedAt: new Date().toISOString() });
}

async function writeExisting(next: StoredRecord): Promise<StoredRecord> {
  if (await usePrisma()) {
    const row = await prisma.adminRecord.update({
      where: { id: next.id },
      data: { title: next.title, status: next.status, payload: JSON.stringify(next.payload) },
    });
    return fromDb(row);
  }
  const rows = readFile();
  if (!rows.some((row) => row.id === next.id) || !writeJsonArray(FILE, rows.map((row) => (row.id === next.id ? next : row)))) {
    const error = new Error("The record cannot be saved right now.");
    (error as Error & { status?: number }).status = 503;
    throw error;
  }
  return next;
}

export async function deleteRecord(id: string): Promise<void> {
  const current = await findRecord(id);
  if (!current) {
    const error = new Error("That record was not found.");
    (error as Error & { status?: number }).status = 404;
    throw error;
  }
  if (current.kind === "visit") {
    const error = new Error("Page views are kept for the analytics pages.");
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  if (await usePrisma()) {
    await prisma.adminRecord.delete({ where: { id } });
    return;
  }
  const rows = readFile().filter((row) => row.id !== id);
  if (!writeJsonArray(FILE, rows)) {
    const error = new Error("The record cannot be deleted right now.");
    (error as Error & { status?: number }).status = 503;
    throw error;
  }
}

async function findRecord(id: string): Promise<StoredRecord | null> {
  if (await usePrisma()) {
    const row = await prisma.adminRecord.findUnique({ where: { id } });
    return row ? fromDb(row) : null;
  }
  return readFile().find((row) => row.id === id) ?? null;
}

export async function readSingleton(kind: string): Promise<Record<string, unknown> | null> {
  const rows = await listRecords(kind, 20);
  return rows[rows.length - 1]?.payload ?? null;
}

export async function saveSingleton(kind: string, title: string, payload: Record<string, unknown>): Promise<void> {
  const body = JSON.stringify(payload);
  if (await usePrisma()) {
    const existing = await prisma.adminRecord.findFirst({ where: { kind }, orderBy: { createdAt: "asc" } });
    if (existing) {
      await prisma.adminRecord.update({ where: { id: existing.id }, data: { title, payload: body, status: "active" } });
    } else {
      await prisma.adminRecord.create({ data: { kind, title, status: "active", payload: body } });
    }
    return;
  }
  const rows = readFile();
  const existing = rows.find((row) => row.kind === kind);
  const now = new Date().toISOString();
  const next: StoredRecord = existing
    ? { ...existing, title, payload, status: "active", updatedAt: now }
    : { id: randomUUID(), kind, title, status: "active", payload, createdAt: now, updatedAt: now };
  const rest = rows.filter((row) => row.kind !== kind);
  if (!writeJsonArray(FILE, [next, ...rest])) {
    const error = new Error("The settings cannot be saved right now.");
    (error as Error & { status?: number }).status = 503;
    throw error;
  }
}

export async function holdCart(input: { email: string; name: string; phone: string; items: Array<{ productId: string; name: string; qty: number }> }): Promise<void> {
  const email = input.email.toLowerCase();
  const payload = { email, name: input.name, phone: input.phone, items: input.items };
  const open = (await listRecords("cart", 100)).find((row) => row.status === "open" && String(row.payload.email || "").toLowerCase() === email);
  if (open) {
    await writeExisting({ ...open, title: email, payload, updatedAt: new Date().toISOString() });
    return;
  }
  const now = new Date().toISOString();
  if (await usePrisma()) {
    await prisma.adminRecord.create({ data: { kind: "cart", title: email, status: "open", payload: JSON.stringify(payload) } });
    return;
  }
  const saved: StoredRecord = { id: randomUUID(), kind: "cart", title: email, status: "open", payload, createdAt: now, updatedAt: now };
  writeJsonArray(FILE, [saved, ...readFile()]);
}

export async function markCartsOrdered(email: string): Promise<void> {
  const needle = email.trim().toLowerCase();
  if (!needle) return;
  const open = (await listRecords("cart", 100)).filter((row) => row.status === "open" && String(row.payload.email || "").toLowerCase() === needle);
  for (const row of open) {
    await writeExisting({ ...row, status: "ordered", updatedAt: new Date().toISOString() });
  }
}

export async function recordVisit(input: { path: string; sessionId: string; device: string; referrer?: string; country?: string }): Promise<void> {
  const clean = input.path.split("?")[0]?.slice(0, 180) || "/";
  if (!clean.startsWith("/") || clean.startsWith("/admin") || clean.startsWith("/api")) return;
  const payload = {
    path: clean,
    sessionId: input.sessionId,
    device: input.device,
    referrer: cleanReferrer(input.referrer || ""),
    country: cleanCountry(input.country),
  };
  if (databaseConfigured()) {
    if (!(await usePrisma())) throw storageError("Visitor storage is not ready.", 503);
    const recent = await prisma.adminRecord.findFirst({ where: { kind: "visit", title: clean }, orderBy: { createdAt: "desc" } });
    if (recent && Date.now() - recent.createdAt.getTime() < 1500 && asPayload(recent.payload).sessionId === payload.sessionId) return;
    await prisma.adminRecord.create({ data: { kind: "visit", title: clean, status: "seen", payload: JSON.stringify(payload) } });
    const overflow = await prisma.adminRecord.findMany({
      where: { kind: "visit" },
      orderBy: { createdAt: "desc" },
      skip: 2000,
      select: { id: true },
    });
    if (overflow.length) await prisma.adminRecord.deleteMany({ where: { id: { in: overflow.map((row) => row.id) } } });
    return;
  }
  const now = new Date().toISOString();
  const rows = readFile();
  const duplicate = rows.find((row) => row.kind === "visit" && row.payload.path === clean && row.payload.sessionId === payload.sessionId && Date.now() - Date.parse(row.createdAt) < 1500);
  if (duplicate) return;
  const saved: StoredRecord = { id: randomUUID(), kind: "visit", title: clean, status: "seen", payload, createdAt: now, updatedAt: now };
  const visits = [saved, ...rows.filter((row) => row.kind === "visit")].slice(0, 2000);
  const others = rows.filter((row) => row.kind !== "visit");
  if (!writeJsonArray(FILE, [...visits, ...others])) throw storageError("The visit could not be stored.", 503);
}

export async function liveAnnouncement(): Promise<{ title: string; message: string; href: string } | null> {
  const banners = await listRecords("banner", 20);
  const live = banners.find((row) => row.status === "active" && typeof row.payload.message === "string");
  if (!live) return null;
  return {
    title: live.title,
    message: String(live.payload.message),
    href: typeof live.payload.href === "string" ? live.payload.href : "",
  };
}
