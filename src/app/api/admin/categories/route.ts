import { NextResponse } from "next/server";
import { saveCategory } from "@/lib/admin-catalog";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const category = await saveCategory(await request.json());
    return NextResponse.json({ id: category.id });
  } catch (error) {
    return errorResponse(error);
  }
}
