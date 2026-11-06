import { NextResponse } from "next/server";
import { ApiError } from "@/lib/backend";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionSecret } from "@/lib/secret";
import { startLiveSignup } from "@/lib/signup";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    if (!getSessionSecret()) return NextResponse.json({ error: "Accounts are not configured." }, { status: 500 });
    const body = registerSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    if (!rateLimit(`register:${email}`, 8, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const result = await startLiveSignup({ email, name: body.name, phone: body.phone, password: body.password });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, step: "verify", email, resendIn: result.resendIn, message: result.message });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return errorResponse(error);
  }
}
