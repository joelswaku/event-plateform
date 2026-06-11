/**
 * Broadcast Notification Service
 *
 * Allows super-admins to create, schedule, and send platform-wide
 * push notifications to targeted user segments.
 *
 * Auto-creates the `broadcast_notifications` table on first use.
 */

import { db } from "../config/db.js";
import { sendPushToUsers } from "./push.service.js";

// ─── Table bootstrap ──────────────────────────────────────────────────────────

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS broadcast_notifications (
      id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
      title        TEXT        NOT NULL,
      body         TEXT        NOT NULL,
      image_url    TEXT,
      deep_link    TEXT,
      audience     TEXT        NOT NULL DEFAULT 'all',
      status       TEXT        NOT NULL DEFAULT 'draft',
      scheduled_at TIMESTAMPTZ,
      sent_at      TIMESTAMPTZ,
      sent_count   INT         DEFAULT 0,
      created_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// ─── Audience resolver ────────────────────────────────────────────────────────
// Returns user IDs matching the requested audience segment.

async function resolveAudienceUserIds(audience) {
  let sql;

  switch (audience) {
    case "all":
      sql = `SELECT DISTINCT user_id FROM push_tokens`;
      break;
    case "organizers":
      // Users who have created at least one event
      sql = `
        SELECT DISTINCT pt.user_id
        FROM   push_tokens pt
        JOIN   events e ON e.created_by = pt.user_id AND e.deleted_at IS NULL
      `;
      break;
    case "attendees":
      // Users who have bought a ticket
      sql = `
        SELECT DISTINCT pt.user_id
        FROM   push_tokens pt
        JOIN   ticket_issuances ti ON ti.attendee_id = pt.user_id
      `;
      break;
    case "vendors":
      // Users who have a vendor portal entry
      sql = `
        SELECT DISTINCT pt.user_id
        FROM   push_tokens pt
        JOIN   vendors v ON v.created_by = pt.user_id
      `;
      break;
    case "premium":
      // Users on a paid subscription plan
      sql = `
        SELECT DISTINCT pt.user_id
        FROM   push_tokens pt
        JOIN   subscriptions s ON s.user_id = pt.user_id
          AND  s.status = 'active'
          AND  s.plan IN ('starter', 'pro', 'enterprise')
      `;
      break;
    default:
      // Fallback: everyone
      sql = `SELECT DISTINCT user_id FROM push_tokens`;
  }

  try {
    const res = await db.query(sql);
    return res.rows.map((r) => r.user_id);
  } catch {
    // Table might not exist yet for some segments — return empty
    return [];
  }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listBroadcasts({ limit = 20, offset = 0, status } = {}) {
  await ensureTable();

  const params  = [];
  const clauses = [];

  if (status) {
    params.push(status);
    clauses.push(`status = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const [rows, total] = await Promise.all([
    db.query(
      `SELECT b.*, u.full_name AS created_by_name
       FROM   broadcast_notifications b
       LEFT JOIN users u ON u.id = b.created_by
       ${where}
       ORDER BY created_at DESC
       LIMIT  $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    db.query(
      `SELECT COUNT(*) FROM broadcast_notifications ${where}`,
      params,
    ),
  ]);

  return {
    broadcasts: rows.rows,
    total:      parseInt(total.rows[0].count, 10),
  };
}

export async function getBroadcast(id) {
  await ensureTable();
  const res = await db.query(
    `SELECT b.*, u.full_name AS created_by_name
     FROM   broadcast_notifications b
     LEFT JOIN users u ON u.id = b.created_by
     WHERE  b.id = $1`,
    [id],
  );
  return res.rows[0] ?? null;
}

export async function createBroadcast({
  title, body, image_url = null, deep_link = null,
  audience = "all", scheduled_at = null, createdBy,
}) {
  await ensureTable();

  const status = scheduled_at ? "scheduled" : "draft";

  const res = await db.query(
    `INSERT INTO broadcast_notifications
       (title, body, image_url, deep_link, audience, status, scheduled_at, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [title, body, image_url, deep_link, audience, status, scheduled_at, createdBy],
  );
  return res.rows[0];
}

export async function updateBroadcast(id, updates) {
  await ensureTable();

  const allowed = ["title", "body", "image_url", "deep_link", "audience", "scheduled_at", "status"];
  const sets    = [];
  const params  = [];

  for (const key of allowed) {
    if (key in updates) {
      params.push(updates[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }

  if (!sets.length) return getBroadcast(id);

  params.push(new Date().toISOString(), id);
  sets.push(`updated_at = $${params.length - 1}`);

  const res = await db.query(
    `UPDATE broadcast_notifications SET ${sets.join(",")} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return res.rows[0] ?? null;
}

export async function deleteBroadcast(id) {
  await ensureTable();
  await db.query(`DELETE FROM broadcast_notifications WHERE id = $1`, [id]);
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export async function sendBroadcast(id) {
  await ensureTable();

  const broadcast = await getBroadcast(id);
  if (!broadcast)                      throw Object.assign(new Error("Broadcast not found"),     { statusCode: 404 });
  if (broadcast.status === "sent")     throw Object.assign(new Error("Already sent"),            { statusCode: 409 });
  if (broadcast.status === "sending")  throw Object.assign(new Error("Already in progress"),     { statusCode: 409 });

  // Mark as sending
  await db.query(
    `UPDATE broadcast_notifications SET status = 'sending', updated_at = NOW() WHERE id = $1`,
    [id],
  );

  try {
    const userIds = await resolveAudienceUserIds(broadcast.audience);

    const payload = {
      title: broadcast.title,
      body:  broadcast.body,
      data: {
        type:     "broadcast",
        broadcastId: id,
        route:    broadcast.deep_link || "/(tabs)",
      },
      ...(broadcast.image_url && { image: broadcast.image_url }),
    };

    await sendPushToUsers(userIds, payload);

    await db.query(
      `UPDATE broadcast_notifications
       SET status = 'sent', sent_at = NOW(), sent_count = $1, updated_at = NOW()
       WHERE id = $2`,
      [userIds.length, id],
    );

    return { success: true, sent_count: userIds.length };
  } catch (err) {
    await db.query(
      `UPDATE broadcast_notifications SET status = 'failed', updated_at = NOW() WHERE id = $1`,
      [id],
    );
    throw err;
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getBroadcastStats() {
  await ensureTable();

  const [totals, byAudience, recent] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*)                                         AS total,
        COUNT(*) FILTER (WHERE status = 'sent')          AS sent,
        COUNT(*) FILTER (WHERE status = 'scheduled')     AS scheduled,
        COUNT(*) FILTER (WHERE status = 'draft')         AS draft,
        COALESCE(SUM(sent_count), 0)                     AS total_delivered
      FROM broadcast_notifications
    `),
    db.query(`
      SELECT audience, COUNT(*) AS count
      FROM   broadcast_notifications
      WHERE  status = 'sent'
      GROUP  BY audience
      ORDER  BY count DESC
    `),
    db.query(`
      SELECT title, audience, sent_count, sent_at
      FROM   broadcast_notifications
      WHERE  status = 'sent'
      ORDER  BY sent_at DESC
      LIMIT  5
    `),
  ]);

  return {
    totals:     totals.rows[0],
    byAudience: byAudience.rows,
    recentSent: recent.rows,
  };
}

// ─── Scheduler (poll-based — runs in-process) ─────────────────────────────────
// For production use a proper job queue (BullMQ, pg-boss, etc.).
// This lightweight version polls every 60 s and fires due broadcasts.

let schedulerStarted = false;

export function startBroadcastScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  async function tick() {
    try {
      const res = await db.query(`
        SELECT id FROM broadcast_notifications
        WHERE  status = 'scheduled'
          AND  scheduled_at <= NOW()
        LIMIT  10
      `).catch(() => ({ rows: [] }));

      for (const { id } of res.rows) {
        sendBroadcast(id).catch((e) =>
          console.error(`[broadcast-scheduler] failed to send ${id}:`, e.message),
        );
      }
    } catch {
      // Non-fatal — scheduler keeps running
    }
  }

  setInterval(tick, 60_000); // poll every minute
  tick(); // run immediately on startup
}
