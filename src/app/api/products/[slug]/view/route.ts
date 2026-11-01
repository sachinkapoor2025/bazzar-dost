import { NextResponse } from "next/server";
import { api } from "@/lib/backend";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  await api(`/products/${encodeURIComponent(slug)}/view`, { method: "POST", body: {} });
  return NextResponse.json({ ok: true });
}
