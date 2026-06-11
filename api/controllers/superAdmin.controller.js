import { db }    from "../config/db.js";
import { audit } from "../services/audit.service.js";

function handleError(res, err) {
  console.error("[SuperAdmin]", err);
  res.status(500).json({ success: false, message: err.message || "Internal error" });
}

/* ── GET /super-admin/stats ──────────────────────────────────────────────── */
export async function getPlatformStats(req, res) {
  try {
    const [usersRes, eventsRes, orgsRes, ticketsRes, revenueRes, activeRes, newUsersRes] =
      await Promise.all([
        db.query(`SELECT COUNT(*)::int AS total FROM users WHERE deleted_at IS NULL`),
        db.query(`SELECT COUNT(*)::int AS total FROM events WHERE deleted_at IS NULL`),
        db.query(`SELECT COUNT(*)::int AS total FROM organizations WHERE deleted_at IS NULL`),
        db.query(`SELECT COUNT(*)::int AS total FROM issued_tickets`),
        db.query(`SELECT COALESCE(SUM(total),0)::numeric AS total FROM ticket_orders WHERE payment_status='PAID'`),
        db.query(`SELECT COUNT(*)::int AS total FROM events WHERE status='PUBLISHED' AND deleted_at IS NULL`),
        db.query(`SELECT COUNT(*)::int AS total FROM users WHERE created_at > NOW()-INTERVAL '30 days' AND deleted_at IS NULL`),
      ]);

    res.json({
      success: true,
      data: {
        totalUsers:     usersRes.rows[0].total,
        totalEvents:    eventsRes.rows[0].total,
        totalOrgs:      orgsRes.rows[0].total,
        totalTickets:   ticketsRes.rows[0].total,
        totalRevenue:   parseFloat(revenueRes.rows[0].total),
        activeEvents:   activeRes.rows[0].total,
        newUsersLast30: newUsersRes.rows[0].total,
      },
    });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/revenue ────────────────────────────────────────────── */
export async function getRevenueOverview(req, res) {
  try {
    const { rows: monthly } = await db.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YYYY') AS month,
        DATE_TRUNC('month', paid_at)                       AS month_date,
        COUNT(*)::int                                       AS tickets,
        COALESCE(SUM(total),0)::numeric                    AS revenue
      FROM ticket_orders
      WHERE payment_status='PAID'
        AND paid_at > NOW()-INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', paid_at)
      ORDER BY month_date ASC
    `);

    const { rows: topEvents } = await db.query(`
      SELECT
        e.id, e.title, e.event_type,
        o.name AS org_name,
        COUNT(to2.id)::int                       AS ticket_count,
        COALESCE(SUM(to2.total),0)::numeric      AS revenue
      FROM ticket_orders to2
      JOIN events e ON e.id = to2.event_id
      JOIN organizations o ON o.id = e.organization_id
      WHERE to2.payment_status='PAID'
      GROUP BY e.id, e.title, e.event_type, o.name
      ORDER BY revenue DESC
      LIMIT 10
    `);

    const { rows: topOrgs } = await db.query(`
      SELECT
        o.id, o.name,
        COUNT(DISTINCT e.id)::int          AS event_count,
        COUNT(to2.id)::int                 AS ticket_count,
        COALESCE(SUM(to2.total),0)::numeric AS revenue
      FROM organizations o
      JOIN events e ON e.organization_id = o.id
      LEFT JOIN ticket_orders to2 ON to2.event_id = e.id AND to2.payment_status='PAID'
      GROUP BY o.id, o.name
      ORDER BY revenue DESC
      LIMIT 10
    `);

    res.json({ success: true, data: { monthly, topEvents, topOrgs } });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/events ─────────────────────────────────────────────── */
export async function getAllEvents(req, res) {
  try {
    const page   = Math.max(parseInt(req.query.page  ?? "1"),  1);
    const limit  = Math.min(parseInt(req.query.limit ?? "50"), 100);
    const offset = (page - 1) * limit;
    const q      = req.query.q?.trim() ?? "";
    const status = req.query.status?.toUpperCase();

    const conditions = ["e.deleted_at IS NULL"];
    const params     = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(e.title ILIKE $${params.length} OR o.name ILIKE $${params.length})`);
    }
    if (status && ["PUBLISHED","DRAFT","ARCHIVED","CANCELLED"].includes(status)) {
      params.push(status);
      conditions.push(`e.status = $${params.length}`);
    }

    const where = conditions.join(" AND ");

    const { rows: events } = await db.query(
      `SELECT
         e.id, e.title, e.status, e.event_type, e.visibility,
         e.starts_at, e.cover_image_url, e.created_at,
         o.id AS org_id, o.name AS org_name,
         u.full_name AS owner_name, u.email AS owner_email,
         COUNT(DISTINCT g.id)::int   AS guest_count,
         COUNT(DISTINCT it.id)::int  AS ticket_count,
         COALESCE(SUM(CASE WHEN to2.payment_status='PAID' THEN to2.total END),0)::numeric AS revenue
       FROM events e
       JOIN organizations o ON o.id = e.organization_id
       JOIN users u ON u.id = e.created_by
       LEFT JOIN guests g ON g.event_id = e.id AND g.deleted_at IS NULL
       LEFT JOIN issued_tickets it ON it.event_id = e.id
       LEFT JOIN ticket_orders to2 ON to2.event_id = e.id
       WHERE ${where}
       GROUP BY e.id, o.id, o.name, u.full_name, u.email
       ORDER BY e.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const { rows: countRes } = await db.query(
      `SELECT COUNT(DISTINCT e.id)::int AS total
       FROM events e
       JOIN organizations o ON o.id = e.organization_id
       WHERE ${where}`,
      params
    );

    res.json({ success: true, data: events, meta: { total: countRes[0].total, page, limit } });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/organizations ─────────────────────────────────────── */
export async function getAllOrganizations(req, res) {
  try {
    const page   = Math.max(parseInt(req.query.page  ?? "1"),  1);
    const limit  = Math.min(parseInt(req.query.limit ?? "50"), 100);
    const offset = (page - 1) * limit;
    const q      = req.query.q?.trim() ?? "";

    const params = [];
    let where = "o.deleted_at IS NULL";
    if (q) {
      params.push(`%${q}%`);
      where += ` AND (o.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    const { rows: orgs } = await db.query(
      `SELECT
         o.id, o.name, o.slug, o.is_personal, o.created_at,
         u.subscription_plan AS plan,
         u.full_name AS owner_name, u.email AS owner_email, u.id AS owner_id,
         COUNT(DISTINCT e.id)::int   AS event_count,
         COUNT(DISTINCT om.user_id)::int AS member_count
       FROM organizations o
       JOIN users u ON u.id = o.owner_user_id
       LEFT JOIN events e ON e.organization_id = o.id AND e.deleted_at IS NULL
       LEFT JOIN organization_members om ON om.organization_id = o.id
       WHERE ${where}
       GROUP BY o.id, u.full_name, u.email, u.id, u.subscription_plan
       ORDER BY o.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const { rows: countRes } = await db.query(
      `SELECT COUNT(DISTINCT o.id)::int AS total
       FROM organizations o
       JOIN users u ON u.id = o.owner_user_id
       WHERE ${where}`,
      params
    );

    res.json({ success: true, data: orgs, meta: { total: countRes[0].total, page, limit } });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/users ──────────────────────────────────────────────── */
export async function getAllUsers(req, res) {
  try {
    const page   = Math.max(parseInt(req.query.page  ?? "1"),  1);
    const limit  = Math.min(parseInt(req.query.limit ?? "50"), 100);
    const offset = (page - 1) * limit;
    const q      = req.query.q?.trim() ?? "";

    const params = [];
    let where = "u.deleted_at IS NULL";
    if (q) {
      params.push(`%${q}%`);
      where += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    const { rows: users } = await db.query(
      `SELECT
         u.id, u.full_name, u.email, u.status, u.is_super_admin,
         u.created_at, u.last_login_at, u.subscription_plan AS plan,
         o.name AS org_name,
         COUNT(DISTINCT e.id)::int AS event_count
       FROM users u
       LEFT JOIN organizations o ON o.id = u.default_organization_id
       LEFT JOIN events e ON e.organization_id = o.id AND e.deleted_at IS NULL
       WHERE ${where}
       GROUP BY u.id, o.name
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const { rows: countRes } = await db.query(
      `SELECT COUNT(*)::int AS total FROM users u WHERE ${where}`,
      params
    );

    res.json({ success: true, data: users, meta: { total: countRes[0].total, page, limit } });
  } catch (e) { handleError(res, e); }
}

/* ── PATCH /super-admin/users/:userId ───────────────────────────────────── */
export async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { status, is_super_admin, is_active } = req.body;

    const updates = [];
    const params  = [];

    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }
    if (is_super_admin !== undefined) {
      params.push(is_super_admin);
      updates.push(`is_super_admin = $${params.length}`);
    }
    // Mobile sends is_active; map to status column
    if (is_active !== undefined && status === undefined) {
      params.push(is_active ? "ACTIVE" : "INACTIVE");
      updates.push(`status = $${params.length}`);
    }

    if (!updates.length) return res.status(400).json({ success: false, message: "Nothing to update" });

    params.push(userId);
    const { rows } = await db.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${params.length}
       RETURNING id, full_name, email, status, is_super_admin`,
      params
    );

    const target = rows[0];

    if (status !== undefined) {
      await audit({
        adminId: req.user.id,
        action: status === "SUSPENDED" ? "user_suspended"
               : status === "ACTIVE"   ? "user_activated"
               :                         "user_status_changed",
        resourceType: "user", resourceId: userId,
        details: { new_status: status, target_email: target?.email, target_name: target?.full_name },
        ip: req.ip, userAgent: req.headers["user-agent"],
      });
    }
    if (is_active !== undefined && status === undefined) {
      await audit({
        adminId: req.user.id,
        action: is_active ? "user_activated" : "user_deactivated",
        resourceType: "user", resourceId: userId,
        details: { is_active, target_email: target?.email, target_name: target?.full_name },
        ip: req.ip, userAgent: req.headers["user-agent"],
      });
    }
    if (is_super_admin !== undefined) {
      await audit({
        adminId: req.user.id,
        action: is_super_admin ? "user_promoted_superadmin" : "user_demoted_superadmin",
        resourceType: "user", resourceId: userId,
        details: { is_super_admin, target_email: target?.email, target_name: target?.full_name },
        ip: req.ip, userAgent: req.headers["user-agent"],
      });
    }

    res.json({ success: true, data: target });
  } catch (e) { handleError(res, e); }
}

/* ── POST /super-admin/organizations ────────────────────────────────────── */
export async function createEnterpriseOrganization(req, res) {
  try {
    const { name, owner_email, plan = "pro" } = req.body;

    if (!name?.trim() || !owner_email?.trim()) {
      return res.status(400).json({ success: false, message: "name and owner_email are required" });
    }

    const { rows: userRows } = await db.query(
      `SELECT id, full_name FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1`,
      [owner_email.trim().toLowerCase()]
    );
    if (!userRows.length) return res.status(404).json({ success: false, message: "User not found with that email" });

    const ownerId = userRows[0].id;
    const slug    = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

    const { rows: orgRows } = await db.query(
      `INSERT INTO organizations (name, slug, owner_user_id, is_personal)
       VALUES ($1, $2, $3, false)
       RETURNING id, name, slug`,
      [name.trim(), slug, ownerId]
    );
    const org = orgRows[0];

    await db.query(
      `INSERT INTO organization_members (organization_id, user_id, role, joined_at)
       VALUES ($1, $2, 'OWNER', NOW())
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [org.id, ownerId]
    );

    await db.query(`UPDATE users SET subscription_plan=$1 WHERE id=$2`, [plan, ownerId]);

    await audit({
      adminId: req.user.id,
      action: "org_created",
      resourceType: "organization", resourceId: org.id,
      details: { org_name: org.name, slug: org.slug, owner_email, plan },
      ip: req.ip, userAgent: req.headers["user-agent"],
    });

    res.status(201).json({ success: true, data: { org, owner: userRows[0] } });
  } catch (e) { handleError(res, e); }
}

