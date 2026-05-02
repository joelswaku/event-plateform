import { NextResponse } from "next/server";

export function proxy(req) {
  const token = req.cookies.get("refreshToken")?.value;

  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
