import crypto from "crypto";
import { db } from "../config/db.js";

export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/* =========================
   CONSTANTS
========================= */

// export const SECTION_TEMPLATES = {
//   HERO: {
//     section_type: "HERO",
//     title: "Welcome to our event",
//     body: "Add your event subtitle here",
//     config: {
//       headline_align: "center",
//       show_cta: true,
//       cta_text: "RSVP Now",
//       background_style: "image",
//       overlay_opacity: 40,
//     },
//   },
//   FAQ: {
//     section_type: "FAQ",
//     title: "Frequently Asked Questions",
//     body: null,
//     config: {
//       items: [
//         {
//           question: "What time does it start?",
//           answer: "Add answer here",
//         },
//       ],
//     },
//   },
//   GALLERY: {
//     section_type: "GALLERY",
//     title: "Gallery",
//     body: null,
//     config: {
//       layout: "grid",
//       media_ids: [],
//     },
//   },
//   ABOUT: {
//     section_type: "ABOUT",
//     title: "About this event",
//     body: "Tell guests about this event.",
//     config: {},
//   },
//   CTA: {
//     section_type: "CTA",
//     title: "Join us",
//     body: "Reserve your place today.",
//     config: {
//       button_text: "Get Started",
//       button_url: null,
//     },
//   },
//   SCHEDULE: {
//     section_type: "SCHEDULE",
//     title: "Schedule",
//     body: null,
//     config: {
//       source: "event_schedule_items",
//     },
//   },
//   SPEAKERS: {
//     section_type: "SPEAKERS",
//     title: "Speakers",
//     body: null,
//     config: {
//       source: "event_speakers",
//     },
//   },
// };
export const SECTION_TEMPLATES = {
  HERO: {
    section_type: "HERO",
    title: "Welcome to our event",
    body: "Add your event subtitle here",
    config: {
      headline_align: "center",
      show_cta: true,
      cta_text: "Join Now",
      background_style: "image",
      overlay_opacity: 40,
    },
  },

  ABOUT: {
    section_type: "ABOUT",
    title: "About this event",
    body: "Tell guests about this event.",
    config: {},
  },

  STORY: {
    section_type: "STORY",
    title: "Our Story",
    body: "Share the story behind this event.",
    config: {
      layout: "split",
      image_position: "left",
    },
  },

  COUPLE: {
    section_type: "COUPLE",
    title: "Meet the Couple",
    body: "Introduce the hosts or couple.",
    config: {
      bride_label: "Bride",
      groom_label: "Groom",
    },
  },

  COUNTDOWN: {
    section_type: "COUNTDOWN",
    title: "Countdown",
    body: "We can’t wait to celebrate with you.",
    config: {
      show_days: true,
      show_hours: true,
      show_minutes: true,
    },
  },

  VENUE: {
    section_type: "VENUE",
    title: "Venue & Directions",
    body: "Add venue details and directions.",
    config: {
      show_map: true,
      show_parking: true,
    },
  },

  REGISTRY: {
    section_type: "REGISTRY",
    title: "Registry",
    body: "Share your registry links here.",
    config: {
      items: [],
    },
  },

  GALLERY: {
    section_type: "GALLERY",
    title: "Gallery",
    body: null,
    config: {
      layout: "grid",
      media_ids: [],
    },
  },

  FAQ: {
    section_type: "FAQ",
    title: "Frequently Asked Questions",
    body: null,
    config: {
      items: [
        {
          question: "What time does it start?",
          answer: "Add answer here",
        },
      ],
    },
  },

  CTA: {
    section_type: "CTA",
    title: "Join us",
    body: "Reserve your place today.",
    config: {
      button_text: "Get Started",
      button_url: null,
    },
  },

  SCHEDULE: {
    section_type: "SCHEDULE",
    title: "Schedule",
    body: null,
    config: {
      source: "event_schedule_items",
    },
  },

  SPEAKERS: {
    section_type: "SPEAKERS",
    title: "Speakers",
    body: null,
    config: {
      source: "event_speakers",
    },
  },

  DONATIONS: {
    section_type: "DONATIONS",
    title: "Support This Event",
    body: "Contribute or donate here.",
    config: {
      button_text: "Donate",
    },
  },

  TICKETS: {
    section_type: "TICKETS",
    title: "Tickets",
    body: "Reserve your place now.",
    config: {
      source: "ticket_types",
    },
  },

  RSVP: {
    section_type: "RSVP",
    title: "RSVP",
    body: "Let us know if you can make it.",
    config: {
      show_dietary: true,
      show_plus_one: true,
      deadline: null,
    },
  },
};
/* =========================
   NORMALIZERS
========================= */

