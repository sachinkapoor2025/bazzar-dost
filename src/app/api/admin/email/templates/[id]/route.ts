import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteTemplate } from "@/lib/email-marketing";
import { errorResponse } from "@/lib/http";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const removed = await deleteTemplate(id);
    if (!removed) return NextResponse.json({ error: "That template was not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
