import bcrypt  from "bcryptjs";
import crypto  from "crypto";
import { db }  from "../config/db.js";
import { AppError } from "../services/events.service.js";
import { getEventMember, EVENT_ROLES } from "../helpers/eventPermissions.js";
import { getUserPlan, PLANS } from "../services/planLimits.service.js";
import {
  sendTeamInviteNewEmail,
  sendTeamInviteExistingEmail,
} from "../utils/sendEmail.js";
import { generateTokens, setAuthCookies } from "../utils/generateToken.js";
import { hashToken } from "../utils/hashToken.js";
import { env } from "../config/env.js";

/* ── Schema bootstrap ────────────────────────────────────────────────────────── */
let _tableReady = false;
async function ensureInvitationsTable() {
  if (_tableReady) return;

  // Core invitations table
  await db.query(`
    CREATE TABLE IF NOT EXISTS event_invitations (
      id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      event_id         UUID NOT NULL,
      email            TEXT NOT NULL,
      invited_by       UUID NOT NULL,
      token            UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
      invite_code_hash TEXT,
      invited_name     TEXT,
      status           TEXT DEFAULT 'pending' NOT NULL,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      expires_at       TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
      accepted_at      TIMESTAMPTZ
    )
  `);

  // event_invitations extra columns
  await db.query(`ALTER TABLE event_invitations ADD COLUMN IF NOT EXISTS invite_code_hash TEXT`);
  await db.query(`ALTER TABLE event_invitations ADD COLUMN IF NOT EXISTS invited_name TEXT`);
  await db.query(`ALTER TABLE event_invitations ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ADMIN'`);
  await db.query(`ALTER TABLE event_invitations ADD COLUMN IF NOT EXISTS user_id UUID`);

  // event_members: add email for pending/email-only memberships
  await db.query(`ALTER TABLE event_members ADD COLUMN IF NOT EXISTS email TEXT`);
  // Allow user_id to be NULL so we can store pending email-only membership records
  try {
    await db.query(`ALTER TABLE event_members ALTER COLUMN user_id DROP NOT NULL`);
  } catch { /* already nullable */ }

  // organization_members: add email for future email-based sync
  await db.query(`ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS email TEXT`);

  _tableReady = true;
}

function handleError(res, error) {
  console.error(error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server error",
    ...(error.code    && { code: error.code }),
    ...(error.details && { details: error.details }),
  });
}

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function formatCode(raw) {
  return raw.slice(0, 3) + "-" + raw.slice(3);
}

/* ── GET /events/:eventId/team ───────────────────────────────────────────────── */
export async function listMembers(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const caller = await getEventMember(userId, eventId);
    if (!caller) throw new AppError("Access denied", 403);

    // LEFT JOIN so email-only pending rows are included
    // DISTINCT ON email to avoid showing duplicates when a linked record + old email-only record both exist
    const { rows } = await db.query(
      `SELECT DISTINCT ON (COALESCE(u.email, em.email))
              em.user_id, em.role, em.joined_at,
              COALESCE(u.full_name, em.email)  AS full_name,
              COALESCE(u.email,    em.email)   AS email,
              u.avatar_url,
              (em.user_id IS NULL)             AS is_pending
       FROM event_members em
       LEFT JOIN users u ON u.id = em.user_id
       WHERE em.event_id = $1 AND em.deleted_at IS NULL
       ORDER BY
         COALESCE(u.email, em.email),
         (em.user_id IS NULL) ASC,
         CASE em.role WHEN 'OWNER' THEN 0 ELSE 1 END,
         em.joined_at ASC`,
      [eventId]
    );

    const planKey   = await getUserPlan(db, userId);
    const planLimit = PLANS[planKey]?.teamMembers ?? 1;

    res.json({
      success: true,
      data: rows,
      meta: {
        plan:            planKey,
        maxTotal:        planLimit === Infinity ? null : planLimit,
        maxAdmins:       planLimit === Infinity ? null : planLimit - 1,
        current:         rows.length,
        currentUserRole: caller.role,
      },
    });
  } catch (e) {
    handleError(res, e);
  }
}

