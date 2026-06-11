import jwt from "jsonwebtoken";
import * as chat from "../services/chat.service.js";
import { addConnection, removeConnection } from "../config/chat-sse.js";

function fail(res, e, msg = "Internal server error") {
  if (!e?.statusCode) console.error("[chat]", e);
  return res.status(e?.statusCode || 500).json({ success: false, message: e?.message || msg });
}

/* ── Contacts ─────────────────────────────────────────────────────────────── */
export async function listContacts(req, res) {
  try {
    const data = await chat.getContactsService({
      userId: req.user.id,
      isSuperAdmin: req.user.isSuperAdmin === true,
      search: req.query.search || "",
    });
    res.json({ success: true, data });
  } catch (e) { fail(res, e); }
}

/* ── Conversations ────────────────────────────────────────────────────────── */
export async function listConversations(req, res) {
  try {
    const data = await chat.listConversationsService({ userId: req.user.id, search: req.query.search || "" });
    res.json({ success: true, data });
  } catch (e) { fail(res, e); }
}

export async function createConversation(req, res) {
  try {
    // Support-only model: regular users cannot start arbitrary conversations.
    // They reach the admin team through POST /chat/support instead.
    if (req.user.isSuperAdmin !== true) {
      return res.status(403).json({ success: false, message: "Use the support channel to contact us." });
    }
    const { recipient_id, participant_ids, title, event_id, type } = req.body || {};
    let conv;
    if (recipient_id && !participant_ids) {
      conv = await chat.openDirectConversationService({ userId: req.user.id, recipientId: recipient_id });
    } else {
      conv = await chat.createGroupConversationService({
        userId: req.user.id,
        title,
        participantIds: participant_ids || [],
        eventId: event_id || null,
        type: type || "group",
      });
    }
    res.json({ success: true, data: conv });
  } catch (e) { fail(res, e); }
}

/* Open (or reuse) the current user's support thread with the admin team. */
export async function openSupport(req, res) {
  try {
    const conv = await chat.openSupportConversationService({ userId: req.user.id });
    res.json({ success: true, data: conv });
  } catch (e) { fail(res, e); }
}

export async function getConversation(req, res) {
  try {
    const data = await chat.getConversationByIdService({ conversationId: req.params.id, userId: req.user.id });
    if (!data) return res.status(404).json({ success: false, message: "Conversation not found" });
    res.json({ success: true, data });
  } catch (e) { fail(res, e); }
}

/* ── Messages ─────────────────────────────────────────────────────────────── */
export async function getMessages(req, res) {
  try {
    const data = await chat.getMessagesService({
      conversationId: req.params.id,
      userId: req.user.id,
      before: req.query.before || null,
      limit: req.query.limit,
    });
    res.json({ success: true, data });
  } catch (e) { fail(res, e); }
}

export async function sendMessage(req, res) {
  try {
    const { body, attachment_url, attachment_type, kind } = req.body || {};
    const data = await chat.sendMessageService({
      conversationId: req.params.id,
      userId: req.user.id,
      body,
      attachmentUrl: attachment_url || null,
      attachmentType: attachment_type || null,
      kind: kind || "text",
    });
    res.status(201).json({ success: true, data });
  } catch (e) { fail(res, e); }
}

export async function markRead(req, res) {
  try {
    await chat.markReadService({ conversationId: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (e) { fail(res, e); }
}

export async function typing(req, res) {
  try {
    await chat.emitTypingService({ conversationId: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (e) { fail(res, e); }
}

export async function unreadCount(req, res) {
  try {
    const total = await chat.getUnreadCountService({ userId: req.user.id });
    res.json({ success: true, data: { total } });
  } catch (e) { fail(res, e); }
}

/* ── Super-admin broadcast ────────────────────────────────────────────────── */
export async function broadcast(req, res) {
  try {
    if (req.user.isSuperAdmin !== true) {
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }
    const { body, audience, event_id } = req.body || {};
    const result = await chat.broadcastService({
      adminId: req.user.id, body, audience: audience || "all", eventId: event_id || null,
    });
    res.json({ success: true, data: result });
  } catch (e) { fail(res, e); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SSE STREAM — real-time delivery.
   Auth: cookie (web) OR Authorization header OR ?token= query (EventSource
   in the browser can't set headers, so we accept the access token via query).
   ═══════════════════════════════════════════════════════════════════════════ */
export function stream(req, res) {
  let token = req.cookies?.accessToken || null;
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token && req.query.token) token = String(req.query.token);

  let userId;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    userId = payload.sub;
  } catch {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  if (!userId) return res.status(401).json({ success: false, message: "Authentication required" });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // disable nginx buffering
  });
  res.write(`retry: 3000\n\n`);
  res.write(`data: ${JSON.stringify({ event: "connected" })}\n\n`);

  addConnection(userId, res);

  // heartbeat to keep proxies from closing the pipe
  const heartbeat = setInterval(() => {
    try { res.write(`: ping\n\n`); } catch { /* closed */ }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeConnection(userId, res);
  });
}
