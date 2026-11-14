import { NextResponse } from "next/server";
import { recordEngagement } from "@/lib/engagement";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  await recordEngagement(slug, "view");
  return NextResponse.json({ ok: true });
}
