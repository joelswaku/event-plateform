import { db } from "../config/db.js";
import { AppError } from "../services/events.service.js";

/*
========================================
EVENT ROLES
========================================
*/

export const EVENT_ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  CHECKIN_AGENT: "CHECKIN_AGENT",
  VIEWER: "VIEWER"
};

/*
========================================
GET EVENT MEMBER
========================================
*/

export async function getEventMember(userId, eventId) {

  const { rows } = await db.query(
    `
    SELECT role
    FROM event_members
    WHERE user_id = $1
    AND event_id = $2
    AND deleted_at IS NULL
    LIMIT 1
    `,
    [userId, eventId]
  );

  return rows[0] || null;

}

/*
========================================
CAN ACCESS EVENT
========================================
*/

export async function canAccessEvent(userId, eventId) {

  const member = await getEventMember(userId, eventId);

  return !!member;

}

/*
========================================
CAN MANAGE EVENT
========================================
*/

export async function canManageEvent(userId, eventId) {

  const member = await getEventMember(userId, eventId);

  if (!member) return false;

  return [
    EVENT_ROLES.OWNER,
    EVENT_ROLES.ADMIN,
    EVENT_ROLES.MANAGER
  ].includes(member.role);

}

/*
========================================
CAN ADMIN EVENT
========================================
*/

export async function canAdminEvent(userId, eventId) {

  const member = await getEventMember(userId, eventId);

  if (!member) return false;

  return [
    EVENT_ROLES.OWNER,
    EVENT_ROLES.ADMIN
  ].includes(member.role);

}

/*
========================================
ASSERT ACCESS
========================================
*/

export async function assertEventAccess(userId, eventId) {

  const allowed = await canAccessEvent(userId, eventId);

  if (!allowed) {
    throw new AppError(
      "You do not have access to this event",
      403
    );
  }

}

/*
========================================
ASSERT MANAGE
========================================
*/

export async function assertManageEvent(userId, eventId) {

  const allowed = await canManageEvent(userId, eventId);

  if (!allowed) {
    throw new AppError(
      "You do not have permission to manage this event",
      403
    );
  }

}

/*
========================================
ASSERT ADMIN
========================================
*/

export async function assertAdminEvent(userId, eventId) {

  const allowed = await canAdminEvent(userId, eventId);

  if (!allowed) {
    throw new AppError(
      "Only event admins can perform this action",
      403
    );
  }

}