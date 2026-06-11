import { Router } from "express";
import * as ctrl from "../controllers/vendors.controller.js";
import { vendorAuth } from "../controllers/vendors.controller.js";
import { upload } from "../middleware/upload.middleware.js";

const r = Router();

// Public auth
r.post("/auth/register", ctrl.register);
r.post("/auth/login",    ctrl.login);

// Protected vendor dashboard — MUST be before /:slug to avoid "me" being matched as a slug
r.get("/me",                          vendorAuth, ctrl.getMe);
r.patch("/me",                        vendorAuth, ctrl.updateMe);
r.post("/me/upload",                  vendorAuth, upload.single("image"), ctrl.uploadImage);
r.get("/me/inquiries",                vendorAuth, ctrl.listInquiries);
r.patch("/me/inquiries/:id/reply",    vendorAuth, ctrl.replyInquiry);
r.patch("/me/inquiries/:id/status",   vendorAuth, ctrl.updateInquiryStatus);
r.get("/me/reviews",                  vendorAuth, ctrl.listReviews);
r.patch("/me/reviews/:id/reply",      vendorAuth, ctrl.replyReview);
r.get("/me/analytics",                vendorAuth, ctrl.getAnalytics);

// Public marketplace — after /me routes
r.get("/",               ctrl.listVendors);
r.get("/:slug",          ctrl.getVendorBySlug);
r.post("/:slug/inquire", ctrl.submitInquiry);
r.post("/:slug/reviews", ctrl.submitReview);

export default r;
