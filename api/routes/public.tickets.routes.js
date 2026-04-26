// api/routes/public.tickets.routes.js
import express    from "express";
import rateLimit  from "express-rate-limit";
import { createTicketOrder }                          from "../controllers/tickets.controller.js";
import { getPublicTickets }                           from "../controllers/ticket-types.controller.js";
import { generateTicketQr, getMyTickets, getQrToken } from "../controllers/guest-tickets.controller.js";

const router = express.Router();
const isDev  = process.env.NODE_ENV === "development";

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Portal lookup: 15 attempts per 15 min per IP — prevents email enumeration
const portalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many lookup attempts. Try again in 15 minutes." },
});

// QR token retrieval: 30 per 10 min per IP — prevents token harvesting
const qrTokenLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  skip: () => isDev,
  message: { success: false, message: "Too many QR requests. Slow down." },
});

// QR image: 60 per minute — CDN-friendly, short TTL set in controller
const qrImageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  skip: () => isDev,
  message: { success: false, message: "Too many QR image requests." },
});

// Order creation: 10 per 15 min per IP — prevents order flooding
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => isDev,
  message: { success: false, message: "Too many orders. Try again later." },
});

// ── Routes ────────────────────────────────────────────────────────────────────

router.get("/events/:eventId/tickets",   getPublicTickets);
router.post("/events/:eventId/orders",   orderLimiter,   createTicketOrder);
router.get("/tickets/qr/:token",         qrImageLimiter, generateTicketQr);
router.get("/tickets/:id/qr-token",      qrTokenLimiter, getQrToken);
router.get("/my-tickets",                portalLimiter,  getMyTickets);

export default router;





// // This route is for public ticket purchasing, no authentication required
// import express from "express";
// import { createTicketOrder } from "../controllers/tickets.controller.js";
// import { getPublicTickets } from "../controllers/ticket-types.controller.js";
// import { generateTicketQr, getMyTickets } from "../controllers/guest-tickets.controller.js";

// const router = express.Router();

// // Fetch available tickets for an event
// router.get("/events/:eventId/tickets", getPublicTickets);

// // Create an order (guest checkout)
// router.post("/events/:eventId/orders", createTicketOrder);

// // QR image for a ticket token → PNG
// router.get("/tickets/qr/:token", generateTicketQr);

// // Guest portal — all tickets for an email address
// router.get("/my-tickets", getMyTickets);

// export default router;
