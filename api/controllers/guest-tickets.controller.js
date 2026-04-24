// controllers/guest-tickets.controller.js
import QRCode from "qrcode";
import { db } from "../config/db.js";

const HEX64_RE = /^[0-9a-f]{64}$/i;

function handleError(res, err) {
  console.error(err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || "Internal error" });
}

/* ── GET /public/tickets/qr/:token → PNG image ─────────── */
export async function generateTicketQr(req, res) {
  try {
    const { token } = req.params;
    if (!HEX64_RE.test(token)) return res.status(400).json({ success: false, message: "Invalid token" });

    const png = await QRCode.toBuffer(token, {
      errorCorrectionLevel: "H",
      width: 400,
      margin: 2,
      color: { dark: "#111827", light: "#ffffff" },
    });

    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(png);
  } catch (err) {
    handleError(res, err);
  }
}

/* ── GET /public/my-tickets?email=... → issued tickets ─── */
export async function getMyTickets(req, res) {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    const result = await db.query(
      `SELECT
         it.id,
         it.qr_token,
         it.qr_status,
         it.issued_at,
         o.buyer_name,
         o.buyer_email,
         o.total,
         o.currency,
         tt.name   AS ticket_type_name,
         tt.kind,
         tt.price,
         e.id      AS event_id,
         e.title   AS event_title,
         e.starts_at_local,
         e.venue_name,
         e.city    AS venue_city,
         e.country AS venue_country
       FROM issued_tickets it
       JOIN ticket_orders  o  ON o.id  = it.order_id
       JOIN ticket_types   tt ON tt.id = it.ticket_type_id
       JOIN events         e  ON e.id  = it.event_id
       WHERE LOWER(o.buyer_email) = $1
         AND it.qr_status != 'REVOKED'
         AND e.deleted_at IS NULL
       ORDER BY it.issued_at DESC
       LIMIT 50`,
      [email]
    );

    res.json({ success: true, tickets: result.rows });
  } catch (err) {
    handleError(res, err);
  }
}
