// This route is for public ticket purchasing, no authentication required
import express from "express";
import { createTicketOrder } from "../controllers/tickets.controller.js";
import { getPublicTickets } from "../controllers/ticket-types.controller.js";
import { generateTicketQr, getMyTickets } from "../controllers/guest-tickets.controller.js";

const router = express.Router();

// Fetch available tickets for an event
router.get("/events/:eventId/tickets", getPublicTickets);

// Create an order (guest checkout)
router.post("/events/:eventId/orders", createTicketOrder);

// QR image for a ticket token → PNG
router.get("/tickets/qr/:token", generateTicketQr);

// Guest portal — all tickets for an email address
router.get("/my-tickets", getMyTickets);

export default router;
