import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

const protectedRoutes = ["/create"];

// Make sure to set this in your .env.local
const JWT_SECRET = process.env.JWT_SECRET || "your_default_secret";

// Extend JwtPayload to include any custom properties if needed
interface MyJwtPayload extends JwtPayload {
  userId?: string; // Optional: adjust based on your token payload
  exp?: number; // Add this line to include the exp property
}

export function middleware(req: NextRequest): NextResponse {
  const token = req.cookies.get("accessToken")?.value;

  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;

      // Optional: you can check for custom fields here
      if (!decoded || !decoded.exp) {
        throw new Error("Invalid token structure");
      }

      return NextResponse.next();
    } catch (err) {
  console.error(err); // Log the error
  const response = NextResponse.redirect(new URL("/auth/login", req.url));
  // Clear the cookie
  response.cookies.set("accessToken", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
}
  }

  return NextResponse.next();
}

// Apply middleware only to protected routes
export const config = {
  matcher: ["/create"],
};
