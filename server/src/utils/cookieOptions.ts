// cookieOptions.ts
import { CookieOptions } from "express";

// const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions: CookieOptions = {
 httpOnly: true,
  secure: true,
  sameSite: "none",
  domain: ".shopxet.com", // ✅ update this!
  path: "/",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};
