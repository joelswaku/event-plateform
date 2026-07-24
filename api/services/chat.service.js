import { db }                from "../config/db.js";
import { publishToUsers }     from "../config/chat-sse.js";
import { sendPushToUser }     from "./push.service.js";

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT SERVICE
   Conversations + participants + messages, with real-time SSE delivery and
   push-notification fallback. Tables auto-create on first use (consistent with
   the legal-pages pattern in this codebase).

   Conversation kinds:
     - direct    : exactly 2 participants (deduped, order-independent)
     - group     : 3+ participants, optional event scope
     - event     : auto group scoped to an event (creator ↔ guests/members)
     - broadcast  : super-admin → many; replies route back as direct to admin
   ═══════════════════════════════════════════════════════════════════════════ */

let _ready = null;
async function ensureSchema() {
  if (_ready) return _ready;
  _ready = (async () => {
    const c = await db.connect();
    try {
      await c.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type                 VARCHAR(20)  NOT NULL DEFAULT 'direct',
          title                TEXT,
          event_id             UUID,
          created_by           UUID,
          direct_key           TEXT UNIQUE,            -- sorted "uidA:uidB" for direct dedupe
          last_message_at      TIMESTAMPTZ,
          last_message_preview TEXT,
          last_message_sender  UUID,
          created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS conversation_participants (
          id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          user_id         UUID NOT NULL,
          role            VARCHAR(20) NOT NULL DEFAULT 'member',  -- member | admin
          last_read_at    TIMESTAMPTZ,
          muted           BOOLEAN NOT NULL DEFAULT FALSE,
          archived        BOOLEAN NOT NULL DEFAULT FALSE,
          joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          deleted_at      TIMESTAMPTZ,
          UNIQUE(conversation_id, user_id)
        )
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id       UUID,
          body            TEXT,
          attachment_url  TEXT,
          attachment_type VARCHAR(40),
          kind            VARCHAR(20) NOT NULL DEFAULT 'text',  -- text | image | system
          metadata        JSONB NOT NULL DEFAULT '{}',
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          edited_at       TIMESTAMPTZ,
          deleted_at      TIMESTAMPTZ
        )
      `);
      await c.query(`CREATE INDEX IF NOT EXISTS idx_msg_conv_created ON messages(conversation_id, created_at DESC)`);
      await c.query(`CREATE INDEX IF NOT EXISTS idx_part_user        ON conversation_participants(user_id) WHERE deleted_at IS NULL`);
      await c.query(`CREATE INDEX IF NOT EXISTS idx_part_conv        ON conversation_participants(conversation_id)`);
      await c.query(`CREATE INDEX IF NOT EXISTS idx_conv_event       ON conversations(event_id) WHERE event_id IS NOT NULL`);
    } finally {
      c.release();
    }
  })();
  return _ready;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function directKey(a, b) {
  return [a, b].sort().join(":");
}

async function isParticipant(conversationId, userId) {
  const { rows } = await db.query(
    `SELECT 1 FROM conversation_participants
     WHERE conversation_id=$1 AND user_id=$2 AND deleted_at IS NULL LIMIT 1`,
    [conversationId, userId]
  );
  return rows.length > 0;
}

async function participantIds(conversationId) {
  const { rows } = await db.query(
    `SELECT user_id FROM conversation_participants
     WHERE conversation_id=$1 AND deleted_at IS NULL`,
    [conversationId]
  );
  return rows.map(r => r.user_id);
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONTACTS — this is a SUPPORT channel, not social chat.
   • Super admins see every user (so they can reach out / answer).
   • Regular users only ever talk to support, so they get no contact picker —
     the support thread is opened directly via openSupportConversationService.
   ═══════════════════════════════════════════════════════════════════════════ */
export async function getContactsService({ userId, isSuperAdmin, search = "" }) {
  await ensureSchema();

  // Regular users have exactly one destination: support. No browsing people.
  if (!isSuperAdmin) return [];

  const like = `%${search.trim()}%`;
  const { rows } = await db.query(
    `SELECT id, full_name, email, avatar_url, is_super_admin
       FROM users
      WHERE deleted_at IS NULL AND id <> $1
        AND ($2 = '%%' OR full_name ILIKE $2 OR email ILIKE $2)
      ORDER BY full_name ASC
      LIMIT 100`,
    [userId, like]
  );
  return rows.map(mapContact);
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUPPORT — open (or reuse) the user's single support thread with the admin
   team. Every current super admin is a participant so any of them can reply.
   ═══════════════════════════════════════════════════════════════════════════ */
export async function openSupportConversationService({ userId }) {
  await ensureSchema();

  const admins = await db.query(
    `SELECT id FROM users WHERE is_super_admin = TRUE AND deleted_at IS NULL AND id <> $1`,
    [userId]
  );
  const adminIds = admins.rows.map(r => r.id);

  const key = `support:${userId}`;
  const existing = await db.query(`SELECT id FROM conversations WHERE direct_key=$1 LIMIT 1`, [key]);
  let conversationId = existing.rows[0]?.id;

  if (!conversationId) {
    const c = await db.connect();
    try {
      await c.query("BEGIN");
      const conv = await c.query(
        `INSERT INTO conversations (type, title, direct_key, created_by, updated_at)
         VALUES ('support', 'Support', $1, $2, NOW()) RETURNING id`,
        [key, userId]
      );
      conversationId = conv.rows[0].id;
      for (const uid of [...new Set([userId, ...adminIds])]) {
        await c.query(
          `INSERT INTO conversation_participants (conversation_id, user_id, role)
           VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
          [conversationId, uid, uid === userId ? "member" : "admin"]
        );
      }
      await c.query("COMMIT");
    } catch (err) {
      await c.query("ROLLBACK");
      const again = await db.query(`SELECT id FROM conversations WHERE direct_key=$1 LIMIT 1`, [key]);
      if (again.rows[0]) conversationId = again.rows[0].id; else throw err;
    } finally {
      c.release();
    }
  } else {
    // keep admin roster fresh + re-activate if anyone soft-deleted the thread
    for (const uid of [...new Set([userId, ...adminIds])]) {
      await db.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role)
         VALUES ($1,$2,$3)
         ON CONFLICT (conversation_id, user_id) DO UPDATE SET deleted_at = NULL`,
        [conversationId, uid, uid === userId ? "member" : "admin"]
      );
    }
  }

  return getConversationByIdService({ conversationId, userId });
}

function mapContact(r) {
  return {
    id: r.id,
    full_name: r.full_name,
    email: r.email,
    avatar_url: r.avatar_url,
    is_super_admin: r.is_super_admin === true,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   CREATE / OPEN a direct conversation (idempotent via direct_key)
   ═══════════════════════════════════════════════════════════════════════════ */
export async function openDirectConversationService({ userId, recipientId }) {
  await ensureSchema();
  if (!recipientId || recipientId === userId) {
    const e = new Error("A valid recipient is required"); e.statusCode = 400; throw e;
  }
  const key = directKey(userId, recipientId);

  const existing = await db.query(
    `SELECT id FROM conversations WHERE direct_key=$1 LIMIT 1`, [key]
  );

  let conversationId = existing.rows[0]?.id;
  if (!conversationId) {
    const c = await db.connect();
    try {
      await c.query("BEGIN");
      const conv = await c.query(
        `INSERT INTO conversations (type, direct_key, created_by, updated_at)
         VALUES ('direct', $1, $2, NOW()) RETURNING id`,
        [key, userId]
      );
      conversationId = conv.rows[0].id;
      await c.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role)
         VALUES ($1,$2,'member'), ($1,$3,'member')
         ON CONFLICT DO NOTHING`,
        [conversationId, userId, recipientId]
      );
      await c.query("COMMIT");
    } catch (err) {
      await c.query("ROLLBACK");
      // race: another request created it — fetch again
      const again = await db.query(`SELECT id FROM conversations WHERE direct_key=$1 LIMIT 1`, [key]);
      if (again.rows[0]) conversationId = again.rows[0].id;
      else throw err;
    } finally {
      c.release();
    }
  } else {
    // re-activate if either side had soft-deleted the thread
    await db.query(
      `UPDATE conversation_participants SET deleted_at=NULL
       WHERE conversation_id=$1 AND user_id=ANY($2::uuid[])`,
      [conversationId, [userId, recipientId]]
    );
  }

  return getConversationByIdService({ conversationId, userId });
}

