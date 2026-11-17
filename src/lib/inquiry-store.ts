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

export async function listInquiries(): Promise<{ messages: InquiryRecord[]; subscribers: number }> {
  if (databaseConfigured()) {
    const [rows, subscribers] = await Promise.all([
      prisma.inquiry.findMany({ where: { type: { not: "newsletter" } }, orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.inquiry.count({ where: { type: "newsletter" } }),
    ]);
    return {
      subscribers,
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
  return {
    subscribers: rows.filter((item) => item.type === "newsletter").length,
    messages: rows.filter((item) => item.type !== "newsletter").slice(0, 100),
  };
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
