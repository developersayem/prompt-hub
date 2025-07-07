// cookieOptions.ts
import { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,                // ✅ Secure cookies in production (HTTPS only)
  sameSite: isProduction ? "none" : "lax", // ✅ Cross-site cookies allowed in prod
  path: "/",
  domain: isProduction ? process.env.COOKIE_DOMAIN || "api.shopxet.com" : undefined, // ✅ Optional in dev
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};
