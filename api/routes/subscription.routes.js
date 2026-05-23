import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getSubscriptionStatus, createCheckoutSession, createPortalSession, verifyCheckoutSession, getStripePrices } from "../controllers/subscription.controller.js";

const router = express.Router();
router.use(authenticate);

router.get("/status",         getSubscriptionStatus);
router.get("/prices",         getStripePrices);
router.get("/verify-session", verifyCheckoutSession);
router.post("/checkout",      createCheckoutSession);
router.post("/portal",        createPortalSession);

export default router;
