import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { couponSchema } from "@/lib/validators";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const body = couponSchema.parse(await request.json());
    await prisma.coupon.update({
      where: { id: (await context.params).id },
      data: {
        code: body.code.toUpperCase(),
        type: body.type,
        value: body.value,
        minSubtotal: body.minSubtotal,
        active: body.active,
        note: body.note || "",
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
