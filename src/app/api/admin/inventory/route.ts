import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const schema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).nullable().optional(),
  stock: z.number().int().min(0).max(100000),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    if (body.variantId) {
      const updated = await prisma.variant.updateMany({
        where: { id: body.variantId, productId: body.productId },
        data: { stock: body.stock },
      });
      if (updated.count !== 1) return NextResponse.json({ error: "That option was not found." }, { status: 404 });
    } else {
      const updated = await prisma.product.updateMany({ where: { id: body.productId }, data: { stock: body.stock } });
      if (updated.count !== 1) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Stock updated." });
  } catch (error) {
    return errorResponse(error);
  }
}
