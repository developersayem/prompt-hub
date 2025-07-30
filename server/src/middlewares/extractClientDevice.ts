import useragent from "useragent";
import { Request, Response, NextFunction } from "express";

export const extractClientDevice = (req: Request, res: Response, next: NextFunction) => {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "";

  const userAgentString = req.headers["user-agent"] || "";
  const agent = useragent.parse(userAgentString);
  const os = agent.os.toString();
  const browser = agent.toAgent();
  let deviceName = agent.device.toString();

  // Fallback for "Other 0.0.0"
  if (deviceName === "Other 0.0.0" || !deviceName.trim()) {
    deviceName = "Unknown Device";
  }

  (req as any).deviceInfo = {
    ip,
    userAgent: userAgentString,
    os,
    browser,
    deviceName,
  };

  next();
};
