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
    SET ${fields.join(", ")}, updated_at=NOW()
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