/* ── POST /super-admin/organizations/:orgId/members ─────────────────────── */
export async function addOrgMember(req, res) {
  try {
    const { orgId } = req.params;
    const { email, role = "ADMIN" } = req.body;

    if (!email?.trim()) return res.status(400).json({ success: false, message: "email is required" });

    const ALLOWED_ROLES = ["OWNER","ADMIN","MANAGER","MEMBER"];
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `role must be one of ${ALLOWED_ROLES.join(", ")}` });
    }

    const { rows: userRows } = await db.query(
      `SELECT id, full_name, email FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1`,
      [email.trim().toLowerCase()]
    );
    if (!userRows.length) return res.status(404).json({ success: false, message: "User not found" });

    await db.query(
      `INSERT INTO organization_members (organization_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (organization_id, user_id) DO UPDATE SET role = $3`,
      [orgId, userRows[0].id, role]
    );

    await audit({
      adminId: req.user.id,
      action: "org_member_added",
      resourceType: "organization", resourceId: orgId,
      details: { member_email: userRows[0].email, member_name: userRows[0].full_name, role },
      ip: req.ip, userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, data: { user: userRows[0], role } });
  } catch (e) { handleError(res, e); }
}

/* ── DELETE /super-admin/events/:eventId ─────────────────────────────────── */
export async function deleteEvent(req, res) {
  try {
    const { eventId } = req.params;
    const { rows: ev } = await db.query(
      `SELECT title, organization_id FROM events WHERE id=$1`,
      [eventId]
    );
    await db.query(`UPDATE events SET deleted_at=NOW() WHERE id=$1`, [eventId]);
    await audit({
      adminId: req.user.id,
      action: "event_deleted",
      resourceType: "event", resourceId: eventId,
      details: { title: ev[0]?.title, organization_id: ev[0]?.organization_id },
      ip: req.ip, userAgent: req.headers["user-agent"],
    });
    res.json({ success: true });
  } catch (e) { handleError(res, e); }
}

