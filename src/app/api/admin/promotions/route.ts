import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { promotionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = promotionSchema.parse(await request.json());
    if (body.href && !body.href.startsWith("/")) return NextResponse.json({ error: "The link must start with /." }, { status: 400 });
    const promotion = await prisma.promotion.create({ data: body });
    return NextResponse.json({ id: promotion.id });
  } catch (error) {
    return errorResponse(error);
  }
}
