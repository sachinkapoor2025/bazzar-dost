import { NextResponse } from "next/server";
import { ApiError, api } from "@/lib/backend";
import { errorResponse } from "@/lib/http";
import { trackSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = trackSchema.parse(await request.json());
    const order = await api("/track", { body: { orderNumber: body.orderNumber.trim().toUpperCase(), email: body.email.toLowerCase() } });
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return errorResponse(error);
  }
}
