
import { db } from "../config/db.js";

export async function resolveOrganization(req, res, next) {
  const headerOrg = req.headers["x-organization-id"];
  const queryOrg  = req.query.organizationId;

  if (headerOrg) { req.organizationId = headerOrg; return next(); }
  if (queryOrg)  { req.organizationId = queryOrg;  return next(); }

  if (req.user?.organizationId) {
    req.organizationId = req.user.organizationId;

    // If the route includes an event ID, check whether this user is a team
    // member of that event (i.e. an admin from a different org). If so,
    // resolve the event's real organization so all queries work correctly.
    const eventId = req.params.eventId ?? req.params.id;
    if (eventId && req.user.id) {
      try {
        const { rows } = await db.query(
          `SELECT e.organization_id
           FROM events e
           JOIN event_members em ON em.event_id = e.id
           WHERE e.id = $1 AND em.user_id = $2 AND em.deleted_at IS NULL
           LIMIT 1`,
          [eventId, req.user.id]
        );
        if (rows.length && rows[0].organization_id !== req.organizationId) {
          req.organizationId = rows[0].organization_id;
          req.isTeamAdmin = true;
        }
      } catch {
        // Non-critical — fall through with the user's own org
      }
    }

    return next();
  }

  return res.status(400).json({ success: false, message: "Organization not specified" });
}