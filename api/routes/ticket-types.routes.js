import express from "express";
import {
  createTicketType,
  getPublicTickets,
  getAdminTickets,
  updateTicketType,
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

router.post("/events/:eventId/tickets", createTicketType);
router.get("/events/:eventId/tickets", getAdminTickets);
router.patch("/tickets/:ticketId", updateTicketType);

export default router;