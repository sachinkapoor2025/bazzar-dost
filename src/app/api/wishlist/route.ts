import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } });
    return NextResponse.json({ productIds: items.map((item) => item.productId) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = z.object({ productId: z.string().min(1) }).parse(await request.json());
    const product = await prisma.product.findFirst({ where: { id: body.productId, isActive: true }, select: { id: true } });
    if (!product) return NextResponse.json({ error: "That product is not available." }, { status: 404 });
    const existing = await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } });
    if (existing) await prisma.wishlistItem.delete({ where: { id: existing.id } });
    else await prisma.wishlistItem.create({ data: { userId: user.id, productId: product.id } });
    return NextResponse.json({ saved: !existing });
  } catch (error) {
    return errorResponse(error);
  }
}
