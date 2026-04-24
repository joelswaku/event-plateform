import crypto from "crypto";
import { db } from "../config/db.js";
import { assertCanCreateEvent } from "./planLimits.service.js";

import { getRuntimeEventStatus } from "../utils/eventStatus.js";
import { convertEventTimeToUTC, convertUTCToEventTime } from "../utils/time.js";

/**
 * Small custom error helper
 */
export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
function validateAndResolveEventType(type) {
  const normalized = normalizeEventType(type);

  // ❌ prevent empty or too short
  if (!normalized || normalized.length < 3) {
    throw new AppError("event_type must be at least 3 characters", 400);
  }

  // ❌ prevent too long
  if (normalized.length > 50) {
    throw new AppError("event_type too long (max 50 chars)", 400);
  }

  // ✅ if default → return directly
  if (DEFAULT_EVENT_TYPES.includes(normalized)) {
    return normalized;
  }

  // 🔥 custom type allowed
  return normalized;
}
/**
 * Slug generator
 */
function slugifyText(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Date validator
 */
function ensureValidDate(value, fieldName) {
  if (!value) throw new AppError(`${fieldName} is required`, 400);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400);
  }

  return date;
}

/**
 * Create payload validation
 */
function validateCreatePayload(payload = {}) {
  const errors = [];

  if (!payload.title || !payload.title.trim()) {
    errors.push("title is required");
  }

  if (!payload.event_type || !String(payload.event_type).trim()) {
    errors.push("event_type is required");
  }

  if (!payload.timezone || !String(payload.timezone).trim()) {
    errors.push("timezone is required");
  }

  if (!payload.starts_at) {
    errors.push("starts_at is required");
  }

  if (!payload.ends_at) {
    errors.push("ends_at is required");
  }

  if (errors.length) {
    throw new AppError("Validation failed", 400, errors);
  }

  const startsAt = ensureValidDate(payload.starts_at, "starts_at");
  const endsAt = ensureValidDate(payload.ends_at, "ends_at");

  if (endsAt < startsAt) {
    throw new AppError("ends_at must be after or equal to starts_at", 400);
  }
}

/**
 * Update payload validation
 */
function validateUpdatePayload(payload = {}) {
  if (!payload || typeof payload !== "object") {
    throw new AppError("Invalid payload", 400);
  }

  if (payload.title !== undefined && !String(payload.title).trim()) {
    throw new AppError("title cannot be empty", 400);
  }

  if (payload.starts_at !== undefined) {
    ensureValidDate(payload.starts_at, "starts_at");
  }

  if (payload.ends_at !== undefined) {
    ensureValidDate(payload.ends_at, "ends_at");
  }

  if (payload.latitude !== undefined && payload.latitude !== null) {
    const latitude = Number(payload.latitude);
    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new AppError("latitude must be between -90 and 90", 400);
    }
  }

  if (payload.longitude !== undefined && payload.longitude !== null) {
    const longitude = Number(payload.longitude);
    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new AppError("longitude must be between -180 and 180", 400);
    }
  }

  if (payload.starts_at && payload.ends_at) {
    const startsAt = new Date(payload.starts_at);
    const endsAt = new Date(payload.ends_at);

    if (endsAt < startsAt) {
      throw new AppError("ends_at must be after or equal to starts_at", 400);
    }
  }
}

/**
 * Ensure the current user can manage events in this organization
 */
