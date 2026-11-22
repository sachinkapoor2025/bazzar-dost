import { NextResponse } from "next/server";
import { listRecords } from "@/lib/admin-records";

export async function GET() {
  const rows = await listRecords("nudge", 20);
  const nudges = rows
    .filter((row) => row.status === "active")
    .map((row) => ({ title: row.title, message: String(row.payload.message || ""), href: String(row.payload.href || "") }));
  return NextResponse.json({ nudges });
}
