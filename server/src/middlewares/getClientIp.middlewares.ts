import { Request, Response, NextFunction } from "express";

export interface RequestWithIP extends Request {
  clientIP?: string;
}

export const extractClientIP = (
  req: RequestWithIP,
  res: Response,
  next: NextFunction
) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket.remoteAddress || "";

  req.clientIP = ip.replace("::ffff:", "");
  next();
};
