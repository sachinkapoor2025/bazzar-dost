import { NextResponse } from "next/server";
import { ApiError, api } from "@/lib/backend";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { setSessionCookie, signSession } from "@/lib/auth";
import { getSessionSecret } from "@/lib/secret";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    if (!getSessionSecret()) return NextResponse.json({ error: "Sign-in is not configured." }, { status: 500 });
    const body = loginSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    if (!rateLimit(`login:${email}`, 8, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
    }
    const user = await api<{ id: string }>("/auth/login", { body: { email, password: body.password } });
    const token = await signSession(user.id);
    if (!token) return NextResponse.json({ error: "Sign-in is not configured." }, { status: 500 });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return errorResponse(error);
  }
}