/* ═══════════════════════════════════════════════════════════════════════════
   CREATE a group / event conversation
   ═══════════════════════════════════════════════════════════════════════════ */
export async function createGroupConversationService({ userId, title, participantIds: ids = [], eventId = null, type = "group" }) {
  await ensureSchema();
  const unique = [...new Set([userId, ...ids])].filter(Boolean);
  if (unique.length < 2) {
    const e = new Error("A group needs at least two participants"); e.statusCode = 400; throw e;
  }
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    const conv = await c.query(
      `INSERT INTO conversations (type, title, event_id, created_by, updated_at)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING id`,
      [type, title || null, eventId, userId]
    );
    const conversationId = conv.rows[0].id;
    // creator = admin, everyone else = member
    for (const uid of unique) {
      await c.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role)
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [conversationId, uid, uid === userId ? "admin" : "member"]
      );
    }
    await c.query("COMMIT");
    return getConversationByIdService({ conversationId, userId });
  } catch (err) {
    await c.query("ROLLBACK");
    throw err;
  } finally {
    c.release();
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIST my conversations (with unread + last message + counterpart info)
   ═══════════════════════════════════════════════════════════════════════════ */
export async function listConversationsService({ userId, search = "" }) {
  await ensureSchema();
  const { rows } = await db.query(
    `
    SELECT
      c.id, c.type, c.title, c.event_id, c.created_by,
      c.last_message_at, c.last_message_preview, c.last_message_sender,
      p.last_read_at, p.muted, p.archived,
      (
        SELECT COUNT(*)::int FROM messages m
         WHERE m.conversation_id = c.id
           AND m.deleted_at IS NULL
           AND m.sender_id <> $1
           AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
      ) AS unread_count
    FROM conversation_participants p
    JOIN conversations c ON c.id = p.conversation_id
    WHERE p.user_id = $1 AND p.deleted_at IS NULL
    ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
    LIMIT 200
    `,
    [userId]
  );

  // attach counterparties (other participants) for display
  const result = [];
  for (const row of rows) {
    const others = await db.query(
      `SELECT u.id, u.full_name, u.email, u.avatar_url, u.is_super_admin
         FROM conversation_participants p
         JOIN users u ON u.id = p.user_id
        WHERE p.conversation_id=$1 AND p.user_id <> $2 AND p.deleted_at IS NULL
        LIMIT 20`,
      [row.id, userId]
    );
    const participants = others.rows.map(mapContact);

    let display, title;
    if (row.type === "support") {
      // The requester sees "Support"; admins see who is asking.
      if (userId === row.created_by) {
        display = null;
        title = "Support";
      } else {
        const requester = participants.find(p => p.id === row.created_by) || participants[0];
        display = requester || null;
        title = requester ? requester.full_name : "Support request";
      }
    } else {
      display = row.type === "direct" ? participants[0] : null;
      title = row.title || (display ? display.full_name : "Conversation");
    }

    if (search && !title.toLowerCase().includes(search.toLowerCase())) continue;

    result.push({
      id: row.id,
      type: row.type,
      title,
      event_id: row.event_id,
      counterpart: display || null,
      participants,
      last_message_at: row.last_message_at,
      last_message_preview: row.last_message_preview,
      last_message_sender: row.last_message_sender,
      unread_count: row.unread_count,
      muted: row.muted,
      archived: row.archived,
    });
  }
  return result;
}

export async function getConversationByIdService({ conversationId, userId }) {
  await ensureSchema();
  if (!(await isParticipant(conversationId, userId))) {
    const e = new Error("Conversation not found"); e.statusCode = 404; throw e;
  }
  const list = await listConversationsService({ userId });
  return list.find(c => c.id === conversationId) || null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MESSAGES — fetch (paginated, newest-first then reversed) + send
   ═══════════════════════════════════════════════════════════════════════════ */
export async function getMessagesService({ conversationId, userId, before = null, limit = 30, isSuperAdmin = false }) {
  await ensureSchema();
  if (!(await isParticipant(conversationId, userId))) {
    const e = new Error("Conversation not found"); e.statusCode = 404; throw e;
  }
  const lim = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const params = [conversationId, lim];
  let cursor = "";
  if (before) { params.push(before); cursor = `AND m.created_at < $3`; }

  // Hide messages older than 24 hours for non-super-admin users
  let ageFilter = "";
  if (!isSuperAdmin) {
    ageFilter = `AND m.created_at > NOW() - INTERVAL '24 hours'`;
  }

  // Hide deleted messages for non-super-admin users
  let deletedFilter = "";
  if (!isSuperAdmin) {
    deletedFilter = `AND m.deleted_at IS NULL`;
  }

  const { rows } = await db.query(
    `SELECT m.id, m.sender_id, m.body, m.attachment_url, m.attachment_type,
            m.kind, m.metadata, m.created_at, m.edited_at, m.deleted_at,
            u.full_name AS sender_name, u.avatar_url AS sender_avatar
       FROM messages m
       LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1 ${cursor} ${ageFilter} ${deletedFilter}
      ORDER BY m.created_at DESC
      LIMIT $2`,
    params
  );
  return rows.reverse().map(mapMessage);
}

function mapMessage(m) {
  return {
    id: m.id,
    sender_id: m.sender_id,
    sender_name: m.sender_name,
    sender_avatar: m.sender_avatar,
    body: m.deleted_at ? null : m.body,
    attachment_url: m.deleted_at ? null : m.attachment_url,
    attachment_type: m.attachment_type,
    kind: m.kind,
    metadata: m.metadata,
    created_at: m.created_at,
    edited_at: m.edited_at,
    deleted: !!m.deleted_at,
  };
}

/* ─── Auto-reply helper for support conversations ─────────────────────── */
async function maybeAutoReplyToSupport(conversationId, userId) {
  try {
    // Check if this is a support conversation
    const convCheck = await db.query(
      `SELECT type, direct_key FROM conversations WHERE id=$1`,
      [conversationId]
    );
    if (!convCheck.rows[0] || convCheck.rows[0].type !== 'support') return;
    if (!convCheck.rows[0].direct_key?.startsWith('support:')) return;

    // Check if there's a recent auto-reply (within last 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentAutoReply = await db.query(
      `SELECT id FROM messages
       WHERE conversation_id=$1
         AND sender_id='system'
         AND kind='system'
         AND created_at > $2
       ORDER BY created_at DESC LIMIT 1`,
      [conversationId, sixHoursAgo]
    );

    // If there's a recent auto-reply, skip
    if (recentAutoReply.rows.length > 0) return;

    // Send auto-reply
    const autoReplyText = `Thank you for contacting LiteEvent Support! 🎉\n\nWe've received your message and our team will respond as soon as possible. We typically reply within a few hours during business hours.\n\nIn the meantime, you can check our help center for quick answers to common questions.`;

    await db.query(
      `INSERT INTO messages (conversation_id, sender_id, body, kind)
       VALUES ($1, 'system', $2, 'system')`,
      [conversationId, autoReplyText]
    );

    // Update conversation last message
    await db.query(
      `UPDATE conversations
          SET last_message_at=NOW(),
              last_message_preview='Auto-reply sent',
              last_message_sender='system',
              updated_at=NOW()
        WHERE id=$1`,
      [conversationId]
    );

    // Notify the user
    const autoReplyMessage = {
      id: 'auto-reply-' + Date.now(),
      sender_id: 'system',
      sender_name: 'LiteEvent Support',
      sender_avatar: null,
      body: autoReplyText,
      attachment_url: null,
      attachment_type: null,
      kind: 'system',
      metadata: null,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted: false,
    };

    publishToUsers([userId], {
      event: "message:new",
      conversation_id: conversationId,
      message: autoReplyMessage,
    });
  } catch (err) {
    // Auto-reply failures should not break message sending
    console.error('Auto-reply error:', err);
  }
}

export async function sendMessageService({ conversationId, userId, body, attachmentUrl = null, attachmentType = null, kind = "text" }) {
  await ensureSchema();
  if (!(await isParticipant(conversationId, userId))) {
    const e = new Error("Conversation not found"); e.statusCode = 404; throw e;
  }
  const text = (body || "").trim();
  if (!text && !attachmentUrl) {
    const e = new Error("Message cannot be empty"); e.statusCode = 400; throw e;
  }

  const ins = await db.query(
    `INSERT INTO messages (conversation_id, sender_id, body, attachment_url, attachment_type, kind)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [conversationId, userId, text || null, attachmentUrl, attachmentType, attachmentUrl ? (kind === "text" ? "image" : kind) : kind]
  );

  const preview = text ? text.slice(0, 140) : (attachmentUrl ? "📎 Attachment" : "");
  await db.query(
    `UPDATE conversations
        SET last_message_at=NOW(), last_message_preview=$2,
            last_message_sender=$3, updated_at=NOW()
      WHERE id=$1`,
    [conversationId, preview, userId]
  );
  // sender is implicitly caught up
  await db.query(
    `UPDATE conversation_participants SET last_read_at=NOW()
      WHERE conversation_id=$1 AND user_id=$2`,
    [conversationId, userId]
  );

  // enrich with sender info for the realtime payload
  const sender = await db.query(
    `SELECT full_name, avatar_url FROM users WHERE id=$1`, [userId]
  );
  const message = mapMessage({
    ...ins.rows[0],
    sender_name: sender.rows[0]?.full_name,
    sender_avatar: sender.rows[0]?.avatar_url,
  });

  // ── realtime fan-out ──
  const recipients = (await participantIds(conversationId)).filter(id => id !== userId);
  const allParticipants = [...recipients, userId];
  publishToUsers(allParticipants, {
    event: "message:new",
    conversation_id: conversationId,
    message,
  });

  // ── push fallback for offline recipients (never blocks) ──
  const { createNotificationService } = await import('./notifications.service.js');
  for (const rid of recipients) {
    // Send push notification (mobile)
    sendPushToUser(rid, {
      title: sender.rows[0]?.full_name || "New message",
      body: preview || "Sent you a message",
      data: { type: "chat", conversation_id: conversationId },
    }).catch(() => {});

    // Create in-app notification (web)
    createNotificationService({
      userId: rid,
      type: "chat",
      title: sender.rows[0]?.full_name || "New message",
      body: preview || "Sent you a message",
      link: `/chat/${conversationId}`,
      metadata: { conversation_id: conversationId },
    }).catch(() => {});
  }

  // ── auto-reply for support conversations ──
  await maybeAutoReplyToSupport(conversationId, userId);

  return message;
}

/* ═══════════════════════════════════════════════════════════════════════════
   READ receipts
   ═══════════════════════════════════════════════════════════════════════════ */
export async function markReadService({ conversationId, userId }) {
  await ensureSchema();
  if (!(await isParticipant(conversationId, userId))) return;
  await db.query(
    `UPDATE conversation_participants SET last_read_at=NOW()
      WHERE conversation_id=$1 AND user_id=$2`,
    [conversationId, userId]
  );
  const others = (await participantIds(conversationId)).filter(id => id !== userId);
  publishToUsers(others, { event: "conversation:read", conversation_id: conversationId, by: userId });
}

export async function getUnreadCountService({ userId }) {
  await ensureSchema();
  const { rows } = await db.query(
    `
    SELECT COALESCE(SUM(sub.cnt),0)::int AS total
    FROM (
      SELECT (
        SELECT COUNT(*)::int FROM messages m
         WHERE m.conversation_id = p.conversation_id
           AND m.deleted_at IS NULL
           AND m.sender_id <> $1
           AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
      ) AS cnt
      FROM conversation_participants p
      WHERE p.user_id = $1 AND p.deleted_at IS NULL AND p.muted = FALSE
    ) sub
    `,
    [userId]
  );
  return rows[0]?.total ?? 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE MESSAGE — soft-delete (mark deleted_at).
   Super admins can delete any message. Regular users can only delete their own.
   ═══════════════════════════════════════════════════════════════════════════ */
export async function deleteMessageService({ messageId, userId, isSuperAdmin = false }) {
  await ensureSchema();

  // Check message exists and get conversation_id
  const msgCheck = await db.query(
    `SELECT id, conversation_id, sender_id FROM messages WHERE id=$1 AND deleted_at IS NULL`,
    [messageId]
  );
  if (!msgCheck.rows[0]) {
    const e = new Error("Message not found"); e.statusCode = 404; throw e;
  }
  const msg = msgCheck.rows[0];

  // Permission check: super admin can delete any message, others can only delete their own
  if (!isSuperAdmin && msg.sender_id !== userId) {
    const e = new Error("You can only delete your own messages"); e.statusCode = 403; throw e;
  }

  // Check user is participant in the conversation
  if (!(await isParticipant(msg.conversation_id, userId))) {
    const e = new Error("Conversation not found"); e.statusCode = 404; throw e;
  }

  // Soft-delete the message
  await db.query(`UPDATE messages SET deleted_at=NOW() WHERE id=$1`, [messageId]);

  // Notify participants
  const participants = await participantIds(msg.conversation_id);
  publishToUsers(participants, {
    event: "message:deleted",
    conversation_id: msg.conversation_id,
    message_id: messageId,
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE CONVERSATION — soft-delete conversation (super admin only).
   Removes the conversation from the user's list.
   ═══════════════════════════════════════════════════════════════════════════ */
export async function deleteConversationService({ conversationId, userId, isSuperAdmin = false }) {
  await ensureSchema();

  // Only super admins can delete conversations
  if (!isSuperAdmin) {
    const e = new Error("Only super admins can delete conversations"); e.statusCode = 403; throw e;
  }

  // Check conversation exists and user is participant
  if (!(await isParticipant(conversationId, userId))) {
    const e = new Error("Conversation not found"); e.statusCode = 404; throw e;
  }

  // Soft-delete the conversation
  await db.query(`UPDATE conversations SET deleted_at=NOW() WHERE id=$1`, [conversationId]);

  // Notify all participants
  const participants = await participantIds(conversationId);
  publishToUsers(participants, {
    event: "conversation:deleted",
    conversation_id: conversationId,
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE ALL CONVERSATIONS WITH USER — super admin only.
   Deletes all conversations where the specified user is a participant.
   ═══════════════════════════════════════════════════════════════════════════ */
export async function deleteAllConversationsWithUserService({ targetUserId, adminId, isSuperAdmin = false }) {
  await ensureSchema();

  // Only super admins can delete conversations
  if (!isSuperAdmin) {
    const e = new Error("Only super admins can delete conversations"); e.statusCode = 403; throw e;
  }

  // Find all conversations with the target user
  const { rows } = await db.query(
    `SELECT DISTINCT c.id
     FROM conversations c
     JOIN conversation_participants cp ON cp.conversation_id = c.id
     WHERE cp.user_id = $1 AND c.deleted_at IS NULL`,
    [targetUserId]
  );

  // Delete each conversation
  for (const row of rows) {
    await db.query(`UPDATE conversations SET deleted_at=NOW() WHERE id=$1`, [row.id]);
    const participants = await participantIds(row.id);
    publishToUsers(participants, {
      event: "conversation:deleted",
      conversation_id: row.id,
    });
  }

  return { deleted: rows.length };
}

/* ═══════════════════════════════════════════════════════════════════════════
   TYPING indicator (ephemeral, realtime only)
   ═══════════════════════════════════════════════════════════════════════════ */
export async function emitTypingService({ conversationId, userId }) {
  await ensureSchema();
  if (!(await isParticipant(conversationId, userId))) return;
  const others = (await participantIds(conversationId)).filter(id => id !== userId);
  publishToUsers(others, { event: "typing", conversation_id: conversationId, user_id: userId });
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUPER-ADMIN BROADCAST — message every active user.
   Each recipient gets a direct conversation with the admin so replies thread
   naturally back to support. Returns count of recipients reached.
   ═══════════════════════════════════════════════════════════════════════════ */
export async function broadcastService({ adminId, body, audience = "all", eventId = null }) {
  await ensureSchema();
  const text = (body || "").trim();
  if (!text) { const e = new Error("Message body required"); e.statusCode = 400; throw e; }

  let recipients = [];
  if (audience === "event" && eventId) {
    const { rows } = await db.query(
      `SELECT DISTINCT uid FROM (
         SELECT created_by AS uid FROM events WHERE id=$1
         UNION SELECT user_id FROM event_members WHERE event_id=$1
         UNION SELECT gu.id FROM guests g
                 JOIN users gu ON LOWER(gu.email) = LOWER(g.email)
                WHERE g.event_id=$1 AND g.email IS NOT NULL AND gu.deleted_at IS NULL
       ) s WHERE uid IS NOT NULL AND uid <> $2`,
      [eventId, adminId]
    );
    recipients = rows.map(r => r.uid);
  } else {
    const { rows } = await db.query(
      `SELECT id FROM users WHERE deleted_at IS NULL AND id <> $1`,
      [adminId]
    );
    recipients = rows.map(r => r.id);
  }

  let reached = 0;
  for (const rid of recipients) {
    try {
      const conv = await openDirectConversationService({ userId: adminId, recipientId: rid });
      await sendMessageService({ conversationId: conv.id, userId: adminId, body: text });
      reached++;
    } catch { /* skip individual failures */ }
  }
  return { reached, total: recipients.length };
}
