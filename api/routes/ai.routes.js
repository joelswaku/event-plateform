import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";
import * as aiCtrl from "../controllers/ai.controller.js";

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many AI requests, please wait." },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatbotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many chatbot requests, please wait." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public chatbot
router.post("/public/events/:eventId/chatbot", chatbotLimiter, aiCtrl.chatbotReply);

// Protected AI routes
router.post("/events/:eventId/generate-content", aiLimiter, authenticate, resolveOrganization, aiCtrl.generateEventContent);
router.post("/events/:eventId/generate-page", aiLimiter, authenticate, resolveOrganization, aiCtrl.generateBuilderPage);
router.post("/events/:eventId/generate-ticket-pricing", aiLimiter, authenticate, resolveOrganization, aiCtrl.generateTicketPricing);
router.post("/events/:eventId/analyze-guests", aiLimiter, authenticate, resolveOrganization, aiCtrl.analyzeGuestList);
router.post("/events/:eventId/generate-seating", aiLimiter, authenticate, resolveOrganization, aiCtrl.generateSmartSeating);
router.post("/events/:eventId/post-event-summary", aiLimiter, authenticate, resolveOrganization, aiCtrl.generatePostEventSummary);
router.post("/events/:eventId/generate-email", aiLimiter, authenticate, resolveOrganization, aiCtrl.generateEmailCopy);
router.post("/events/:eventId/generate-rsvp-form", aiLimiter, authenticate, resolveOrganization, aiCtrl.generateRsvpForm);
router.get("/events/:eventId/performance-prediction", aiLimiter, authenticate, resolveOrganization, aiCtrl.getPerformancePrediction);

export default router;
