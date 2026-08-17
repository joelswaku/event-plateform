
// controllers/guests.public.controller.js
import * as guestsService from "../services/guests.service.js";
import { db } from "../config/db.js";
import QRCode from "qrcode";

const GUEST_QR_TOKEN_RE = /^[0-9a-f]{64}$/i;

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);

  const statusCode = error?.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error?.message || fallbackMessage,
    ...(error?.details ? { details: error.details } : {}),
  });
}

export async function getInvitationByToken(req, res) {
  try {
    const { token } = req.params;

    const invitation = await guestsService.getInvitationByTokenService({
      token,
    });

    return res.status(200).json({
      success: true,
      message: "Invitation fetched successfully",
      data: invitation,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch invitation");
  }
}

export async function getPublicEventInfo(req, res) {
  try {
    const { eventId } = req.params;
    const result = await db.query(
      `SELECT id, title, visibility, status FROM events WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [eventId]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: "Event not found" });
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch event");
  }
}

export async function submitInvitationRsvp(req, res) {
  try {
    const { token } = req.params;

    const result = await guestsService.submitInvitationRsvpService({
      token,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "RSVP submitted successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to submit RSVP");
  }
}

export async function submitOpenRsvp(req, res) {
  try {
    const { eventId } = req.params;
    const result = await guestsService.submitOpenRsvpService({ eventId, payload: req.body });
    return res.status(200).json({ success: true, message: "RSVP submitted", data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to submit RSVP");
  }
}

async function findPublicGuestQrPass(token) {
  if (!GUEST_QR_TOKEN_RE.test(token)) {
    const error = new Error("Invalid QR pass");
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query(
    `SELECT
       qp.qr_token,
       qp.qr_status,
       qp.expires_at,
       qp.used_at,
       qp.revoked_at,
       g.full_name,
       e.title AS event_title,
       e.starts_at,
       e.venue_name,
       e.venue_address,
       e.city
     FROM guest_qr_passes qp
     JOIN guests g ON g.id = qp.guest_id
     JOIN events e ON e.id = qp.event_id
     WHERE qp.qr_token = $1
       AND g.deleted_at IS NULL
       AND e.deleted_at IS NULL
     LIMIT 1`,
    [token],
  );

  const pass = result.rows[0];
  if (!pass) {
    const error = new Error("QR pass not found");
    error.statusCode = 404;
    throw error;
  }

  if (pass.expires_at && new Date(pass.expires_at) < new Date() && pass.qr_status === "ACTIVE") {
    pass.qr_status = "EXPIRED";
  }

  return pass;
}

export async function getPublicGuestQrPass(req, res) {
  try {
    const pass = await findPublicGuestQrPass(req.params.token);
    const unavailable = ["USED", "REVOKED", "EXPIRED"].includes(pass.qr_status);

    return res.status(200).json({
      success: true,
      data: {
        guest_name: pass.full_name,
        event_title: pass.event_title,
        starts_at: pass.starts_at,
        venue_name: pass.venue_name,
        location: [pass.venue_address, pass.city].filter(Boolean).join(", ") || null,
        qr_status: pass.qr_status,
        expires_at: pass.expires_at,
        unavailable,
      },
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch QR pass");
  }
}

export async function generatePublicGuestQrPass(req, res) {
  try {
    const pass = await findPublicGuestQrPass(req.params.token);
    if (pass.qr_status !== "ACTIVE") {
      return res.status(410).json({
        success: false,
        message: `This QR pass is ${String(pass.qr_status).toLowerCase()}.`,
      });
    }

    const png = await QRCode.toBuffer(pass.qr_token, {
      errorCorrectionLevel: "H",
      width: 480,
      margin: 2,
      color: { dark: "#07152c", light: "#ffffff" },
    });

    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    return res.send(png);
  } catch (error) {
    return handleControllerError(res, error, "Failed to generate QR pass");
  }
}
