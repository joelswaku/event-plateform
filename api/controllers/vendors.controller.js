import * as svc from "../services/vendors.service.js";
import { db } from "../config/db.js";
import { cloudinary } from "../config/cloudinary.js";
import streamifier from "streamifier";
import { sendVendorWelcomeEmail } from "../utils/sendEmail.js";

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

// Auth middleware for vendor routes
export function vendorAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    const decoded = svc.verifyVendorToken(token);
    req.vendorId = decoded.vendorId;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// ── AUTH ──────────────────────────────────────────────────────────────────

export const register = wrap(async (req, res) => {
  const data = await svc.registerVendorService(req.body);
  // Send welcome email (non-blocking)
  sendVendorWelcomeEmail({
    to:   data.vendor.email,
    name: data.vendor.business_name || req.body.fullName || "Vendor",
  }).catch(() => {});
  res.status(201).json({ success: true, data });
});

export const login = wrap(async (req, res) => {
  const data = await svc.loginVendorService(req.body);
  res.json({ success: true, data });
});

// ── PROFILE ───────────────────────────────────────────────────────────────

export const getMe = wrap(async (req, res) => {
  const vendor = await svc.getVendorMeService(req.vendorId);
  res.json({ success: true, data: vendor });
});

export const updateMe = wrap(async (req, res) => {
  const vendor = await svc.updateVendorProfileService(req.vendorId, req.body);
  res.json({ success: true, data: vendor });
});

// ── MARKETPLACE ───────────────────────────────────────────────────────────

export const listVendors = wrap(async (req, res) => {
  const data = await svc.listVendorsService(req.query);
  res.json({ success: true, data });
});

export const getVendorBySlug = wrap(async (req, res) => {
  const data = await svc.getVendorBySlugService(req.params.slug);
  res.json({ success: true, data });
});

export const submitInquiry = wrap(async (req, res) => {
  const { rows: [v] } = await db.query("SELECT id FROM vendors WHERE slug=$1", [req.params.slug]);
  if (!v) return res.status(404).json({ success: false, message: "Vendor not found" });
  const data = await svc.createInquiryService(v.id, req.body);
  res.status(201).json({ success: true, data });
});

// ── VENDOR DASHBOARD ──────────────────────────────────────────────────────

export const listInquiries = wrap(async (req, res) => {
  const data = await svc.listInquiriesService(req.vendorId, req.query.status);
  res.json({ success: true, data });
});

export const replyInquiry = wrap(async (req, res) => {
  const data = await svc.replyInquiryService(req.vendorId, req.params.id, req.body.reply, req.body.status);
  res.json({ success: true, data });
});

export const updateInquiryStatus = wrap(async (req, res) => {
  const data = await svc.markInquiryStatusService(req.vendorId, req.params.id, req.body.status);
  res.json({ success: true, data });
});

export const listReviews = wrap(async (req, res) => {
  const data = await svc.listReviewsService(req.vendorId);
  res.json({ success: true, data });
});

export const replyReview = wrap(async (req, res) => {
  const data = await svc.replyReviewService(req.vendorId, req.params.id, req.body.reply);
  res.json({ success: true, data });
});

export const submitReview = wrap(async (req, res) => {
  const { rows: [v] } = await db.query("SELECT id FROM vendors WHERE slug=$1", [req.params.slug]);
  if (!v) return res.status(404).json({ success: false, message: "Vendor not found" });
  const data = await svc.createReviewService(v.id, req.body);
  res.status(201).json({ success: true, data });
});

export const getAnalytics = wrap(async (req, res) => {
  const data = await svc.getAnalyticsService(req.vendorId);
  res.json({ success: true, data });
});

// ── IMAGE UPLOAD ──────────────────────────────────────────────────────────

export const uploadImage = wrap(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file provided" });
  }

  const folder = req.query.folder || "vendors/portfolio";

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `liteevent/${folder}`, resource_type: "image", transformation: [{ quality: "auto", fetch_format: "auto" }] },
      (err, r) => (err ? reject(err) : resolve(r))
    );
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  });

  res.json({
    success: true,
    data: {
      url:       result.secure_url,
      public_id: result.public_id,
      width:     result.width,
      height:    result.height,
    },
  });
});
