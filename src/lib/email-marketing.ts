import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma, databaseConfigured } from "@/lib/db";
import { readJsonArray, writeJsonArray } from "@/lib/local-json";
import { mailConfigured, sendMail } from "@/lib/mail";
import { absoluteUrl } from "@/lib/site";

const FILE = path.join(process.cwd(), "data", "email-marketing.json");
const SEND_LIMIT = 40;

export type CampaignRecord = {
  id: string;
  subject: string;
  message: string;
  audience: string;
  sent: number;
  failed: number;
  status: string;
  createdAt: string;
};

export type TemplateRecord = {
  id: string;
  name: string;
  subject: string;
  message: string;
};

type Row = {
  id: string;
  type: "campaign" | "suppression" | "template";
  email: string;
  name: string;
  subject: string;
  message: string;
  sent: number;
  failed: number;
  status: string;
  createdAt: string;
};

const builtInTemplates: TemplateRecord[] = [
  {
    id: "welcome",
    name: "Welcome",
    subject: "Welcome to BazaarDost",
    message: "Thank you for joining BazaarDost. Browse the catalogue, and checkout is cash on delivery.",
  },
  {
    id: "offer",
    name: "Shop offer",
    subject: "A note from BazaarDost",
    message: "Here is a short update from BazaarDost. Open the shop to see current prices and stock.",
  },
  {
    id: "review",
    name: "Review request",
    subject: "How was your BazaarDost order?",
    message: "If you have received a BazaarDost order, you can leave a review on the product page. Reviews are shown after they are saved.",
  },
];

function emailOk(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readLocal(): Row[] {
  return readJsonArray<Row>(FILE);
}

function writeLocal(rows: Row[]): boolean {
  return writeJsonArray(FILE, rows);
}

export function emailTemplates(): TemplateRecord[] {
  return builtInTemplates;
}

export async function savedTemplates(): Promise<TemplateRecord[]> {
  if (databaseConfigured()) {
    const rows = await prisma.inquiry.findMany({ where: { type: "template" }, orderBy: { createdAt: "desc" }, take: 40 });
    return rows.map((row) => ({ id: row.id, name: row.name || "Template", subject: row.subject, message: row.message }));
  }
  return readLocal()
    .filter((row) => row.type === "template")
    .map((row) => ({ id: row.id, name: row.name || "Template", subject: row.subject, message: row.message }));
}

export async function saveTemplate(input: { name: string; subject: string; message: string }): Promise<boolean> {
  const name = input.name.trim().slice(0, 80);
  const subject = input.subject.trim().slice(0, 140);
  const message = input.message.trim().slice(0, 5000);
  if (!name || !subject || !message) return false;
  if (databaseConfigured()) {
    await prisma.inquiry.create({
      data: { type: "template", email: "template", name, subject, message, status: "saved" },
    });
    return true;
  }
  const row: Row = { id: randomUUID(), type: "template", email: "template", name, subject, message, sent: 0, failed: 0, status: "saved", createdAt: new Date().toISOString() };
  return writeLocal([row, ...readLocal()]);
}

export async function subscriberEmails(): Promise<string[]> {
  if (databaseConfigured()) {
    const rows = await prisma.inquiry.findMany({ where: { type: "newsletter" }, select: { email: true } });
    return [...new Set(rows.map((row) => row.email.trim().toLowerCase()).filter(emailOk))];
  }
  const { listInquiries } = await import("@/lib/inquiry-store");
  const listed = await listInquiries();
  return listed.subscriberEmails.map((email) => email.trim().toLowerCase()).filter(emailOk);
}

export async function suppressedEmails(): Promise<string[]> {
  if (databaseConfigured()) {
    const rows = await prisma.inquiry.findMany({ where: { type: "suppression" }, select: { email: true } });
    return [...new Set(rows.map((row) => row.email.trim().toLowerCase()).filter(emailOk))];
  }
  return [...new Set(readLocal().filter((row) => row.type === "suppression").map((row) => row.email.trim().toLowerCase()).filter(emailOk))];
}

export async function suppressEmail(emailInput: string): Promise<boolean> {
  const email = emailInput.trim().toLowerCase();
  if (!emailOk(email)) return false;
  const existing = await suppressedEmails();
  if (existing.includes(email)) return true;
  if (databaseConfigured()) {
    await prisma.inquiry.create({ data: { type: "suppression", email, status: "suppressed", subject: "Unsubscribed" } });
    return true;
  }
  const row: Row = { id: randomUUID(), type: "suppression", email, name: "", subject: "Unsubscribed", message: "", sent: 0, failed: 0, status: "suppressed", createdAt: new Date().toISOString() };
  return writeLocal([row, ...readLocal()]);
}

export async function listCampaigns(): Promise<CampaignRecord[]> {
  if (databaseConfigured()) {
    const rows = await prisma.inquiry.findMany({ where: { type: "campaign" }, orderBy: { createdAt: "desc" }, take: 40 });
    return rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      message: row.message,
      audience: row.name || "subscribers",
      sent: Number(row.productInterest) || 0,
      failed: Number(row.quantity) || 0,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }));
  }
  return readLocal()
    .filter((row) => row.type === "campaign")
    .map((row) => ({ id: row.id, subject: row.subject, message: row.message, audience: row.name, sent: row.sent, failed: row.failed, status: row.status, createdAt: row.createdAt }));
}

export async function sendCampaign(input: { subject: string; message: string; audience: "subscribers" | "custom"; customEmails?: string }): Promise<{ ok: true; sent: number; failed: number; skipped: number } | { ok: false; error: string }> {
  if (!mailConfigured()) return { ok: false, error: "Email is not configured. Set SMTP host, port, and from address before sending." };
  const subject = input.subject.trim().slice(0, 140);
  const message = input.message.trim().slice(0, 5000);
  if (!subject || !message) return { ok: false, error: "Enter a subject and a message." };
  const suppressed = new Set(await suppressedEmails());
  const source = input.audience === "custom"
    ? (input.customEmails || "").split(/[\s,;]+/).map((item) => item.trim().toLowerCase()).filter(emailOk)
    : await subscriberEmails();
  const unique = [...new Set(source)].filter((email) => !suppressed.has(email));
  if (unique.length === 0) return { ok: false, error: "There are no recipients left after removing duplicates and unsubscribed addresses." };
  const batch = unique.slice(0, SEND_LIMIT);
  const skipped = unique.length - batch.length;
  let sent = 0;
  let failed = 0;
  const footer = `\n\nBazaarDost\n${absoluteUrl("/")}\nTo stop these emails, open ${absoluteUrl("/unsubscribe")}`;
  for (const email of batch) {
    try {
      const delivered = await sendMail(email, subject, `${message}${footer}`);
      if (delivered) sent += 1;
      else failed += 1;
    } catch (error) {
      console.error(error);
      failed += 1;
    }
  }
  const status = failed === 0 ? "sent" : sent === 0 ? "failed" : "partial";
  if (databaseConfigured()) {
    await prisma.inquiry.create({
      data: {
        type: "campaign",
        email: "campaign",
        name: input.audience,
        subject,
        message,
        productInterest: String(sent),
        quantity: String(failed),
        status,
      },
    });
  } else {
    const row: Row = { id: randomUUID(), type: "campaign", email: "campaign", name: input.audience, subject, message, sent, failed, status, createdAt: new Date().toISOString() };
    writeLocal([row, ...readLocal()]);
  }
  return { ok: true, sent, failed, skipped };
}
