// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/features",
  "/pricing",
  "/blog",
  "/faqs",
  "/contact",
];

const AUTH_ROUTES = ["/login"];

export default auth((req) => {
  const { nextUrl, auth: session } = req as NextRequest & { auth: { user?: { id: string; name?: string; email?: string } } | null };
  const isLoggedIn = !!session;
  const pathname = nextUrl.pathname;

  // Allow public assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/uploadthing") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isDashboardRoute = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/parties") ||
    pathname.startsWith("/expense") ||
    pathname.startsWith("/income") ||
    pathname.startsWith("/manage-account") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/business-tools") ||
    pathname.startsWith("/help-and-supports") ||
    pathname.startsWith("/tutorials") ||
    pathname.startsWith("/whats-new") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  // Redirect logged-in users away from auth routes
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect unauthenticated users from protected routes
  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
