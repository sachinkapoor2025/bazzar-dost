import { NextResponse } from "next/server";
import { api } from "@/lib/backend";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { promotionSchema } from "@/lib/validators";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = promotionSchema.parse(await request.json());
    if (body.href && !body.href.startsWith("/")) return NextResponse.json({ error: "The link must start with /." }, { status: 400 });
    await api(`/admin/promotions/${encodeURIComponent(id)}`, { method: "PATCH", body });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await api(`/admin/promotions/${encodeURIComponent((await context.params).id)}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
