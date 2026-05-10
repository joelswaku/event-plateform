import { db } from "../config/db.js";

/**
 * Internal helper — called by other services when notable things happen.
 * Never throws; notification failures must never break the main flow.
 */
export async function createNotificationService({
  userId,
  type,
  title,
  body = null,
  link = null,
  metadata = {},
}) {
  if (!userId || !type || !title) return;
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, body, link, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, body, link, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error("[notifications] createNotification failed (non-fatal):", err.message);
  }
}

/**
 * Fetch notifications for a user with unread count.
 */
export async function getNotificationsService(userId, { limit = 30, offset = 0 } = {}) {
  const safeLimit  = Math.min(Number(limit)  || 30, 50);
  const safeOffset = Math.max(Number(offset) || 0,  0);

  const [notifRes, countRes] = await Promise.all([
    db.query(
      `SELECT id, type, title, body, link, metadata, read_at, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, safeLimit, safeOffset]
    ),
    db.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    ),
  ]);

  return {
    notifications: notifRes.rows,
    unreadCount: parseInt(countRes.rows[0].count, 10),
  };
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationReadService(userId, notifId) {
  const res = await db.query(
    `UPDATE notifications
     SET read_at = NOW()
     WHERE id = $1 AND user_id = $2 AND read_at IS NULL
     RETURNING id`,
    [notifId, userId]
  );
  if (!res.rowCount) {
    throw Object.assign(new Error("Notification not found or already read"), { statusCode: 404 });
  }
  return { id: notifId };
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllReadService(userId) {
  const res = await db.query(
    `UPDATE notifications SET read_at = NOW()
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return { updated: res.rowCount };
}

/**
 * Get the user_id of the event owner (created_by).
 * Used internally by service triggers.
 */
export async function getEventOwnerIdService(eventId) {
  const res = await db.query(
    `SELECT created_by FROM events WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    [eventId]
  );
  return res.rows[0]?.created_by ?? null;
}
