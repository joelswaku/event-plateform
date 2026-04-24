
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";
import { scanLimiter, sendQrLimiter } from "../utils/rateLimite.js";
import {
  createGuest,
  listGuests,
  getGuestById,
  updateGuest,
  deleteGuest,
  createGuestGroup,
  listGuestGroups,
  updateGuestGroup,
  deleteGuestGroup,
  submitGuestRsvp,
  listGuestRsvps,
  markGuestAttendance,
  generateQrPass,
  sendQrEmail,
  sendGuestInvitation,
  checkInGuestByQr,
  getGuestDashboard,
  sendInvitationsToAllGuests,
  manualCheckIn,
  listAttendance,
} from "../controllers/guests.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(resolveOrganization);

router.post("/events/:eventId/guests", createGuest);
router.get("/events/:eventId/guests", listGuests);
router.get("/events/:eventId/guests/:guestId", getGuestById);
router.patch("/events/:eventId/guests/:guestId", updateGuest);
router.delete("/events/:eventId/guests/:guestId", deleteGuest);

router.post("/events/:eventId/guest-groups", createGuestGroup);
router.get("/events/:eventId/guest-groups", listGuestGroups);
router.patch("/events/:eventId/guest-groups/:groupId", updateGuestGroup);
router.delete("/events/:eventId/guest-groups/:groupId", deleteGuestGroup);

router.post("/events/:eventId/rsvps", submitGuestRsvp);
router.get("/events/:eventId/rsvps", listGuestRsvps);

router.post("/events/:eventId/attendance", markGuestAttendance);

router.post("/events/:eventId/guests/:guestId/qr-pass", generateQrPass);
router.post("/events/:eventId/guests/:guestId/send-qr", sendQrLimiter, sendQrEmail);
router.post("/events/:eventId/guests/:guestId/invitations", sendGuestInvitation);

router.post("/events/:eventId/guests/:guestId/manual-checkin", manualCheckIn);
router.get("/events/:eventId/attendance", listAttendance);
router.post("/events/:eventId/check-in", scanLimiter, checkInGuestByQr);
router.post("/scanner/events/:eventId/check-in/scan", scanLimiter, checkInGuestByQr);

router.get("/events/:eventId/guest-dashboard", getGuestDashboard);
router.post(
  "/events/:eventId/invitations/send-all",
  authenticate,
  resolveOrganization,
  sendInvitationsToAllGuests
);

export default router;














// import express from "express";

// import { authenticate } from "../middleware/auth.middleware.js";
// import { resolveOrganization } from "../middleware/organization.middleware.js";

// import {
//   createGuest,
//   listGuests,
//   getGuestById,
//   updateGuest,
//   deleteGuest,

//   createGuestGroup,
//   listGuestGroups,
//   updateGuestGroup,
//   deleteGuestGroup,

//   submitGuestRsvp,
//   listGuestRsvps,

//   markGuestAttendance,

//   generateQrPass,
//   sendGuestInvitation,
//   checkInGuestByQr,

//   getGuestDashboard
// } from "../controllers/guests.controller.js";

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | Apply global middleware
// |--------------------------------------------------------------------------
// */

// router.use(authenticate);
// router.use(resolveOrganization);

// /*
// |--------------------------------------------------------------------------
// | GUESTS
// |--------------------------------------------------------------------------
// */

// router.post(
//   "/events/:eventId/guests",
//   createGuest
// );

// router.get(
//   "/events/:eventId/guests",
//   listGuests
// );

// router.get(
//   "/events/:eventId/guests/:guestId",
//   getGuestById
// );

// router.patch(
//   "/events/:eventId/guests/:guestId",
//   updateGuest
// );

// router.delete(
//   "/events/:eventId/guests/:guestId",
//   deleteGuest
// );

// /*
// |--------------------------------------------------------------------------
// | GUEST GROUPS
// |--------------------------------------------------------------------------
// */

// router.post(
//   "/events/:eventId/guest-groups",
//   createGuestGroup
// );

// router.get(
//   "/events/:eventId/guest-groups",
//   listGuestGroups
// );

// router.patch(
//   "/events/:eventId/guest-groups/:groupId",
//   updateGuestGroup
// );

// router.delete(
//   "/events/:eventId/guest-groups/:groupId",
//   deleteGuestGroup
// );

// /*
// |--------------------------------------------------------------------------
// | RSVP
// |--------------------------------------------------------------------------
// */

