import { NextResponse } from "next/server";
import { z } from "zod";
import { api } from "@/lib/backend";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json(await api("/wishlist"));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = z.object({ productId: z.string().min(1) }).parse(await request.json());
    return NextResponse.json(await api("/wishlist", { body }));
  } catch (error) {
    return errorResponse(error);
  }
}
