import rateLimit from "express-rate-limit";

export const sendCodeLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many resend attempts. Please try again later.",
});
