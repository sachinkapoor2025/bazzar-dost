import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { newsletterSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = newsletterSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    const existing = await prisma.inquiry.findFirst({ where: { type: "newsletter", email } });
    if (existing) return NextResponse.json({ message: "This email is already on the list." });
    await prisma.inquiry.create({ data: { type: "newsletter", email, status: "new" } });
    return NextResponse.json({ message: "You're on the list. The store can use this address for BazaarDost updates." });
  } catch (error) {
    return errorResponse(error);
  }
}
