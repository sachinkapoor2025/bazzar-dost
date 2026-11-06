import { NextResponse } from "next/server";
import { ApiError } from "@/lib/backend";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionSecret } from "@/lib/secret";
import { resendLiveSignup } from "@/lib/signup";
import { resendOtpSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    if (!getSessionSecret()) return NextResponse.json({ error: "Accounts are not configured." }, { status: 500 });
    const body = resendOtpSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    if (!rateLimit(`resend:${email}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const result = await resendLiveSignup(email);
    if (!result.ok) return NextResponse.json({ error: result.error, resendIn: result.resendIn }, { status: result.status });
    return NextResponse.json({ ok: true, resendIn: result.resendIn, message: result.message });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return errorResponse(error);
  }
}
