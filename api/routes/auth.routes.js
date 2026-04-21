
import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { resetLimiter, loginLimiter } from "../utils/rateLimite.js";

import { register } from "../controllers/auth/register.controller.js";
import { login } from "../controllers/auth/login.controller.js";
import { logout } from "../controllers/auth/logout.controller.js";
import { refreshToken } from "../controllers/auth/refreshToken.controller.js";
import { verifyEmail } from "../controllers/auth/verifyEmail.controller.js";
import { forgotPassword } from "../controllers/auth/forgotPassword.controller.js";
import { resetPassword } from "../controllers/auth/resetPassword.controller.js";
import { googleLogin } from "../controllers/auth/googleLogin.controller.js";
import { me } from "../controllers/auth/me.controller.js";

const router = Router();

/* =========================
   PUBLIC ROUTES (NO AUTH)
========================= */

// Register new user
router.post("/register", register);

// Login user
router.post("/login", loginLimiter, login);

// Google OAuth login
router.post("/google", googleLogin);

// Refresh access token
router.post("/refresh-token", refreshToken);

// Verify email
router.post("/verify-email", verifyEmail);

// Request password reset
router.post("/request-password-reset", forgotPassword);

// Reset password
router.post("/reset-password", resetLimiter, resetPassword);

/* =========================
   PROTECTED ROUTES (AUTH REQUIRED)
========================= */

// Logout user
router.post("/logout", authenticate, logout);

// Get current user
router.get("/me", authenticate, me);

export default router;


