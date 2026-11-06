import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getSessionSecret, SESSION_COOKIE } from "@/lib/secret";
import { canonicalRedirectTarget } from "@/lib/site";
import { isAdminRole } from "@/lib/staff";

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
  const accountPage = pathname.startsWith("/account");
  if (!adminPage && !adminApi && !accountPage) return NextResponse.next();

  const secret = getSessionSecret();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const next = `${pathname}${request.nextUrl.search}`;
  const denyApi = (status: number, error: string) => NextResponse.json({ error }, { status });
  const redirectToLogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(next)}`;
    return NextResponse.redirect(url);
  };
  if (!secret || !token) return adminApi ? denyApi(401, "Sign in required.") : redirectToLogin();
  try {
    const { payload } = await jwtVerify(token, secret);
    if ((adminPage || adminApi) && !isAdminRole(payload.role)) {
      if (adminApi) return denyApi(403, "Admin access is required.");
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  } catch {
    return adminApi ? denyApi(401, "Sign in required.") : redirectToLogin();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|logo.png|media/|uploads/).*)"],
};
