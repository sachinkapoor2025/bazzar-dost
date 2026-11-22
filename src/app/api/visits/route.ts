import { NextResponse } from "next/server";
import { visitSchema } from "@/lib/admin-record-schema";
import { recordVisit } from "@/lib/admin-records";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`visit:${forwarded}`, 40, 60_000)) return NextResponse.json({ ok: true });
  try {
    const body = visitSchema.parse(await request.json());
    await recordVisit(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
