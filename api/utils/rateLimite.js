import rateLimit from "express-rate-limit";

export const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});