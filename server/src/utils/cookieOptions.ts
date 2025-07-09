import { CookieOptions } from "express";
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction, // secure only in production
  sameSite: isProduction ? "none" : "lax", // lax in local, none in prod
  domain: isProduction ? ".shopxet.com" : undefined, // no domain for localhost
  path: "/",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};
