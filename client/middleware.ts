import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/feed", "/create"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken");

  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/feed", "/create"],
};
