// cookieOptions.ts
import { CookieOptions } from "express";

// const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,                // Secure cookies in production (HTTPS only)
  sameSite: "none", // Cross-site cookies allowed in prod
  path: "/",
  // domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};
