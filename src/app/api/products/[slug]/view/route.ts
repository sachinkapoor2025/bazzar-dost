import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  await prisma.product.updateMany({ where: { slug, isActive: true }, data: { viewCount: { increment: 1 } } });
  return NextResponse.json({ ok: true });
}
