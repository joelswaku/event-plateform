import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";
import * as controller from "../controllers/event-builder.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(resolveOrganization);

router.get("/events/:eventId/builder", controller.getEventBuilder);

router.put("/events/:eventId/page", controller.upsertEventPage);

router.post("/events/:eventId/sections/replace", controller.replaceSections);
router.post("/events/:eventId/sections/batch", controller.batchCreateSections);
router.post("/events/:eventId/sections", controller.createSection);
router.patch("/events/:eventId/sections/reorder", controller.reorderSections);
router.patch("/events/:eventId/sections/:sectionId", controller.updateSection);
router.delete("/events/:eventId/sections/:sectionId", controller.deleteSection);


router.post("/events/:eventId/page/publish", controller.publishEventPage);
router.post("/events/:eventId/page/unpublish", controller.unpublishEventPage);
router.get("/events/:eventId/page/preview", controller.getPreviewEventPage);

router.post("/events/:eventId/schedule-items", controller.createScheduleItem);
router.post("/events/:eventId/speakers", controller.createSpeaker);
router.post("/events/:eventId/media", controller.uploadEventMedia);
router.post("/events/:eventId/theme/select", controller.selectEventTheme);




export default router;


