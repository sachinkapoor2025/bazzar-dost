import { NextResponse } from "next/server";
import { saveCategory } from "@/lib/admin-catalog";
import { requireAdmin } from "@/lib/auth";
import { api } from "@/lib/backend";
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
    await api(`/admin/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
