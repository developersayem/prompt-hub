// cookieOptions.ts
import { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions: CookieOptions = {
 httpOnly: true,
  secure: isProduction, // true in production, false in dev
  sameSite: isProduction ? "none" : "lax", // none for cross-site cookies in prod
  path: "/",
  maxAge: 24 * 60 * 60 * 1000, // 1 day, adjust if needed
};

// Or a function that returns options, for more flexibility:
export const getCookieOptions = (overrides?: Partial<CookieOptions>): CookieOptions => ({
  ...cookieOptions,
  ...overrides,
});
