// // api/routes/test-email.route.js
// import express from "express";
// import { sendWelcomeEmail } from "../utils/sendEmail.js";

// const router = express.Router();

// router.get("/test-email", async (req, res) => {
//   try {
//     const result = await sendWelcomeEmail({
//       to: "joelswaku@gmail.com",
//       name: "Joel",
//     });

//     res.json({
//       success: true,
//       result,
//     });
//   } catch (error) {
//     console.error("Test email failed:", error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// export default router;


import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listMembers, inviteMember, removeMember,
  acceptInvite, getInviteInfo,
  setupPassword, getMyTeamEvents, getMyRoleForEvent,
} from "../controllers/team.controller.js";

const router = express.Router();

// Public
router.get("/invite-info/:token", getInviteInfo);
router.post("/accept-new/:token", setupPassword);

// Authenticated
router.use(authenticate);
router.get("/my-events", getMyTeamEvents);
router.get("/my-role/:eventId", getMyRoleForEvent);  // ← NEW

// Event-scoped
router.get("/events/:eventId/team", listMembers);
router.post("/events/:eventId/team/invite", inviteMember);
router.delete("/events/:eventId/team/:memberId", removeMember);
router.post("/events/:eventId/team/accept/:token", acceptInvite);

export default router;