import { db } from "../config/db.js";
import { sendMail } from "../utils/sendEmail.js";

export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function normalizeText(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v || null;
}

async function assertOrganizationEventPermission(client, organizationId, userId) {
  const result = await client.query(
    `
    SELECT role
    FROM organization_members
    WHERE organization_id = $1
      AND user_id = $2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [organizationId, userId]
  );

  if (!result.rows[0]) {
    throw new AppError("Forbidden", 403);
  }
}

async function assertEventExists(client, eventId, organizationId) {
  const result = await client.query(
    `
    SELECT *
    FROM events
    WHERE id = $1
      AND organization_id = $2
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

function validateMessagePayload(payload = {}) {
  const errors = [];

  if (!normalizeText(payload.channel)) errors.push("channel is required");
  if (!normalizeText(payload.recipient)) errors.push("recipient is required");
  if (!normalizeText(payload.body)) errors.push("body is required");

  if (errors.length) {
    throw new AppError("Validation failed", 400, errors);
  }
}

export async function createOutboundMessageService({
  eventId,
  organizationId,
  userId,
  payload,
}) {
  validateMessagePayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const channel = String(payload.channel).trim().toUpperCase();
    let status = "PENDING";
    let providerMessageId = null;
    let errorMessage = null;

    if (channel === "EMAIL") {
      try {
        const mailResult = await sendMail({
          to: payload.recipient,
          subject: normalizeText(payload.subject) ?? "Event Message",
          html: payload.body,
        });

        providerMessageId = mailResult?.messageId || null;
        status = "SENT";
      } catch (error) {
        status = "FAILED";
        errorMessage = error.message || "Failed to send email";
      }
    }

    const result = await client.query(
      `
      INSERT INTO outbound_messages
      (
        organization_id,
        event_id,
        guest_id,
        channel,
        recipient,
        template_id,
        subject,
        body,
        provider,
        provider_message_id,
        status,
        error_message,
        scheduled_at,
        sent_at,
        created_at,
        updated_at
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
        CASE WHEN $11 = 'SENT' THEN NOW() ELSE NULL END,
        NOW(),
        NOW()
      )
      RETURNING *
      `,
      [
        organizationId,
        eventId,
        payload.guest_id ?? null,
        channel,
        normalizeText(payload.recipient),
        payload.template_id ?? null,
        normalizeText(payload.subject),
        payload.body,
        channel === "EMAIL" ? "EMAIL" : null,
        providerMessageId,
        status,
        errorMessage,
        payload.scheduled_at ?? null,
      ]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listOutboundMessagesService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      SELECT *
      FROM outbound_messages
      WHERE event_id = $1
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      `,
      [eventId]
    );

    return result.rows;
  } finally {
    client.release();
  }
}