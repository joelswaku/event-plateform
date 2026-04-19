import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";
import {
  syncOfflineTicketScans,
  getScannerDashboard,
} from "../controllers/scanner.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(resolveOrganization);

/*
|--------------------------------------------------------------------------
| OFFLINE SCAN SYNC
|--------------------------------------------------------------------------
*/

router.post(
  "/events/:eventId/tickets/checkin/batch-sync",
  syncOfflineTicketScans
);

/*
|--------------------------------------------------------------------------
| SCANNER DASHBOARD
|--------------------------------------------------------------------------
*/

router.get(
  "/events/:eventId/dashboard",
  getScannerDashboard
);

export default router;