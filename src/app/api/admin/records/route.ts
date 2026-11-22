import { NextResponse } from "next/server";
import { createRecord, listRecords } from "@/lib/admin-records";
import { WRITABLE_KINDS } from "@/lib/admin-record-schema";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const kind = new URL(request.url).searchParams.get("kind") || "";
    if (!WRITABLE_KINDS.includes(kind) && kind !== "cart" && kind !== "visit") {
      return NextResponse.json({ error: "Choose a record type." }, { status: 400 });
    }
    const records = await listRecords(kind);
    return NextResponse.json({ records });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { kind?: unknown };
    const kind = typeof body.kind === "string" ? body.kind : "";
    if (!WRITABLE_KINDS.includes(kind)) return NextResponse.json({ error: "Choose a record type." }, { status: 400 });
    const record = await createRecord(kind, body);
    return NextResponse.json({ id: record.id, message: "Saved." });
  } catch (error) {
    return errorResponse(error);
  }
}
