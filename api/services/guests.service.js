
import { db } from "../config/db.js";
import crypto from "crypto";
import { sendMail, sendEventInvitationEmail, sendSeatAssignmentEmail, sendRsvpConfirmationEmail } from "../utils/sendEmail.js";
import QRCode from "qrcode";

/* =========================
   ERROR CLASS
========================= */

class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/* =========================
   ENUMS
========================= */

const RSVP_STATUS = ["PENDING", "GOING", "MAYBE", "DECLINED"];

const ATTENDANCE_STATUS = [
  "NOT_MARKED",
  "PRESENT",
  "ABSENT",
  "LATE",
  "CHECKED_IN",
];

const INVITATION_CHANNELS = ["EMAIL", "SMS", "WHATSAPP", "MANUAL"];
const INVITATION_STATUS = [
  "PENDING",
  "SENT",
  "DELIVERED",
  "OPENED",
  "FAILED",
  "CANCELLED",
];
const QR_STATUS = ["ACTIVE", "USED", "REVOKED", "EXPIRED"];

/* =========================
   VALIDATION
========================= */

function validateGuestPayload(payload = {}) {
  const errors = [];

  if (!payload.full_name || !payload.full_name.trim()) {
    errors.push("full_name is required");
  }

  if (payload.email && !payload.email.includes("@")) {
    errors.push("email must be valid");
  }

  if (
    payload.plus_one_count !== undefined &&
    (!Number.isInteger(payload.plus_one_count) || payload.plus_one_count < 0)
  ) {
    errors.push("plus_one_count must be a non-negative integer");
  }

  if (
    payload.plus_one_allowed === false &&
    payload.plus_one_count !== undefined &&
    payload.plus_one_count > 0
  ) {
    errors.push("plus_one_count must be 0 when plus_one_allowed is false");
  }

  if (errors.length) {
    throw new AppError("Validation failed", 400, errors);
  }
}

function validateRsvpPayload(payload = {}) {
  if (!payload.guest_id) {
    throw new AppError("guest_id is required", 400);
  }

  payload.rsvp_status = payload.rsvp_status?.toUpperCase();

  if (!RSVP_STATUS.includes(payload.rsvp_status)) {
    throw new AppError(
      `Invalid rsvp_status. Allowed: ${RSVP_STATUS.join(", ")}`,
      400,
    );
  }
}

function validateAttendancePayload(payload = {}) {
  if (!payload.guest_id) {
    throw new AppError("guest_id is required", 400);
  }

  payload.attendance_status = payload.attendance_status?.toUpperCase();

  if (!ATTENDANCE_STATUS.includes(payload.attendance_status)) {
    throw new AppError(
      `Invalid attendance_status. Allowed: ${ATTENDANCE_STATUS.join(", ")}`,
      400,
    );
  }
}

function validateInvitationPayload(payload = {}) {
  payload.channel = (payload.channel || "EMAIL").toUpperCase();

  if (!INVITATION_CHANNELS.includes(payload.channel)) {
    throw new AppError(
      `Invalid channel. Allowed: ${INVITATION_CHANNELS.join(", ")}`,
      400,
    );
  }
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}
function validateInvitationStatus(status) {
  if (!INVITATION_STATUS.includes(status)) {
    throw new AppError(
      `Invalid invitation_status. Allowed: ${INVITATION_STATUS.join(", ")}`,
      400,
    );
  }
}
function validateQrStatus(status) {
   status = status.toUpperCase();
    if (!QR_STATUS.includes(status)) {
        throw new AppError( 
            `Invalid qr_status. Allowed: ${QR_STATUS.join(", ")}`,
            400,
        );
    }
}

/* =========================
   HELPERS
========================= */
function validatePublicRsvpPayload(payload = {}) {
    payload.rsvp_status = payload.rsvp_status?.toUpperCase();
  
    if (!RSVP_STATUS.includes(payload.rsvp_status)) {
      throw new AppError(
        `Invalid rsvp_status. Allowed: ${RSVP_STATUS.join(", ")}`,
        400
      );
    }
  
    if (
      payload.plus_one_count !== undefined &&
      (!Number.isInteger(payload.plus_one_count) || payload.plus_one_count < 0)
    ) {
      throw new AppError("plus_one_count must be a non-negative integer", 400);
    }
  }

async function assertOrganizationEventPermission(
  client,
  organizationId,
  userId,
) {
  const result = await client.query(
    `
    SELECT role
    FROM organization_members
    WHERE organization_id=$1
      AND user_id=$2
    LIMIT 1
    `,
    [organizationId, userId],
  );

  if (!result.rows[0]) {
    throw new AppError("You do not belong to this organization", 403);
  }

  return result.rows[0];
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
    [eventId, organizationId],
  );

  if (!result.rows[0]) {
    throw new AppError("Event not found", 404);
  }

  return result.rows[0];
}

