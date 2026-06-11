
import { db } from "../config/db.js";

export async function resolveOrganization(req, res, next) {
  const headerOrg = req.headers["x-organization-id"];
  const queryOrg  = req.query.organizationId;

  if (headerOrg) { req.organizationId = headerOrg; return next(); }
  if (queryOrg)  { req.organizationId = queryOrg;  return next(); }

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
               WHERE om.organization_id = e.organization_id AND om.user_id = $2
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
