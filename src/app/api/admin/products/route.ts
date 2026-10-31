import { NextResponse } from "next/server";
import { saveProduct } from "@/lib/admin-catalog";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const product = await saveProduct(await request.json());
    return NextResponse.json({ id: product.id });
  } catch (error) {
    return errorResponse(error);
  }
}
