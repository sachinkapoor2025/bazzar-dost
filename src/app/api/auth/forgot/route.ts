import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { mailConfigured, sendMail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";
import { forgotSchema } from "@/lib/validators";

const message = "If an account exists for that email and outbound email is configured, a reset link has been sent. If email is not configured, no message is sent.";

export async function POST(request: Request) {
  try {
    const body = forgotSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    if (!rateLimit(`forgot:${email}`, 5, 60 * 60 * 1000)) return NextResponse.json({ message });
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && mailConfigured()) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
      await sendMail(user.email, "Reset your BazaarDost password", `Open this link within 30 minutes:\n${absoluteUrl(`/reset-password?token=${token}`)}\n`);
    }
    return NextResponse.json({ message });
  } catch (error) {
    return errorResponse(error);
  }
}
