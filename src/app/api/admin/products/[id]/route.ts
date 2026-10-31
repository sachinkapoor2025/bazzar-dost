import { NextResponse } from "next/server";
import { saveProduct } from "@/lib/admin-catalog";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const product = await saveProduct(await request.json(), id);
    return NextResponse.json({ id: product.id });
  } catch (error) {
    return errorResponse(error);
  }
}
