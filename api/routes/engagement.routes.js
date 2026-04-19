import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";
import * as engagementController from "../controllers/engagement.controller.js";
import * as messagingController from "../controllers/messaging.controller.js";
import * as billingController from "../controllers/billing.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GIFTS
|--------------------------------------------------------------------------
*/
router.get(
  "/events/:eventId/gifts",
  authenticate,
  resolveOrganization,
  engagementController.listGifts
);

router.post(
  "/events/:eventId/gifts",
  authenticate,
  resolveOrganization,
  engagementController.createGift
);

/*
|--------------------------------------------------------------------------
| DONATIONS
|--------------------------------------------------------------------------
| Public create intent, protected list
*/
router.post(
  "/events/:eventId/donations",
  engagementController.createDonationIntent
);

router.get(
  "/events/:eventId/donations",
  authenticate,
  resolveOrganization,
  engagementController.listDonations
);

/*
|--------------------------------------------------------------------------
| MESSAGES
|--------------------------------------------------------------------------
*/
router.get(
  "/events/:eventId/messages",
  authenticate,
  resolveOrganization,
  messagingController.listMessages
);

router.post(
  "/events/:eventId/messages",
  authenticate,
  resolveOrganization,
  messagingController.createMessage
);

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/
router.get(
  "/events/:eventId/dashboard",
  authenticate,
  resolveOrganization,
  engagementController.getEventDashboard
);

/*
|--------------------------------------------------------------------------
| DISCOUNTS
|--------------------------------------------------------------------------
*/
router.get(
  "/events/:eventId/discounts",
  authenticate,
  resolveOrganization,
  billingController.listDiscounts
);

router.post(
  "/events/:eventId/discounts",
  authenticate,
  resolveOrganization,
  billingController.createDiscount
);

/*
|--------------------------------------------------------------------------
| PLANS
|--------------------------------------------------------------------------
*/
router.get(
  "/billing/plans",
  billingController.listPlans
);

export default router;