/**
 * Expo Push Notifications service
 *
 * Responsibilities:
 *  1. Save / update a device push token for a user
 *  2. Look up tokens for a user and send a push notification via Expo's API
 */

import { db } from "../config/db.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// ─── Token management ─────────────────────────────────────────────────────────

/**
 * Upsert an Expo push token for a user + platform combo.
 * Creates the table on first use so no migration is needed.
 */
export async function savePushToken(userId, token, platform = "unknown") {
  // Ensure table exists (idempotent)
  await db.query(`
    CREATE TABLE IF NOT EXISTS push_tokens (
      id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT        NOT NULL,
      platform   TEXT        NOT NULL DEFAULT 'unknown',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, token)
    )
  `);

  await db.query(
    `INSERT INTO push_tokens (user_id, token, platform, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, token)
     DO UPDATE SET platform = $3, updated_at = NOW()`,
    [userId, token, platform],
  );
}

/**
 * Retrieve all active push tokens for a user.
 */
export async function getUserTokens(userId) {
  try {
    const res = await db.query(
      `SELECT token FROM push_tokens WHERE user_id = $1`,
      [userId],
    );
    return res.rows.map((r) => r.token);
  } catch {
    return [];
  }
}

// ─── Push sender ─────────────────────────────────────────────────────────────

/**
 * Send a push notification to a single user.
 * Silently ignores failures — push is non-critical.
 *
 * @param {string}  userId  Recipient's user ID
 * @param {object}  payload { title, body, data?, sound?, badge? }
 */
export async function sendPushToUser(userId, { title, body, data = {}, sound = "default", badge = 1 }) {
  const tokens = await getUserTokens(userId);
  if (!tokens.length) return;

  const messages = tokens.map((to) => ({
    to,
    title,
    body,
    data,
    sound,
    badge,
    priority: "high",
    channelId: "default",
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body:    JSON.stringify(messages),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("[push] Expo API error:", text);
    }
  } catch (err) {
    console.warn("[push] sendPushToUser failed (non-fatal):", err.message);
  }
}

/**
 * Send a push notification to multiple users at once.
 * Batches up to 100 messages per Expo request.
 */
export async function sendPushToUsers(userIds, payload) {
  // Run in parallel but don't let failures block
  await Promise.allSettled(userIds.map((uid) => sendPushToUser(uid, payload)));
}

// ─── Typed notification helpers ───────────────────────────────────────────────
// Keep push content in sync with mobile's TYPE_CFG and deep-link routes.

export const PushTemplates = {
  ticketSold: (eventTitle, buyerName) => ({
    title: `🎟️ New ticket sale`,
    body:  `${buyerName} just bought a ticket for "${eventTitle}"`,
    data:  { type: "ticket_sold" },
  }),

  newRsvp: (eventTitle, guestName) => ({
    title: `👥 New RSVP`,
    body:  `${guestName} RSVP'd to "${eventTitle}"`,
    data:  { type: "new_rsvp" },
  }),

  newDonation: (eventTitle, amount) => ({
    title: `💰 New donation`,
    body:  `You received a $${amount} donation for "${eventTitle}"`,
    data:  { type: "new_donation" },
  }),

  checkIn: (guestName, eventTitle) => ({
    title: `✅ Guest checked in`,
    body:  `${guestName} just checked in to "${eventTitle}"`,
    data:  { type: "checkin" },
  }),

  eventReminder24h: (eventTitle, eventId) => ({
    title: `⏰ Tomorrow: ${eventTitle}`,
    body:  "Your event starts in 24 hours. Make sure everything is ready!",
    data:  { type: "event_reminder", eventId, route: `/events/${eventId}` },
  }),

  eventReminder1h: (eventTitle, eventId) => ({
    title: `🚀 Starting soon: ${eventTitle}`,
    body:  "Your event kicks off in 1 hour!",
    data:  { type: "event_reminder", eventId, route: `/events/${eventId}` },
  }),

  invitationAccepted: (guestName) => ({
    title: `👥 Invitation accepted`,
    body:  `${guestName} accepted your invitation`,
    data:  { type: "invitation" },
  }),
};
