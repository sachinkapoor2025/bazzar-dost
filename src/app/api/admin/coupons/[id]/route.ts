import { NextResponse } from "next/server";
import { api } from "@/lib/backend";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { couponSchema } from "@/lib/validators";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const body = couponSchema.parse(await request.json());
    const { id } = await context.params;
    await api(`/admin/coupons/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { ...body, code: body.code.toUpperCase(), expiresAt: body.expiresAt || null },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
