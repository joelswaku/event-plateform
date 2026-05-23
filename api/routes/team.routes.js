import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";
import {
  listMembers,
  inviteMember,
  acceptInvite,
  getInviteInfo,
  removeMember,
  portalLogin,
  setupPassword,
  getMyTeamEvents,
} from "../controllers/team.controller.js";

const router = express.Router({ mergeParams: true });

// Public — no auth needed
router.get( "/invite-info/:token", getInviteInfo);
router.post("/portal-login",       portalLogin);
router.post("/setup-password",     setupPassword);

// Authenticated — not scoped to an event
router.get("/my-events", authenticate, getMyTeamEvents);

// Authenticated — scoped to an event (mergeParams provides eventId)
router.get(   "/",              authenticate, resolveOrganization, listMembers);
router.post(  "/invite",        authenticate, resolveOrganization, inviteMember);
router.post(  "/accept/:token", authenticate,                     acceptInvite);
router.delete("/:memberId",     authenticate, resolveOrganization, removeMember);

export default router;
