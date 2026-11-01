import { NextResponse } from "next/server";
import { api } from "@/lib/backend";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { inquiryStatusSchema } from "@/lib/validators";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = inquiryStatusSchema.parse(await request.json());
    await api(`/admin/inquiries/${encodeURIComponent(id)}`, { method: "PATCH", body });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
