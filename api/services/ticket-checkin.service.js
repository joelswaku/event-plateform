//ticket-checkin.service.js
import { db } from "../config/db.js";
import { broadcastToEvent } from "../config/websocket.js";

class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function assertOrganizationEventPermission(client, organizationId, userId) {
  const result = await client.query(
    `
    SELECT role
    FROM organization_members
    WHERE organization_id=$1
      AND user_id=$2
    LIMIT 1
    `,
    [organizationId, userId]
  );

  if (!result.rows[0]) {
    throw new AppError("You do not belong to this organization", 403);
  }
}

async function assertEventExists(client, eventId, organizationId) {
  const result = await client.query(
    `
    SELECT *
    FROM events
    WHERE id=$1
      AND organization_id=$2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [eventId, organizationId]
  );

  if (!result.rows[0]) {
    throw new AppError("Event not found", 404);
  }

  return result.rows[0];
}

export async function checkInIssuedTicketService({
  eventId,
  organizationId,
  userId,
  payload,
}) {
  const qrToken = payload?.qr_token ? String(payload.qr_token).trim() : null;

  if (!qrToken) {
    throw new AppError("qr_token is required", 400);
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const ticketRes = await client.query(
      `
      SELECT
        it.*,
        tt.name AS ticket_type_name,
        o.buyer_name,
        o.buyer_email
      FROM issued_tickets it
      JOIN ticket_types tt ON tt.id = it.ticket_type_id
      JOIN ticket_orders o ON o.id = it.order_id
      WHERE it.event_id=$1
        AND it.qr_token=$2
      LIMIT 1
      `,
      [eventId, qrToken]
    );

    const ticket = ticketRes.rows[0];

    if (!ticket) {
      await client.query(
        `
        INSERT INTO ticket_scans
        (
          issued_ticket_id,
          event_id,
          scanned_by,
          device_id,
          scan_result,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,NOW())
        `,
        [null, eventId, userId, payload.device_id ?? null, "INVALID"]
      ).catch(() => {});
      throw new AppError("Invalid ticket QR", 404);
    }

    if (ticket.qr_status === "REVOKED") {
      await client.query(
        `
        INSERT INTO ticket_scans
        (
          issued_ticket_id,
          event_id,
          scanned_by,
          device_id,
          scan_result,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,NOW())
        `,
        [ticket.id, eventId, userId, payload.device_id ?? null, "REVOKED"]
      );
      throw new AppError("Ticket has been revoked", 400);
    }

    if (ticket.checked_in_at) {
      await client.query(
        `
        INSERT INTO ticket_scans
        (
          issued_ticket_id,
          event_id,
          scanned_by,
          device_id,
          scan_result,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,NOW())
        `,
        [ticket.id, eventId, userId, payload.device_id ?? null, "ALREADY_USED"]
      );
      throw new AppError("Ticket already checked in", 409);
    }

    await client.query(
      `
      UPDATE issued_tickets
      SET checked_in_at=NOW(),
          qr_status='USED'
      WHERE id=$1
      `,
      [ticket.id]
    );

    await client.query(
      `
      INSERT INTO ticket_scans
      (
        issued_ticket_id,
        event_id,
        scanned_by,
        device_id,
        scan_result,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,NOW())
      `,
      [ticket.id, eventId, userId, payload.device_id ?? null, "SUCCESS"]
    );

    await client.query("COMMIT");
    const response = {
        checked_in: true,
        ticket_id: ticket.id,
        ticket_type_name: ticket.ticket_type_name,
        holder_name: ticket.holder_name || ticket.buyer_name,
        holder_email: ticket.holder_email || ticket.buyer_email,
        checked_in_at: new Date().toISOString(),
      };
  
      broadcastToEvent(eventId, {
        type: "ticket_checked_in",
        eventId,
        ticketId: ticket.id,
        ticketTypeName: ticket.ticket_type_name,
        holderName: ticket.holder_name || ticket.buyer_name,
        checkedInAt: response.checked_in_at,
      });
  
      return response;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}