import express from "express";
import * as controller from "../controllers/public-pages.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public — only PUBLISHED + PUBLIC events
router.get("/public/pages/:slug", controller.getPublicEventPageBySlug);

// Preview — authenticated owner/org member, any status/visibility
router.get("/public/pages/:slug/preview", authenticate, controller.getPreviewEventPage);

export default router;
