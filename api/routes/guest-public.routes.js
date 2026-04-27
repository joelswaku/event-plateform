import express from "express";
import {
  getInvitationByToken,
  submitInvitationRsvp,
  getPublicEventInfo,
  submitOpenRsvp,
} from "../controllers/guests.public.controller.js";
import { invitationLimiter } from "../utils/rateLimite.js";

const router = express.Router();

router.get("/invitations/:token", invitationLimiter, getInvitationByToken);
router.post("/invitations/:token/rsvp", invitationLimiter, submitInvitationRsvp);
router.get("/events/:eventId", getPublicEventInfo);
router.post("/events/:eventId/rsvp", invitationLimiter, submitOpenRsvp);

export default router;