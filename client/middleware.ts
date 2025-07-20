import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Define protected routes
const protectedRoutes = ["/dashboard", "/dashboard/"];

const JWT_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || "your_default_secret";

// Decode the key properly
const getSecret = () =>
  new TextEncoder().encode(JWT_SECRET);

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get("accessToken")?.value;
  const url = req.nextUrl;
  console.log("🔑 JWT_SECRET:", JWT_SECRET);

  console.log("💡 Middleware accessToken:", token);

  const isProtected = protectedRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return redirectToLogin(req);
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      console.log("✅ JWT valid:", payload);

      return NextResponse.next();
    } catch (err) {
      console.warn("⛔ JWT invalid:", err);
      return clearTokenAndRedirect(req);
    }
  }

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/auth/login", req.url));
}

function clearTokenAndRedirect(req: NextRequest): NextResponse {
  const res = redirectToLogin(req);
  res.cookies.set("accessToken", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    domain: ".shopxet.com", // make sure this matches
  });
  return res;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/(.*)"],
};
