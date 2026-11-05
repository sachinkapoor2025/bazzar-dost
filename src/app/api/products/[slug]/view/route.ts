import { NextResponse } from "next/server";
import { api } from "@/lib/backend";
import { recordEngagement } from "@/lib/engagement";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  await recordEngagement(slug, "view");
  try {
    await api(`/products/${encodeURIComponent(slug)}/view`, { method: "POST", body: {} });
  } catch (error) {
    console.error(error);
  }
  return NextResponse.json({ ok: true });
}
