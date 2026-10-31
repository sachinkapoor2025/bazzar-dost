import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!address) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    await prisma.address.delete({ where: { id } });
    const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
    return NextResponse.json({ addresses });
  } catch (error) {
    return errorResponse(error);
  }
}
