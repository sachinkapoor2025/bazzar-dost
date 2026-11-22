import { NextResponse } from "next/server";
import { persistCategory, removeCategory } from "@/lib/category-admin";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const category = await persistCategory(await request.json(), id);
    return NextResponse.json({ id: category.id });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await removeCategory((await context.params).id);
    return NextResponse.json({ message: "Category deleted." });
  } catch (error) {
    return errorResponse(error);
  }
}
