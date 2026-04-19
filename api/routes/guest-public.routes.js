import express from "express";
import {
  getInvitationByToken,
  submitInvitationRsvp,
} from "../controllers/guests.public.controller.js";

const router = express.Router();

router.get("/public/invitations/:token", getInvitationByToken);
router.post("/public/invitations/:token/rsvp", submitInvitationRsvp);

export default router;