/* ── PATCH /super-admin/events/:eventId ──────────────────────────────────── */
export async function updateEvent(req, res) {
  try {
    const { eventId } = req.params;
    const { status, visibility } = req.body;

    const updates = [];
    const params  = [];

    if (status)     { params.push(status);     updates.push(`status = $${params.length}`); }
    if (visibility) { params.push(visibility); updates.push(`visibility = $${params.length}`); }
    if (!updates.length) return res.status(400).json({ success: false, message: "Nothing to update" });

    params.push(eventId);
    const { rows } = await db.query(
      `UPDATE events SET ${updates.join(", ")} WHERE id=$${params.length}
       RETURNING id, title, status, visibility`,
      params
    );
    await audit({
      adminId: req.user.id,
      action: status ? "event_status_changed" : "event_updated",
      resourceType: "event", resourceId: eventId,
      details: { title: rows[0]?.title, status, visibility },
      ip: req.ip, userAgent: req.headers["user-agent"],
    });
    res.json({ success: true, data: rows[0] });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/organizations/:orgId ───────────────────────────────── */
export async function getOrganizationDetail(req, res) {
  try {
    const { orgId } = req.params;

    const { rows: orgRows } = await db.query(
      `SELECT o.*, u.full_name AS owner_name, u.email AS owner_email, u.subscription_plan AS plan
       FROM organizations o
       JOIN users u ON u.id = o.owner_user_id
       WHERE o.id = $1`,
      [orgId]
    );
    if (!orgRows.length) return res.status(404).json({ success: false, message: "Organization not found" });

    const [{ rows: members }, { rows: events }] = await Promise.all([
      db.query(
        `SELECT u.id, u.full_name, u.email, u.avatar_url, om.role, om.joined_at
         FROM organization_members om
         JOIN users u ON u.id = om.user_id
         WHERE om.organization_id=$1 ORDER BY om.joined_at`,
        [orgId]
      ),
      db.query(
        `SELECT e.id, e.title, e.status, e.event_type, e.starts_at,
                COUNT(DISTINCT g.id)::int AS guest_count,
                COUNT(DISTINCT it.id)::int AS ticket_count,
                COALESCE(SUM(CASE WHEN to2.payment_status='PAID' THEN to2.total END),0)::numeric AS revenue
         FROM events e
         LEFT JOIN guests g ON g.event_id=e.id AND g.deleted_at IS NULL
         LEFT JOIN issued_tickets it ON it.event_id=e.id
         LEFT JOIN ticket_orders to2 ON to2.event_id=e.id
         WHERE e.organization_id=$1 AND e.deleted_at IS NULL
         GROUP BY e.id ORDER BY e.created_at DESC LIMIT 20`,
        [orgId]
      ),
    ]);

    res.json({ success: true, data: { org: orgRows[0], members, events } });
  } catch (e) { handleError(res, e); }
}

/* ── PATCH /super-admin/organizations/:orgId/plan ───────────────────────── */
export async function updateOrgPlan(req, res) {
  try {
    const { orgId } = req.params;
    const { plan }  = req.body;
    if (!plan) return res.status(400).json({ success: false, message: "plan is required" });

    const { rows: orgRows } = await db.query(
      `SELECT name FROM organizations WHERE id=$1`,
      [orgId]
    );

    const { rows } = await db.query(
      `UPDATE users SET subscription_plan=$1
       WHERE id=(SELECT owner_user_id FROM organizations WHERE id=$2)
       RETURNING id, email, subscription_plan AS plan`,
      [plan, orgId]
    );

    await audit({
      adminId: req.user.id,
      action: "org_plan_updated",
      resourceType: "organization", resourceId: orgId,
      details: { org_name: orgRows[0]?.name, new_plan: plan, owner_email: rows[0]?.email },
      ip: req.ip, userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, data: rows[0] });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/activity ─── */
export async function getActivityFeed(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit ?? "60"), 100);

    const [newUsers, tickets, published, upgrades] = await Promise.all([
      db.query(
        `SELECT id, full_name, email, created_at, 'user_registered' AS type
         FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1`,
        [limit]
      ),
      db.query(
        `SELECT to2.id, to2.created_at, to2.total AS amount_paid,
                to2.buyer_name, to2.buyer_email,
                e.title AS event_title,
                'ticket_purchased' AS type
         FROM ticket_orders to2
         JOIN events e ON e.id = to2.event_id
         WHERE to2.payment_status = 'PAID'
         ORDER BY to2.paid_at DESC LIMIT $1`,
        [limit]
      ),
      db.query(
        `SELECT e.id, e.title, e.updated_at AS created_at,
                o.name AS org_name, 'event_published' AS type
         FROM events e
         JOIN organizations o ON o.id = e.organization_id
         WHERE e.status='PUBLISHED' AND e.deleted_at IS NULL
         ORDER BY e.updated_at DESC LIMIT $1`,
        [limit]
      ),
      db.query(
        `SELECT u.id, u.full_name, u.email, u.subscription_plan, u.updated_at AS created_at, 'plan_upgraded' AS type
         FROM users u
         WHERE u.subscription_plan != 'free'
           AND u.is_subscribed = true
           AND u.updated_at > NOW()-INTERVAL '30 days'
           AND u.deleted_at IS NULL
         ORDER BY u.updated_at DESC LIMIT $1`,
        [limit]
      ),
    ]);

    const all = [
      ...newUsers.rows.map(r  => ({ ...r, id: `user_reg_${r.id}`  })),
      ...tickets.rows.map(r   => ({ ...r, id: `ticket_${r.id}`    })),
      ...published.rows.map(r => ({ ...r, id: `event_pub_${r.id}` })),
      ...upgrades.rows.map(r  => ({ ...r, id: `user_upg_${r.id}`  })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    res.json({ success: true, data: all });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/financial ─── */
export async function getFinancialOverview(req, res) {
  try {
    const [gmvRes, dailyRes, weeklyRes, daily30Res, topBuyersRes] = await Promise.all([
      db.query(
        `SELECT COALESCE(SUM(total),0)::numeric AS gmv,
                COUNT(*)::int AS total_transactions,
                COALESCE(AVG(total),0)::numeric AS avg_transaction
         FROM ticket_orders WHERE payment_status='PAID'`
      ),
      db.query(
        `SELECT COALESCE(SUM(total),0)::numeric AS revenue, COUNT(*)::int AS tickets
         FROM ticket_orders WHERE payment_status='PAID' AND paid_at > NOW()-INTERVAL '24 hours'`
      ),
      db.query(
        `SELECT COALESCE(SUM(total),0)::numeric AS revenue, COUNT(*)::int AS tickets
         FROM ticket_orders WHERE payment_status='PAID' AND paid_at > NOW()-INTERVAL '7 days'`
      ),
      db.query(
        `SELECT TO_CHAR(DATE_TRUNC('day',paid_at),'MM/DD') AS day,
                DATE_TRUNC('day',paid_at) AS day_date,
                COALESCE(SUM(total),0)::numeric AS revenue,
                COUNT(*)::int AS tickets
         FROM ticket_orders
         WHERE payment_status='PAID' AND paid_at > NOW()-INTERVAL '30 days'
         GROUP BY DATE_TRUNC('day',paid_at) ORDER BY day_date ASC`
      ),
      db.query(
        `SELECT buyer_name, buyer_email,
                COUNT(*)::int AS tickets,
                SUM(total)::numeric AS total_spent
         FROM ticket_orders
         WHERE payment_status='PAID'
         GROUP BY buyer_name, buyer_email
         ORDER BY total_spent DESC LIMIT 10`
      ),
    ]);

    const gmv  = parseFloat(gmvRes.rows[0].gmv);
    const fees = gmv * 0.029 + gmvRes.rows[0].total_transactions * 0.30;

    res.json({
      success: true,
      data: {
        gmv, netRevenue: gmv - fees, estimatedFees: fees,
        totalTransactions: gmvRes.rows[0].total_transactions,
        avgTransaction: parseFloat(gmvRes.rows[0].avg_transaction),
        last24h: { revenue: parseFloat(dailyRes.rows[0].revenue), tickets: dailyRes.rows[0].tickets },
        last7d:  { revenue: parseFloat(weeklyRes.rows[0].revenue), tickets: weeklyRes.rows[0].tickets },
        daily30: daily30Res.rows,
        topBuyers: topBuyersRes.rows,
      },
    });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/health ─── */
export async function getPlatformHealth(req, res) {
  try {
    const start = Date.now();
    let dbStatus = "operational", dbLatency = 0;
    try {
      const t = Date.now();
      await db.query("SELECT 1");
      dbLatency = Date.now() - t;
    } catch { dbStatus = "down"; }

    const [counts, failed, active] = await Promise.all([
      db.query(
        `SELECT (SELECT COUNT(*)::int FROM users WHERE deleted_at IS NULL) AS users,
                (SELECT COUNT(*)::int FROM events WHERE deleted_at IS NULL) AS events,
                (SELECT COUNT(*)::int FROM issued_tickets) AS tickets`
      ),
      db.query(
        `SELECT COUNT(*)::int AS count FROM ticket_orders
         WHERE payment_status IN ('FAILED','CANCELLED') AND created_at > NOW()-INTERVAL '24 hours'`
      ),
      db.query(
        `SELECT COUNT(*)::int AS count FROM users
         WHERE last_login_at > NOW()-INTERVAL '24 hours' AND deleted_at IS NULL`
      ),
    ]);

    res.json({
      success: true,
      data: {
        services: {
          api:      { status: "operational", latency: Date.now() - start },
          database: { status: dbStatus, latency: dbLatency },
          stripe:   { status: process.env.STRIPE_SECRET_KEY ? "connected" : "not_configured" },
          email:    { status: process.env.RESEND_API_KEY ? "operational" : "not_configured" },
          storage:  { status: process.env.CLOUDINARY_CLOUD_NAME ? "connected" : "not_configured" },
        },
        metrics: {
          ...counts.rows[0],
          failedPayments24h: failed.rows[0].count,
          activeUsers24h: active.rows[0].count,
        },
        uptime:      Math.floor(process.uptime()),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "development",
      },
    });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/search ─── */
export async function globalSearch(req, res) {
  try {
    const q = req.query.q?.trim() ?? "";
    if (!q || q.length < 2) return res.json({ success: true, data: { users: [], events: [], orgs: [] } });

    const term = `%${q}%`;
    const [usersRes, eventsRes, orgsRes] = await Promise.all([
      db.query(
        `SELECT id, full_name, email, status, subscription_plan AS plan, is_super_admin, created_at
         FROM users WHERE (full_name ILIKE $1 OR email ILIKE $1) AND deleted_at IS NULL LIMIT 8`,
        [term]
      ),
      db.query(
        `SELECT e.id, e.title, e.status, e.event_type, e.starts_at,
                o.name AS org_name, u.email AS owner_email
         FROM events e
         JOIN organizations o ON o.id = e.organization_id
         JOIN users u ON u.id = e.created_by
         WHERE (e.title ILIKE $1 OR o.name ILIKE $1) AND e.deleted_at IS NULL
         ORDER BY e.created_at DESC LIMIT 8`,
        [term]
      ),
      db.query(
        `SELECT o.id, o.name, u.subscription_plan AS plan, u.email AS owner_email,
                COUNT(DISTINCT e.id)::int AS event_count
         FROM organizations o
         JOIN users u ON u.id = o.owner_user_id
         LEFT JOIN events e ON e.organization_id = o.id AND e.deleted_at IS NULL
         WHERE (o.name ILIKE $1 OR u.email ILIKE $1) AND o.deleted_at IS NULL
         GROUP BY o.id, u.email, u.subscription_plan
         ORDER BY o.created_at DESC LIMIT 8`,
        [term]
      ),
    ]);

    res.json({ success: true, data: { users: usersRes.rows, events: eventsRes.rows, orgs: orgsRes.rows } });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/audit-logs ─── */
export async function getAuditLogs(req, res) {
  try {
    const page   = Math.max(parseInt(req.query.page  ?? "1"), 1);
    const limit  = Math.min(parseInt(req.query.limit ?? "50"), 100);
    const offset = (page - 1) * limit;
    const { action, resource_type, admin_id, organization_id, user_email, from, to, format } = req.query;

    const conditions = [];
    const params     = [];

    if (action) {
      params.push(`%${action}%`);
      conditions.push(`a.action ILIKE $${params.length}`);
    }
    if (resource_type) {
      params.push(resource_type);
      conditions.push(`a.entity_type = $${params.length}`);
    }
    if (admin_id) {
      params.push(admin_id);
      conditions.push(`a.actor_user_id = $${params.length}`);
    }
    if (user_email) {
      params.push(`%${user_email}%`);
      conditions.push(`(a.admin_email ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    if (organization_id) {
      params.push(organization_id);
      conditions.push(`a.changes->>'organization_id' = $${params.length}`);
    }
    if (from) {
      params.push(from);
      conditions.push(`a.created_at >= $${params.length}`);
    }
    if (to) {
      params.push(`${to} 23:59:59`);
      conditions.push(`a.created_at <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // For export (CSV/JSON), fetch all matching rows (no pagination)
    const exportMode = format === "csv" || format === "json";
    const exportLimit = exportMode ? 10000 : limit;
    const exportOffset = exportMode ? 0 : offset;

    const { rows } = await db.query(
      `SELECT
         a.id, a.created_at,
         a.actor_user_id  AS user_id,
         COALESCE(a.admin_email, u.email, 'unknown') AS user_email,
         COALESCE(u.full_name, a.admin_email, 'Unknown') AS user_name,
         a.action,
         a.entity_type    AS resource_type,
         a.resource_id,
         a.changes        AS details,
         a.ip_address,
         a.user_agent
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.actor_user_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, exportLimit, exportOffset]
    );
    const { rows: cnt } = await db.query(
      `SELECT COUNT(*)::int AS total FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id ${where}`,
      params
    );

    // ── CSV export ─────────────────────────────────────────────────────────────
    if (format === "csv") {
      const headers = ["ID","Date","User Email","User Name","Action","Resource Type","Resource ID","Organization","Amount","IP Address","User Agent"];
      const escape  = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines   = [
        headers.join(","),
        ...rows.map(r => [
          r.id,
          r.created_at ? new Date(r.created_at).toISOString() : "",
          r.user_email,
          r.user_name,
          r.action,
          r.resource_type ?? "",
          r.resource_id   ?? "",
          r.details?.organization_id ?? "",
          r.details?.amount ?? r.details?.total ?? "",
          r.ip_address ?? "",
          r.user_agent ?? "",
        ].map(escape).join(","))
      ];
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="audit-log-${Date.now()}.csv"`);
      return res.send(lines.join("\n"));
    }

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="audit-log-${Date.now()}.json"`);
      return res.json({ exported_at: new Date().toISOString(), total: cnt[0].total, logs: rows });
    }

    res.json({ success: true, data: rows, meta: { total: cnt[0].total, page, limit } });
  } catch (e) { handleError(res, e); }
}

// Kept for backward compatibility — delegates to the audit service
export async function writeAuditLog(opts) {
  return audit(opts);
}

/* ── GET /super-admin/flags ─── */
export async function getFeatureFlags(req, res) {
  try {
    const { rows } = await db.query(`SELECT * FROM feature_flags ORDER BY key ASC`);
    res.json({ success: true, data: rows });
  } catch (e) { handleError(res, e); }
}

/* ── PATCH /super-admin/flags/:key ─── */
export async function updateFeatureFlag(req, res) {
  try {
    const { key } = req.params;
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") return res.status(400).json({ success: false, message: "enabled must be boolean" });

    const { rows } = await db.query(
      `UPDATE feature_flags SET enabled=$1, updated_by=$2, updated_at=NOW() WHERE key=$3 RETURNING *`,
      [enabled, req.user.email || req.user.id, key]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Flag not found" });

    await audit({
      adminId: req.user.id,
      action: `feature_flag_${enabled ? "enabled" : "disabled"}`,
      resourceType: "feature_flag", resourceId: key,
      details: { key, enabled, flag_name: rows[0]?.name },
      ip: req.ip, userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, data: rows[0] });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/moderation ─── */
export async function getModerationQueue(req, res) {
  try {
    const [suspiciousRes, velocityRes, suspendedRes] = await Promise.all([
      db.query(
        `SELECT buyer_email, buyer_name,
                COUNT(*)::int AS ticket_count,
                SUM(total)::numeric AS total_spent,
                MAX(paid_at) AS last_activity
         FROM ticket_orders
         WHERE payment_status='PAID' AND paid_at > NOW()-INTERVAL '24 hours'
         GROUP BY buyer_email, buyer_name
         HAVING COUNT(*) > 3
         ORDER BY ticket_count DESC LIMIT 20`
      ),
      db.query(
        `SELECT e.id, e.title, o.name AS org_name,
                COUNT(to2.id)::int AS tickets_last_hour,
                COALESCE(SUM(to2.total),0)::numeric AS revenue_last_hour
         FROM ticket_orders to2
         JOIN events e ON e.id = to2.event_id
         JOIN organizations o ON o.id = e.organization_id
         WHERE to2.paid_at > NOW()-INTERVAL '1 hour' AND to2.payment_status='PAID'
         GROUP BY e.id, e.title, o.name
         HAVING COUNT(to2.id) > 5
         ORDER BY tickets_last_hour DESC LIMIT 10`
      ),
      db.query(
        `SELECT id, full_name, email, status, updated_at
         FROM users
         WHERE status IN ('SUSPENDED','INACTIVE') AND updated_at > NOW()-INTERVAL '30 days' AND deleted_at IS NULL
         ORDER BY updated_at DESC LIMIT 20`
      ),
    ]);

    res.json({
      success: true,
      data: {
        suspiciousTickets: suspiciousRes.rows,
        highVelocity: velocityRes.rows,
        suspended: suspendedRes.rows,
      },
    });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/ai-insights ─── */
export async function getAiInsights(req, res) {
  try {
    const [statsRes, revenueRes, recentRes, growthRes] = await Promise.all([
      db.query(
        `SELECT (SELECT COUNT(*)::int FROM users WHERE deleted_at IS NULL) AS total_users,
                (SELECT COUNT(*)::int FROM events WHERE deleted_at IS NULL) AS total_events,
                (SELECT COUNT(*)::int FROM events WHERE status='PUBLISHED' AND deleted_at IS NULL) AS published_events,
                (SELECT COALESCE(SUM(total),0)::numeric FROM ticket_orders WHERE payment_status='PAID') AS total_revenue,
                (SELECT COUNT(*)::int FROM issued_tickets) AS total_tickets`
      ),
      db.query(
        `SELECT COALESCE(SUM(CASE WHEN paid_at > NOW()-INTERVAL '30 days' THEN total END),0)::numeric AS revenue_30d,
                COALESCE(SUM(CASE WHEN paid_at > NOW()-INTERVAL '60 days' AND paid_at <= NOW()-INTERVAL '30 days' THEN total END),0)::numeric AS revenue_prev_30d,
                COUNT(CASE WHEN paid_at > NOW()-INTERVAL '30 days' THEN 1 END)::int AS tickets_30d
         FROM ticket_orders WHERE payment_status='PAID'`
      ),
      db.query(`SELECT COUNT(*)::int AS new_users_7d FROM users WHERE created_at > NOW()-INTERVAL '7 days' AND deleted_at IS NULL`),
      db.query(
        `SELECT COUNT(CASE WHEN subscription_plan != 'free' AND is_subscribed=true THEN 1 END)::int AS paid_users,
                COUNT(*)::int AS total_users
         FROM users WHERE deleted_at IS NULL`
      ),
    ]);

    const stats  = statsRes.rows[0];
    const revenue = revenueRes.rows[0];
    const recent  = recentRes.rows[0];
    const growth  = growthRes.rows[0];
    const rev30d  = parseFloat(revenue.revenue_30d);
    const revPrev = parseFloat(revenue.revenue_prev_30d);
    const revenueGrowth  = revPrev > 0 ? ((rev30d - revPrev) / revPrev * 100).toFixed(1) : "N/A";
    const conversionRate = growth.total_users > 0 ? (growth.paid_users / growth.total_users * 100).toFixed(1) : "0";

    const platformData = `Total users: ${stats.total_users}, Events: ${stats.total_events} (${stats.published_events} published), All-time revenue: $${parseFloat(stats.total_revenue).toFixed(2)}, Tickets sold: ${stats.total_tickets}, Revenue 30d: $${rev30d.toFixed(2)}, Revenue prev 30d: $${revPrev.toFixed(2)}, Revenue growth: ${revenueGrowth}%, New users 7d: ${recent.new_users_7d}, Paid conversion: ${conversionRate}%`;

    let insights, aiPowered = false;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001", max_tokens: 1024,
            messages: [{ role: "user", content: `You are an AI analyst for an event ticketing SaaS. Data: ${platformData}. Respond with ONLY a JSON array of exactly 5 insight objects: [{"type":"opportunity|warning|insight|growth|alert","title":"max 8 words","description":"2-3 sentences actionable","metric":"key number","priority":"high|medium|low"}]` }],
          }),
        });
        const d = await r.json();
        insights = JSON.parse(d?.content?.[0]?.text ?? "");
        aiPowered = true;
      } catch { insights = null; }
    }

    if (!insights) {
      insights = [
        { type: rev30d >= revPrev ? "growth" : "warning", title: "Revenue momentum", description: `Revenue ${rev30d >= revPrev ? "grew" : "declined"} ${Math.abs(parseFloat(revenueGrowth || 0))}% vs prior 30 days. ${rev30d >= revPrev ? "Feature top events to sustain momentum." : "Consider a promotion to re-engage dormant organizers."}`, metric: `${revenueGrowth}% MoM`, priority: rev30d < revPrev ? "high" : "medium" },
        { type: "insight", title: "Conversion rate opportunity", description: `Only ${conversionRate}% of ${growth.total_users} users are on paid plans. ${growth.total_users - growth.paid_users} free users are prime upgrade targets with the right in-app nudge.`, metric: `${conversionRate}% paid`, priority: parseFloat(conversionRate) < 5 ? "high" : "medium" },
        { type: "growth", title: "New user acquisition", description: `${recent.new_users_7d} new users joined this week. Focus on onboarding quality — guide them to create their first event within 48h of signup.`, metric: `${recent.new_users_7d} users/week`, priority: "medium" },
        { type: "insight", title: "Event publish rate", description: `${stats.published_events} of ${stats.total_events} events are published (${stats.total_events > 0 ? Math.round(stats.published_events / stats.total_events * 100) : 0}%). Automate a nudge to push draft events to published.`, metric: `${stats.total_events > 0 ? Math.round(stats.published_events / stats.total_events * 100) : 0}% publish rate`, priority: "medium" },
        { type: "opportunity", title: "Revenue per event lift", description: `Average $${stats.published_events > 0 ? (parseFloat(stats.total_revenue) / stats.published_events).toFixed(0) : 0}/published event. Feature top-revenue events on the homepage to drive discovery.`, metric: `$${stats.published_events > 0 ? (parseFloat(stats.total_revenue) / stats.published_events).toFixed(0) : 0}/event`, priority: "low" },
      ];
    }

    res.json({ success: true, data: { insights, raw: platformData, ai_powered: aiPowered } });
  } catch (e) { handleError(res, e); }
}

/* ── GET /super-admin/vendors ────────────────────────────────────────────── */
export async function getAdminVendors(req, res) {
  try {
    const { q = "", status = "all", category = "", verified = "", page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ["1=1"];
    const vals = [];
    let i = 1;

    if (q.trim()) {
      conditions.push(`(v.business_name ILIKE $${i} OR v.email ILIKE $${i+1} OR v.category ILIKE $${i+2})`);
      vals.push(`%${q}%`, `%${q}%`, `%${q}%`);
      i += 3;
    }
    if (status === "active")   { conditions.push(`v.is_active = true`);  }
    if (status === "inactive") { conditions.push(`v.is_active = false`); }
    if (verified === "verified") { conditions.push(`v.verification_status = 'verified'`); }
    if (verified === "pending")  { conditions.push(`v.verification_status = 'pending'`);  }
    if (verified === "rejected") { conditions.push(`v.verification_status = 'rejected'`); }
    if (category) { conditions.push(`v.category ILIKE $${i++}`); vals.push(`%${category}%`); }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [{ rows: vendors }, { rows: [{ count }] }, { rows: stats }] = await Promise.all([
      db.query(`
        SELECT v.id, v.business_name, v.slug, v.category, v.email, v.phone,
               v.city, v.country, v.base_price, v.currency,
               v.verification_status, v.is_active, v.is_featured,
               v.rating, v.review_count, v.inquiry_count, v.booking_count,
               v.profile_views, v.tier, v.logo_url, v.created_at
        FROM vendors v ${where}
        ORDER BY v.created_at DESC
        LIMIT $${i} OFFSET $${i+1}
      `, [...vals, parseInt(limit), offset]),
      db.query(`SELECT COUNT(*) FROM vendors v ${where}`, vals),
      db.query(`
        SELECT
          COUNT(*)::int                                                                AS total,
          COUNT(*) FILTER (WHERE is_active = true)::int                              AS active,
          COUNT(*) FILTER (WHERE verification_status = 'verified')::int              AS verified,
          COUNT(*) FILTER (WHERE verification_status = 'pending')::int               AS pending,
          COALESCE(SUM(inquiry_count),0)::int                                        AS total_inquiries,
          COALESCE(SUM(review_count),0)::int                                         AS total_reviews
        FROM vendors
      `),
    ]);

    res.json({
      success: true,
      data: {
        vendors,
        stats: stats[0],
        total: parseInt(count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(count) / parseInt(limit)),
      },
    });
  } catch (e) { handleError(res, e); }
}

/* ── PATCH /super-admin/vendors/:id ─────────────────────────────────────── */
export async function updateAdminVendor(req, res) {
  try {
    const { id } = req.params;
    const allowed = ["verification_status", "is_active", "is_featured", "tier"];
    const fields = [], vals = [];
    let i = 1;
    for (const [k, v] of Object.entries(req.body)) {
      if (allowed.includes(k)) { fields.push(`${k} = $${i++}`); vals.push(v); }
    }
    if (!fields.length) return res.status(400).json({ success: false, message: "No valid fields" });
    fields.push("updated_at = NOW()");
    vals.push(id);
    const { rows } = await db.query(
      `UPDATE vendors SET ${fields.join(", ")} WHERE id = $${i} RETURNING id, business_name, verification_status, is_active, is_featured, tier`,
      vals
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Vendor not found" });
    res.json({ success: true, data: rows[0] });
  } catch (e) { handleError(res, e); }
}

/* ── DELETE /super-admin/vendors/:id ────────────────────────────────────── */
export async function deleteAdminVendor(req, res) {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM vendors WHERE id = $1", [id]);
    res.json({ success: true, message: "Vendor deleted" });
  } catch (e) { handleError(res, e); }
}
