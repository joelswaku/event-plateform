import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";
import {
  createSeatingLocation,
  listSeatingLocations,
  updateSeatingLocation,
  deleteSeatingLocation,
  assignGuestSeat,
  removeGuestSeat,
  listSeatingAssignments,
  getSeatingChart,
  autoAssignSeating,
  clearSeatingAssignments,
} from "../controllers/seating.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(resolveOrganization);

/*
|--------------------------------------------------------------------------
| LOCATIONS
|--------------------------------------------------------------------------
*/

router.post("/events/:eventId/seating-locations", createSeatingLocation);
router.get("/events/:eventId/seating-locations", listSeatingLocations);
router.patch("/events/:eventId/seating-locations/:locationId", updateSeatingLocation);
router.delete("/events/:eventId/seating-locations/:locationId", deleteSeatingLocation);

/*
|--------------------------------------------------------------------------
| ASSIGNMENTS
|--------------------------------------------------------------------------
*/

router.post("/events/:eventId/seating-assignments", assignGuestSeat);
router.get("/events/:eventId/seating-assignments", listSeatingAssignments);
router.delete("/events/:eventId/seating-assignments/:assignmentId", removeGuestSeat);

/*
|--------------------------------------------------------------------------
| CHART
|--------------------------------------------------------------------------
*/

router.get("/events/:eventId/seating-chart", getSeatingChart);

/*
|--------------------------------------------------------------------------
| AUTO SEATING
|--------------------------------------------------------------------------
*/

router.post("/events/:eventId/seating/auto-assign", autoAssignSeating);
router.delete("/events/:eventId/seating/assignments", clearSeatingAssignments);

export default router;