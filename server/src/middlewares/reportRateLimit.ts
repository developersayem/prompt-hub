import rateLimit from "express-rate-limit";

// Middleware to rate limit report submissions: 5 per hour per IP
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many reports submitted. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
