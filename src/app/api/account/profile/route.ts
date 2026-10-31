import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { profileSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = profileSchema.parse(await request.json());
    await prisma.user.update({ where: { id: user.id }, data: { name: body.name, phone: body.phone } });
    return NextResponse.json({ message: "Profile saved." });
  } catch (error) {
    return errorResponse(error);
  }
}
