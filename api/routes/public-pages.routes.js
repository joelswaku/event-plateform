import express from "express";
import * as controller from "../controllers/public-pages.controller.js";

const router = express.Router();

router.get("/public/pages/:slug", controller.getPublicEventPageBySlug);

export default router;