// router.post(
//   "/events/:eventId/rsvps",
//   submitGuestRsvp
// );

// router.get(
//   "/events/:eventId/rsvps",
//   listGuestRsvps
// );

// /*
// |--------------------------------------------------------------------------
// | ATTENDANCE
// |--------------------------------------------------------------------------
// */

// router.post(
//   "/events/:eventId/attendance",
//   markGuestAttendance
// );

// /*
// |--------------------------------------------------------------------------
// | QR PASS
// |--------------------------------------------------------------------------
// */

// router.post(
//   "/events/:eventId/guests/:guestId/qr-pass",
//   generateQrPass
// );

// /*
// |--------------------------------------------------------------------------
// | INVITATIONS
// |--------------------------------------------------------------------------
// */

// router.post(
//   "/events/:eventId/guests/:guestId/invitations",
//   sendGuestInvitation
// );

// /*
// |--------------------------------------------------------------------------
// | QR CHECK-IN
// |--------------------------------------------------------------------------
// */

// router.post(
//   "/events/:eventId/check-in",
//   checkInGuestByQr
// );

// /*
// |--------------------------------------------------------------------------
// | DASHBOARD
// |--------------------------------------------------------------------------
// */

// router.get(
//   "/events/:eventId/guest-dashboard",
//   getGuestDashboard
// );

// router.post(
//     "/scanner/events/:eventId/check-in/scan",
//     authenticate,
//     resolveOrganization,
//     checkInGuestByQr
//   );
//   router.post("/events/:eventId/check-in", checkInGuestByQr);

// export default router;





//////////////////////////yyyyyyyyyyyyyyyyyyyyyyy



// import express from "express";
// import { authenticate } from "../middleware/auth.middleware.js";
// import { resolveOrganization } from "../middleware/organization.middleware.js";
// import {
//   createGuest,
//   listGuests,
//   getGuestById,
//   updateGuest,
//   deleteGuest,
//   createGuestGroup,
//   listGuestGroups,
//   updateGuestGroup,
//   deleteGuestGroup,
//   submitGuestRsvp,
//   listGuestRsvps,
//   markGuestAttendance,
//   getGuestDashboard,
// } from "../controllers/guests.controller.js";

// const router = express.Router();

// /**
//  * Guests
//  */
// router.post(
//   "/events/:eventId/guests",
//   authenticate,
//   resolveOrganization,
//   createGuest
// );

// router.get(
//   "/events/:eventId/guests",
//   authenticate,
//   resolveOrganization,
//   listGuests
// );

// router.get(
//   "/events/:eventId/guests/:guestId",
//   authenticate,
//   resolveOrganization,
//   getGuestById
// );

// router.patch(
//   "/events/:eventId/guests/:guestId",
//   authenticate,
//   resolveOrganization,
//   updateGuest
// );

// router.delete(
//   "/events/:eventId/guests/:guestId",
//   authenticate,
//   resolveOrganization,
//   deleteGuest
// );

// /**
//  * Guest groups
//  */
// router.post(
//   "/events/:eventId/guest-groups",
//   authenticate,
//   resolveOrganization,
//   createGuestGroup
// );

// router.get(
//   "/events/:eventId/guest-groups",
//   authenticate,
//   resolveOrganization,
//   listGuestGroups
// );

// router.patch(
//   "/events/:eventId/guest-groups/:groupId",
//   authenticate,
//   resolveOrganization,
//   updateGuestGroup
// );

// router.delete(
//   "/events/:eventId/guest-groups/:groupId",
//   authenticate,
//   resolveOrganization,
//   deleteGuestGroup
// );

// /**
//  * RSVPs
//  */
// router.post(
//   "/events/:eventId/rsvps",
//   authenticate,
//   resolveOrganization,
//   submitGuestRsvp
// );

// router.get(
//   "/events/:eventId/rsvps",
//   authenticate,
//   resolveOrganization,
//   listGuestRsvps
// );

// /**
//  * Attendance
//  */
// router.post(
//   "/events/:eventId/attendance",
//   authenticate,
//   resolveOrganization,
//   markGuestAttendance
// );

// /**
//  * Dashboard
//  */
// router.get(
//   "/events/:eventId/guest-dashboard",
//   authenticate,
//   resolveOrganization,
//   getGuestDashboard
// );

// export default router;