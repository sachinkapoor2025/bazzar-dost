import { NextResponse } from "next/server";
import { setSessionCookie, signSession } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionSecret } from "@/lib/secret";
import { verifySignup } from "@/lib/signup";
import { verifyOtpSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    if (!getSessionSecret()) return NextResponse.json({ error: "Accounts are not configured." }, { status: 500 });
    const body = verifyOtpSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    if (!rateLimit(`verify:${email}`, 12, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
    }
    const result = await verifySignup(email, body.otp);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const token = await signSession(result.userId, result.role);
    if (!token) return NextResponse.json({ error: "Accounts are not configured." }, { status: 500 });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    return errorResponse(error);
  }
}
