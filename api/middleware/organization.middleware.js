
import { db } from "../config/db.js";

export async function resolveOrganization(req, res, next) {
  // SECURITY: NEVER trust client-supplied organization IDs
  // Client can send x-organization-id or organizationId but we MUST verify membership
  const clientRequestedOrgId = req.headers["x-organization-id"] || req.query.organizationId;

  // Extract event ID from route params (populated by inline middleware) or URL regex
  const urlEventId = req.originalUrl.match(/\/events\/([^/?]+)/)?.[1];
  const eventId = req.params.eventId ?? req.params.id ?? urlEventId;

  // For event-scoped routes: resolve org from event membership FIRST.
  // This is the only correct approach for invited team members — their JWT carries
  // their personal org, not the event owner's org.
  if (eventId && req.user?.id) {
    try {
      const { rows } = await db.query(
        `SELECT e.organization_id
         FROM events e
         WHERE e.id = $1 AND e.deleted_at IS NULL
           AND (
             EXISTS (
               SELECT 1 FROM event_members em
               WHERE em.event_id = e.id AND em.user_id = $2 AND em.deleted_at IS NULL
             )
             OR EXISTS (
               SELECT 1 FROM organization_members om
               WHERE om.organization_id = e.organization_id AND om.user_id = $2 AND om.deleted_at IS NULL
             )
           )
         LIMIT 1`,
        [eventId, req.user.id]
      );

      if (rows.length) {
        req.organizationId = rows[0].organization_id;
        // Flag when the user is accessing via event_members (cross-org)
        if (rows[0].organization_id !== req.user?.organizationId) {
          req.isTeamAdmin = true;
        }
        return next();
      }
    } catch {
      // DB error — fall through to personal-org resolution
    }
  }

  // Non-event routes or event lookup found no access: use org from JWT
  // If client requested specific org, verify user is a member
  if (clientRequestedOrgId && req.user?.id) {
    try {
      const { rows } = await db.query(
        `SELECT 1 FROM organization_members
         WHERE organization_id = $1 AND user_id = $2 AND deleted_at IS NULL
         LIMIT 1`,
        [clientRequestedOrgId, req.user.id]
      );
      if (rows.length) {
        req.organizationId = clientRequestedOrgId;
        return next();
      }
      // User requested org they're not a member of - reject
      return res.status(403).json({ success: false, message: "Access denied to this organization" });
    } catch {
      // DB error - fall through to personal org
    }
  }

  // Default to user's personal org from JWT
  if (req.user?.organizationId) {
    req.organizationId = req.user.organizationId;
    return next();
  }

  // User has no personal org — try event membership as last resort
  if (eventId && req.user?.id) {
    try {
      const { rows } = await db.query(
        `SELECT e.organization_id
         FROM events e
         JOIN event_members em ON em.event_id = e.id AND em.user_id = $2 AND em.deleted_at IS NULL
         WHERE e.id = $1 AND e.deleted_at IS NULL
         LIMIT 1`,
        [eventId, req.user.id]
      );
      if (rows.length) {
        req.organizationId = rows[0].organization_id;
        req.isTeamAdmin = true;
        return next();
      }
    } catch { /* fall through */ }
  }

  return res.status(400).json({ success: false, message: "Organization not specified" });
}
