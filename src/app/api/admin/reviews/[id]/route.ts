import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { databaseConfigured, prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { deleteProductReviewRecord } from "@/lib/local-reviews";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    if (!databaseConfigured()) {
      if (!deleteProductReviewRecord(id)) return NextResponse.json({ error: "That review was not found." }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    await prisma.productReview.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
