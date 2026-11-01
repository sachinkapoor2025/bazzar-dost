import { NextResponse } from "next/server";
import { saveProduct } from "@/lib/admin-catalog";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const product = await saveProduct(await request.json(), id);
    return NextResponse.json({ id: product.id });
  } catch (error) {
    return errorResponse(error);
  }
}
