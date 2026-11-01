import { NextResponse } from "next/server";
import { ApiError, api } from "@/lib/backend";
import { setSessionCookie, signSession } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionSecret } from "@/lib/secret";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    if (!getSessionSecret()) return NextResponse.json({ error: "Accounts are not configured." }, { status: 500 });
    const body = registerSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    if (!rateLimit(`register:${email}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const user = await api<{ id: string }>("/auth/register", { body: { email, name: body.name, phone: body.phone, password: body.password } });
    const token = await signSession(user.id);
    if (!token) return NextResponse.json({ error: "Accounts are not configured." }, { status: 500 });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return errorResponse(error);
  }
}