async function assertOrganizationEventPermission(
  client,
  organizationId,
  userId,
) {
  const result = await client.query(
    `
    SELECT role
    FROM organization_members
    WHERE organization_id = $1
      AND user_id = $2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [organizationId, userId],
  );

  const membership = result.rows[0];

  if (!membership) {
    throw new AppError("You do not belong to this organization", 403);
  }

  const allowedRoles = [
    "owner",
    "admin",
    "event_manager",
    "OWNER",
    "ADMIN",
    "EVENT_MANAGER",
  ];

  if (!allowedRoles.includes(membership.role)) {
    throw new AppError("You do not have permission to manage events", 403);
  }
}

/**
 * Find event by id and organization
 */
async function findEventById(
  client,
  eventId,
  organizationId,
  { includeDeleted = false } = {},
) {
  const conditions = [`id = $1`, `organization_id = $2`];

  if (!includeDeleted) {
    conditions.push(`deleted_at IS NULL`);
  }

  const result = await client.query(
    `
    SELECT *
    FROM events
    WHERE ${conditions.join(" AND ")}
    LIMIT 1
    `,
    [eventId, organizationId],
  );

  return result.rows[0] || null;
}

/**
 * Generate unique slug
 */

async function generateUniqueEventSlug(client, title) {
  const baseSlug = slugifyText(title) || "event";

  for (let i = 0; i < 5; i++) {
    const randomPart = crypto.randomUUID().slice(0, 8);

    const slug = `${baseSlug}-${randomPart}`;

    const existing = await client.query(
      `
        SELECT id
        FROM events
        WHERE slug = $1
        LIMIT 1
        `,
      [slug],
    );

    if (existing.rowCount === 0) {
      return slug;
    }
  }

  throw new AppError("Failed to generate unique slug", 500);
}

function mapEvent(row) {
  if (!row) return null;

  const runtimeStatus = getRuntimeEventStatus(row);

  const startsAtLocal = row.starts_at
    ? convertUTCToEventTime(row.starts_at, row.timezone)
    : null;

  const endsAtLocal = row.ends_at
    ? convertUTCToEventTime(row.ends_at, row.timezone)
    : null;

  return {
    id: row.id,
    organization_id: row.organization_id,
    created_by: row.created_by,

    event_type: row.event_type,
    title: row.title,
    slug: row.slug,

    description: row.description,
    short_description: row.short_description,

    banner_url: row.banner_url,
    cover_image_url: row.cover_image_url,

    status: row.status,
    runtime_status: runtimeStatus,

    visibility: row.visibility,

    venue_name: row.venue_name,
    venue_address: row.venue_address,

    city: row.city,
    state: row.state,
    country: row.country,

    latitude: row.latitude,
    longitude: row.longitude,

    timezone: row.timezone,

    starts_at_utc: row.starts_at,
    ends_at_utc: row.ends_at,

    starts_at_local: startsAtLocal,
    ends_at_local: endsAtLocal,

    allow_rsvp: row.allow_rsvp,
    allow_plus_ones: row.allow_plus_ones,
    allow_manual_attendance: row.allow_manual_attendance,
    allow_qr_checkin: row.allow_qr_checkin,
    allow_ticketing: row.allow_ticketing,
    allow_donations: row.allow_donations,

    require_creator_verification: row.require_creator_verification,
    creator_verified: row.creator_verified,

    dashboard_mode: row.dashboard_mode,
    custom_domain: row.custom_domain,

    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}

export async function createEventService({ userId, organizationId, payload }) {
  if (!userId) throw new AppError("Unauthorized", 401);
  if (!organizationId) throw new AppError("Organization is required", 400);

  validateCreatePayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);

    // ── Plan limit: free users can only have 1 event ──────────────────────────
    await assertCanCreateEvent(client, userId, organizationId);

    /* -------------------------------
         EVENT TYPE (SMART VALIDATION)
      --------------------------------*/

    const DEFAULT_EVENT_TYPES = [
      "wedding",
      "birthday",
      "funeral",
      "conference",
      "meeting",
      "church",
      "corporate",
      "other",
    ];

    function normalizeEventType(type) {
      if (!type) return "other";

      return String(type)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, " ");
    }

    function validateAndResolveEventType(type) {
      const normalized = normalizeEventType(type);

      if (!normalized || normalized.length < 3) {
        throw new AppError("event_type must be at least 3 characters", 400);
      }

      if (normalized.length > 50) {
        throw new AppError("event_type too long (max 50 chars)", 400);
      }

      // allow both default + custom
      return normalized;
    }

    const eventType = validateAndResolveEventType(payload.event_type);

    /* -------------------------------
         TIME CONVERSION
      --------------------------------*/

    const startsAtUTC = convertEventTimeToUTC(
      payload.starts_at,
      payload.timezone,
    );

    const endsAtUTC = convertEventTimeToUTC(payload.ends_at, payload.timezone);

    /* -------------------------------
         SLUG
      --------------------------------*/

    const slug = await generateUniqueEventSlug(client, payload.title);

    /* -------------------------------
         INSERT EVENT
      --------------------------------*/

    const result = await client.query(
      `
        INSERT INTO events (
          organization_id,
          created_by,
          event_type,
          title,
          slug,
          description,
          short_description,
          banner_url,
          cover_image_url,
          status,
          visibility,
          venue_name,
          venue_address,
          city,
          state,
          country,
          latitude,
          longitude,
          timezone,
          starts_at,
          ends_at,
          allow_rsvp,
          allow_plus_ones,
          allow_manual_attendance,
          allow_qr_checkin,
          allow_ticketing,
          allow_donations,
          require_creator_verification,
          creator_verified,
          dashboard_mode,
          custom_domain
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          'DRAFT',
          $10,$11,$12,$13,$14,$15,$16,$17,
          $18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28,$29,$30
        )
        RETURNING *
        `,
      [
        organizationId,
        userId,
        eventType, // ✅ FIXED
        payload.title.trim(),
        slug,
        payload.description ?? null,
        payload.short_description ?? null,
        payload.banner_url ?? null,
        payload.cover_image_url ?? null,
        payload.visibility ?? "PRIVATE",
        payload.venue_name ?? null,
        payload.venue_address ?? null,
        payload.city ?? null,
        payload.state ?? null,
        payload.country ?? null,
        payload.latitude ?? null,
        payload.longitude ?? null,

        payload.timezone,
        startsAtUTC,
        endsAtUTC ?? null,

        payload.allow_rsvp ?? true,
        payload.allow_plus_ones ?? false,
        payload.allow_manual_attendance ?? true,
        payload.allow_qr_checkin ?? false,
        payload.allow_ticketing ?? false,
        payload.allow_donations ?? false,
        payload.require_creator_verification ?? false,
        payload.creator_verified ?? false,
        payload.dashboard_mode ?? null,
        payload.custom_domain ?? null,
      ],
    );

    const event = result.rows[0];

    /* -------------------------------
         ADD EVENT OWNER
      --------------------------------*/

    await client.query(
      `
        INSERT INTO event_members (
          event_id,
          user_id,
          role,
          joined_at
        )
        VALUES ($1,$2,'OWNER',NOW())
        `,
      [event.id, userId],
    );

    await client.query("COMMIT");

    return mapEvent(event);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * LIST EVENTS
 */
export async function listEventsService({ organizationId, query = {} }) {
  if (!organizationId) throw new AppError("Organization is required", 400);

  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const offset = (page - 1) * limit;

  const allowedSortFields = [
    "created_at",
    "updated_at",
    "starts_at",
    "ends_at",
    "title",
    "status",
  ];

  const sortBy = allowedSortFields.includes(query.sort_by)
    ? query.sort_by
    : "created_at";

  const sortOrder =
    String(query.sort_order || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

  const values = [organizationId];
  const where = [`organization_id = $1`, `deleted_at IS NULL`];

  if (query.status) {
    values.push(query.status);
    where.push(`status = $${values.length}`);
  }

  if (query.event_type) {
    values.push(query.event_type);
    where.push(`event_type = $${values.length}`);
  }

  if (query.visibility) {
    values.push(query.visibility);
    where.push(`visibility = $${values.length}`);
  }

  if (query.search) {
    values.push(`%${query.search}%`);
    where.push(
      `(title ILIKE $${values.length} OR COALESCE(description, '') ILIKE $${values.length})`,
    );
  }

  if (query.start_date) {
    values.push(query.start_date);
    where.push(`starts_at >= $${values.length}`);
  }

  if (query.end_date) {
    values.push(query.end_date);
    where.push(`ends_at <= $${values.length}`);
  }

  const whereClause = where.join(" AND ");

  const countResult = await db.query(
    `
    SELECT COUNT(*)::int AS total
    FROM events
    WHERE ${whereClause}
    `,
    values,
  );

  const dataResult = await db.query(
    `
    SELECT *
    FROM events
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
    `,
    [...values, limit, offset],
  );

  const total = countResult.rows[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: dataResult.rows.map(mapEvent),
    meta: {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    },
  };
}

/**
 * GET ONE EVENT
 */
export async function getEventByIdService({ eventId, organizationId }) {
  if (!eventId) throw new AppError("Event id is required", 400);
  if (!organizationId) throw new AppError("Organization is required", 400);

  const result = await db.query(
    `
    SELECT *
    FROM events
    WHERE id = $1
      AND organization_id = $2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [eventId, organizationId],
  );

  const event = result.rows[0];

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  return mapEvent(event);
}

