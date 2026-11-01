import { NextResponse } from "next/server";
import { api } from "@/lib/backend";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { couponSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = couponSchema.parse(await request.json());
    if (body.expiresAt && Number.isNaN(new Date(body.expiresAt).getTime())) {
      return NextResponse.json({ error: "Enter a valid expiry date or leave it empty." }, { status: 400 });
    }
    const coupon = await api<{ id: string }>("/admin/coupons", {
      body: { ...body, code: body.code.toUpperCase(), expiresAt: body.expiresAt || null },
    });
    return NextResponse.json({ id: coupon.id });
  } catch (error) {
    return errorResponse(error);
  }
}
