import { NextResponse } from "next/server";
import { prisma, databaseConfigured } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";
import { getSessionSecret } from "@/lib/secret";
import { roleForEmail } from "@/lib/staff";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    if (!getSessionSecret()) return NextResponse.json({ error: "Sign-in is not configured." }, { status: 500 });
    if (!databaseConfigured()) return NextResponse.json({ error: "Sign-in is unavailable because the account database is not configured." }, { status: 503 });
    const body = loginSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    if (!rateLimit(`login:${email}`, 8, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "Email or password is not correct." }, { status: 401 });
    }
    let role = user.role;
    if (roleForEmail(user.email) === "admin" && role !== "admin") {
      await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
      role = "admin";
    }
    const token = await signSession(user.id, role);
    if (!token) return NextResponse.json({ error: "Sign-in is not configured." }, { status: 500 });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
