import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

// Define which routes are protected
const protectedRoutes = ["/create"];

// Use a strong secret, set it in your `.env.local`
const JWT_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || "your_default_secret";

// Extend token structure if needed
interface MyJwtPayload extends JwtPayload {
  userId?: string;
  email?: string;
}

export function middleware(req: NextRequest): NextResponse {
  const token = req.cookies.get("accessToken")?.value;

  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Require login for protected routes
  if (isProtected && !token) {
    return redirectToLogin(req);
  }

  // 🧠 Validate the JWT
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;

      if (!decoded || !decoded.exp) {
        throw new Error("Invalid token structure");
      }

      return NextResponse.next();
    } catch (err) {
      console.warn("JWT expired or invalid:", err);
      return clearTokenAndRedirect(req);
    }
  }

  return NextResponse.next();
}

// Helper to redirect to login
function redirectToLogin(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/auth/login", req.url));
}

// Helper to clear accessToken cookie and redirect
function clearTokenAndRedirect(req: NextRequest): NextResponse {
  const res = redirectToLogin(req);
  res.cookies.set("accessToken", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}

// Apply middleware only to these routes
export const config = {
  matcher: ["/create"], // Add more as needed
};
