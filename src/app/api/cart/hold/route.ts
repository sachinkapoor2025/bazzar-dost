import { NextResponse } from "next/server";
import { cartHoldSchema } from "@/lib/admin-record-schema";
import { holdCart } from "@/lib/admin-records";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`cart-hold:${forwarded}`, 20, 60_000)) return NextResponse.json({ ok: true });
  try {
    const body = cartHoldSchema.parse(await request.json());
    await holdCart(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
