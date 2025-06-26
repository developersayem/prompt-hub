import type{ Request, Response, NextFunction } from "express";
import type{ JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.ts";
import { User } from "../models/users.model.ts";
import asyncHandler from "../utils/asyncHandler.ts";

// Extend Request to include `user`
export interface AuthenticatedRequest extends Request {
  user?: typeof User.prototype;
}

// Define token payload structure (customize if needed)
interface DecodedToken extends JwtPayload {
  _id: string;
  email: string;
}

export const verifyJWT = asyncHandler(
  async (req: AuthenticatedRequest, _: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized - No token provided");
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as DecodedToken;

      const user = await User.findById(decoded._id).select("-password -refreshToken");

      if (!user) throw new ApiError(401, "Unauthorized - User not found");

      req.user = user;

      next();
    } catch (error: any) {
        console.error("JWT verification error:", error);
      throw new ApiError(401, error.message || "Invalid access token");
    }
  }
);
