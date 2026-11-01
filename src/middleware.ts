import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { canonicalRedirectTarget } from "@/lib/site";
import { getSessionSecret, SESSION_COOKIE } from "@/lib/secret";

export async function middleware(request: NextRequest) {
  const target = canonicalRedirectTarget(
    [request.headers.get("x-forwarded-host"), request.headers.get("host")],
    request.nextUrl.pathname,
    request.nextUrl.search,
  );
  if (target) return NextResponse.redirect(target, 308);

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/account") && !pathname.startsWith("/admin")) return NextResponse.next();

  const secret = getSessionSecret();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const next = `${pathname}${request.nextUrl.search}`;
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|media/|uploads/).*)"],
};
