import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { resetSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = resetSchema.parse(await request.json());
    const tokenHash = crypto.createHash("sha256").update(body.token).digest("hex");
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link is not valid." }, { status: 400 });
    }
    await prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(body.password) } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });
    return NextResponse.json({ message: "Password updated. You can sign in." });
  } catch (error) {
    return errorResponse(error);
  }
}
