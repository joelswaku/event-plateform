import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV === "development";

// Password reset — tight limit, applies in all environments
export const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many reset attempts, try again in 15 minutes." },
});

// Login — brute-force protection in production only
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: () => isDev,
  message: { success: false, message: "Too many login attempts, try again in 15 minutes." },
});
