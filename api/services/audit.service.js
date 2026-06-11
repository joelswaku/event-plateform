import { db } from "../config/db.js";

// In-process cache: avoids repeated DB lookups for the same admin within a server run
const _emailCache = new Map();

/**
 * Write an immutable super-admin audit log entry.
 * Never throws — audit failures must not break the API response.
 *
 * Columns used (mapped to the existing audit_logs schema):
 *   actor_user_id  ← adminId
 *   admin_email    ← resolved from DB when not supplied
 *   action         ← action
 *   entity_type    ← resourceType
 *   resource_id    ← resourceId  (TEXT — handles UUIDs and flag keys)
 *   changes        ← details     (JSONB)
 *   ip_address     ← ip
 *   user_agent     ← userAgent
 */
export async function audit({
  adminId,
  adminEmail,
  action,
  resourceType,
  resourceId,
  details,
  ip,
  userAgent,
}) {
  try {
    let email = adminEmail;

    if (!email && adminId) {
      if (_emailCache.has(adminId)) {
        email = _emailCache.get(adminId);
      } else {
        const { rows } = await db.query(
          `SELECT email FROM users WHERE id=$1 LIMIT 1`,
          [adminId]
        );
        email = rows[0]?.email ?? "unknown";
        _emailCache.set(adminId, email);
      }
    }

    await db.query(
      `INSERT INTO audit_logs
         (actor_user_id, admin_email, action, entity_type, resource_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8)`,
      [
        adminId      ?? null,
        email        ?? "unknown",
        action,
        resourceType ?? null,
        resourceId   != null ? String(resourceId) : null,
        JSON.stringify(details ?? {}),
        ip           || null,
        userAgent    ?? null,
      ]
    );
  } catch (e) {
    console.error("[Audit]", e.message);
  }
}
