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

// Register — prevent account creation spam
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skip: () => isDev,
  message: { success: false, message: "Too many accounts created from this IP, try again in an hour." },
});

// Google OAuth — prevent token stuffing
export const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skip: () => isDev,
  message: { success: false, message: "Too many OAuth attempts, try again in 15 minutes." },
});

// Public invitation endpoints — prevents token enumeration; keyed per-token so legitimate
// guests are not affected by other IPs hammering the same route
export const invitationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: () => isDev,
  keyGenerator: (req) => `${req.ip}:${req.params.token ?? ""}`,
  message: { success: false, message: "Too many requests for this invitation, try again later." },
});

// QR check-in scan — one scan per second per IP is plenty even for busy venues
export const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  skip: () => isDev,
  message: { success: false, message: "Too many scan attempts, slow down." },
});

// Admin send-QR-by-email — prevents accidental or intentional email flooding per guest
export const sendQrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skip: () => isDev,
  keyGenerator: (req) => `${req.ip}:${req.params.guestId ?? ""}`,
  message: { success: false, message: "Too many QR email requests, try again in an hour." },
});
