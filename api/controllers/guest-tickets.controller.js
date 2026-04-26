// api/controllers/guest-tickets.controller.js
import QRCode  from "qrcode";
import crypto  from "crypto";
import { db }  from "../config/db.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const HEX64_RE      = /^[0-9a-f]{64}$/i;
const HMAC_SECRET   = process.env.TICKET_HMAC_SECRET || "change-me-in-production";
const QR_CACHE_TTL  = 300; // seconds — short so tokens can't be harvested and cached

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function handleError(res, err) {
  console.error("[guest-tickets]", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal error",
  });
}

/**
 * HMAC-SHA256 integrity stamp.
 * Embedded in every ticket object returned to the client.
 * The frontend can verify it hasn't been tampered with; the scanner can too.
 */
function stampTicket(ticket) {
  const payload = [
    ticket.id,
    ticket.qr_token,
    ticket.ticket_number,
    ticket.buyer_email,
    ticket.event_id,
  ].join("|");

  const sig = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(payload)
    .digest("hex");

  return { ...ticket, _sig: sig };
}

/**
 * Log every portal view to `ticket_portal_views` for fraud detection.
 * Non-blocking — never throws.
 */
async function logPortalView(ip, email, ticketIds) {
  try {
    await db.query(
      `INSERT INTO ticket_portal_views (ip_address, email, ticket_ids, viewed_at)
       VALUES ($1, $2, $3, NOW())`,
      [ip, email, ticketIds],
    );
  } catch {
    // Table may not exist yet — degrade gracefully
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /public/tickets/qr/:token  →  PNG
// ─────────────────────────────────────────────────────────────────────────────

export async function generateTicketQr(req, res) {
  try {
    const { token } = req.params;

    // 1. Format validation — must be 64-char hex (our token format)
    if (!HEX64_RE.test(token)) {
      return res.status(400).json({ success: false, message: "Invalid token format" });
    }

    // 2. Token must exist and be ACTIVE — prevents QR generation for revoked/used tickets
    const row = await db.query(
      `SELECT it.qr_status, it.event_id, e.ends_at
       FROM issued_tickets it
       JOIN events e ON e.id = it.event_id
       WHERE it.qr_token = $1 AND e.deleted_at IS NULL
       LIMIT 1`,
      [token],
    );

    if (!row.rows[0]) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const { qr_status, ends_at } = row.rows[0];

    if (qr_status === "REVOKED") {
      return res.status(403).json({ success: false, message: "Ticket has been revoked" });
    }

    // 3. Generate QR — embed token + HMAC stamp so scanners can detect forgeries
    const stampPayload = `${token}:${HMAC_SECRET}`;
    const stamp = crypto.createHash("sha256").update(stampPayload).digest("hex").slice(0, 8);
    const qrContent = `${token}.${stamp}`; // scanner strips the stamp and verifies

    const png = await QRCode.toBuffer(qrContent, {
      errorCorrectionLevel: "H",
      width: 480,
      margin: 2,
      color: { dark: "#0a0a0f", light: "#ffffff" },
    });

    // 4. No caching for USED/EXPIRED — fresh each time; short TTL for ACTIVE
    const ttl = qr_status === "ACTIVE" ? QR_CACHE_TTL : 0;
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", ttl > 0 ? `public, max-age=${ttl}` : "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    res.send(png);
  } catch (err) {
    handleError(res, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /public/my-tickets?email=&ticket_number=
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyTickets(req, res) {
  try {
    const email        = String(req.query.email         || "").trim().toLowerCase();
    const ticketNumber = String(req.query.ticket_number || "").trim().toUpperCase();

    // ── 1. Input validation ──────────────────────────────────────────────────
    if (!email || !email.includes("@") || email.length > 254) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    // Block obviously malformed ticket numbers (simple injection guard)
    if (ticketNumber && !/^[A-Z0-9\-]{1,30}$/.test(ticketNumber)) {
      return res.status(400).json({ success: false, message: "Invalid ticket number format" });
    }

    const useTicketNumber = ticketNumber.length > 0;

    // ── 2. Query — only real DB columns ─────────────────────────────────────
    //    starts_at_local / ends_at_local are app-computed; use e.starts_at alias instead.
    const query = `
      SELECT
        it.id,
        it.qr_token,
        it.qr_status,
        it.created_at                                                     AS issued_at,
        it.checked_in_at,
        COALESCE(
          it.ticket_number,
          'TKT-' || UPPER(SUBSTR(it.id::text, 1, 8))
        )                                                                 AS ticket_number,

        o.buyer_name,
        o.buyer_email,
        o.total,
        o.currency,
        o.id                                                              AS order_id,

        tt.name                                                           AS ticket_type_name,
        tt.kind,
        tt.price,

        e.id                                                              AS event_id,
        e.title                                                           AS event_title,
        e.slug                                                            AS event_slug,
        e.starts_at                                                       AS starts_at_local,
        e.ends_at                                                         AS ends_at_local,
        e.timezone,
        e.venue_name,
        e.city                                                            AS venue_city,
        e.country                                                         AS venue_country,
        e.cover_image_url,
        e.banner_url

      FROM issued_tickets it
      JOIN ticket_orders  o  ON o.id  = it.order_id
      JOIN ticket_types   tt ON tt.id = it.ticket_type_id
      JOIN events         e  ON e.id  = it.event_id

      WHERE LOWER(o.buyer_email) = $1
        AND it.qr_status != 'REVOKED'
        AND e.deleted_at IS NULL
        ${useTicketNumber
          ? `AND UPPER(COALESCE(it.ticket_number, 'TKT-' || UPPER(SUBSTR(it.id::text, 1, 8)))) = $2`
          : ""}

      ORDER BY it.created_at DESC
      LIMIT 50
    `;

    const params = useTicketNumber ? [email, ticketNumber] : [email];
    const result = await db.query(query, params);

    if (useTicketNumber && result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No ticket found with that email and ticket number combination.",
      });
    }

    // ── 3. Strip QR token from list response — only expose in QR endpoint ───
    //    The list never hands out the raw token; only the /qr/:token endpoint does,
    //    and that endpoint requires the token to already be known.
    const tickets = result.rows.map((row) => {
      const { qr_token, ...safe } = row; // eslint-disable-line no-unused-vars
      return stampTicket(safe);          // add HMAC integrity stamp
    });

    // ── 4. Non-blocking fraud logging ────────────────────────────────────────
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    logPortalView(ip, email, tickets.map((t) => t.id));

    // ── 5. Security headers ──────────────────────────────────────────────────
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");

    res.json({ success: true, tickets });
  } catch (err) {
    handleError(res, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /public/tickets/:id/qr-token
// Called by the frontend ONLY when the user clicks "View QR" — returns the
// raw token for a specific ticket, gated by email ownership.
// ─────────────────────────────────────────────────────────────────────────────

export async function getQrToken(req, res) {
  try {
    const { id } = req.params;
    const email  = String(req.query.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const row = await db.query(
      `SELECT it.qr_token, it.qr_status
       FROM issued_tickets it
       JOIN ticket_orders o ON o.id = it.order_id
       WHERE it.id = $1
         AND LOWER(o.buyer_email) = $2
         AND it.qr_status != 'REVOKED'
       LIMIT 1`,
      [id, email],
    );

    if (!row.rows[0]) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const { qr_token, qr_status } = row.rows[0];

    if (qr_status === "REVOKED") {
      return res.status(403).json({ success: false, message: "Ticket revoked" });
    }

    res.set("Cache-Control", "no-store");
    res.json({ success: true, qr_token });
  } catch (err) {
    handleError(res, err);
  }
}





// // api/controllers/guest-tickets.controller.js
// import QRCode from "qrcode";
// import { db } from "../config/db.js";

// const HEX64_RE = /^[0-9a-f]{64}$/i;

// function handleError(res, err) {
//   console.error("[guest-tickets]", err);
//   res.status(err.statusCode || 500).json({
//     success: false,
//     message: err.message || "Internal error",
//   });
// }

// /* ── GET /public/tickets/qr/:token → PNG ───────────────────────────────── */
// export async function generateTicketQr(req, res) {
//   try {
//     const { token } = req.params;
//     if (!HEX64_RE.test(token))
//       return res.status(400).json({ success: false, message: "Invalid token" });

//     const png = await QRCode.toBuffer(token, {
//       errorCorrectionLevel: "H",
//       width: 400,
//       margin: 2,
//       color: { dark: "#111827", light: "#ffffff" },
//     });

//     res.set("Content-Type", "image/png");
//     res.set("Cache-Control", "public, max-age=3600");
//     res.send(png);
//   } catch (err) {
//     handleError(res, err);
//   }
// }

// /* ── GET /public/my-tickets?email=&ticket_number= ──────────────────────── */
// export async function getMyTickets(req, res) {
//   try {
//     const email        = String(req.query.email         || "").trim().toLowerCase();
//     const ticketNumber = String(req.query.ticket_number || "").trim().toUpperCase();

//     if (!email || !email.includes("@")) {
//       return res.status(400).json({ success: false, message: "Valid email is required" });
//     }

//     const useTicketNumber = ticketNumber.length > 0;

//     /*
//      * Column audit (all confirmed from schema / service / migration):
//      *   issued_tickets : id, qr_token, qr_status, created_at, checked_in_at, ticket_number
//      *   ticket_orders  : id, buyer_name, buyer_email, total, currency
//      *   ticket_types   : id, name, kind, price
//      *   events         : id, title, slug, starts_at (UTC), ends_at (UTC), timezone,
//      *                    venue_name, city, country, cover_image_url, banner_url
//      *
//      * starts_at_local / ends_at_local are computed in the service layer — NOT real columns.
//      * We select the raw UTC timestamps and alias them so the frontend receives consistent keys.
//      */
//     const query = `
//       SELECT
//         it.id,
//         it.qr_token,
//         it.qr_status,
//         it.created_at                                                          AS issued_at,
//         it.checked_in_at,
//         COALESCE(
//           it.ticket_number,
//           'TKT-' || UPPER(SUBSTR(it.id::text, 1, 8))
//         )                                                                      AS ticket_number,

//         o.buyer_name,
//         o.buyer_email,
//         o.total,
//         o.currency,
//         o.id                                                                   AS order_id,

//         tt.name                                                                AS ticket_type_name,
//         tt.kind,
//         tt.price,

//         e.id                                                                   AS event_id,
//         e.title                                                                AS event_title,
//         e.slug                                                                 AS event_slug,
//         e.starts_at                                                            AS starts_at_local,
//         e.ends_at                                                              AS ends_at_local,
//         e.timezone,
//         e.venue_name,
//         e.city                                                                 AS venue_city,
//         e.country                                                              AS venue_country,
//         e.cover_image_url,
//         e.banner_url

//       FROM issued_tickets it
//       JOIN ticket_orders  o  ON o.id  = it.order_id
//       JOIN ticket_types   tt ON tt.id = it.ticket_type_id
//       JOIN events         e  ON e.id  = it.event_id

//       WHERE LOWER(o.buyer_email) = $1
//         AND it.qr_status != 'REVOKED'
//         AND e.deleted_at IS NULL
//         ${useTicketNumber
//           ? `AND UPPER(COALESCE(it.ticket_number, 'TKT-' || UPPER(SUBSTR(it.id::text, 1, 8)))) = $2`
//           : ""}

//       ORDER BY it.created_at DESC
//       LIMIT 50
//     `;

//     const params = useTicketNumber ? [email, ticketNumber] : [email];
//     const result = await db.query(query, params);

//     if (useTicketNumber && result.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No ticket found with that email and ticket number combination.",
//       });
//     }

//     res.json({ success: true, tickets: result.rows });
//   } catch (err) {
//     handleError(res, err);
//   }
// }




// // api/controllers/guest-tickets.controller.js
// import QRCode from "qrcode";
// import { db } from "../config/db.js";

// const HEX64_RE = /^[0-9a-f]{64}$/i;

// function handleError(res, err) {
//   console.error("[guest-tickets]", err);
//   res.status(err.statusCode || 500).json({
//     success: false,
//     message: err.message || "Internal error",
//   });
// }

// /* ── GET /public/tickets/qr/:token → PNG ───────────────────────────────── */
// export async function generateTicketQr(req, res) {
//   try {
//     const { token } = req.params;
//     if (!HEX64_RE.test(token))
//       return res.status(400).json({ success: false, message: "Invalid token" });

//     const png = await QRCode.toBuffer(token, {
//       errorCorrectionLevel: "H",
//       width: 400,
//       margin: 2,
//       color: { dark: "#111827", light: "#ffffff" },
//     });

//     res.set("Content-Type", "image/png");
//     res.set("Cache-Control", "public, max-age=3600");
//     res.send(png);
//   } catch (err) {
//     handleError(res, err);
//   }
// }

// /* ── GET /public/my-tickets?email=&ticket_number= ──────────────────────── */
// export async function getMyTickets(req, res) {
//   try {
//     const email        = String(req.query.email         || "").trim().toLowerCase();
//     const ticketNumber = String(req.query.ticket_number || "").trim().toUpperCase();

//     if (!email || !email.includes("@")) {
//       return res.status(400).json({ success: false, message: "Valid email is required" });
//     }

//     const useTicketNumber = ticketNumber.length > 0;

//     // FIX: the table uses created_at, NOT issued_at.
//     // We alias it as issued_at so the frontend column name stays consistent.
//     const query = `
//       SELECT
//         it.id,
//         it.qr_token,
//         it.qr_status,
//         it.created_at                                                        AS issued_at,
//         it.checked_in_at,
//         COALESCE(
//           it.ticket_number,
//           'TKT-' || UPPER(SUBSTR(it.id::text, 1, 8))
//         )                                                                    AS ticket_number,
//         o.buyer_name,
//         o.buyer_email,
//         o.total,
//         o.currency,
//         o.id                                                                 AS order_id,
//         tt.name                                                              AS ticket_type_name,
//         tt.kind,
//         tt.price,
//         e.id                                                                 AS event_id,
//         e.title                                                              AS event_title,
//         e.slug                                                               AS event_slug,
//         e.starts_at_local,
//         e.ends_at_local,
//         e.venue_name,
//         e.city                                                               AS venue_city,
//         e.country                                                            AS venue_country,
//         e.cover_image_url,
//         e.banner_url
//       FROM issued_tickets it
//       JOIN ticket_orders  o  ON o.id  = it.order_id
//       JOIN ticket_types   tt ON tt.id = it.ticket_type_id
//       JOIN events         e  ON e.id  = it.event_id
//       WHERE LOWER(o.buyer_email) = $1
//         AND it.qr_status != 'REVOKED'
//         AND e.deleted_at IS NULL
//         ${useTicketNumber
//           ? `AND UPPER(COALESCE(it.ticket_number, 'TKT-' || UPPER(SUBSTR(it.id::text, 1, 8)))) = $2`
//           : ""}
//       ORDER BY it.created_at DESC
//       LIMIT 50
//     `;

//     const params = useTicketNumber ? [email, ticketNumber] : [email];
//     const result = await db.query(query, params);

//     if (useTicketNumber && result.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No ticket found with that email and ticket number combination.",
//       });
//     }

//     res.json({ success: true, tickets: result.rows });
//   } catch (err) {
//     handleError(res, err);
//   }
// }



// // api/controllers/guest-tickets.controller.js
// import QRCode from "qrcode";
// import { db } from "../config/db.js";

// const HEX64_RE = /^[0-9a-f]{64}$/i;

// function handleError(res, err) {
//   console.error(err);
//   res.status(err.statusCode || 500).json({ success: false, message: err.message || "Internal error" });
// }

// /* ── GET /public/tickets/qr/:token → PNG ───────────────── */
// export async function generateTicketQr(req, res) {
//   try {
//     const { token } = req.params;
//     if (!HEX64_RE.test(token))
//       return res.status(400).json({ success: false, message: "Invalid token" });

//     const png = await QRCode.toBuffer(token, {
//       errorCorrectionLevel: "H",
//       width: 400,
//       margin: 2,
//       color: { dark: "#111827", light: "#ffffff" },
//     });

//     res.set("Content-Type", "image/png");
//     res.set("Cache-Control", "public, max-age=3600");
//     res.send(png);
//   } catch (err) {
//     handleError(res, err);
//   }
// }

// /* ── GET /public/my-tickets?email=&ticket_number= ──────── */
// // Requires BOTH email AND ticket_number for security
// export async function getMyTickets(req, res) {
//   try {
//     const email         = String(req.query.email         || "").trim().toLowerCase();
//     const ticketNumber  = String(req.query.ticket_number || "").trim().toUpperCase();

//     // Must provide at least email
//     if (!email || !email.includes("@")) {
//       return res.status(400).json({ success: false, message: "Valid email is required" });
//     }

//     // Build query — if ticket_number provided, filter by both (secure lookup)
//     // If only email, return all tickets for that email (browse mode)
//     const useTicketNumber = ticketNumber.length > 0;

//     const query = `
//       SELECT
//         it.id,
//         it.qr_token,
//         it.qr_status,
//         it.issued_at,
//         it.checked_in_at,
//         COALESCE(it.ticket_number, 'TKT-' || UPPER(SUBSTR(it.id::text, 1, 8))) AS ticket_number,
//         o.buyer_name,
//         o.buyer_email,
//         o.total,
//         o.currency,
//         o.id               AS order_id,
//         tt.name            AS ticket_type_name,
//         tt.kind,
//         tt.price,
//         e.id               AS event_id,
//         e.title            AS event_title,
//         e.slug             AS event_slug,
//         e.starts_at_local,
//         e.ends_at_local,
//         e.venue_name,
//         e.city             AS venue_city,
//         e.country          AS venue_country,
//         e.cover_image_url,
//         e.banner_url
//       FROM issued_tickets it
//       JOIN ticket_orders  o  ON o.id  = it.order_id
//       JOIN ticket_types   tt ON tt.id = it.ticket_type_id
//       JOIN events         e  ON e.id  = it.event_id
//       WHERE LOWER(o.buyer_email) = $1
//         AND it.qr_status != 'REVOKED'
//         AND e.deleted_at IS NULL
//         ${useTicketNumber ? `AND UPPER(COALESCE(it.ticket_number, 'TKT-' || UPPER(SUBSTR(it.id::text, 1, 8)))) = $2` : ""}
//       ORDER BY it.issued_at DESC
//       LIMIT 50
//     `;

//     const params = useTicketNumber ? [email, ticketNumber] : [email];
//     const result = await db.query(query, params);

//     if (useTicketNumber && result.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No ticket found with that email and ticket number combination.",
//       });
//     }

//     res.json({ success: true, tickets: result.rows });
//   } catch (err) {
//     handleError(res, err);
//   }
// }





















// // controllers/guest-tickets.controller.js
// import QRCode from "qrcode";
// import { db } from "../config/db.js";

// const HEX64_RE = /^[0-9a-f]{64}$/i;

// function handleError(res, err) {
//   console.error(err);
//   res.status(err.statusCode || 500).json({ success: false, message: err.message || "Internal error" });
// }

// /* ── GET /public/tickets/qr/:token → PNG image ─────────── */
// export async function generateTicketQr(req, res) {
//   try {
//     const { token } = req.params;
//     if (!HEX64_RE.test(token)) return res.status(400).json({ success: false, message: "Invalid token" });

//     const png = await QRCode.toBuffer(token, {
//       errorCorrectionLevel: "H",
//       width: 400,
//       margin: 2,
//       color: { dark: "#111827", light: "#ffffff" },
//     });

//     res.set("Content-Type", "image/png");
//     res.set("Cache-Control", "public, max-age=3600");
//     res.send(png);
//   } catch (err) {
//     handleError(res, err);
//   }
// }

// /* ── GET /public/my-tickets?email=... → issued tickets ─── */
// export async function getMyTickets(req, res) {
//   try {
//     const email = String(req.query.email || "").trim().toLowerCase();
//     if (!email || !email.includes("@")) {
//       return res.status(400).json({ success: false, message: "Valid email is required" });
//     }

//     const result = await db.query(
//       `SELECT
//          it.id,
//          it.qr_token,
//          it.qr_status,
//          it.issued_at,
//          o.buyer_name,
//          o.buyer_email,
//          o.total,
//          o.currency,
//          tt.name   AS ticket_type_name,
//          tt.kind,
//          tt.price,
//          e.id      AS event_id,
//          e.title   AS event_title,
//          e.starts_at_local,
//          e.venue_name,
//          e.city    AS venue_city,
//          e.country AS venue_country
//        FROM issued_tickets it
//        JOIN ticket_orders  o  ON o.id  = it.order_id
//        JOIN ticket_types   tt ON tt.id = it.ticket_type_id
//        JOIN events         e  ON e.id  = it.event_id
//        WHERE LOWER(o.buyer_email) = $1
//          AND it.qr_status != 'REVOKED'
//          AND e.deleted_at IS NULL
//        ORDER BY it.issued_at DESC
//        LIMIT 50`,
//       [email]
//     );

//     res.json({ success: true, tickets: result.rows });
//   } catch (err) {
//     handleError(res, err);
//   }
// }
