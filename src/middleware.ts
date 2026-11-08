import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Routes requiring active agent authentication
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/pipeline",
  "/deals",
  "/quotations",
  "/properties",
  "/inbox",
  "/trippings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    const authSessionCookie = request.cookies.get("propflow_auth_session");

    // If no active agent session exists, redirect to login with return path
    if (!authSessionCookie || !authSessionCookie.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pipeline/:path*",
    "/deals/:path*",
    "/quotations/:path*",
    "/properties/:path*",
    "/inbox/:path*",
    "/trippings/:path*",
  ],
};