/* ── POST /events/:eventId/team/invite ───────────────────────────────────────── */
export async function inviteMember(req, res) {
  try {
    await ensureInvitationsTable();

    const { eventId } = req.params;
    const userId = req.user.id;
    const { email, name, role: reqRole } = req.body;
    const memberRole = Object.values(EVENT_ROLES).includes(reqRole) ? reqRole : EVENT_ROLES.ADMIN;

    const caller = await getEventMember(userId, eventId);
    if (!caller || caller.role !== EVENT_ROLES.OWNER) {
      throw new AppError("Only the event owner can add team members", 403);
    }

    if (!email?.trim()) throw new AppError("Email is required", 400);

    // Plan limit check
    const planKey   = await getUserPlan(db, userId);
    const planLimit = PLANS[planKey]?.teamMembers ?? 1;
    if (planLimit !== Infinity) {
      const { rows: countRows } = await db.query(
        `SELECT COUNT(*) AS total FROM event_members WHERE event_id = $1 AND deleted_at IS NULL`,
        [eventId]
      );
      const current   = parseInt(countRows[0]?.total ?? 0, 10);
      const maxAdmins = planLimit - 1;
      if (current >= planLimit) {
        const err = new Error(
          `Team limit reached. Your ${planKey} plan allows up to ${maxAdmins} admin${maxAdmins === 1 ? "" : "s"}.`
        );
        err.statusCode = 403;
        err.code       = "PLAN_LIMIT_FEATURE";
        err.details    = { code: "PLAN_LIMIT_FEATURE", feature: "teamMembers", plan: planKey, limit: maxAdmins };
        throw err;
      }
    }

    const { rows: evtRows } = await db.query(
      `SELECT title, organization_id FROM events WHERE id = $1 LIMIT 1`, [eventId]
    );
    const eventTitle = evtRows[0]?.title ?? "your event";
    const eventOrgId = evtRows[0]?.organization_id ?? null;

    const { rows: inviterRows } = await db.query(
      `SELECT full_name FROM users WHERE id = $1 LIMIT 1`, [userId]
    );
    const inviterName = inviterRows[0]?.full_name ?? "Event owner";

    const normalizedEmail = email.trim().toLowerCase();
    const inviteeName     = name?.trim() || null;

    // ── Check if already an active (user_id-linked) member ──────────────────
    const { rows: memberRows } = await db.query(
      `SELECT em.user_id FROM event_members em
       JOIN users u ON u.id = em.user_id
       WHERE LOWER(u.email) = $1 AND em.event_id = $2 AND em.deleted_at IS NULL
       LIMIT 1`,
      [normalizedEmail, eventId]
    );
    if (memberRows.length) throw new AppError("This user is already a team member", 409);

    // ── Self-invite check ───────────────────────────────────────────────────
    const { rows: selfRows } = await db.query(
      `SELECT id FROM users WHERE id = $1 AND LOWER(email) = $2 LIMIT 1`,
      [userId, normalizedEmail]
    );
    if (selfRows.length) throw new AppError("You cannot invite yourself", 400);

    // ── Check if email belongs to an existing account ───────────────────────
    const { rows: userRows } = await db.query(
      `SELECT id, full_name FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizedEmail]
    );
    const isExistingUser = userRows.length > 0;

    // ── CASE 2: Existing user — add directly, send notification email ────────
    if (isExistingUser) {
      const existingUserId = userRows[0].id;

      // 1. Link any email-only pending record for this email → set user_id on it
      try {
        await db.query(
          `UPDATE event_members SET user_id = $1, email = NULL, role = $3, deleted_at = NULL, joined_at = NOW()
           WHERE event_id = $2 AND user_id IS NULL AND deleted_at IS NULL
             AND LOWER(COALESCE(email, '')) = $4`,
          [existingUserId, eventId, memberRole, normalizedEmail]
        );
      } catch { /* email column may not exist */ }

      // 2. Un-delete / update any existing user_id-linked record
      await db.query(
        `UPDATE event_members SET deleted_at = NULL, role = $3, joined_at = NOW()
         WHERE user_id = $1 AND event_id = $2`,
        [existingUserId, eventId, memberRole]
      );

      // 3. Insert only if still no active record for this user
      await db.query(
        `INSERT INTO event_members (user_id, event_id, role, joined_at)
         SELECT $1, $2, $3, NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM event_members WHERE user_id = $1 AND event_id = $2 AND deleted_at IS NULL
         )`,
        [existingUserId, eventId, memberRole]
      );

      // Cancel any stale pending invitations
      await db.query(
        `UPDATE event_invitations SET status = 'cancelled'
         WHERE event_id = $1 AND LOWER(email) = $2 AND status = 'pending'`,
        [eventId, normalizedEmail]
      );

      sendTeamInviteExistingEmail({
        to:          normalizedEmail,
        inviteeName: userRows[0].full_name,
        inviterName,
        eventTitle,
        loginUrl:    `${env.frontendUrl}/login?redirect=/events/${eventId}`,
      }).catch(console.error);

      const { rows: newMember } = await db.query(
        `SELECT em.user_id, em.role, em.joined_at,
                u.full_name, u.email, u.avatar_url
         FROM event_members em
         JOIN users u ON u.id = em.user_id
         WHERE em.user_id = $1 AND em.event_id = $2 AND em.deleted_at IS NULL
         LIMIT 1`,
        [existingUserId, eventId]
      );

      return res.status(201).json({
        success: true,
        type:    "added",
        data:    newMember[0] ?? { email: normalizedEmail, role: memberRole },
      });
    }

    // ── CASE 1: New user — pre-create pending membership, send setup email ───

    // Cancel prior pending invites for this email + event
    await db.query(
      `UPDATE event_invitations SET status = 'cancelled'
       WHERE event_id = $1 AND LOWER(email) = $2 AND status = 'pending'`,
      [eventId, normalizedEmail]
    );

    // Upsert email-only event_members record (pending — no user_id)
    const { rows: pendingMember } = await db.query(
      `SELECT id FROM event_members
       WHERE LOWER(email) = $1 AND event_id = $2 AND user_id IS NULL AND deleted_at IS NULL
       LIMIT 1`,
      [normalizedEmail, eventId]
    );
    if (pendingMember.length) {
      await db.query(
        `UPDATE event_members SET role = $3, joined_at = NOW()
         WHERE LOWER(email) = $1 AND event_id = $2 AND user_id IS NULL`,
        [normalizedEmail, eventId, memberRole]
      );
    } else {
      await db.query(
        `INSERT INTO event_members (email, event_id, role, joined_at)
         VALUES ($1, $2, $3, NOW())`,
        [normalizedEmail, eventId, memberRole]
      );
    }

    // Create invitation — token is auto-generated (DEFAULT gen_random_uuid())
    const { rows: [newInv] } = await db.query(
      `INSERT INTO event_invitations
         (event_id, email, invited_by, invited_name, expires_at, role)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days', $5)
       RETURNING token`,
      [eventId, normalizedEmail, userId, inviteeName, memberRole]
    );

    sendTeamInviteNewEmail({
      to:          normalizedEmail,
      inviteeName,
      inviterName,
      eventTitle,
      setupUrl:    `${env.frontendUrl}/team/setup?token=${newInv.token}`,
    }).catch(console.error);

    return res.status(201).json({
      success: true,
      type:    "invited",
      data: { email: normalizedEmail, role: memberRole, pending: true },
    });
  } catch (e) {
    handleError(res, e);
  }
}

/* ── POST /team/portal-login (public) ───────────────────────────────────────── */
export async function portalLogin(req, res) {
  try {
    await ensureInvitationsTable();

    const { email, code } = req.body;
    if (!email?.trim() || !code?.trim()) {
      return res.status(400).json({ success: false, message: "Email and code are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode       = code.replace(/[-\s]/g, "").toUpperCase();

    const { rows: invRows } = await db.query(
      `SELECT i.*, e.title AS event_title
       FROM event_invitations i
       JOIN events e ON e.id = i.event_id
       WHERE LOWER(i.email) = $1
         AND i.status = 'pending'
         AND i.expires_at > NOW()
       ORDER BY i.created_at DESC`,
      [normalizedEmail]
    );

    if (!invRows.length) {
      return res.status(401).json({
        success: false,
        message: "No active invitation found for this email. The code may have expired.",
      });
    }

    let matchedInv = null;
    for (const inv of invRows) {
      if (inv.invite_code_hash && await bcrypt.compare(cleanCode, inv.invite_code_hash)) {
        matchedInv = inv;
        break;
      }
    }

    if (!matchedInv) {
      return res.status(401).json({
        success: false,
        message: "Invalid code. Please check the email and try again.",
      });
    }

    // Does an account already exist for this email?
    const { rows: userRows } = await db.query(
      `SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizedEmail]
    );

    if (userRows.length) {
      const userId = userRows[0].id;

      // Link any email-only event_members records for this user
      await db.query(
        `UPDATE event_members SET user_id = $1, email = NULL, joined_at = NOW()
         WHERE LOWER(email) = $2 AND user_id IS NULL AND deleted_at IS NULL`,
        [userId, normalizedEmail]
      );

      // Fallback: direct add if no email-only record existed
      await db.query(
        `INSERT INTO event_members (user_id, event_id, role, joined_at)
         SELECT $1, $2, COALESCE($3, 'ADMIN'), NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM event_members WHERE user_id = $1 AND event_id = $2 AND deleted_at IS NULL
         )`,
        [userId, matchedInv.event_id, matchedInv.role]
      );

      // Expire the token — single use only
      await db.query(
        `UPDATE event_invitations SET status = 'accepted', accepted_at = NOW(), user_id = $1 WHERE id = $2`,
        [userId, matchedInv.id]
      );

      return res.json({
        success:    true,
        userExists: true,
        eventTitle: matchedInv.event_title,
      });
    }

    // New user: return token so frontend can redirect to setup-password page
    return res.json({
      success:    true,
      isNewUser:  true,
      token:      matchedInv.token,
      eventTitle: matchedInv.event_title,
    });
  } catch (e) {
    handleError(res, e);
  }
}

