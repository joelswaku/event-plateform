



import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";
import {
  getEventAnalyticsDashboard,
  getTicketSalesAnalytics,
  getTicketCheckinAnalytics,

  getRevenueTimeline,
  getConversionAnalytics,
  getInsights



} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(resolveOrganization);

/*
|--------------------------------------------------------------------------
| EVENT ANALYTICS DASHBOARD
|--------------------------------------------------------------------------
*/

router.get("/events/:eventId/analytics/dashboard", getEventAnalyticsDashboard);
router.get("/events/:eventId/analytics/ticket-sales", getTicketSalesAnalytics);
router.get("/events/:eventId/analytics/ticket-checkins", getTicketCheckinAnalytics);

router.get("/events/:eventId/analytics/revenue", getRevenueTimeline);
router.get("/events/:eventId/analytics/conversion", getConversionAnalytics);
router.get("/events/:eventId/analytics/insights", getInsights);

//router.get("/events/:eventId/overview", getFullEventOverview);

export default router;


