import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getSessionSecret, SESSION_COOKIE } from "@/lib/secret";

export async function middleware(request: NextRequest) {
  const secret = getSessionSecret();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const redirect = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(next)}`;
    return NextResponse.redirect(url);
  };
  if (!secret || !token) return redirect();
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return redirect();
  }
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
