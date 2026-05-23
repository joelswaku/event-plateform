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

/* ── Table bootstrap ─────────────────────────────────────────────────────────── */
let _tableReady = false;
async function ensureInvitationsTable() {
  if (_tableReady) return;
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
  await db.query(`ALTER TABLE event_invitations ADD COLUMN IF NOT EXISTS invite_code_hash TEXT`);
  await db.query(`ALTER TABLE event_invitations ADD COLUMN IF NOT EXISTS invited_name TEXT`);
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

/* Generates a human-friendly 6-char code, e.g. "K7XQ3P" */
function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* Format code for display: "K7X-Q3P" */
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

    const { rows } = await db.query(
      `SELECT em.user_id, em.role, em.joined_at,
              u.full_name, u.email, u.avatar_url
       FROM event_members em
       JOIN users u ON u.id = em.user_id
       WHERE em.event_id = $1 AND em.deleted_at IS NULL
       ORDER BY
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
    const { email, name } = req.body;

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
      `SELECT title FROM events WHERE id = $1 LIMIT 1`,
      [eventId]
    );
    const eventTitle = evtRows[0]?.title ?? "your event";

    const { rows: inviterRows } = await db.query(
      `SELECT full_name FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const inviterName = inviterRows[0]?.full_name ?? "Event owner";

    const normalizedEmail = email.trim().toLowerCase();

    // Check if already a team member
    const { rows: memberRows } = await db.query(
      `SELECT em.user_id FROM event_members em
       JOIN users u ON u.id = em.user_id
       WHERE LOWER(u.email) = $1 AND em.event_id = $2 AND em.deleted_at IS NULL
       LIMIT 1`,
      [normalizedEmail, eventId]
    );
    if (memberRows.length) throw new AppError("This user is already a team member", 409);

    // Check if inviter is trying to add themselves
    const { rows: selfRows } = await db.query(
      `SELECT id FROM users WHERE id = $1 AND LOWER(email) = $2 LIMIT 1`,
      [userId, normalizedEmail]
    );
    if (selfRows.length) throw new AppError("You cannot invite yourself", 400);

    // Check whether the email is already registered
    const { rows: userRows } = await db.query(
      `SELECT id, full_name FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizedEmail]
    );
    const isExistingUser = userRows.length > 0;

    // Cancel prior pending invites for this email + event
    await db.query(
      `UPDATE event_invitations SET status = 'cancelled'
       WHERE event_id = $1 AND LOWER(email) = $2 AND status = 'pending'`,
      [eventId, normalizedEmail]
    );

    // Generate a short code
    const rawCode  = generateInviteCode();
    const codeHash = await bcrypt.hash(rawCode, 10);

    const inviteeName = name?.trim() || null;
    await db.query(
      `INSERT INTO event_invitations (event_id, email, invited_by, invite_code_hash, invited_name, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')`,
      [eventId, normalizedEmail, userId, codeHash, inviteeName]
    );

    const portalUrl    = `${env.frontendUrl}/team/portal`;
    const displayCode  = formatCode(rawCode);

    if (isExistingUser) {
      sendTeamInviteExistingEmail({
        to:          normalizedEmail,
        inviteeName: userRows[0].full_name,
        inviterName,
        eventTitle,
        code:        displayCode,
        portalUrl,
      }).catch(console.error);
    } else {
      sendTeamInviteNewEmail({
        to:          normalizedEmail,
        inviteeName,
        inviterName,
        eventTitle,
        code:        displayCode,
        portalUrl,
      }).catch(console.error);
    }

    return res.status(201).json({
      success: true,
      type: "invited",
      data: {
        email:       normalizedEmail,
        role:        EVENT_ROLES.ADMIN,
        pending:     true,
        isExistingUser,
      },
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

    // Find all pending, non-expired invitations for this email
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

    // Find matching code
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

    // Does a user account already exist for this email?
    const { rows: userRows } = await db.query(
      `SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizedEmail]
    );

    if (userRows.length) {
      // ── Existing user: add them to the event now, then tell them to sign in ──
      const userId = userRows[0].id;
      await db.query(
        `UPDATE event_members SET deleted_at = NULL, role = $3, joined_at = NOW()
         WHERE user_id = $1 AND event_id = $2`,
        [userId, matchedInv.event_id, EVENT_ROLES.ADMIN]
      );
      await db.query(
        `INSERT INTO event_members (user_id, event_id, role, joined_at)
         SELECT $1, $2, $3, NOW()
         WHERE NOT EXISTS (SELECT 1 FROM event_members WHERE user_id = $1 AND event_id = $2)`,
        [userId, matchedInv.event_id, EVENT_ROLES.ADMIN]
      );
      await db.query(
        `UPDATE event_invitations SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
        [matchedInv.id]
      );

      return res.json({
        success:    true,
        userExists: true,
        eventTitle: matchedInv.event_title,
      });
    }

    // ── New user: return the invite token so frontend can redirect to setup page ──
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

    await client.query(
      `UPDATE event_members SET deleted_at = NULL, role = $3, joined_at = NOW()
       WHERE user_id = $1 AND event_id = $2`,
      [user.id, inv.event_id, EVENT_ROLES.ADMIN]
    );
    await client.query(
      `INSERT INTO event_members (user_id, event_id, role, joined_at)
       SELECT $1, $2, $3, NOW()
       WHERE NOT EXISTS (SELECT 1 FROM event_members WHERE user_id = $1 AND event_id = $2)`,
      [user.id, inv.event_id, EVENT_ROLES.ADMIN]
    );

    await client.query(
      `UPDATE event_invitations SET status = 'accepted', accepted_at = NOW() WHERE token = $1`,
      [token]
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
              em.role, em.joined_at,
              u.full_name AS owner_name
       FROM event_members em
       JOIN events e ON e.id = em.event_id
       JOIN users u  ON u.id = (
         SELECT user_id FROM event_members
         WHERE event_id = e.id AND role = 'OWNER' AND deleted_at IS NULL
         LIMIT 1
       )
       WHERE em.user_id = $1
         AND em.role = 'ADMIN'
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

/* ── POST /events/:eventId/team/accept/:token (authed — kept for backwards compat) */
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
      `SELECT email FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const userEmail = userRows[0]?.email?.toLowerCase();
    if (userEmail !== inv.email.toLowerCase()) {
      throw new AppError("This invitation was sent to a different email address", 403);
    }

    const existing = await getEventMember(userId, inv.event_id);
    if (existing) {
      await db.query(
        `UPDATE event_invitations SET status = 'accepted', accepted_at = NOW() WHERE token = $1`,
        [token]
      );
      return res.json({ success: true, eventId: inv.event_id, alreadyMember: true });
    }

    await db.query(
      `UPDATE event_members SET deleted_at = NULL, role = $3, joined_at = NOW()
       WHERE user_id = $1 AND event_id = $2`,
      [userId, inv.event_id, EVENT_ROLES.ADMIN]
    );
    await db.query(
      `INSERT INTO event_members (user_id, event_id, role, joined_at)
       SELECT $1, $2, $3, NOW()
       WHERE NOT EXISTS (SELECT 1 FROM event_members WHERE user_id = $1 AND event_id = $2)`,
      [userId, inv.event_id, EVENT_ROLES.ADMIN]
    );
    await db.query(
      `UPDATE event_invitations SET status = 'accepted', accepted_at = NOW() WHERE token = $1`,
      [token]
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
              u.full_name AS inviter_name
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
