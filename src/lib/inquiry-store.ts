import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma, databaseConfigured } from "@/lib/db";
import { readJsonArray, writeJsonArray } from "@/lib/local-json";

const FILE = path.join(process.cwd(), "data", "inquiries.json");

export type InquiryRecord = {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string;
  business: string;
  city: string;
  subject: string;
  message: string;
  productInterest: string;
  quantity: string;
  status: string;
  createdAt: string;
};

type InquiryInput = Omit<InquiryRecord, "id" | "status" | "createdAt">;

function blank(input: Partial<InquiryInput>): InquiryInput {
  return {
    type: input.type || "contact",
    name: input.name || "",
    email: input.email || "",
    phone: input.phone || "",
    business: input.business || "",
    city: input.city || "",
    subject: input.subject || "",
    message: input.message || "",
    productInterest: input.productInterest || "",
    quantity: input.quantity || "",
  };
}

export async function saveInquiry(input: Partial<InquiryInput> & { type: string; email: string }): Promise<{ ok: true; duplicate?: boolean } | { ok: false }> {
  const row = blank(input);
  if (databaseConfigured()) {
    if (row.type === "newsletter") {
      const existing = await prisma.inquiry.findFirst({ where: { type: "newsletter", email: row.email } });
      if (existing) return { ok: true, duplicate: true };
    }
    await prisma.inquiry.create({ data: { ...row, status: "new" } });
    return { ok: true };
  }
  const rows = readJsonArray<InquiryRecord>(FILE);
  if (row.type === "newsletter" && rows.some((item) => item.type === "newsletter" && item.email === row.email)) {
    return { ok: true, duplicate: true };
  }
  const saved: InquiryRecord = { ...row, id: randomUUID(), status: "new", createdAt: new Date().toISOString() };
  return writeJsonArray(FILE, [saved, ...rows]) ? { ok: true } : { ok: false };
}

export async function listInquiries(): Promise<{ messages: InquiryRecord[]; subscribers: number; subscriberEmails: string[] }> {
  if (databaseConfigured()) {
    const [rows, subscriberRows] = await Promise.all([
      prisma.inquiry.findMany({ where: { type: { notIn: ["newsletter", "campaign", "suppression", "template"] } }, orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.inquiry.findMany({ where: { type: "newsletter" }, orderBy: { createdAt: "desc" }, select: { email: true } }),
    ]);
    const subscriberEmails = [...new Set(subscriberRows.map((item) => item.email).filter(Boolean))];
    return {
      subscribers: subscriberEmails.length,
      subscriberEmails,
      messages: rows.map((item) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        email: item.email,
        phone: item.phone,
        business: item.business,
        city: item.city,
        subject: item.subject,
        message: item.message,
        productInterest: item.productInterest,
        quantity: item.quantity,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
  const rows = readJsonArray<InquiryRecord>(FILE);
  const subscriberEmails = [...new Set(rows.filter((item) => item.type === "newsletter").map((item) => item.email).filter(Boolean))];
  return {
    subscribers: subscriberEmails.length,
    subscriberEmails,
    messages: rows.filter((item) => !["newsletter", "campaign", "suppression", "template"].includes(item.type)).slice(0, 100),
  };
}

export async function listInquiriesByType(type: string): Promise<InquiryRecord[]> {
  if (databaseConfigured()) {
    const rows = await prisma.inquiry.findMany({ where: { type }, orderBy: { createdAt: "desc" }, take: 200 });
    return rows.map((item) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      email: item.email,
      phone: item.phone,
      business: item.business,
      city: item.city,
      subject: item.subject,
      message: item.message,
      productInterest: item.productInterest,
      quantity: item.quantity,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }));
  }
  return readJsonArray<InquiryRecord>(FILE).filter((item) => item.type === type).slice(0, 200);
}

export async function listNewsletterSubscribers(): Promise<Array<{ id: string; email: string; createdAt: string }>> {
  if (databaseConfigured()) {
    const rows = await prisma.inquiry.findMany({ where: { type: "newsletter" }, orderBy: { createdAt: "desc" }, take: 500 });
    return rows.map((row) => ({ id: row.id, email: row.email, createdAt: row.createdAt.toISOString() }));
  }
  return readJsonArray<InquiryRecord>(FILE)
    .filter((item) => item.type === "newsletter")
    .slice(0, 500)
    .map((item) => ({ id: item.id, email: item.email, createdAt: item.createdAt }));
}

export async function updateNewsletterEmail(id: string, email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { ok: false, error: "Enter a valid email." };
  if (databaseConfigured()) {
    const row = await prisma.inquiry.findUnique({ where: { id } });
    if (!row || row.type !== "newsletter") return { ok: false, error: "That subscriber was not found." };
    const duplicate = await prisma.inquiry.findFirst({ where: { type: "newsletter", email: clean, NOT: { id } } });
    if (duplicate) return { ok: false, error: "That email is already on the list." };
    await prisma.inquiry.update({ where: { id }, data: { email: clean } });
    return { ok: true };
  }
  const rows = readJsonArray<InquiryRecord>(FILE);
  const current = rows.find((item) => item.id === id);
  if (!current || current.type !== "newsletter") return { ok: false, error: "That subscriber was not found." };
  if (rows.some((item) => item.type === "newsletter" && item.email === clean && item.id !== id)) {
    return { ok: false, error: "That email is already on the list." };
  }
  const next = rows.map((item) => (item.id === id ? { ...item, email: clean } : item));
  return writeJsonArray(FILE, next) ? { ok: true } : { ok: false, error: "The subscriber could not be saved." };
}

export async function deleteInquiryOfType(id: string, type: string): Promise<boolean> {
  if (databaseConfigured()) {
    const row = await prisma.inquiry.findUnique({ where: { id } });
    if (!row || row.type !== type) return false;
    await prisma.inquiry.delete({ where: { id } });
    return true;
  }
  const rows = readJsonArray<InquiryRecord>(FILE);
  if (!rows.some((item) => item.id === id && item.type === type)) return false;
  return writeJsonArray(FILE, rows.filter((item) => item.id !== id));
}

export async function updateInquiryStatus(id: string, status: string): Promise<boolean> {
  if (databaseConfigured()) {
    await prisma.inquiry.update({ where: { id }, data: { status } });
    return true;
  }
  const rows = readJsonArray<InquiryRecord>(FILE);
  const next = rows.map((item) => (item.id === id ? { ...item, status } : item));
  if (!next.some((item) => item.id === id)) return false;
  return writeJsonArray(FILE, next);
}