function normalizeText(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v || null;
}

function normalizeSectionType(value) {
  if (!value) return null;
  return String(value).trim().toUpperCase().replace(/\s+/g, "_");
}

function ensureObject(value, fieldName) {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an object`, 400);
  }
  return value;
}

function ensureNonNegativeInteger(value, fieldName) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new AppError(`${fieldName} must be a non-negative integer`, 400);
  }
  return n;
}

function ensureValidDate(value, fieldName) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400);
  }
  return d;
}

function buildDefaultPublicUrl(event) {
  return `/events/${event.slug}`;
}

/* =========================
   ASSERTIONS
========================= */

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
    throw new AppError("You do not belong to this organization", 403);
  }

  const role = String(result.rows[0].role).toUpperCase();
  const allowedRoles = ["OWNER", "ADMIN", "MANAGER", "EVENT_MANAGER", "EDITOR"];

  if (!allowedRoles.includes(role)) {
    throw new AppError("You do not have permission to edit event content", 403);
  }

  return result.rows[0];
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

async function assertSectionExists(client, sectionId, eventId) {
  const result = await client.query(
    `
    SELECT *
    FROM event_page_sections
    WHERE id = $1
      AND event_id = $2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [sectionId, eventId]
  );

  if (!result.rows[0]) {
    throw new AppError("Section not found", 404);
  }

  return result.rows[0];
}

async function getOrCreateEventPage(client, event) {
  const existing = await client.query(
    `
    SELECT *
    FROM event_pages
    WHERE event_id = $1
    LIMIT 1
    `,
    [event.id]
  );

  if (existing.rows[0]) return existing.rows[0];

  const previewToken = crypto.randomBytes(24).toString("hex");

  const inserted = await client.query(
    `
    INSERT INTO event_pages
    (
      event_id,
      public_url,
      seo_title,
      seo_description,
      page_status,
      preview_token,
      draft_updated_at,
      published_at,
      created_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,'DRAFT',$5,NOW(),NULL,NOW(),NOW())
    RETURNING *
    `,
    [
      event.id,
      buildDefaultPublicUrl(event),
      event.title,
      event.short_description ?? event.description ?? null,
      previewToken,
    ]
  );

  return inserted.rows[0];
}

/* =========================
   VALIDATION
========================= */

function validatePagePayload(payload = {}) {
  if (
    payload.public_url !== undefined &&
    payload.public_url !== null &&
    !String(payload.public_url).trim()
  ) {
    throw new AppError("public_url cannot be empty", 400);
  }

  if (
    payload.seo_title !== undefined &&
    payload.seo_title !== null &&
    String(payload.seo_title).trim().length > 255
  ) {
    throw new AppError("seo_title too long (max 255 chars)", 400);
  }
}

