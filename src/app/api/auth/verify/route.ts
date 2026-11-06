import { NextResponse } from "next/server";
import { ApiError } from "@/lib/backend";
import { setSessionCookie, signSession } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionSecret } from "@/lib/secret";
import { verifyLiveSignup } from "@/lib/signup";
import { verifyOtpSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    if (!getSessionSecret()) return NextResponse.json({ error: "Accounts are not configured." }, { status: 500 });
    const body = verifyOtpSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    if (!rateLimit(`verify:${email}`, 12, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
    }
    const user = await verifyLiveSignup(email, body.otp);
    const token = await signSession(user.id, user.role);
    if (!token) return NextResponse.json({ error: "Accounts are not configured." }, { status: 500 });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true, message: "Email verified. Your account is ready." });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return errorResponse(error);
  }
}