export async function updateEventService({
  eventId,
  organizationId,
  userId,
  payload = {},
}) {
  if (!userId) throw new AppError("Unauthorized", 401);
  if (!eventId) throw new AppError("Event id is required", 400);
  if (!organizationId) throw new AppError("Organization is required", 400);

  validateUpdatePayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);

    const existing = await findEventById(client, eventId, organizationId);
    if (!existing) {
      throw new AppError("Event not found", 404);
    }

    /* -------------------------------
         EVENT TYPE (SMART VALIDATION)
      --------------------------------*/

    function normalizeEventType(type) {
      if (!type) return "other";

      return String(type)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, " ");
    }

    function validateAndResolveEventType(type) {
      const normalized = normalizeEventType(type);

      if (!normalized || normalized.length < 3) {
        throw new AppError("event_type must be at least 3 characters", 400);
      }

      if (normalized.length > 50) {
        throw new AppError("event_type too long (max 50 chars)", 400);
      }

      return normalized;
    }

    const eventType = payload.event_type
      ? validateAndResolveEventType(payload.event_type)
      : existing.event_type;

    /* -------------------------------
         TIME HANDLING (LOCAL → UTC)
      --------------------------------*/

    const startsAtUTC = payload.starts_at
      ? convertEventTimeToUTC(
          payload.starts_at,
          payload.timezone || existing.timezone,
        )
      : existing.starts_at;

    const endsAtUTC = payload.ends_at
      ? convertEventTimeToUTC(
          payload.ends_at,
          payload.timezone || existing.timezone,
        )
      : existing.ends_at;

    if (
      endsAtUTC &&
      startsAtUTC &&
      new Date(endsAtUTC) < new Date(startsAtUTC)
    ) {
      throw new AppError("ends_at must be after or equal to starts_at", 400);
    }

    /* -------------------------------
         MERGE DATA
      --------------------------------*/

    const merged = {
      title: payload.title ?? existing.title,
      description: payload.description ?? existing.description,
      short_description:
        payload.short_description ?? existing.short_description,
      banner_url: payload.banner_url ?? existing.banner_url,
      cover_image_url: payload.cover_image_url ?? existing.cover_image_url,
      event_type: eventType,
      status: payload.status ?? existing.status,
      visibility: payload.visibility ?? existing.visibility,
      venue_name: payload.venue_name ?? existing.venue_name,
      venue_address: payload.venue_address ?? existing.venue_address,
      city: payload.city ?? existing.city,
      state: payload.state ?? existing.state,
      country: payload.country ?? existing.country,
      latitude: payload.latitude ?? existing.latitude,
      longitude: payload.longitude ?? existing.longitude,
      timezone: payload.timezone ?? existing.timezone,
      starts_at: startsAtUTC,
      ends_at: endsAtUTC,
      allow_rsvp: payload.allow_rsvp ?? existing.allow_rsvp,
      allow_plus_ones: payload.allow_plus_ones ?? existing.allow_plus_ones,
      allow_manual_attendance:
        payload.allow_manual_attendance ?? existing.allow_manual_attendance,
      allow_qr_checkin: payload.allow_qr_checkin ?? existing.allow_qr_checkin,
      allow_ticketing: payload.allow_ticketing ?? existing.allow_ticketing,
      allow_donations: payload.allow_donations ?? existing.allow_donations,
      require_creator_verification:
        payload.require_creator_verification ??
        existing.require_creator_verification,
      creator_verified: payload.creator_verified ?? existing.creator_verified,
      dashboard_mode: payload.dashboard_mode ?? existing.dashboard_mode,
      custom_domain: payload.custom_domain ?? existing.custom_domain,
    };

    /* -------------------------------
         SLUG UPDATE (ONLY IF TITLE CHANGED)
      --------------------------------*/

    let slug = existing.slug;

    if (
      payload.title &&
      payload.title.trim() &&
      payload.title.trim() !== existing.title
    ) {
      slug = await generateUniqueEventSlug(client, payload.title);
    }

    /* -------------------------------
         UPDATE QUERY
      --------------------------------*/

    const result = await client.query(
      `
        UPDATE events
        SET
          event_type = $1,
          title = $2,
          slug = $3,
          description = $4,
          short_description = $5,
          banner_url = $6,
          cover_image_url = $7,
          status = $8,
          visibility = $9,
          venue_name = $10,
          venue_address = $11,
          city = $12,
          state = $13,
          country = $14,
          latitude = $15,
          longitude = $16,
          timezone = $17,
          starts_at = $18,
          ends_at = $19,
          allow_rsvp = $20,
          allow_plus_ones = $21,
          allow_manual_attendance = $22,
          allow_qr_checkin = $23,
          allow_ticketing = $24,
          allow_donations = $25,
          require_creator_verification = $26,
          creator_verified = $27,
          dashboard_mode = $28,
          custom_domain = $29,
          updated_at = NOW()
        WHERE id = $30
          AND organization_id = $31
          AND deleted_at IS NULL
        RETURNING *
        `,
      [
        merged.event_type,
        merged.title,
        slug,
        merged.description,
        merged.short_description,
        merged.banner_url,
        merged.cover_image_url,
        merged.status,
        merged.visibility,
        merged.venue_name,
        merged.venue_address,
        merged.city,
        merged.state,
        merged.country,
        merged.latitude,
        merged.longitude,
        merged.timezone,
        merged.starts_at,
        merged.ends_at,
        merged.allow_rsvp,
        merged.allow_plus_ones,
        merged.allow_manual_attendance,
        merged.allow_qr_checkin,
        merged.allow_ticketing,
        merged.allow_donations,
        merged.require_creator_verification,
        merged.creator_verified,
        merged.dashboard_mode,
        merged.custom_domain,
        eventId,
        organizationId,
      ],
    );

    await client.query("COMMIT");

    return mapEvent(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
/**
 * SOFT DELETE EVENT
 */
export async function deleteEventService({ eventId, organizationId, userId }) {
  if (!userId) throw new AppError("Unauthorized", 401);
  if (!eventId) throw new AppError("Event id is required", 400);
  if (!organizationId) throw new AppError("Organization is required", 400);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);

    const result = await client.query(
      `
      UPDATE events
      SET
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
        AND organization_id = $2
        AND deleted_at IS NULL
      RETURNING id
      `,
      [eventId, organizationId],
    );

    if (result.rowCount === 0) {
      throw new AppError("Event not found", 404);
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * PUBLISH EVENT
 */
export async function publishEventService({ eventId, organizationId, userId }) {
  if (!userId) throw new AppError("Unauthorized", 401);
  if (!eventId) throw new AppError("Event id is required", 400);
  if (!organizationId) throw new AppError("Organization is required", 400);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);

    const event = await findEventById(client, eventId, organizationId);
    if (!event) throw new AppError("Event not found", 404);

    if (event.status === "PUBLISHED") {
      throw new AppError("Event is already published", 400);
    }

    const result = await client.query(
      `
      UPDATE events
      SET
        status = 'PUBLISHED',
        updated_at = NOW()
      WHERE id = $1
        AND organization_id = $2
        AND deleted_at IS NULL
      RETURNING *
      `,
      [eventId, organizationId],
    );

    await client.query("COMMIT");
    return mapEvent(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * UNPUBLISH EVENT
 */
export async function unpublishEventService({
  eventId,
  organizationId,
  userId,
}) {
  if (!userId) throw new AppError("Unauthorized", 401);
  if (!eventId) throw new AppError("Event id is required", 400);
  if (!organizationId) throw new AppError("Organization is required", 400);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);

    const event = await findEventById(client, eventId, organizationId);
    if (!event) throw new AppError("Event not found", 404);

    const result = await client.query(
      `
      UPDATE events
      SET
        status = 'DRAFT',
        updated_at = NOW()
      WHERE id = $1
        AND organization_id = $2
        AND deleted_at IS NULL
      RETURNING *
      `,
      [eventId, organizationId],
    );

    await client.query("COMMIT");
    return mapEvent(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * CANCEL EVENT
 */
export async function cancelEventService({ eventId, organizationId, userId }) {
  if (!userId) throw new AppError("Unauthorized", 401);
  if (!eventId) throw new AppError("Event id is required", 400);
  if (!organizationId) throw new AppError("Organization is required", 400);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);

    const event = await findEventById(client, eventId, organizationId);
    if (!event) throw new AppError("Event not found", 404);

    if (event.status === "CANCELLED") {
      throw new AppError("Event is already cancelled", 400);
    }

    const result = await client.query(
      `
      UPDATE events
      SET
        status = 'CANCELLED',
        updated_at = NOW()
      WHERE id = $1
        AND organization_id = $2
        AND deleted_at IS NULL
      RETURNING *
      `,
      [eventId, organizationId],
    );

    await client.query("COMMIT");
    return mapEvent(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * RESTORE EVENT
 * restores soft-deleted event
 */
export async function restoreEventService({ eventId, organizationId, userId }) {
  if (!userId) throw new AppError("Unauthorized", 401);
  if (!eventId) throw new AppError("Event id is required", 400);
  if (!organizationId) throw new AppError("Organization is required", 400);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);

    const event = await findEventById(client, eventId, organizationId, {
      includeDeleted: true,
    });

    if (!event) throw new AppError("Event not found", 404);

    const result = await client.query(
      `
      UPDATE events
      SET
        deleted_at = NULL,
        updated_at = NOW()
      WHERE id = $1
        AND organization_id = $2
      RETURNING *
      `,
      [eventId, organizationId],
    );

    await client.query("COMMIT");
    return mapEvent(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * DUPLICATE EVENT
 */
export async function duplicateEventService({
  eventId,
  organizationId,
  userId,
}) {
  if (!userId) throw new AppError("Unauthorized", 401);
  if (!eventId) throw new AppError("Event id is required", 400);
  if (!organizationId) throw new AppError("Organization is required", 400);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);

    const event = await findEventById(client, eventId, organizationId);
    if (!event) throw new AppError("Event not found", 404);

    const slug = await generateUniqueEventSlug(client, `${event.title}-copy`);

    const result = await client.query(
      `
      INSERT INTO events (
        organization_id,
        created_by,
        event_type,
        title,
        slug,
        description,
        short_description,
        banner_url,
        cover_image_url,
        status,
        visibility,
        venue_name,
        venue_address,
        city,
        state,
        country,
        latitude,
        longitude,
        timezone,
        starts_at,
        ends_at,
        allow_rsvp,
        allow_plus_ones,
        allow_manual_attendance,
        allow_qr_checkin,
        allow_ticketing,
        allow_donations,
        require_creator_verification,
        creator_verified,
        dashboard_mode,
        custom_domain
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        'DRAFT',
        $10,$11,$12,$13,$14,$15,$16,$17,
        $18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30
      )
      RETURNING *
      `,
      [
        organizationId,
        userId,
        event.event_type,
        `${event.title} Copy`,
        slug,
        event.description,
        event.short_description,
        event.banner_url,
        event.cover_image_url,
        event.visibility,
        event.venue_name,
        event.venue_address,
        event.city,
        event.state,
        event.country,
        event.latitude,
        event.longitude,
        event.timezone,
        event.starts_at,
        event.ends_at,
        event.allow_rsvp,
        event.allow_plus_ones,
        event.allow_manual_attendance,
        event.allow_qr_checkin,
        event.allow_ticketing,
        event.allow_donations,
        event.require_creator_verification,
        event.creator_verified,
        event.dashboard_mode,
        event.custom_domain,
      ],
    );

    await client.query("COMMIT");
    return mapEvent(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * EVENT DASHBOARD
 */
export async function getEventDashboardService({ eventId, organizationId }) {
  if (!eventId) throw new AppError("Event id is required", 400);
  if (!organizationId) throw new AppError("Organization is required", 400);

  const client = await db.connect();

  try {
    const event = await findEventById(client, eventId, organizationId);
    if (!event) throw new AppError("Event not found", 404);

    const [
      guestCountResult,
      attendingCountResult,
      ticketCountResult,
      checkinCountResult,
    ] = await Promise.all([
      client
        .query(
          `
          SELECT COUNT(*)::int AS total
          FROM guests
          WHERE event_id = $1
            AND deleted_at IS NULL
          `,
          [eventId],
        )
        .catch(() => ({ rows: [{ total: 0 }] })),

      client
        .query(
          `
          SELECT COUNT(*)::int AS total
          FROM guest_rsvps
          WHERE event_id = $1
            AND LOWER(status) = 'attending'
          `,
          [eventId],
        )
        .catch(() => ({ rows: [{ total: 0 }] })),

      client
        .query(
          `
          SELECT COUNT(*)::int AS total
          FROM issued_tickets
          WHERE event_id = $1
          `,
          [eventId],
        )
        .catch(() => ({ rows: [{ total: 0 }] })),

      client
        .query(
          `
          SELECT COUNT(*)::int AS total
          FROM qr_checkins
          WHERE event_id = $1
          `,
          [eventId],
        )
        .catch(() => ({ rows: [{ total: 0 }] })),
    ]);

    return {
      event: mapEvent(event),
      stats: {
        guest_count: guestCountResult.rows[0]?.total || 0,
        attending_count: attendingCountResult.rows[0]?.total || 0,
        ticket_count: ticketCountResult.rows[0]?.total || 0,
        checkin_count: checkinCountResult.rows[0]?.total || 0,
      },
    };
  } finally {
    client.release();
  }
}

/**
 * PUBLIC EVENT BY SLUG
 */
export async function getPublicEventBySlugService({ slug }) {
  if (!slug) throw new AppError("Slug is required", 400);

  const result = await db.query(
    `
    SELECT *
    FROM events
    WHERE slug = $1
      AND deleted_at IS NULL
      AND status = 'PUBLISHED'
      AND visibility = 'PUBLIC'
    LIMIT 1
    `,
    [slug],
  );

  const event = result.rows[0];

  if (!event) {
    throw new AppError("Public event not found", 404);
  }

  return mapEvent(event);
}
export async function canManageEvent(userId, eventId) {
  const { rows } = await db.query(
    `
      SELECT role
      FROM event_members
      WHERE user_id=$1
      AND event_id=$2
      AND deleted_at IS NULL
      `,
    [userId, eventId],
  );

  if (!rows.length) return false;

  const role = rows[0].role;

  return ["OWNER", "ADMIN", "MANAGER"].includes(role);
}
