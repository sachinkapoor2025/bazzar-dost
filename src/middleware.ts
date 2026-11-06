import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { isAdminRole } from "@/lib/staff";
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
  const adminPage = pathname.startsWith("/admin");
  const adminApi = pathname.startsWith("/api/admin");
  if (!pathname.startsWith("/account") && !adminPage && !adminApi) return NextResponse.next();

  const secret = getSessionSecret();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const next = `${pathname}${request.nextUrl.search}`;
  const redirect = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(next)}`;
    return NextResponse.redirect(url);
  };
  if (!secret || !token) {
    if (adminApi) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    return redirect();
  }
  try {
    const { payload } = await jwtVerify(token, secret);
    if ((adminPage || adminApi) && !isAdminRole(payload.role)) {
      if (adminApi) return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  } catch {
    if (adminApi) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    return redirect();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|logo.png|media/|uploads/).*)"],
};
