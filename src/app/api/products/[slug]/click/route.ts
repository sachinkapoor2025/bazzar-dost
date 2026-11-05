import { NextResponse } from "next/server";
import { recordEngagement } from "@/lib/engagement";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  await recordEngagement((await context.params).slug, "click");
  return NextResponse.json({ ok: true });
}