function validateSectionPayload(payload = {}) {
  const errors = [];

  if (payload.template_key) {
    const key = String(payload.template_key).trim().toUpperCase();
    if (!SECTION_TEMPLATES[key]) {
      errors.push(`Invalid template_key. Allowed: ${Object.keys(SECTION_TEMPLATES).join(", ")}`);
    }
  } else {
    if (!normalizeSectionType(payload.section_type)) {
      errors.push("section_type is required");
    }
  }

  if (
    payload.position_order !== undefined &&
    (!Number.isInteger(Number(payload.position_order)) || Number(payload.position_order) < 0)
  ) {
    errors.push("position_order must be a non-negative integer");
  }

  if (payload.config !== undefined) {
    try {
      ensureObject(payload.config, "config");
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (errors.length) {
    throw new AppError("Validation failed", 400, errors);
  }
}

function validateSchedulePayload(payload = {}) {
  const errors = [];

  if (!normalizeText(payload.title)) errors.push("title is required");
  if (!payload.starts_at) errors.push("starts_at is required");

  if (payload.starts_at) {
    try {
      ensureValidDate(payload.starts_at, "starts_at");
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (payload.ends_at) {
    try {
      ensureValidDate(payload.ends_at, "ends_at");
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (payload.starts_at && payload.ends_at) {
    const startsAt = new Date(payload.starts_at);
    const endsAt = new Date(payload.ends_at);
    if (endsAt < startsAt) {
      errors.push("ends_at must be after or equal to starts_at");
    }
  }

  if (
    payload.position_order !== undefined &&
    (!Number.isInteger(Number(payload.position_order)) || Number(payload.position_order) < 0)
  ) {
    errors.push("position_order must be a non-negative integer");
  }

  if (errors.length) {
    throw new AppError("Validation failed", 400, errors);
  }
}

function validateSpeakerPayload(payload = {}) {
  if (!normalizeText(payload.full_name)) {
    throw new AppError("full_name is required", 400);
  }

  if (payload.social_links !== undefined) {
    ensureObject(payload.social_links, "social_links");
  }
}

function validateMediaPayload(payload = {}) {
  const errors = [];

  if (!normalizeText(payload.media_type)) errors.push("media_type is required");
  if (!normalizeText(payload.file_url)) errors.push("file_url is required");

  if (payload.file_size !== undefined && payload.file_size !== null) {
    const n = Number(payload.file_size);
    if (!Number.isInteger(n) || n < 0) {
      errors.push("file_size must be a non-negative integer");
    }
  }

  if (errors.length) {
    throw new AppError("Validation failed", 400, errors);
  }
}

function validateThemePayload(payload = {}) {
  if (!normalizeText(payload.theme_name)) {
    throw new AppError("theme_name is required", 400);
  }
}

/* =========================
   MAPPERS
========================= */

function mapPage(row) {
  if (!row) return null;

  return {
    id: row.id,
    event_id: row.event_id,
    public_url: row.public_url,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    page_status: row.page_status,
    preview_token: row.preview_token,
    draft_updated_at: row.draft_updated_at,
    published_at: row.published_at,
    is_published: Boolean(row.published_at),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapSection(row) {
  return {
    id: row.id,
    event_id: row.event_id,
    section_type: row.section_type,
    title: row.title,
    body: row.body,
    position_order: row.position_order,
    is_visible: row.is_visible,
    config: row.config,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}

/* =========================
   BUILDER OVERVIEW
========================= */

export async function getEventBuilderService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    const event = await assertEventExists(client, eventId, organizationId);
    const page = await getOrCreateEventPage(client, event);

    const [
      settingsResult,
      sectionsResult,
      scheduleResult,
      speakersResult,
      mediaResult,
    ] = await Promise.all([
      client.query(
        `
        SELECT *
        FROM event_settings
        WHERE event_id = $1
        LIMIT 1
        `,
        [eventId]
      ),
      client.query(
        `
        SELECT *
        FROM event_page_sections
        WHERE event_id = $1
          AND deleted_at IS NULL
        ORDER BY position_order ASC, created_at ASC
        `,
        [eventId]
      ),
      client.query(
        `
        SELECT *
        FROM event_schedule_items
        WHERE event_id = $1
          AND deleted_at IS NULL
        ORDER BY position_order ASC, starts_at ASC
        `,
        [eventId]
      ),
      client.query(
        `
        SELECT *
        FROM event_speakers
        WHERE event_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at ASC
        `,
        [eventId]
      ),
      client.query(
        `
        SELECT *
        FROM event_media
        WHERE event_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        `,
        [eventId]
      ),
    ]);

    return {
      event,
      page: mapPage(page),
      settings: settingsResult.rows[0] || null,
      sections: sectionsResult.rows.map(mapSection),
      schedule_items: scheduleResult.rows,
      speakers: speakersResult.rows,
      media: mediaResult.rows,
      templates: Object.keys(SECTION_TEMPLATES),
    };
  } finally {
    client.release();
  }
}

/* =========================
   PAGE
========================= */

export async function upsertEventPageService({
  eventId,
  organizationId,
  userId,
  payload = {},
}) {
  validatePagePayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    const event = await assertEventExists(client, eventId, organizationId);
    const page = await getOrCreateEventPage(client, event);

    const result = await client.query(
      `
      UPDATE event_pages
      SET
        public_url = $1,
        seo_title = $2,
        seo_description = $3,
        draft_updated_at = NOW(),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
      `,
      [
        normalizeText(payload.public_url) ?? page.public_url ?? buildDefaultPublicUrl(event),
        normalizeText(payload.seo_title),
        normalizeText(payload.seo_description),
        page.id,
      ]
    );

    await client.query("COMMIT");
    return mapPage(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/* =========================
   SECTIONS
========================= */

export async function createSectionService({
  eventId,
  organizationId,
  userId,
  payload = {},
}) {
  validateSectionPayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    let sectionData;

    if (payload.template_key) {
      const templateKey = String(payload.template_key).trim().toUpperCase();
      const template = SECTION_TEMPLATES[templateKey];
      if (!template) throw new AppError(`Unknown template_key: "${templateKey}"`, 400);

      const nextPositionResult = await client.query(
        `
        SELECT COALESCE(MAX(position_order), -1) + 1 AS next_position
        FROM event_page_sections
        WHERE event_id = $1
          AND deleted_at IS NULL
        `,
        [eventId]
      );

      sectionData = {
        section_type: template.section_type,
        title: payload.title ?? template.title,
        body: payload.body ?? template.body,
        position_order: payload.position_order ?? nextPositionResult.rows[0].next_position,
        config: {
          ...template.config,
          ...(payload.config || {}),
        },
        is_visible: payload.is_visible ?? true,
      };
    } else {
      const nextPositionResult = await client.query(
        `
        SELECT COALESCE(MAX(position_order), -1) + 1 AS next_position
        FROM event_page_sections
        WHERE event_id = $1
          AND deleted_at IS NULL
        `,
        [eventId]
      );

      sectionData = {
        section_type: normalizeSectionType(payload.section_type),
        title: normalizeText(payload.title),
        body: normalizeText(payload.body),
        position_order: payload.position_order ?? nextPositionResult.rows[0].next_position,
        config: ensureObject(payload.config, "config"),
        is_visible: payload.is_visible ?? true,
      };
    }

    const result = await client.query(
      `
      INSERT INTO event_page_sections
      (
        event_id,
        section_type,
        title,
        body,
        position_order,
        is_visible,
        config,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
      RETURNING *
      `,
      [
        eventId,
        sectionData.section_type,
        sectionData.title,
        sectionData.body,
        ensureNonNegativeInteger(sectionData.position_order, "position_order"),
        Boolean(sectionData.is_visible),
        sectionData.config ?? {},
      ]
    );

    await client.query(
      `
      UPDATE event_pages
      SET
        draft_updated_at = NOW(),
        updated_at = NOW()
      WHERE event_id = $1
      `,
      [eventId]
    );

    await client.query("COMMIT");
    return mapSection(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function replaceSectionsService({
  eventId,
  organizationId,
  userId,
  sections,
}) {
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new AppError("sections must be a non-empty array", 400);
  }
  if (sections.length > 20) {
    throw new AppError("Cannot create more than 20 sections at once", 400);
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    // Soft-delete all existing sections in one shot
    await client.query(
      `UPDATE event_page_sections
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE event_id = $1 AND deleted_at IS NULL`,
      [eventId]
    );

    const created = [];
    let pos = 0;

    for (const item of sections) {
      validateSectionPayload(item);

      let sectionData;
      if (item.template_key) {
        const key = String(item.template_key).trim().toUpperCase();
        const template = SECTION_TEMPLATES[key];
        if (!template) throw new AppError(`Unknown template_key: "${key}"`, 400);
        sectionData = {
          section_type: template.section_type,
          title: item.title ?? template.title,
          body: item.body ?? template.body,
          position_order: pos++,
          config: { ...template.config, ...(item.config || {}) },
          is_visible: item.is_visible ?? true,
        };
      } else {
        sectionData = {
          section_type: normalizeSectionType(item.section_type),
          title: normalizeText(item.title),
          body: normalizeText(item.body),
          position_order: pos++,
          config: ensureObject(item.config, "config"),
          is_visible: item.is_visible ?? true,
        };
      }

      const result = await client.query(
        `INSERT INTO event_page_sections
         (event_id, section_type, title, body, position_order, is_visible, config, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
         RETURNING *`,
        [
          eventId,
          sectionData.section_type,
          sectionData.title,
          sectionData.body,
          ensureNonNegativeInteger(sectionData.position_order, "position_order"),
          Boolean(sectionData.is_visible),
          sectionData.config ?? {},
        ]
      );
      created.push(mapSection(result.rows[0]));
    }

    await client.query(
      `UPDATE event_pages SET draft_updated_at = NOW(), updated_at = NOW() WHERE event_id = $1`,
      [eventId]
    );

    await client.query("COMMIT");
    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function batchCreateSectionsService({
  eventId,
  organizationId,
  userId,
  sections,
}) {
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new AppError("sections must be a non-empty array", 400);
  }
  if (sections.length > 20) {
    throw new AppError("Cannot create more than 20 sections at once", 400);
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const posResult = await client.query(
      `SELECT COALESCE(MAX(position_order), -1) + 1 AS next_pos
       FROM event_page_sections
       WHERE event_id = $1 AND deleted_at IS NULL`,
      [eventId]
    );
    let nextPos = posResult.rows[0].next_pos;

    const created = [];

    for (const item of sections) {
      validateSectionPayload(item);

      let sectionData;
      if (item.template_key) {
        const key = String(item.template_key).trim().toUpperCase();
        const template = SECTION_TEMPLATES[key];
        if (!template) throw new AppError(`Unknown template_key: "${key}"`, 400);
        sectionData = {
          section_type: template.section_type,
          title: item.title ?? template.title,
          body: item.body ?? template.body,
          position_order: nextPos++,
          config: { ...template.config, ...(item.config || {}) },
          is_visible: item.is_visible ?? true,
        };
      } else {
        sectionData = {
          section_type: normalizeSectionType(item.section_type),
          title: normalizeText(item.title),
          body: normalizeText(item.body),
          position_order: nextPos++,
          config: ensureObject(item.config, "config"),
          is_visible: item.is_visible ?? true,
        };
      }

      const result = await client.query(
        `INSERT INTO event_page_sections
         (event_id, section_type, title, body, position_order, is_visible, config, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
         RETURNING *`,
        [
          eventId,
          sectionData.section_type,
          sectionData.title,
          sectionData.body,
          ensureNonNegativeInteger(sectionData.position_order, "position_order"),
          Boolean(sectionData.is_visible),
          sectionData.config ?? {},
        ]
      );
      created.push(mapSection(result.rows[0]));
    }

    await client.query(
      `UPDATE event_pages SET draft_updated_at = NOW(), updated_at = NOW() WHERE event_id = $1`,
      [eventId]
    );

    await client.query("COMMIT");
    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateSectionService({
  eventId,
  sectionId,
  organizationId,
  userId,
  payload = {},
}) {
  if (payload.config !== undefined) {
    ensureObject(payload.config, "config");
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);
    const existing = await assertSectionExists(client, sectionId, eventId);

    const merged = {
      section_type:
        payload.section_type !== undefined
          ? normalizeSectionType(payload.section_type)
          : existing.section_type,
      title: payload.title !== undefined ? normalizeText(payload.title) : existing.title,
      body: payload.body !== undefined ? normalizeText(payload.body) : existing.body,
      position_order:
        payload.position_order !== undefined
          ? ensureNonNegativeInteger(payload.position_order, "position_order")
          : existing.position_order,
      is_visible:
        payload.is_visible !== undefined ? Boolean(payload.is_visible) : existing.is_visible,
      config:
        payload.config !== undefined ? ensureObject(payload.config, "config") : existing.config,
    };

    if (!merged.section_type) {
      throw new AppError("section_type is required", 400);
    }

    const result = await client.query(
      `
      UPDATE event_page_sections
      SET
        section_type = $1,
        title = $2,
        body = $3,
        position_order = $4,
        is_visible = $5,
        config = $6,
        updated_at = NOW()
      WHERE id = $7
        AND event_id = $8
        AND deleted_at IS NULL
      RETURNING *
      `,
      [
        merged.section_type,
        merged.title,
        merged.body,
        merged.position_order,
        merged.is_visible,
        merged.config,
        sectionId,
        eventId,
      ]
    );

    await client.query(
      `
      UPDATE event_pages
      SET
        draft_updated_at = NOW(),
        updated_at = NOW()
      WHERE event_id = $1
      `,
      [eventId]
    );

    await client.query("COMMIT");
    return mapSection(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteSectionService({
  eventId,
  sectionId,
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
      UPDATE event_page_sections
      SET
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
        AND event_id = $2
        AND deleted_at IS NULL
      RETURNING id
      `,
      [sectionId, eventId]
    );

    if (!result.rows[0]) {
      throw new AppError("Section not found", 404);
    }

    await client.query(
      `
      UPDATE event_pages
      SET
        draft_updated_at = NOW(),
        updated_at = NOW()
      WHERE event_id = $1
      `,
      [eventId]
    );

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function reorderSectionsService({
  eventId,
  organizationId,
  userId,
  payload = {},
}) {
  if (!Array.isArray(payload.sections) || payload.sections.length === 0) {
    throw new AppError("sections must be a non-empty array", 400);
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    for (const item of payload.sections) {
      if (!item?.id) {
        throw new AppError("Each section item must include id", 400);
      }

      ensureNonNegativeInteger(item.position_order, "position_order");

      const result = await client.query(
        `
        UPDATE event_page_sections
        SET
          position_order = $1,
          updated_at = NOW()
        WHERE id = $2
          AND event_id = $3
          AND deleted_at IS NULL
        RETURNING id
        `,
        [item.position_order, item.id, eventId]
      );

      if (!result.rows[0]) {
        throw new AppError(`Section not found: ${item.id}`, 404);
      }
    }

    await client.query(
      `
      UPDATE event_pages
      SET
        draft_updated_at = NOW(),
        updated_at = NOW()
      WHERE event_id = $1
      `,
      [eventId]
    );

    const refreshed = await client.query(
      `
      SELECT *
      FROM event_page_sections
      WHERE event_id = $1
        AND deleted_at IS NULL
      ORDER BY position_order ASC, created_at ASC
      `,
      [eventId]
    );

    await client.query("COMMIT");
    return refreshed.rows.map(mapSection);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/* =========================
   PUBLISH / UNPUBLISH
========================= */

export async function publishEventPageService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    const event = await assertEventExists(client, eventId, organizationId);
    const page = await getOrCreateEventPage(client, event);

    const visibleSectionsResult = await client.query(
      `
      SELECT COUNT(*)::int AS total
      FROM event_page_sections
      WHERE event_id = $1
        AND deleted_at IS NULL
        AND is_visible = true
      `,
      [eventId]
    );

    if (visibleSectionsResult.rows[0].total === 0) {
      throw new AppError("Cannot publish page without at least one visible section", 400);
    }

    const result = await client.query(
      `
      UPDATE event_pages
      SET
        page_status = 'PUBLISHED',
        published_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [page.id]
    );

    await client.query("COMMIT");
    return mapPage(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function unpublishEventPageService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    const event = await assertEventExists(client, eventId, organizationId);
    const page = await getOrCreateEventPage(client, event);

    const result = await client.query(
      `
      UPDATE event_pages
      SET
        page_status = 'DRAFT',
        published_at = NULL,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [page.id]
    );

    await client.query("COMMIT");
    return mapPage(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/* =========================
   PREVIEW
========================= */

export async function getPreviewEventPageService({
  eventId,
  organizationId,
  userId,
}) {
  return getEventBuilderService({
    eventId,
    organizationId,
    userId,
  });
}

/* =========================
   SCHEDULE
========================= */

export async function createScheduleItemService({
  eventId,
  organizationId,
  userId,
  payload = {},
}) {
  validateSchedulePayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      INSERT INTO event_schedule_items
      (
        event_id,
        title,
        description,
        starts_at,
        ends_at,
        location,
        position_order,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
      RETURNING *
      `,
      [
        eventId,
        normalizeText(payload.title),
        normalizeText(payload.description),
        payload.starts_at,
        payload.ends_at ?? null,
        normalizeText(payload.location),
        payload.position_order ?? 0,
      ]
    );

    await client.query(
      `
      UPDATE event_pages
      SET
        draft_updated_at = NOW(),
        updated_at = NOW()
      WHERE event_id = $1
      `,
      [eventId]
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
   SPEAKERS
========================= */

export async function createSpeakerService({
  eventId,
  organizationId,
  userId,
  payload = {},
}) {
  validateSpeakerPayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      INSERT INTO event_speakers
      (
        event_id,
        full_name,
        title,
        bio,
        avatar_url,
        social_links,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
      RETURNING *
      `,
      [
        eventId,
        normalizeText(payload.full_name),
        normalizeText(payload.title),
        normalizeText(payload.bio),
        normalizeText(payload.avatar_url),
        ensureObject(payload.social_links, "social_links"),
      ]
    );

    await client.query(
      `
      UPDATE event_pages
      SET
        draft_updated_at = NOW(),
        updated_at = NOW()
      WHERE event_id = $1
      `,
      [eventId]
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
   MEDIA
========================= */

export async function uploadEventMediaService({
  eventId,
  organizationId,
  userId,
  payload = {},
}) {
  validateMediaPayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      INSERT INTO event_media
      (
        event_id,
        uploaded_by,
        upload_id,
        media_type,
        file_url,
        file_name,
        mime_type,
        file_size,
        caption,
        is_public,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
      RETURNING *
      `,
      [
        eventId,
        userId ?? null,
        payload.upload_id ?? null,
        normalizeText(payload.media_type),
        normalizeText(payload.file_url),
        normalizeText(payload.file_name),
        normalizeText(payload.mime_type),
        payload.file_size ?? null,
        normalizeText(payload.caption),
        payload.is_public ?? true,
      ]
    );

    await client.query(
      `
      UPDATE event_pages
      SET
        draft_updated_at = NOW(),
        updated_at = NOW()
      WHERE event_id = $1
      `,
      [eventId]
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
   THEME SELECT
========================= */

export async function selectEventThemeService({
  eventId,
  organizationId,
  userId,
  payload = {},
}) {
  validateThemePayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      INSERT INTO event_settings
      (
        event_id,
        theme_name,
        primary_color,
        secondary_color,
        font_family,
        custom_settings,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
      ON CONFLICT (event_id)
      DO UPDATE SET
        theme_name = EXCLUDED.theme_name,
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        font_family = EXCLUDED.font_family,
        custom_settings = COALESCE(event_settings.custom_settings, '{}'::jsonb) || COALESCE(EXCLUDED.custom_settings, '{}'::jsonb),
        updated_at = NOW()
      RETURNING *
      `,
      [
        eventId,
        normalizeText(payload.theme_name),
        normalizeText(payload.primary_color),
        normalizeText(payload.secondary_color),
        normalizeText(payload.font_family),
        ensureObject(payload.custom_settings, "custom_settings"),
      ]
    );

    await client.query(
      `
      UPDATE event_pages
      SET
        draft_updated_at = NOW(),
        updated_at = NOW()
      WHERE event_id = $1
      `,
      [eventId]
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

