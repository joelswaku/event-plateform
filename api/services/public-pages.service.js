import { db } from "../config/db.js";

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function getPublicEventPageBySlugService({ slug }) {
  const client = await db.connect();

  try {
    const eventRes = await client.query(
      `
      SELECT e.*
      FROM events e
      INNER JOIN event_pages ep ON ep.event_id = e.id
      WHERE e.slug = $1
        AND e.deleted_at IS NULL
        AND ep.page_status = 'PUBLISHED'
      LIMIT 1
      `,
      [slug]
    );

    const event = eventRes.rows[0];

    if (!event) {
      throw new AppError("Public event not found or page not published", 404);
    }

    const [pageRes, sectionsRes, mediaRes, settingsRes, scheduleRes, speakersRes] =
      await Promise.all([
        client.query(
          `
          SELECT *
          FROM event_pages
          WHERE event_id = $1
          LIMIT 1
          `,
          [event.id]
        ),
        client.query(
          `
          SELECT *
          FROM event_page_sections
          WHERE event_id = $1
            AND deleted_at IS NULL
            AND is_visible = true
          ORDER BY position_order ASC, created_at ASC
          `,
          [event.id]
        ),
        client.query(
          `
          SELECT *
          FROM event_media
          WHERE event_id = $1
            AND deleted_at IS NULL
            AND is_public = true
          ORDER BY created_at DESC
          `,
          [event.id]
        ),
        client.query(
          `
          SELECT *
          FROM event_settings
          WHERE event_id = $1
          LIMIT 1
          `,
          [event.id]
        ),
        client.query(
          `
          SELECT *
          FROM event_schedule_items
          WHERE event_id = $1
            AND deleted_at IS NULL
          ORDER BY position_order ASC, starts_at ASC
          `,
          [event.id]
        ),
        client.query(
          `
          SELECT *
          FROM event_speakers
          WHERE event_id = $1
            AND deleted_at IS NULL
          ORDER BY created_at ASC
          `,
          [event.id]
        ),
      ]);

    return {
      event,
      page: pageRes.rows[0] || null,
      sections: sectionsRes.rows,
      media: mediaRes.rows,
      settings: settingsRes.rows[0] || null,
      schedule_items: scheduleRes.rows,
      speakers: speakersRes.rows,
     
    };
  } finally {
    client.release();
  }
}