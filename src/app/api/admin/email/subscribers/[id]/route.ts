import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { deleteInquiryOfType, updateNewsletterEmail } from "@/lib/inquiry-store";

const schema = z.object({ email: z.string().trim().email().max(120) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const updated = await updateNewsletterEmail(id, body.email);
    if (!updated.ok) return NextResponse.json({ error: updated.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const removed = await deleteInquiryOfType(id, "newsletter");
    if (!removed) return NextResponse.json({ error: "That subscriber was not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
