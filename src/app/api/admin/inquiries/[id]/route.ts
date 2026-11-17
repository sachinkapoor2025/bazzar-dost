import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { updateInquiryStatus } from "@/lib/inquiry-store";
import { inquiryStatusSchema } from "@/lib/validators";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = inquiryStatusSchema.parse(await request.json());
    const updated = await updateInquiryStatus(id, body.status);
    if (!updated) return NextResponse.json({ error: "That message was not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
