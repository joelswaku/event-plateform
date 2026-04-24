import express from "express";
import {
  createTicketType,
  getPublicTickets,
  getAdminTickets,
  updateTicketType,
  deleteTicketType,
  getTicketStats,
  listOrders,
  getEventsWithTickets,
} from "../controllers/ticket-types.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";

const router = express.Router();

/*
========================================
PUBLIC ROUTES (FRONTEND)
========================================
*/

router.get("/public/events/:eventId/tickets", getPublicTickets);

/*
========================================
ADMIN ROUTES
========================================
*/

router.use(authenticate);
router.use(resolveOrganization);

router.get("/events-with-tickets", getEventsWithTickets);
router.post("/events/:eventId/tickets", createTicketType);
router.get("/events/:eventId/tickets", getAdminTickets);
router.get("/events/:eventId/tickets/stats", getTicketStats);
router.get("/events/:eventId/orders", listOrders);
router.patch("/tickets/:ticketId", updateTicketType);
router.delete("/tickets/:ticketId", deleteTicketType);

export default router;