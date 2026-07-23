
import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { resetLimiter, loginLimiter, registerLimiter, googleAuthLimiter } from "../utils/rateLimite.js";

import { register } from "../controllers/auth/register.controller.js";
import { login } from "../controllers/auth/login.controller.js";
import { logout } from "../controllers/auth/logout.controller.js";
import { refreshToken } from "../controllers/auth/refreshToken.controller.js";
import { verifyEmail, resendCode } from "../controllers/auth/verifyEmail.controller.js";
import { forgotPassword } from "../controllers/auth/forgotPassword.controller.js";
import { resetPassword } from "../controllers/auth/resetPassword.controller.js";
import { googleLogin } from "../controllers/auth/googleLogin.controller.js";
import { me }             from "../controllers/auth/me.controller.js";
import { uploadAvatar }   from "../controllers/auth/uploadAvatar.controller.js";
import { updateProfile }  from "../controllers/auth/updateProfile.controller.js";
import { changePassword } from "../controllers/auth/changePassword.controller.js";
import { upload }         from "../middleware/upload.middleware.js";
import { acceptTerms }    from "../controllers/auth/accept-terms.controller.js";

const router = Router();

/* =========================
   PUBLIC ROUTES (NO AUTH)
========================= */

// Register new user
router.post("/register", registerLimiter, register);

// Login user
router.post("/login", loginLimiter, login);

// Google OAuth login
router.post("/google", googleAuthLimiter, googleLogin);

// Refresh access token
router.post("/refresh-token", refreshToken);

// Verify email with code
router.post("/verify-email", verifyEmail);

// Resend verification code
router.post("/resend-verification-code", resendCode);

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

// Upload / update profile avatar
router.patch("/avatar",    authenticate, upload.single("file"), uploadAvatar);
// Update profile info (name)
router.patch("/profile",   authenticate, updateProfile);
// Change password
router.patch("/password",  authenticate, changePassword);
// Accept legal terms
router.post("/accept-terms", authenticate, acceptTerms);

export default router;


