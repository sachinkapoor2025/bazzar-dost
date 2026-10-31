import { NextResponse } from "next/server";
import { z } from "zod";
import { couponDiscount } from "@/lib/commerce";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().int().nonnegative() }).parse(await request.json());
    const coupon = await prisma.coupon.findFirst({
      where: { code: body.code.toUpperCase(), active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    });
    if (!coupon) return NextResponse.json({ error: "That coupon is not valid." }, { status: 400 });
    const discount = couponDiscount(body.subtotal, coupon);
    if (discount <= 0) return NextResponse.json({ error: `That coupon needs a subtotal of at least ₹${coupon.minSubtotal}.` }, { status: 400 });
    return NextResponse.json({ type: coupon.type, value: coupon.value, minSubtotal: coupon.minSubtotal, code: coupon.code });
  } catch (error) {
    return errorResponse(error);
  }
}
