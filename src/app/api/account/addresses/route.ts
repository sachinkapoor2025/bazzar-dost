import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { addressSchema } from "@/lib/validators";

async function list(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = addressSchema.parse(await request.json());
    if (body.isDefault) await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    await prisma.address.create({ data: { ...body, userId: user.id } });
    return NextResponse.json({ addresses: await list(user.id) });
  } catch (error) {
    return errorResponse(error);
  }
}
