import { NextResponse } from "next/server";
import { persistCategory } from "@/lib/category-admin";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const category = await persistCategory(await request.json());
    return NextResponse.json({ id: category.id });
  } catch (error) {
    return errorResponse(error);
  }
}
