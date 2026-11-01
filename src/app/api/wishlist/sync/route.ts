import { NextResponse } from "next/server";
import { z } from "zod";
import { api } from "@/lib/backend";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = z.object({ productIds: z.array(z.string()).max(50) }).parse(await request.json());
    return NextResponse.json(await api("/wishlist/sync", { body }));
  } catch (error) {
    return errorResponse(error);
  }
}
