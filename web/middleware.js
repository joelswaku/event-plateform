import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/events", "/planner", "/tickets", "/billing", "/settings"];

// Public routes that should ALWAYS be accessible without auth
const PUBLIC_EXACT = ["/", "/login", "/register", "/signup", "/features", "/pricing", "/templates", "/about", "/contact", "/faq", "/terms", "/privacy-policy", "/cookies-policy", "/acceptable-use"];
const PUBLIC_PREFIXES = ["/e/", "/_next", "/api/public"];

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("refreshToken")?.value;

  // Always allow exact public routes
  if (PUBLIC_EXACT.includes(pathname)) {
    return NextResponse.next();
  }

  // Always allow public prefixes
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Unauthenticated users hitting protected routes → redirect to login
  if (!token && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow everything else (don't block unknown routes)
  return NextResponse.next();
}

export const config = {
  // Only run middleware on app routes (not static files, images, sitemap, robots.txt, etc)
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
