import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/events", "/planner", "/tickets", "/billing", "/settings"];

export function proxy(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("refreshToken")?.value;

  // Authenticated users hitting the landing page → go to dashboard
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Unauthenticated users hitting protected routes → go to login
  if (!token && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/events/:path*", "/planner/:path*", "/tickets/:path*", "/billing/:path*", "/settings/:path*"],
};
