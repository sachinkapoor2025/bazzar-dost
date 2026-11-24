import { NextResponse } from "next/server";
import { saveProduct } from "@/lib/admin-catalog";
import { requireAdmin } from "@/lib/auth";
import { databaseHasProducts } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { updateLocalProduct } from "@/lib/local-catalogue";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();
    if (!(await databaseHasProducts())) {
      const product = updateLocalProduct(id, body);
      if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
      return NextResponse.json({ id: product.id });
    }
    const product = await saveProduct(body, id);
    return NextResponse.json({ id: product.id });
  } catch (error) {
    return errorResponse(error);
  }
}
