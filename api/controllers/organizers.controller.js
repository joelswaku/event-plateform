import * as svc from "../services/organizers.service.js";
import { sendOrganizerWelcomeEmail } from "../utils/sendEmail.js";

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

export function organizerAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    const decoded = svc.verifyOrganizerToken(token);
    req.organizerId = decoded.organizerId;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
}

export const register = wrap(async (req, res) => {
  const data = await svc.registerOrganizerService(req.body);
  // Send welcome email (non-blocking)
  sendOrganizerWelcomeEmail({
    to: data.organizer.email,
    name: data.organizer.name,
  }).catch(() => {});
  res.status(201).json({ success: true, data });
});

export const login = wrap(async (req, res) => {
  const data = await svc.loginOrganizerService(req.body);
  res.json({ success: true, data });
});

export const getMe = wrap(async (req, res) => {
  const data = await svc.getOrganizerMeService(req.organizerId);
  res.json({ success: true, data });
});

export const updateMe = wrap(async (req, res) => {
  const data = await svc.updateOrganizerProfileService(req.organizerId, req.body);
  res.json({ success: true, data });
});

export const getSaved = wrap(async (req, res) => {
  const data = await svc.getSavedVendorsService(req.organizerId);
  res.json({ success: true, data });
});

export const saveVendor = wrap(async (req, res) => {
  const data = await svc.saveVendorService(req.organizerId, req.params.vendorId);
  res.json({ success: true, data });
});

export const unsaveVendor = wrap(async (req, res) => {
  const data = await svc.unsaveVendorService(req.organizerId, req.params.vendorId);
  res.json({ success: true, data });
});
