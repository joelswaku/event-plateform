import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";

import { resolveOrganization } from "../middleware/organization.middleware.js";
import {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  cancelEvent,
  archiveEvent,
  restoreEvent,
  duplicateEvent,
  getEventDashboard,
  getPublicEventBySlug,
} from "../controllers/events.controller.js";

const router = express.Router();
router.get("/public/:slug", getPublicEventBySlug);

router.post("/", authenticate, resolveOrganization, createEvent);
router.get("/" ,authenticate, resolveOrganization, listEvents);
router.get("/:id", authenticate, resolveOrganization, getEventById);
router.patch("/:id",  authenticate, resolveOrganization, updateEvent);
router.delete("/:id", authenticate, resolveOrganization, deleteEvent);

router.post("/:id/publish",  authenticate, resolveOrganization, publishEvent);
router.post("/:id/unpublish", authenticate, resolveOrganization, unpublishEvent);
router.post("/:id/cancel",  authenticate, resolveOrganization, cancelEvent);
router.post("/:id/archive",  authenticate, resolveOrganization, archiveEvent);
router.post("/:id/restore",  authenticate, resolveOrganization, restoreEvent);
router.post("/:id/duplicate", authenticate, resolveOrganization, duplicateEvent);

router.get("/:id/dashboard", authenticate,  resolveOrganization, getEventDashboard);








export default router;
