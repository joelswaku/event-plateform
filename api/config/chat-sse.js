// ─────────────────────────────────────────────────────────────────────────────
// Chat real-time delivery via Server-Sent Events (SSE).
//
// Each authenticated user may hold several live connections (web tab + mobile).
// We keep an in-memory registry: userId -> Set<res>. When a chat event happens
// (new message, read receipt, typing…) we look up every participant's open
// connections and write the event to each. Survives behind a single Node
// process; for multi-instance deploys this would be backed by Redis pub/sub,
// which is intentionally abstracted behind publishToUsers().
// ─────────────────────────────────────────────────────────────────────────────

import { redis } from "./redis.js";

/** userId -> Set<ServerResponse> */
const connections = new Map();

const REDIS_CHANNEL = "chat:events";
let redisSub = null;

/* ── Fan-out across instances via Redis pub/sub (best-effort) ─────────────── */
function ensureRedisSubscriber() {
  if (redisSub || !redis) return;
  try {
    redisSub = redis.duplicate();
    redisSub.subscribe(REDIS_CHANNEL).catch(() => {});
    redisSub.on("message", (_channel, raw) => {
      try {
        const { userIds, payload } = JSON.parse(raw);
        deliverLocal(userIds, payload);
      } catch { /* ignore malformed */ }
    });
  } catch {
    redisSub = null; // single-instance fallback
  }
}

/* ── Register / unregister a live SSE connection ──────────────────────────── */
export function addConnection(userId, res) {
  ensureRedisSubscriber();
  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId).add(res);
}

export function removeConnection(userId, res) {
  const set = connections.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) connections.delete(userId);
}

/* ── Deliver to connections held by THIS instance ─────────────────────────── */
function deliverLocal(userIds, payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const uid of userIds) {
    const set = connections.get(uid);
    if (!set) continue;
    for (const res of set) {
      try { res.write(data); } catch { /* connection died; cleaned on close */ }
    }
  }
}

/* ── Public: deliver to users across all instances ────────────────────────── */
export function publishToUsers(userIds, payload) {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  // Local delivery first (instant for same-instance clients)
  deliverLocal(userIds, payload);
  // Fan out to other instances
  if (redis) {
    redis.publish(REDIS_CHANNEL, JSON.stringify({ userIds, payload })).catch(() => {});
  }
}

/** Number of users currently holding at least one live connection (this instance). */
export function onlineUserCount() {
  return connections.size;
}

export function isUserOnline(userId) {
  return connections.has(userId);
}
