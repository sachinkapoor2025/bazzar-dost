import { NextResponse } from "next/server";
import { saveCategory } from "@/lib/admin-catalog";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const category = await saveCategory(await request.json(), id);
    return NextResponse.json({ id: category.id });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) return NextResponse.json({ error: "Move or archive the products in this category before deleting it." }, { status: 400 });
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
