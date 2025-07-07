// cookieOptions.ts
import { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";
// If you’re on a custom domain (e.g. *.shopxet.com), set a shared cookie domain
const domain = isProduction ? process.env.COOKIE_DOMAIN || ".shopxet.com" : undefined;

export const cookieOptions: CookieOptions = {
httpOnly: true,
  secure: isProduction, // true in production, false in dev
  sameSite: isProduction ? "none" : "lax", // none for cross-site cookies in prod
  path: "/",
  domain,
  maxAge: 24 * 60 * 60 * 1000, // 1 day, adjust if needed
};

// Or a function that returns options, for more flexibility:
export const getCookieOptions = (overrides?: Partial<CookieOptions>): CookieOptions => ({
  ...cookieOptions,
  ...overrides,
});
