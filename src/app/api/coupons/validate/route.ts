import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, api } from "@/lib/backend";
import { couponDiscount } from "@/lib/commerce";
import { errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().int().nonnegative() }).parse(await request.json());
    const coupon = await api<{ type: string; value: number; minSubtotal: number; code: string }>("/coupons/validate", { body });
    const discount = couponDiscount(body.subtotal, coupon);
    if (discount <= 0) return NextResponse.json({ error: `That coupon needs a subtotal of at least ₹${coupon.minSubtotal}.` }, { status: 400 });
    return NextResponse.json({ type: coupon.type, value: coupon.value, minSubtotal: coupon.minSubtotal, code: coupon.code });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return errorResponse(error);
  }
}