/* ── POST /team/setup-password (public — new user account creation) ─────────── */
export async function setupPassword(req, res) {
  const client = await db.connect();
  try {
    await ensureInvitationsTable();

    const { token, full_name, password } = req.body;
    if (!token || !full_name?.trim() || !password) {
      return res.status(400).json({ success: false, message: "token, full_name and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    await client.query("BEGIN");

    const { rows: invRows } = await client.query(
      `SELECT * FROM event_invitations WHERE token = $1 FOR UPDATE`,
      [token]
    );
    if (!invRows.length) throw new AppError("Invitation not found", 404);
    const inv = invRows[0];
    if (inv.status !== "pending") throw new AppError("This invitation has already been used or cancelled", 410);
    if (new Date(inv.expires_at) < new Date()) throw new AppError("This invitation has expired", 410);

    const { rows: existingUser } = await client.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [inv.email]
    );
    if (existingUser.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please sign in instead.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows: userRows } = await client.query(
      `INSERT INTO users (email, password_hash, full_name, status, email_verified)
       VALUES ($1, $2, $3, 'ACTIVE', false)
       RETURNING id, email, full_name, avatar_url`,
      [inv.email.toLowerCase(), passwordHash, full_name.trim()]
    );
    const user = userRows[0];

    const orgSlug = inv.email.split("@")[0] + "-" + crypto.randomBytes(4).toString("hex");
    const { rows: orgRows } = await client.query(
      `INSERT INTO organizations (name, slug, owner_user_id, is_personal)
       VALUES ($1, $2, $3, true)
       RETURNING id`,
      [`${full_name.trim()}'s Events`, orgSlug, user.id]
    );
    const orgId = orgRows[0].id;

    await client.query(
      `INSERT INTO organization_members (organization_id, user_id, role, joined_at)
       VALUES ($1, $2, 'OWNER', NOW())`,
      [orgId, user.id]
    );
    await client.query(
      `UPDATE users SET default_organization_id = $1 WHERE id = $2`,
      [orgId, user.id]
    );

    // Link ALL email-only pending event_members for this email → covers any multi-event invites
    const { rowCount } = await client.query(
      `UPDATE event_members
       SET user_id = $1, email = NULL, joined_at = NOW()
       WHERE LOWER(email) = $2 AND user_id IS NULL AND deleted_at IS NULL`,
      [user.id, inv.email.toLowerCase()]
    );

    // Fallback: ensure this specific invitation's event has a membership row
    await client.query(
      `INSERT INTO event_members (user_id, event_id, role, joined_at)
       SELECT $1, $2, $3, NOW()
       WHERE NOT EXISTS (
         SELECT 1 FROM event_members WHERE user_id = $1 AND event_id = $2 AND deleted_at IS NULL
       )`,
      [user.id, inv.event_id, inv.role || EVENT_ROLES.ADMIN]
    );

    // Add to organization_members for every event org the user belongs to → see all org events
    await client.query(
      `INSERT INTO organization_members (organization_id, user_id, role, joined_at)
       SELECT DISTINCT e.organization_id, $1, 'event_manager', NOW()
       FROM event_members em
       JOIN events e ON e.id = em.event_id AND e.deleted_at IS NULL
       WHERE em.user_id = $1 AND em.deleted_at IS NULL AND em.role != 'OWNER'
         AND NOT EXISTS (
           SELECT 1 FROM organization_members om2
           WHERE om2.organization_id = e.organization_id AND om2.user_id = $1
         )`,
      [user.id]
    );

    // Expire the token — single use only
    await client.query(
      `UPDATE event_invitations SET status = 'accepted', accepted_at = NOW(), user_id = $1 WHERE token = $2`,
      [user.id, token]
    );

    const tokens = generateTokens({ userId: user.id, organizationId: orgId, role: "OWNER" });
    const refreshHash = hashToken(tokens.refreshToken);
    await client.query(
      `INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshHash]
    );

    await client.query("COMMIT");

    setAuthCookies(res, tokens);
    res.json({
      success:     true,
      accessToken: tokens.accessToken,
      eventId:     inv.event_id,
      user: { id: user.id, email: user.email, full_name: user.full_name, avatar_url: null },
    });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    handleError(res, e);
  } finally {
    client.release();
  }
}

/* ── GET /team/my-events (authenticated) ─────────────────────────────────────── */
export async function getMyTeamEvents(req, res) {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT e.id, e.title, e.status, e.starts_at_local, e.starts_at_utc,
              e.cover_image_url, e.event_type, e.organization_id,
              e.allow_rsvp, e.allow_ticketing, e.allow_donations,
              em.role, em.joined_at,
              u.full_name AS owner_name, u.avatar_url AS owner_avatar
       FROM event_members em
       JOIN events e ON e.id = em.event_id
       JOIN users u  ON u.id = (
         SELECT user_id FROM event_members
         WHERE event_id = e.id AND role = 'OWNER' AND deleted_at IS NULL
         LIMIT 1
       )
       WHERE em.user_id = $1
         AND em.role != 'OWNER'
         AND em.deleted_at IS NULL
         AND e.deleted_at IS NULL
       ORDER BY em.joined_at DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (e) {
    handleError(res, e);
  }
}

/* ── GET /team/my-role/:eventId (authenticated) ─────────────────────────────── */
export async function getMyRoleForEvent(req, res) {
  try {
    const userId  = req.user.id;
    const { eventId } = req.params;

    const member = await getEventMember(userId, eventId);
    if (!member) return res.status(403).json({ success: false, message: "Not a team member" });

    // Fetch event basic info
    const { rows } = await db.query(
      `SELECT e.id, e.title, e.status, e.starts_at_local, e.ends_at_local,
              e.cover_image_url, e.allow_rsvp, e.allow_ticketing, e.allow_donations,
              e.description, e.venue_name, e.venue_address, e.city, e.country,
              e.event_type, e.visibility,
              u.full_name AS owner_name
       FROM events e
       JOIN event_members em ON em.event_id = e.id AND em.role = 'OWNER' AND em.deleted_at IS NULL
       JOIN users u ON u.id = em.user_id
       WHERE e.id = $1 AND e.deleted_at IS NULL
       LIMIT 1`,
      [eventId]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: "Event not found" });

    res.json({
      success: true,
      data: {
        ...rows[0],
        role: member.role,
        permissions: getRolePermissions(member.role),
      }
    });
  } catch (e) {
    handleError(res, e);
  }
}

/* ── Role permission map ─────────────────────────────────────────────────────── */
export function getRolePermissions(role) {
  const map = {
    OWNER:         { canEdit: true,  canDelete: true,  canManageTeam: true,  canManageGuests: true,  canCheckin: true,  canViewAnalytics: true,  canPublish: true  },
    ADMIN:         { canEdit: true,  canDelete: false, canManageTeam: true,  canManageGuests: true,  canCheckin: true,  canViewAnalytics: true,  canPublish: true  },
    MANAGER:       { canEdit: true,  canDelete: false, canManageTeam: false, canManageGuests: true,  canCheckin: true,  canViewAnalytics: true,  canPublish: false },
    STAFF:         { canEdit: false, canDelete: false, canManageTeam: false, canManageGuests: true,  canCheckin: true,  canViewAnalytics: false, canPublish: false },
    CHECKIN_AGENT: { canEdit: false, canDelete: false, canManageTeam: false, canManageGuests: false, canCheckin: true,  canViewAnalytics: false, canPublish: false },
    VIEWER:        { canEdit: false, canDelete: false, canManageTeam: false, canManageGuests: false, canCheckin: false, canViewAnalytics: true,  canPublish: false },
  };
  return map[role] ?? map.VIEWER;
}

/* ── POST /events/:eventId/team/accept/:token (authed — backward compat) ──────── */
export async function acceptInvite(req, res) {
  try {
    await ensureInvitationsTable();

    const { token } = req.params;
    const userId    = req.user.id;

    const { rows: invRows } = await db.query(
      `SELECT * FROM event_invitations WHERE token = $1 LIMIT 1`,
      [token]
    );
    if (!invRows.length) throw new AppError("Invitation not found", 404);

    const inv = invRows[0];
    if (inv.status !== "pending") throw new AppError("Invitation has already been used or cancelled", 410);
    if (new Date(inv.expires_at) < new Date()) throw new AppError("Invitation has expired", 410);

    const { rows: userRows } = await db.query(
      `SELECT email FROM users WHERE id = $1 LIMIT 1`, [userId]
    );
    const userEmail = userRows[0]?.email?.toLowerCase();
    if (userEmail !== inv.email.toLowerCase()) {
      throw new AppError("This invitation was sent to a different email address", 403);
    }

    // Link email-only records and ensure membership
    await db.query(
      `UPDATE event_members SET user_id = $1, email = NULL, joined_at = NOW()
       WHERE LOWER(email) = $2 AND user_id IS NULL AND deleted_at IS NULL`,
      [userId, userEmail]
    );
    await db.query(
      `INSERT INTO event_members (user_id, event_id, role, joined_at)
       SELECT $1, $2, COALESCE($3, 'ADMIN'), NOW()
       WHERE NOT EXISTS (
         SELECT 1 FROM event_members WHERE user_id = $1 AND event_id = $2 AND deleted_at IS NULL
       )`,
      [userId, inv.event_id, inv.role]
    );

    // Expire the token
    await db.query(
      `UPDATE event_invitations SET status = 'accepted', accepted_at = NOW(), user_id = $1 WHERE token = $2`,
      [userId, token]
    );

    res.json({ success: true, eventId: inv.event_id });
  } catch (e) {
    handleError(res, e);
  }
}

/* ── GET /team/invite-info/:token (public) ───────────────────────────────────── */
export async function getInviteInfo(req, res) {
  try {
    await ensureInvitationsTable();

    const { token } = req.params;
    const { rows } = await db.query(
      `SELECT i.token, i.email, i.status, i.expires_at, i.invited_name,
              e.title AS event_title, e.id AS event_id,
              u.full_name AS inviter_name,
              EXISTS(SELECT 1 FROM users WHERE LOWER(email) = LOWER(i.email)) AS user_exists
       FROM event_invitations i
       JOIN events e ON e.id = i.event_id
       JOIN users u ON u.id = i.invited_by
       WHERE i.token = $1 LIMIT 1`,
      [token]
    );

    if (!rows.length) throw new AppError("Invitation not found", 404);

    const inv = rows[0];
    if (inv.status !== "pending") {
      return res.json({ success: true, status: inv.status, eventTitle: inv.event_title });
    }
    if (new Date(inv.expires_at) < new Date()) {
      return res.json({ success: true, status: "expired", eventTitle: inv.event_title });
    }

    res.json({
      success:      true,
      status:       "pending",
      email:        inv.email,
      eventId:      inv.event_id,
      eventTitle:   inv.event_title,
      inviterName:  inv.inviter_name,
      inviteeName:  inv.invited_name,
      userExists:   inv.user_exists,
    });
  } catch (e) {
    handleError(res, e);
  }
}

/* ── DELETE /events/:eventId/team/:memberId ──────────────────────────────────── */
export async function removeMember(req, res) {
  try {
    const { eventId, memberId } = req.params;
    const userId = req.user.id;

    const caller = await getEventMember(userId, eventId);
    if (!caller || caller.role !== EVENT_ROLES.OWNER) {
      throw new AppError("Only the event owner can remove team members", 403);
    }
    if (memberId === userId) throw new AppError("Cannot remove yourself as owner", 400);

    const target = await getEventMember(memberId, eventId);
    if (!target) throw new AppError("Member not found", 404);
    if (target.role === EVENT_ROLES.OWNER) throw new AppError("Cannot remove the event owner", 400);

    await db.query(
      `UPDATE event_members SET deleted_at = NOW()
       WHERE user_id = $1 AND event_id = $2 AND deleted_at IS NULL`,
      [memberId, eventId]
    );

    res.json({ success: true });
  } catch (e) {
    handleError(res, e);
  }
}
