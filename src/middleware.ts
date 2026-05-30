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

function addSecurityHeaders(response: NextResponse) {
  const contentSecurityPolicyHeaderValue = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://utfs.io https://lh3.googleusercontent.com https://avatars.githubusercontent.com;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return response;
}

export default auth((req) => {
  const { nextUrl, auth: session } = req as NextRequest & { auth: { user?: { id: string; name?: string; email?: string } } | null };
  const isLoggedIn = !!session;
  const pathname = nextUrl.pathname;

  let response = NextResponse.next();

  // Allow public assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/uploadthing") ||
    pathname.includes(".")
  ) {
    return addSecurityHeaders(response);
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

  // Allow public routes to pass through without auth checks
  if (isPublicRoute && !isAuthRoute) {
    return addSecurityHeaders(response);
  }

  // Redirect logged-in users away from auth routes
  if (isAuthRoute && isLoggedIn) {
    response = NextResponse.redirect(new URL("/dashboard", nextUrl));
    return addSecurityHeaders(response);
  }

  // Redirect unauthenticated users from protected routes
  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    response = NextResponse.redirect(loginUrl);
    return addSecurityHeaders(response);
  }

  return addSecurityHeaders(response);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
