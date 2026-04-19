import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { resolveOrganization } from "../middleware/organization.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { uploadBuilderImage } from "../controllers/media-upload.controller.js";

const router = express.Router();

router.post(
  "/events/:eventId/builder/upload-image",
  authenticate,
  resolveOrganization,
  upload.single("file"),
  uploadBuilderImage
);

export default router;