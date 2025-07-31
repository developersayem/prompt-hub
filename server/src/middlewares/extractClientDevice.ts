import { Request, Response, NextFunction } from "express";
import * as UAParser from "ua-parser-js";
import { getGeoLocationFromIP } from "../utils/ipGeolocation";

export const extractClientDevice = async (req: Request, res: Response, next: NextFunction) => {
  const parser = new UAParser.UAParser(req.headers["user-agent"]);
  const ua = parser.getResult();

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    req.ip ||
    "Unknown";

  const location = await getGeoLocationFromIP(ip);

  const os = ua.os.name && ua.os.version ? `${ua.os.name} ${ua.os.version}` : "Unknown OS";
  const browser =
    ua.browser.name && ua.browser.version ? `${ua.browser.name} ${ua.browser.version}` : "Unknown Browser";
  const deviceName =
    ua.device.vendor && ua.device.model
      ? `${ua.device.vendor} ${ua.device.model}`
      : ua.device.model ||
        `${ua.browser.name} on ${ua.os.name}` ||
        "Generic Device";

  (req as any).deviceInfo = {
    ip,
    userAgent: req.headers["user-agent"],
    os,
    browser,
    deviceName,
    location,
  };

  next();
};
