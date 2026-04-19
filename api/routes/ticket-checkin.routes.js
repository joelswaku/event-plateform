// import express from "express";
// import { authenticate } from "../middleware/auth.middleware.js";
// import { resolveOrganization } from "../middleware/organization.middleware.js";
// import { checkInIssuedTicket } from "../controllers/tickets.controller.js";

// const router = express.Router();

// router.use(authenticate);
// router.use(resolveOrganization);

// router.post("/events/:eventId/tickets/checkin", checkInIssuedTicket);
// router.post("/scanner/events/:eventId/tickets/checkin", checkInIssuedTicket);

// export default router;

//
// ticket-checkin.routes.js
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";
import { checkInIssuedTicket } from "../controllers/tickets.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(resolveOrganization);

/*
|--------------------------------------------------------------------------
| TICKET CHECK-IN
|--------------------------------------------------------------------------
*/
// @route   POST /api/events/:eventId/tickets/checkin 

router.post(
  "/events/:eventId/tickets/checkin",
  checkInIssuedTicket
);

router.post(
  "/scanner/events/:eventId/tickets/checkin",
  checkInIssuedTicket
);

export default router;