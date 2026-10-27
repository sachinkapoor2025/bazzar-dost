import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { couponSchema } from "@/lib/validators";

function couponData(body: { code: string; type: "PERCENT" | "FIXED"; value: number; minSubtotal: number; active: boolean; note?: string; expiresAt?: string }) {
  return {
    code: body.code.toUpperCase(),
    type: body.type,
    value: body.value,
    minSubtotal: body.minSubtotal,
    active: body.active,
    note: body.note || "",
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  };
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = couponSchema.parse(await request.json());
    if (body.expiresAt && Number.isNaN(new Date(body.expiresAt).getTime())) {
      return NextResponse.json({ error: "Enter a valid expiry date or leave it empty." }, { status: 400 });
    }
    const coupon = await prisma.coupon.create({ data: couponData(body) });
    return NextResponse.json({ id: coupon.id });
  } catch (error) {
    return errorResponse(error);
  }
}
