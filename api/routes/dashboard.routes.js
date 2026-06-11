



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
import { callClaude } from "../services/claude.service.js";

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

// TEMP: Claude Bedrock smoke test — remove after verification
router.get("/test-claude", async (req, res) => {
  try {
    const text = await callClaude({
      system: 'You are a helpful assistant.',
      prompt: 'Say hello in one sentence.',
    });
    res.json({ ok: true, response: text });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;


