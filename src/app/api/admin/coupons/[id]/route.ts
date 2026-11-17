import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { databaseConfigured, prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { saveLocalCoupon } from "@/lib/local-coupons";
import { couponSchema } from "@/lib/validators";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const body = couponSchema.parse(await request.json());
    const data = {
      code: body.code.toUpperCase(),
      type: body.type,
      value: body.value,
      minSubtotal: body.minSubtotal,
      active: body.active,
      note: body.note || "",
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    };
    if (!databaseConfigured()) {
      const saved = saveLocalCoupon({ ...data, id: (await context.params).id, expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null });
      if (!saved) return NextResponse.json({ error: "The coupon cannot be saved right now." }, { status: 503 });
      return NextResponse.json({ ok: true });
    }
    await prisma.coupon.update({ where: { id: (await context.params).id }, data });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
