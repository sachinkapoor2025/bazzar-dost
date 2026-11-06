import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionSecret } from "@/lib/secret";
import { resendSignup } from "@/lib/signup";
import { resendOtpSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    if (!getSessionSecret()) return NextResponse.json({ error: "Accounts are not configured." }, { status: 500 });
    const body = resendOtpSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    if (!rateLimit(`resend:${email}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many code requests. Try again later." }, { status: 429 });
    }
    const result = await resendSignup(email);
    if (!result.ok) return NextResponse.json({ error: result.error, resendIn: result.resendIn }, { status: result.status });
    return NextResponse.json({ ok: true, message: result.message, resendIn: result.resendIn });
  } catch (error) {
    return errorResponse(error);
  }
}