async function assertGuestBelongsToEvent(client, guestId, eventId) {
  const result = await client.query(
    `
    SELECT *
    FROM guests
    WHERE id=$1
      AND event_id=$2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [guestId, eventId],
  );

  if (!result.rows[0]) {
    throw new AppError("Guest not found", 404);
  }

  return result.rows[0];
}

async function getActiveQrPassByGuest(client, guestId, eventId) {
  const result = await client.query(
    `
    SELECT *
    FROM guest_qr_passes
    WHERE guest_id=$1
      AND event_id=$2
      AND qr_status='ACTIVE'
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [guestId, eventId],
  );

  return result.rows[0] || null;
}

function buildInvitationUrl({ invitationToken }) {
  const baseUrl =
    process.env.APP_FRONTEND_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000";

  return `${baseUrl}/invitation/${invitationToken}`;
}

function mapGuest(row) {
  return {
    id: row.id,
    event_id: row.event_id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    plus_one_allowed: row.plus_one_allowed,
    plus_one_count: row.plus_one_count,
    is_vip: row.is_vip,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapInvitation(row) {
  return {
    id: row.id,
    guest_id: row.guest_id,
    event_id: row.event_id,
    channel: row.channel,
    recipient_value: row.recipient_value,
    invitation_token: row.invitation_token,
    invitation_status: row.invitation_status,
    sent_at: row.sent_at,
    delivered_at: row.delivered_at,
    opened_at: row.opened_at,
    failed_reason: row.failed_reason,
    provider_message_id: row.provider_message_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapQrPass(row) {
  return {
    id: row.id,
    guest_id: row.guest_id,
    event_id: row.event_id,
    qr_token: row.qr_token,
    qr_status: row.qr_status,
    expires_at: row.expires_at,
    used_at: row.used_at,
    revoked_at: row.revoked_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/* =========================
   CREATE GUEST
========================= */

export async function createGuestService({
  eventId,
  organizationId,
  userId,
  payload,
}) {
  validateGuestPayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      INSERT INTO guests
      (
        event_id,
        full_name,
        email,
        phone,
        plus_one_allowed,
        plus_one_count,
        is_vip
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        eventId,
        payload.full_name.trim(),
        payload.email ? payload.email.trim().toLowerCase() : null,
        payload.phone ?? null,
        normalizeBoolean(payload.plus_one_allowed, false),
        payload.plus_one_count ?? 0,
        normalizeBoolean(payload.is_vip, false),
      ],
    );

    await client.query("COMMIT");

    return mapGuest(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/* =========================
   LIST GUESTS
========================= */

export async function listGuestsService({ eventId, organizationId, userId }) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      SELECT *
      FROM guests
      WHERE event_id=$1
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      `,
      [eventId],
    );

    return {
      data: result.rows.map(mapGuest),
    };
  } finally {
    client.release();
  }
}

/* =========================
   GET GUEST
========================= */

export async function getGuestByIdService({
  eventId,
  guestId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const guest = await assertGuestBelongsToEvent(client, guestId, eventId);

    return mapGuest(guest);
  } finally {
    client.release();
  }
}

/* =========================
   UPDATE GUEST
========================= */

export async function updateGuestService({
  eventId,
  guestId,
  organizationId,
  userId,
  payload,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const guest = await assertGuestBelongsToEvent(client, guestId, eventId);

    const mergedPayload = {
      full_name: payload.full_name ?? guest.full_name,
      email: payload.email ?? guest.email,
      phone: payload.phone ?? guest.phone,
      plus_one_allowed: payload.plus_one_allowed ?? guest.plus_one_allowed,
      plus_one_count: payload.plus_one_count ?? guest.plus_one_count,
      is_vip: payload.is_vip ?? guest.is_vip,
    };

    validateGuestPayload(mergedPayload);

    const result = await client.query(
      `
      UPDATE guests
      SET
        full_name=$1,
        email=$2,
        phone=$3,
        plus_one_allowed=$4,
        plus_one_count=$5,
        is_vip=$6,
        updated_at=NOW()
      WHERE id=$7
      RETURNING *
      `,
      [
        mergedPayload.full_name.trim(),
        mergedPayload.email ? mergedPayload.email.trim().toLowerCase() : null,
        mergedPayload.phone ?? null,
        mergedPayload.plus_one_allowed,
        mergedPayload.plus_one_count,
        mergedPayload.is_vip,
        guestId,
      ],
    );

    await client.query("COMMIT");

    return mapGuest(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/* =========================
   DELETE GUEST
========================= */

export async function deleteGuestService({
  eventId,
  guestId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      UPDATE guests
      SET deleted_at=NOW(), updated_at=NOW()
      WHERE id=$1
        AND event_id=$2
        AND deleted_at IS NULL
      RETURNING id
      `,
      [guestId, eventId],
    );

    if (!result.rowCount) {
      throw new AppError("Guest not found", 404);
    }

    await client.query("COMMIT");

    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/* =========================
   RSVP
========================= */

export async function submitGuestRsvpService({
  eventId,
  organizationId,
  payload,
}) {
  validateRsvpPayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertEventExists(client, eventId, organizationId);
    const guest = await assertGuestBelongsToEvent(
      client,
      payload.guest_id,
      eventId,
    );

    const result = await client.query(
      `
      INSERT INTO guest_rsvps
      (
        guest_id,
        event_id,
        rsvp_status,
        responded_at,
        updated_at
      )
      VALUES ($1,$2,$3::rsvp_status,NOW(),NOW())
      ON CONFLICT (guest_id,event_id)
      DO UPDATE SET
        rsvp_status=EXCLUDED.rsvp_status,
        responded_at=NOW(),
        updated_at=NOW()
      RETURNING *
      `,
      [guest.id, eventId, payload.rsvp_status],
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

/* =========================
   LIST RSVPS
========================= */

export async function listGuestRsvpsService({
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
      FROM guest_rsvps
      WHERE event_id=$1
      ORDER BY responded_at DESC NULLS LAST, created_at DESC
      `,
      [eventId],
    );

    return { data: result.rows };
  } finally {
    client.release();
  }
}

/* =========================
   ATTENDANCE
========================= */

export async function markGuestAttendanceService({
  eventId,
  organizationId,
  userId,
  payload,
}) {
  validateAttendancePayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);
    await assertGuestBelongsToEvent(client, payload.guest_id, eventId);

    const result = await client.query(
      `
      INSERT INTO guest_attendance
      (
        guest_id,
        event_id,
        attendance_status,
        marked_by_user_id,
        marked_via,
        marked_at,
        notes,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,NOW(),$6,NOW())
      ON CONFLICT (guest_id,event_id)
      DO UPDATE SET
        attendance_status=EXCLUDED.attendance_status,
        marked_by_user_id=EXCLUDED.marked_by_user_id,
        marked_via=EXCLUDED.marked_via,
        marked_at=NOW(),
        notes=EXCLUDED.notes,
        updated_at=NOW()
      RETURNING *
      `,
      [
        payload.guest_id,
        eventId,
        payload.attendance_status,
        userId,
        payload.marked_via ?? "MANUAL",
        payload.notes ?? null,
      ],
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

/* =========================
   DASHBOARD
========================= */


export async function getGuestDashboardService({
    eventId,
    organizationId,
    userId,
  }) {
    const client = await db.connect();
  
    try {
      await assertOrganizationEventPermission(client, organizationId, userId);
      await assertEventExists(client, eventId, organizationId);
  
      const [
        guestsRes,
        rsvpRes,
        attendanceRes,
        vipRes,
        invitationRes,
        qrRes
      ] = await Promise.all([
  
        client.query(
          `
          SELECT COUNT(*)::int AS total
          FROM guests
          WHERE event_id=$1
            AND deleted_at IS NULL
          `,
          [eventId]
        ),
  
        client.query(
          `
          SELECT
            COUNT(*) FILTER (WHERE rsvp_status='GOING')::int AS going,
            COUNT(*) FILTER (WHERE rsvp_status='MAYBE')::int AS maybe,
            COUNT(*) FILTER (WHERE rsvp_status='DECLINED')::int AS declined,
            COUNT(*) FILTER (WHERE rsvp_status='PENDING')::int AS pending
          FROM guest_rsvps
          WHERE event_id=$1
          `,
          [eventId]
        ),
  
        client.query(
          `
          SELECT
            COUNT(*) FILTER (WHERE attendance_status='CHECKED_IN')::int AS checked_in,
            COUNT(*) FILTER (WHERE attendance_status='PRESENT')::int AS present,
            COUNT(*) FILTER (WHERE attendance_status='ABSENT')::int AS absent,
            COUNT(*) FILTER (WHERE attendance_status='LATE')::int AS late
          FROM guest_attendance
          WHERE event_id=$1
          `,
          [eventId]
        ),
  
        client.query(
          `
          SELECT COUNT(*)::int AS total
          FROM guests
          WHERE event_id=$1
            AND deleted_at IS NULL
            AND is_vip=true
          `,
          [eventId]
        ),
  
        client.query(
          `
          SELECT
            COUNT(*) FILTER (WHERE invitation_status='SENT')::int AS sent,
            COUNT(*) FILTER (WHERE invitation_status='DELIVERED')::int AS delivered,
            COUNT(*) FILTER (WHERE invitation_status='OPENED')::int AS opened,
            COUNT(*) FILTER (WHERE invitation_status='FAILED')::int AS failed
          FROM guest_invitations
          WHERE event_id=$1
            AND deleted_at IS NULL
          `,
          [eventId]
        ),
  
        client.query(
          `
          SELECT
            COUNT(*) FILTER (WHERE qr_status='ACTIVE')::int AS active,
            COUNT(*) FILTER (WHERE qr_status='USED')::int AS used,
            COUNT(*) FILTER (WHERE qr_status='EXPIRED')::int AS expired,
            COUNT(*) FILTER (WHERE qr_status='REVOKED')::int AS revoked
          FROM guest_qr_passes
          WHERE event_id=$1
          `,
          [eventId]
        )
  
      ]);
  
      return {
        total_guests: guestsRes.rows[0].total,
  
        rsvp: rsvpRes.rows[0],
  
        attendance: attendanceRes.rows[0],
  
        vip_guests: vipRes.rows[0].total,
  
        invitations: invitationRes.rows[0],
  
        qr_passes: qrRes.rows[0]
      };
  
    } finally {
      client.release();
    }
  }

/* =========================
   QR PASS
========================= */

export async function generateQrCodeForGuestService({
  eventId,
  guestId,
  organizationId,
  userId,
  expiresInHours = 48,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);
    await assertGuestBelongsToEvent(client, guestId, eventId);

    const existingActive = await getActiveQrPassByGuest(
      client,
      guestId,
      eventId,
    );
    if (existingActive) {
      await client.query("COMMIT");
      return mapQrPass(existingActive);
    }

    const qrToken = crypto.randomBytes(32).toString("hex");

    const result = await client.query(
      `
      INSERT INTO guest_qr_passes
      (
        guest_id,
        event_id,
        qr_token,
        qr_status,
        expires_at,
        created_at,
        updated_at
      )
      VALUES
      (
        $1,
        $2,
        $3,
        'ACTIVE',
        NOW() + ($4 || ' hours')::interval,
        NOW(),
        NOW()
      )
      RETURNING *
      `,
      [guestId, eventId, qrToken, String(expiresInHours)],
    );

    await client.query("COMMIT");

    return mapQrPass(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/* =========================
   SEND INVITATION
========================= */

export async function sendInvitationEmailToGuestService({
  eventId,
  guestId,
  organizationId,
  userId,
  payload = {},
}) {
  validateInvitationPayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const channel = (payload.channel || "EMAIL").toUpperCase();

    await assertOrganizationEventPermission(client, organizationId, userId);
    const event = await assertEventExists(client, eventId, organizationId);
    const guest = await assertGuestBelongsToEvent(client, guestId, eventId);

    // Always try email first; fall back to manual if guest has no email
    const effectiveChannel = guest.email ? "EMAIL" : channel === "SMS" || channel === "WHATSAPP" ? channel : "MANUAL";
    let recipientValue = null;

    if (effectiveChannel === "EMAIL") {
      recipientValue = guest.email.trim().toLowerCase();
    } else if (effectiveChannel === "SMS" || effectiveChannel === "WHATSAPP") {
      if (!guest.phone) throw new AppError("Guest has no phone number", 400);
      recipientValue = guest.phone;
    } else {
      recipientValue = guest.email || guest.phone || guest.full_name;
    }

    const invitationToken = crypto.randomBytes(32).toString("hex");

    const insertResult = await client.query(
      `
      INSERT INTO guest_invitations
      (guest_id, event_id, channel, recipient_value, invitation_token, invitation_status, created_at, updated_at)
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, 'PENDING'::invitation_status, NOW(), NOW())
      RETURNING *
      `,
      [guest.id, eventId, effectiveChannel, recipientValue, invitationToken],
    );
    const invitation = insertResult.rows[0];
    const invitationUrl = buildInvitationUrl({ invitationToken });
    const baseUrl = process.env.APP_FRONTEND_URL || process.env.FRONTEND_URL || "http://localhost:3000";
    const eventPageUrl = event.slug ? `${baseUrl}/e/${event.slug}?token=${invitationToken}` : null;

    let providerMessageId = null;
    let finalStatus = "SENT";
    let failedReason = null;

    if (effectiveChannel === "EMAIL") {
      try {
        const mailResult = await sendEventInvitationEmail({
          to: recipientValue,
          guest,
          event,
          invitationUrl,
          eventPageUrl,
        });
        providerMessageId = mailResult?.messageId || mailResult?.message_id || null;
      } catch (error) {
        finalStatus = "FAILED";
        failedReason = error.message || "Failed to send invitation email";
      }
    } else {
      finalStatus = "SENT";
    }

    const updateResult = await client.query(
      `
      UPDATE guest_invitations
      SET
        invitation_status=$1::invitation_status,
        sent_at=CASE WHEN $1='SENT' THEN NOW() ELSE sent_at END,
        failed_reason=$2,
        provider_message_id=$3,
        updated_at=NOW()
      WHERE id=$4
      RETURNING *
      `,
      [finalStatus, failedReason, providerMessageId, invitation.id],
    );

    await client.query("COMMIT");

    return {
      invitation: mapInvitation(updateResult.rows[0]),
      invitation_url: invitationUrl,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}


export async function checkInGuestByQrTokenService({
    eventId,
    organizationId,
    userId,
    qrToken,
    deviceId = null,
    appPlatform = null,
    location = null,
  }) {
    if (!qrToken || !HEX64_RE.test(String(qrToken).trim())) {
      throw new AppError("Invalid QR token format", 400);
    }
  
    const client = await db.connect();
  
    try {
      await client.query("BEGIN");
  
      await assertOrganizationEventPermission(client, organizationId, userId);
      await assertEventExists(client, eventId, organizationId);
  
      const qrResult = await client.query(
        `
        SELECT
          qp.*,
          g.full_name,
          g.email,
          g.phone,
          g.is_vip
        FROM guest_qr_passes qp
        JOIN guests g
          ON g.id = qp.guest_id
        WHERE qp.event_id = $1
          AND qp.qr_token = $2
          AND g.deleted_at IS NULL
        FOR UPDATE
        `,
        [eventId, String(qrToken).trim()]
      );
  
      const qrPass = qrResult.rows[0];
  
      if (!qrPass) {
        throw new AppError("Invalid QR pass", 404);
      }
  
      if (qrPass.revoked_at) {
        throw new AppError("QR pass has been revoked", 400);
      }
  
      if (qrPass.used_at || qrPass.qr_status === "USED") {
        throw new AppError("QR pass already used", 400);
      }
  
      if (qrPass.expires_at && new Date(qrPass.expires_at) < new Date()) {
        await client.query(
          `
          UPDATE guest_qr_passes
          SET
            qr_status = 'EXPIRED',
            updated_at = NOW()
          WHERE id = $1
          `,
          [qrPass.id]
        );
  
        throw new AppError("QR pass has expired", 400);
      }
  
      const existingCheckin = await client.query(
        `
        SELECT id
        FROM qr_checkins
        WHERE qr_pass_id = $1
           OR (event_id = $2 AND guest_id = $3)
        LIMIT 1
        `,
        [qrPass.id, eventId, qrPass.guest_id]
      );
  
      if (existingCheckin.rowCount > 0) {
        throw new AppError("Guest already checked in", 400);
      }
  
      let checkinResult;
  
      try {
        checkinResult = await client.query(
          `
          INSERT INTO qr_checkins
          (
            qr_pass_id,
            guest_id,
            event_id,
            checked_in_by,
            device_id,
            app_platform,
            location_json,
            created_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
          RETURNING *
          `,
          [
            qrPass.id,
            qrPass.guest_id,
            eventId,
            userId ?? null,
            deviceId ?? null,
            appPlatform ?? null,
            location ? JSON.stringify(location) : JSON.stringify({}),
          ]
        );
      } catch (error) {
        if (error.code === "23505") {
          throw new AppError("Guest already checked in", 400);
        }
        throw error;
      }
  
      await client.query(
        `
        UPDATE guest_qr_passes
        SET
          qr_status = 'USED',
          used_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        `,
        [qrPass.id]
      );
  
      const attendanceResult = await client.query(
        `
        INSERT INTO guest_attendance
        (
          guest_id,
          event_id,
          attendance_status,
          marked_by_user_id,
          marked_via,
          marked_at,
          updated_at
        )
        VALUES ($1,$2,'CHECKED_IN',$3,'QR',NOW(),NOW())
        ON CONFLICT (guest_id,event_id)
        DO UPDATE SET
          attendance_status = 'CHECKED_IN',
          marked_by_user_id = EXCLUDED.marked_by_user_id,
          marked_via = 'QR',
          marked_at = NOW(),
          updated_at = NOW()
        RETURNING *
        `,
        [qrPass.guest_id, eventId, userId]
      );
  
      await client.query("COMMIT");

      await maybeSendSeatEmail(client, qrPass.guest_id, eventId, {
        email: qrPass.email,
        full_name: qrPass.full_name,
      });

      return {
        checked_in: true,
        guest: {
          id: qrPass.guest_id,
          full_name: qrPass.full_name,
          email: qrPass.email,
          phone: qrPass.phone,
          is_vip: qrPass.is_vip,
        },
        qr_pass: {
          id: qrPass.id,
          qr_status: "USED",
        },
        qr_checkin: checkinResult.rows[0],
        attendance: attendanceResult.rows[0],
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

/* =========================
   HELPER: send seat email after check-in
========================= */
async function maybeSendSeatEmail(client, guestId, eventId, guestData) {
  try {
    if (!guestData?.email) return;
    const seatRes = await client.query(
      `SELECT sa.seat_number, sl.name AS table_name
       FROM seating_assignments sa
       JOIN seating_locations sl ON sl.id = sa.seating_location_id
       WHERE sa.guest_id = $1 AND sa.event_id = $2
       LIMIT 1`,
      [guestId, eventId]
    );
    if (!seatRes.rows[0]) return;
    const { table_name, seat_number } = seatRes.rows[0];
    const eventRes = await client.query(`SELECT title FROM events WHERE id = $1`, [eventId]);
    const eventTitle = eventRes.rows[0]?.title || "the event";
    await sendSeatAssignmentEmail({
      to: guestData.email,
      name: guestData.full_name,
      eventName: eventTitle,
      tableName: table_name,
      seatNumber: seat_number,
    });
  } catch {
    // non-fatal — seat email failure should not block check-in
  }
}

/* =========================
   MANUAL CHECK-IN (click, no QR)
========================= */
export async function manualCheckInGuestService({ eventId, guestId, organizationId, userId }) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);
    const guest = await assertGuestBelongsToEvent(client, guestId, eventId);

    const attendanceResult = await client.query(
      `INSERT INTO guest_attendance
       (guest_id, event_id, attendance_status, marked_by_user_id, marked_via, marked_at, updated_at)
       VALUES ($1, $2, 'CHECKED_IN', $3, 'MANUAL', NOW(), NOW())
       ON CONFLICT (guest_id, event_id) DO UPDATE SET
         attendance_status = 'CHECKED_IN',
         marked_by_user_id = EXCLUDED.marked_by_user_id,
         marked_via = 'MANUAL',
         marked_at = NOW(),
         updated_at = NOW()
       RETURNING *`,
      [guestId, eventId, userId]
    );

    await client.query("COMMIT");

    await maybeSendSeatEmail(client, guestId, eventId, guest);

    return { checked_in: true, guest: mapGuest(guest), attendance: attendanceResult.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/* =========================
   LIST ATTENDANCE
========================= */
export async function listGuestAttendanceService({ eventId, organizationId, userId }) {
  const client = await db.connect();
  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);
    const result = await client.query(
      `SELECT guest_id, attendance_status, marked_via, marked_at FROM guest_attendance WHERE event_id = $1`,
      [eventId]
    );
    return { data: result.rows };
  } finally {
    client.release();
  }
}

// public functions for guests (no auth required) can be added here, e.g. public RSVP submission, etc.
const HEX64_RE = /^[0-9a-f]{64}$/i;

// QR passes expire the day after the event ends (or 90 days out if no end date)
function qrExpiryForEvent(event) {
  if (event?.ends_at) {
    const d = new Date(event.ends_at);
    d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCHours(23, 59, 59, 0);
    return d.toISOString();
  }
  return null; // fallback: use SQL `NOW() + interval '90 days'`
}

export async function getInvitationByTokenService({ token }) {
    if (!token || !HEX64_RE.test(String(token))) {
      throw new AppError("Invalid invitation token", 400);
    }
  
    const result = await db.query(
      `
      SELECT
        gi.id,
        gi.guest_id,
        gi.event_id,
        gi.channel,
        gi.recipient_value,
        gi.invitation_status,
        gi.sent_at,
        gi.delivered_at,
        gi.opened_at,
        g.full_name,
        g.email,
        g.phone,
        g.plus_one_allowed,
        g.plus_one_count,
        g.is_vip,
        e.title AS event_title,
        e.description AS event_description,
        e.starts_at,
        e.ends_at,
        e.venue_name,
        e.venue_address,
        e.city,
        e.country,
        gr.rsvp_status AS existing_rsvp_status,
        gr.plus_one_count AS existing_plus_one_count
      FROM guest_invitations gi
      JOIN guests g ON g.id = gi.guest_id
      JOIN events e ON e.id = gi.event_id
      LEFT JOIN guest_rsvps gr ON gr.guest_id = gi.guest_id AND gr.event_id = gi.event_id
      WHERE gi.invitation_token = $1
        AND gi.deleted_at IS NULL
        AND g.deleted_at IS NULL
        AND e.deleted_at IS NULL
      LIMIT 1
      `,
      [token]
    );
  
    const invitation = result.rows[0];
  
    if (!invitation) {
      throw new AppError("Invitation not found or invalid", 404);
    }
  
    await db.query(
      `
      UPDATE guest_invitations
      SET
        invitation_status = CASE
          WHEN invitation_status IN ('PENDING', 'SENT', 'DELIVERED')
          THEN 'OPENED'::invitation_status
          ELSE invitation_status
        END,
        opened_at = COALESCE(opened_at, NOW()),
        updated_at = NOW()
      WHERE id = $1
      `,
      [invitation.id]
    );
  
    return {
      invitation_id: invitation.id,
      guest: {
        id: invitation.guest_id,
        full_name: invitation.full_name,
        email: invitation.email,
        phone: invitation.phone,
        plus_one_allowed: invitation.plus_one_allowed,
        plus_one_count: invitation.plus_one_count,
        is_vip: invitation.is_vip,
      },
      event: {
        id: invitation.event_id,
        title: invitation.event_title,
        description: invitation.event_description,
        start_at: invitation.starts_at,
        end_at: invitation.ends_at,
        location_name: invitation.venue_name,
        location_address: [invitation.venue_address, invitation.city, invitation.country].filter(Boolean).join(", ") || null,
      },
      invitation_status: invitation.invitation_status,
      channel: invitation.channel,
      existing_rsvp: invitation.existing_rsvp_status
        ? {
            rsvp_status: invitation.existing_rsvp_status,
            plus_one_count: invitation.existing_plus_one_count ?? 0,
          }
        : null,
    };
  }

  export async function submitInvitationRsvpService({ token, payload }) {
    if (!token || !HEX64_RE.test(String(token))) {
      throw new AppError("Invalid invitation token", 400);
    }
    validatePublicRsvpPayload(payload);

    const client = await db.connect();
  
    try {
      await client.query("BEGIN");
  
      const invitationResult = await client.query(
        `
        SELECT
          gi.*,
          g.id AS guest_id,
          g.plus_one_allowed,
          g.deleted_at AS guest_deleted_at,
          e.id AS event_id,
          e.deleted_at AS event_deleted_at
        FROM guest_invitations gi
        JOIN guests g ON g.id = gi.guest_id
        JOIN events e ON e.id = gi.event_id
        WHERE gi.invitation_token = $1
          AND gi.deleted_at IS NULL
        LIMIT 1
        `,
        [token]
      );
  
      const invitation = invitationResult.rows[0];
  
      if (!invitation) {
        throw new AppError("Invitation not found or invalid", 404);
      }
  
      if (invitation.guest_deleted_at) {
        throw new AppError("Guest no longer available", 404);
      }
  
      if (invitation.event_deleted_at) {
        throw new AppError("Event no longer available", 404);
      }
  
      const finalPlusOneCount = invitation.plus_one_allowed
        ? (payload.plus_one_count ?? 0)
        : 0;

      // Update guest contact info if provided
      const guestUpdates = [];
      const guestVals    = [];
      let gi = 1;
      if (payload.guest_name?.trim())  { guestUpdates.push(`full_name = $${gi++}`); guestVals.push(payload.guest_name.trim()); }
      if (payload.email?.trim())       { guestUpdates.push(`email = $${gi++}`);     guestVals.push(payload.email.trim()); }
      if (payload.phone?.trim())       { guestUpdates.push(`phone = $${gi++}`);     guestVals.push(payload.phone.trim()); }
      if (guestUpdates.length) {
        guestVals.push(invitation.guest_id);
        await client.query(
          `UPDATE guests SET ${guestUpdates.join(", ")}, updated_at = NOW() WHERE id = $${gi}`,
          guestVals
        );
      }

      await client.query(
        `
        INSERT INTO guest_rsvps
        (
          guest_id,
          event_id,
          rsvp_status,
          plus_one_count,
          responded_at,
          updated_at
        )
        VALUES ($1,$2,$3::rsvp_status,$4,NOW(),NOW())
        ON CONFLICT (guest_id,event_id)
        DO UPDATE SET
          rsvp_status = EXCLUDED.rsvp_status,
          plus_one_count = EXCLUDED.plus_one_count,
          responded_at = NOW(),
          updated_at = NOW()
        `,
        [
          invitation.guest_id,
          invitation.event_id,
          payload.rsvp_status,
          finalPlusOneCount,
        ]
      );

      await client.query(
        `
        UPDATE guest_invitations
        SET
          invitation_status = 'OPENED'::invitation_status,
          opened_at = COALESCE(opened_at, NOW()),
          updated_at = NOW()
        WHERE id = $1
        `,
        [invitation.id]
      );
  
      const rsvpResult = await client.query(
        `
        SELECT *
        FROM guest_rsvps
        WHERE guest_id = $1 AND event_id = $2
        LIMIT 1
        `,
        [invitation.guest_id, invitation.event_id]
      );

      // Fetch guest + event details needed for confirmation email
      const guestEventResult = await client.query(
        `
        SELECT
          g.full_name, g.email, g.phone, g.plus_one_count,
          e.title AS event_title, e.starts_at, e.ends_at, e.venue_name
        FROM guests g
        JOIN events e ON e.id = $2
        WHERE g.id = $1
        LIMIT 1
        `,
        [invitation.guest_id, invitation.event_id]
      );

      await client.query("COMMIT");

      // Fire-and-forget: generate QR pass and send confirmation email for GOING
      if (payload.rsvp_status === "GOING") {
        const guestRow = guestEventResult.rows[0];
        const recipientEmail = payload.email?.trim() || guestRow?.email;
        if (recipientEmail && guestRow) {
          (async () => {
            try {
              // Upsert a QR pass for the guest
              let qrToken;
              const existingPass = await db.query(
                `SELECT qr_token FROM guest_qr_passes
                 WHERE guest_id=$1 AND event_id=$2 AND qr_status='ACTIVE'
                   AND revoked_at IS NULL
                   AND (expires_at IS NULL OR expires_at > NOW())
                 ORDER BY created_at DESC LIMIT 1`,
                [invitation.guest_id, invitation.event_id]
              );
              if (existingPass.rows[0]) {
                qrToken = existingPass.rows[0].qr_token;
              } else {
                qrToken = crypto.randomBytes(32).toString("hex");
                const expiry = qrExpiryForEvent(guestRow);
                await db.query(
                  `INSERT INTO guest_qr_passes
                   (guest_id, event_id, qr_token, qr_status, expires_at, created_at, updated_at)
                   VALUES ($1,$2,$3,'ACTIVE',$4,NOW(),NOW())`,
                  [invitation.guest_id, invitation.event_id, qrToken, expiry]
                );
              }

              await sendRsvpConfirmationEmail({
                to: recipientEmail,
                guestName: payload.guest_name?.trim() || guestRow.full_name || "Guest",
                eventTitle: guestRow.event_title,
                eventDate: guestRow.starts_at,
                venueName: guestRow.venue_name,
                qrToken,
                plusOneCount: finalPlusOneCount,
              });
            } catch (emailErr) {
              console.error("RSVP confirmation email failed:", emailErr.message);
            }
          })();
        }
      }

      return rsvpResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  export async function sendQrEmailToGuestService({ eventId, guestId, organizationId, userId }) {
    const client = await db.connect();
    try {
      await assertOrganizationEventPermission(client, organizationId, userId);
      const event = await assertEventExists(client, eventId, organizationId);
      await assertGuestBelongsToEvent(client, guestId, eventId);

      const guestRes = await client.query(
        `SELECT full_name, email FROM guests WHERE id=$1 AND deleted_at IS NULL LIMIT 1`,
        [guestId]
      );
      const guest = guestRes.rows[0];
      if (!guest) throw new AppError("Guest not found", 404);
      if (!guest.email) throw new AppError("Guest has no email address", 400);

      // Get or create an active QR pass
      let qrToken;
      const existing = await getActiveQrPassByGuest(client, guestId, eventId);
      if (existing) {
        qrToken = existing.qr_token;
      } else {
        qrToken = crypto.randomBytes(32).toString("hex");
        const expiry = qrExpiryForEvent(event);
        await client.query(
          `INSERT INTO guest_qr_passes
           (guest_id, event_id, qr_token, qr_status, expires_at, created_at, updated_at)
           VALUES ($1,$2,$3,'ACTIVE',$4,NOW(),NOW())`,
          [guestId, eventId, qrToken, expiry]
        );
      }

      await sendRsvpConfirmationEmail({
        to: guest.email,
        guestName: guest.full_name,
        eventTitle: event.title,
        eventDate: event.starts_at,
        venueName: event.venue_name,
        qrToken,
        plusOneCount: 0,
      });

      return { qr_token: qrToken };
    } finally {
      client.release();
    }
  }

  export async function sendInvitationsToAllGuestsService({
    eventId,
    organizationId,
    userId,
    payload = {},
  }) {
    const client = await db.connect();
  
    try {
      await client.query("BEGIN");
  
      await assertOrganizationEventPermission(client, organizationId, userId);
      const event = await assertEventExists(client, eventId, organizationId);
  
      // 👉 GET ALL GUESTS
      const guestsRes = await client.query(
        `
        SELECT *
        FROM guests
        WHERE event_id=$1
          AND deleted_at IS NULL
        `,
        [eventId]
      );
  
      const guests = guestsRes.rows;
  
      if (!guests.length) {
        throw new AppError("No guests found", 404);
      }
  
      const results = [];
  
      for (const guest of guests) {
        try {
          const result = await sendInvitationEmailToGuestService({
            eventId,
            guestId: guest.id,
            organizationId,
            userId,
            payload,
          });
  
          results.push({
            guest_id: guest.id,
            status: "SENT",
            invitation_url: result.invitation_url,
          });
        } catch (err) {
          results.push({
            guest_id: guest.id,
            status: "FAILED",
            error: err.message,
          });
        }
      }
  
      await client.query("COMMIT");
  
      return {
        total: guests.length,
        results,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
