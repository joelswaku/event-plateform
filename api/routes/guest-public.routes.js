import express from "express";
import {
  getInvitationByToken,
  submitInvitationRsvp,
  getPublicEventInfo,
} from "../controllers/guests.public.controller.js";

const router = express.Router();

router.get("/invitations/:token", getInvitationByToken);
router.post("/invitations/:token/rsvp", submitInvitationRsvp);
router.get("/events/:eventId", getPublicEventInfo);

export default router;           