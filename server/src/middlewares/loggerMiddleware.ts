import type{ Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Get client IP address
  // Express sets req.ip, but behind proxies you may want req.headers['x-forwarded-for']
  const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${ip} - ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
};
