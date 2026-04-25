// services/ticket-types.service.js
import { db } from "../config/db.js";

class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function ensurePositiveNumber(value, field) {
  if (value === undefined || value === null || Number(value) < 0) {
    throw new AppError(`${field} must be a positive number`, 400);
  }
}

export async function createTicketTypeService({
  eventId,
  organizationId,
  payload,
}) {
  const {
    name,
    description,
    price,
    quantity_total,
    currency = "USD",
    sale_starts_at,
    sale_ends_at,
    kind = "PAID",
  } = payload;

  if (!name || !name.trim()) {
    throw new AppError("Ticket name is required");
  }

  ensurePositiveNumber(price, "price");

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Ensure event belongs to org
    const eventRes = await client.query(
      `
      SELECT *
      FROM events
      WHERE id=$1
        AND organization_id=$2
        AND deleted_at IS NULL
      `,
      [eventId, organizationId]
    );

    if (!eventRes.rows[0]) {
      throw new AppError("Event not found or unauthorized", 404);
    }

    const insert = await client.query(
      `
      INSERT INTO ticket_types
      (
        event_id,
        name,
        description,
        price,
        quantity_total,
        quantity_sold,
        currency,
        kind,
        is_active,
        sale_starts_at,
        sale_ends_at,
        created_at
      )
      VALUES
      ($1,$2,$3,$4,$5,0,$6,$7,true,$8,$9,NOW())
      RETURNING *
      `,
      [
        eventId,
        name.trim(),
        description || null,
        Number(price),
        quantity_total ?? null,
        currency,
        kind,
        sale_starts_at || null,
        sale_ends_at || null,
      ]
    );

    await client.query("COMMIT");

    return insert.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/*
----------------------------------------
GET PUBLIC TICKETS
----------------------------------------
*/
export async function getPublicTicketsService(eventId) {
  const result = await db.query(
    `
    SELECT
      id,
      name,
      description,
      price,
      currency,
      quantity_total,
      quantity_sold,
      (quantity_total - quantity_sold) AS available,
      sale_starts_at,
      sale_ends_at
    FROM ticket_types
    WHERE event_id=$1
      AND is_active=true
      AND deleted_at IS NULL
    ORDER BY created_at ASC
    `,
    [eventId]
  );

  return result.rows;
}

/*
----------------------------------------
ADMIN VIEW
----------------------------------------
*/
export async function getAdminTicketsService(eventId, organizationId) {
  const result = await db.query(
    `
    SELECT *
    FROM ticket_types
    WHERE event_id=$1
      AND deleted_at IS NULL
    ORDER BY created_at DESC
    `,
    [eventId]
  );

  return result.rows;
}

const ENTERTAINMENT_DASHBOARD_MODES = [
  "CONCERT", "FESTIVAL", "LIVE_SHOW", "NIGHTCLUB",
  "THEATER", "COMEDY", "SPORTS", "EXHIBITION",
];

/* event_type values used by entertainment subcategories */
const ENTERTAINMENT_EVENT_TYPES = ["CONCERT", "CORPORATE_EVENT"];

export async function getEventsWithTicketsService(organizationId) {
  const result = await db.query(
    `SELECT
       e.id,
       e.title,
       e.event_type,
       e.dashboard_mode,
       e.status,
       e.starts_at AS starts_at_local,
       e.venue_name,
       COUNT(tt.id)::int                                              AS ticket_count,
       COUNT(tt.id) FILTER (WHERE tt.is_active = true)::int          AS active_count,
       COALESCE(SUM(tt.quantity_sold), 0)::int                       AS total_sold
     FROM events e
     LEFT JOIN ticket_types tt ON tt.event_id = e.id AND tt.deleted_at IS NULL
     WHERE e.organization_id = $1
       AND e.deleted_at IS NULL
       AND (
         UPPER(e.dashboard_mode) = ANY($2)
         OR UPPER(e.event_type)  = ANY($3)
       )
     GROUP BY e.id
     ORDER BY e.starts_at DESC NULLS LAST`,
    [organizationId, ENTERTAINMENT_DASHBOARD_MODES, ENTERTAINMENT_EVENT_TYPES]
  );
  return result.rows;
}

export async function deleteTicketTypeService(ticketId, organizationId) {
  const result = await db.query(
    `UPDATE ticket_types SET deleted_at = NOW()
     WHERE id = $1
       AND event_id IN (SELECT id FROM events WHERE organization_id = $2 AND deleted_at IS NULL)
       AND deleted_at IS NULL
     RETURNING id`,
    [ticketId, organizationId]
  );
  if (!result.rows.length) throw new AppError("Ticket type not found or unauthorized", 404);
  return { deleted: true };
}

export async function getTicketStatsService(eventId, organizationId) {
  const [types, orders, issued] = await Promise.all([
    db.query(
      `SELECT id, name, price, currency, quantity_total, quantity_sold, kind, is_active
       FROM ticket_types WHERE event_id=$1 AND deleted_at IS NULL`,
      [eventId]
    ),
    db.query(
      `SELECT
         COUNT(*)                                                        AS total_orders,
         COUNT(*) FILTER (WHERE payment_status='PAID')                  AS paid_orders,
         COALESCE(SUM(total) FILTER (WHERE payment_status='PAID'),0)    AS gross_revenue,
         COALESCE(SUM(total) FILTER (WHERE payment_status='PENDING'),0) AS pending_revenue,
         currency
       FROM ticket_orders WHERE event_id=$1
       GROUP BY currency LIMIT 1`,
      [eventId]
    ),
    db.query(
      `SELECT
         COUNT(*)                                            AS total_issued,
         COUNT(*) FILTER (WHERE qr_status='ACTIVE')         AS active,
         COUNT(*) FILTER (WHERE qr_status='USED')           AS checked_in,
         COUNT(*) FILTER (WHERE qr_status='REVOKED')        AS revoked
       FROM issued_tickets WHERE event_id=$1`,
      [eventId]
    ),
  ]);
  const o = orders.rows[0] ?? {};
  const i = issued.rows[0] ?? {};
  return {
    ticket_types:    types.rows,
    total_orders:    Number(o.total_orders    ?? 0),
    paid_orders:     Number(o.paid_orders     ?? 0),
    gross_revenue:   Number(o.gross_revenue   ?? 0),
    pending_revenue: Number(o.pending_revenue ?? 0),
    currency:        o.currency ?? "USD",
    total_issued:    Number(i.total_issued    ?? 0),
    active_tickets:  Number(i.active          ?? 0),
    checked_in:      Number(i.checked_in      ?? 0),
    revoked:         Number(i.revoked         ?? 0),
  };
}

export async function listOrdersService(eventId, { limit = 50, offset = 0 } = {}) {
  const result = await db.query(
    `SELECT
       o.id, o.buyer_name, o.buyer_email, o.buyer_phone,
       o.order_status, o.payment_status,
       o.subtotal, o.total, o.currency, o.paid_at, o.created_at,
       json_agg(json_build_object(
         'name',       tt.name,
         'quantity',   oi.quantity,
         'unit_price', oi.unit_price,
         'line_total', oi.line_total
       ) ORDER BY oi.created_at) AS items
     FROM ticket_orders o
     JOIN ticket_order_items oi ON oi.order_id = o.id
     JOIN ticket_types tt ON tt.id = oi.ticket_type_id
     WHERE o.event_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT $2 OFFSET $3`,
    [eventId, limit, offset]
  );
  return result.rows;
}

/*
----------------------------------------
UPDATE TICKET
----------------------------------------
*/
// export async function updateTicketTypeService(ticketId, payload) {
//   const fields = [];
//   const values = [];
//   let index = 1;

//   for (const key in payload) {
//     fields.push(`${key}=$${index}`);
//     values.push(payload[key]);
//     index++;
//   }

//   if (!fields.length) {
//     throw new Error("Nothing to update");
//   }

//   const result = await db.query(
//     `
//     UPDATE ticket_types
//     SET ${fields.join(", ")}, updated_at=NOW()
//     WHERE id=$${index}
//     RETURNING *
//     `,
//     [...values, ticketId]
//   );

//   return result.rows[0];
// }
export async function updateTicketTypeService(ticketId, payload) {
  const allowedFields = [
    "name",
    "description",
    "price",
    "currency",
    "quantity_total",
    "sale_starts_at",
    "sale_ends_at",
    "is_active",
    "kind"
  ];

  const fields = [];
  const values = [];
  let index = 1;

  for (const key in payload) {
    if (!allowedFields.includes(key)) continue;

    fields.push(`${key}=$${index}`);
    values.push(payload[key]);
    index++;
  }

  if (!fields.length) {
    throw new Error("Nothing valid to update");
  }

  const result = await db.query(
    `
    UPDATE ticket_types
    SET ${fields.join(", ")}
    WHERE id=$${index}
    RETURNING *
    `,
    [...values, ticketId]
  );

  if (!result.rows.length) {
    throw new Error("Ticket type not found");
  }

  return result.rows[0];
}