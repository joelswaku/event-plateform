import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  markOneRead,
  markAllRead,
} from "../controllers/notifications.controller.js";

const router = express.Router();
router.use(authenticate);

router.get("/",           getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markOneRead);

export default router;
