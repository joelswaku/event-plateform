import express from "express";
import {
  getInvitationByToken,
  submitInvitationRsvp,
  getPublicEventInfo,
  submitOpenRsvp,
  getPublicGuestQrPass,
  generatePublicGuestQrPass,
} from "../controllers/guests.public.controller.js";
import { publicGuestQrLimiter } from "../utils/rateLimite.js";

const router = express.Router();

router.get("/invitations/:token", getInvitationByToken);
router.post("/invitations/:token/rsvp", submitInvitationRsvp);
router.get("/events/:eventId", getPublicEventInfo);
router.post("/events/:eventId/rsvp", submitOpenRsvp);
router.get("/guest-passes/:token", publicGuestQrLimiter, getPublicGuestQrPass);
router.get("/guest-passes/:token/qr", publicGuestQrLimiter, generatePublicGuestQrPass);

export default router;
