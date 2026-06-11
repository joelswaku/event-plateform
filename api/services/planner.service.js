import { db } from "../config/db.js";
import { callAI, logAIGeneration } from "./ai.service.js";
import { PLANS } from "./planLimits.service.js";

export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ── Private helpers ────────────────────────────────────────────────────────

// Safely coerce AI-returned values to numbers — handles "$1,500", "1500 USD", etc.
function safeNum(v, fallback = null) {
  if (v == null) return fallback;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? fallback : n;
}

function safeInt(v, fallback = null) {
  if (v == null) return fallback;
  const n = parseInt(String(v).replace(/[^0-9-]/g, ""), 10);
  return isNaN(n) ? fallback : n;
}

async function assertProject(organizationId, projectId) {
  const { rows } = await db.query(
    "SELECT id FROM planner_projects WHERE id = $1 AND organization_id = $2 AND status != 'DELETED'",
    [projectId, organizationId]
  );
  if (!rows.length) throw new AppError("Project not found", 404);
  return rows[0];
}

async function logActivity(projectId, { userId, actorName, action, entityType, entityId, entityTitle, metadata } = {}) {
  try {
    await db.query(
      `INSERT INTO planner_activity_log
        (project_id, user_id, actor_name, action, entity_type, entity_id, entity_title, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [projectId, userId ?? null, actorName ?? null, action,
       entityType ?? null, entityId ?? null, entityTitle ?? null,
       JSON.stringify(metadata ?? {})]
    );
  } catch { /* non-fatal */ }
}

function computeHealthScore({ taskCount, doneCount, vendorCount, confirmedVendors, daysRemaining }) {
  if (!taskCount && !vendorCount) return 50;
  const taskScore    = taskCount    ? Math.round((doneCount / taskCount) * 40)     : 20;
  const vendorScore  = vendorCount  ? Math.round((confirmedVendors / vendorCount) * 30) : 15;
  const timeScore    = daysRemaining > 60 ? 30 : daysRemaining > 30 ? 20 : daysRemaining > 14 ? 12 : daysRemaining > 7 ? 6 : 2;
  return Math.min(100, taskScore + vendorScore + timeScore);
}

// ── PROJECTS ───────────────────────────────────────────────────────────────

export async function listProjectsService({ organizationId }) {
  const { rows } = await db.query(`
    SELECT
      p.*,
      COUNT(DISTINCT t.id)::int                                       AS task_count,
      COUNT(DISTINCT CASE WHEN t.status = 'DONE' THEN t.id END)::int AS done_count,
      COUNT(DISTINCT v.id)::int                                       AS vendor_count,
      COUNT(DISTINCT CASE WHEN v.booking_status IN ('booked','confirmed','BOOKED','CONFIRMED') THEN v.id END)::int AS confirmed_vendor_count,
      COALESCE(SUM(b.estimated_cost),0)::numeric                      AS total_estimated,
      COALESCE(SUM(b.actual_cost),0)::numeric                         AS total_actual,
      CASE WHEN p.event_date IS NOT NULL
        THEN (p.event_date - CURRENT_DATE)
        ELSE NULL
      END AS days_until_event
    FROM planner_projects p
    LEFT JOIN planner_tasks t        ON t.project_id = p.id
    LEFT JOIN planner_vendors v      ON v.project_id = p.id
    LEFT JOIN planner_budget_items b ON b.project_id = p.id
    WHERE p.organization_id = $1 AND p.status != 'DELETED'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `, [organizationId]);
  return rows;
}

export async function createProjectService({ organizationId, userId, payload }) {
  const {
    title, eventType, eventDate, eventEndDate, guestCount,
    totalBudget, currency, venue, city, country, styleNotes,
    eventId, color
  } = payload;
  if (!title?.trim()) throw new AppError("title is required", 400);

  const { rows } = await db.query(`
    INSERT INTO planner_projects
      (organization_id, user_id, event_id, title, event_type, event_date,
       event_end_date, guest_count, total_budget, currency, venue, city,
       country, style_notes, color, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'ACTIVE')
    RETURNING *
  `, [
    organizationId, userId ?? null, eventId || null,
    title.trim(), eventType || null, eventDate || null,
    eventEndDate || null, guestCount || null,
    totalBudget || null, currency || "USD",
    venue || null, city || null, country || null,
    styleNotes || null, color || "#6366f1",
  ]);

  const project = rows[0];
  await logActivity(project.id, { userId, action: "project_created", entityType: "project", entityId: project.id, entityTitle: project.title });
  return project;
}

export async function getProjectService({ organizationId, projectId }) {
  const { rows: [project] } = await db.query(
    `SELECT * FROM planner_projects WHERE id = $1 AND organization_id = $2 AND status != 'DELETED'`,
    [projectId, organizationId]
  );
  if (!project) throw new AppError("Project not found", 404);

  const [taskRows, vendorRows, timelineRows, budgetRows, teamRows, activityRows] = await Promise.all([
    db.query("SELECT * FROM planner_tasks WHERE project_id = $1 AND parent_task_id IS NULL ORDER BY position_order, created_at", [projectId]),
    db.query("SELECT * FROM planner_vendors WHERE project_id = $1 ORDER BY category, name", [projectId]),
    db.query("SELECT * FROM planner_timeline_items WHERE project_id = $1 ORDER BY position_order, COALESCE(start_time, item_time)", [projectId]),
    db.query("SELECT * FROM planner_budget_items WHERE project_id = $1 ORDER BY category, position_order", [projectId]),
    db.query("SELECT * FROM planner_team_members WHERE project_id = $1 ORDER BY created_at", [projectId]),
    db.query("SELECT * FROM planner_activity_log WHERE project_id = $1 ORDER BY created_at DESC LIMIT 10", [projectId]),
  ]);

  const tasks = taskRows.rows;
  const vendors = vendorRows.rows;
  const budget = budgetRows.rows;

  const doneCount = tasks.filter(t => t.status === "DONE").length;
  const confirmedVendors = vendors.filter(v => ["booked", "confirmed", "BOOKED", "CONFIRMED"].includes(v.booking_status)).length;
  const daysRemaining = project.event_date
    ? Math.max(0, Math.ceil((new Date(project.event_date) - new Date()) / 86400000))
    : 999;
  const healthScore = computeHealthScore({
    taskCount: tasks.length, doneCount,
    vendorCount: vendors.length, confirmedVendors,
    daysRemaining,
  });

  const totalEstimated = budget.reduce((s, b) => s + Number(b.estimated_cost || 0), 0);
  const totalActual = budget.reduce((s, b) => s + Number(b.actual_cost || 0), 0);
  const totalPaid = budget.reduce((s, b) => s + Number(b.paid_amount || 0), 0);

  return {
    ...project,
    tasks: tasks,
    vendors: vendors,
    timeline: timelineRows.rows,
    budget: {
      items: budget,
      total_budget: Number(project.total_budget || 0),
      total_estimated: totalEstimated,
      total_actual: totalActual,
      total_paid: totalPaid,
      remaining: Number(project.total_budget || 0) - totalActual,
    },
    team: teamRows.rows,
    activity: activityRows.rows,
    task_stats: { total: tasks.length, done: doneCount, overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE").length },
    health_score: healthScore,
    days_remaining: daysRemaining,
  };
}

export async function updateProjectService({ organizationId, projectId, userId, payload }) {
  await assertProject(organizationId, projectId);

  const allowed = {
    title: "title", event_type: "event_type", eventType: "event_type",
    event_date: "event_date", eventDate: "event_date",
    event_end_date: "event_end_date", eventEndDate: "event_end_date",
    guest_count: "guest_count", guestCount: "guest_count",
    total_budget: "total_budget", totalBudget: "total_budget",
    currency: "currency", venue: "venue", city: "city", country: "country",
    style_notes: "style_notes", styleNotes: "style_notes",
    status: "status", color: "color", cover_image_url: "cover_image_url",
    ai_brief: "ai_brief", health_score: "health_score",
  };

  const DATE_COLS = new Set(["event_date", "event_end_date"]);

  const fields = [];
  const vals = [];
  let i = 1;
  for (const [k, v] of Object.entries(payload)) {
    const col = allowed[k];
    if (!col) continue;
    // Coerce empty strings to null for date columns — Postgres rejects "" as a date
    const safeVal = DATE_COLS.has(col) && v === "" ? null : v;
    fields.push(`${col} = $${i++}`);
    vals.push(safeVal);
  }
  if (!fields.length) throw new AppError("No valid fields to update", 400);
  fields.push("updated_at = NOW()");
  vals.push(projectId);

  const { rows } = await db.query(
    `UPDATE planner_projects SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, vals
  );
  await logActivity(projectId, { userId, action: "project_updated", entityType: "project", entityId: projectId });
  return rows[0];
}

export async function deleteProjectService({ organizationId, projectId, userId }) {
  await assertProject(organizationId, projectId);
  await db.query(
    "UPDATE planner_projects SET status = 'DELETED', updated_at = NOW() WHERE id = $1",
    [projectId]
  );
  await logActivity(projectId, { userId, action: "project_deleted", entityType: "project", entityId: projectId });
}

export async function archiveProjectService({ organizationId, projectId, userId }) {
  await assertProject(organizationId, projectId);
  const { rows } = await db.query(
    "UPDATE planner_projects SET status = 'ARCHIVED', updated_at = NOW() WHERE id = $1 RETURNING *",
    [projectId]
  );
  await logActivity(projectId, { userId, action: "project_archived", entityType: "project", entityId: projectId });
  return rows[0];
}

// ── TASKS ──────────────────────────────────────────────────────────────────

export async function getTasksService({ organizationId, projectId, filters = {} }) {
  await assertProject(organizationId, projectId);

  let where = "WHERE project_id = $1";
  const vals = [projectId];
  let i = 2;

  if (filters.status) { where += ` AND status = $${i++}`; vals.push(filters.status.toUpperCase()); }
  if (filters.category) { where += ` AND category = $${i++}`; vals.push(filters.category); }
  if (filters.assignee_email) { where += ` AND assignee_email = $${i++}`; vals.push(filters.assignee_email); }
  if (filters.search) { where += ` AND title ILIKE $${i++}`; vals.push(`%${filters.search}%`); }
  if (filters.overdue) { where += " AND due_date < CURRENT_DATE AND status != 'DONE'"; }

  const { rows } = await db.query(
    `SELECT t.*,
      (SELECT COUNT(*) FROM planner_tasks sub WHERE sub.parent_task_id = t.id)::int AS subtask_count
     FROM planner_tasks t
     ${where} AND parent_task_id IS NULL
     ORDER BY position_order, created_at`,
    vals
  );

  const grouped = { TODO: [], IN_PROGRESS: [], DONE: [], BLOCKED: [] };
  for (const task of rows) {
    const key = task.status?.toUpperCase();
    if (grouped[key]) grouped[key].push(task);
    else grouped.TODO.push(task);
  }
  return grouped;
}

export async function createTaskService({ organizationId, projectId, userId, payload }) {
  await assertProject(organizationId, projectId);
  const { title, description, category, status, priority, dueDate, assigneeName, assigneeEmail, estimatedCost, labels, parentTaskId } = payload;
  if (!title?.trim()) throw new AppError("title is required", 400);

  const normalStatus = (status ?? "TODO").toUpperCase();
  const normalPriority = (priority ?? "MEDIUM").toUpperCase();

  const { rows } = await db.query(`
    INSERT INTO planner_tasks
      (project_id, parent_task_id, title, description, category, status, priority,
       due_date, assignee_name, assignee_email, estimated_cost, labels, ai_generated)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *
  `, [
    projectId, parentTaskId ?? null, title.trim(),
    description ?? null, category ?? null,
    normalStatus, normalPriority,
    dueDate ?? null, assigneeName ?? null, assigneeEmail ?? null,
    estimatedCost ?? null,
    labels ?? [],
    payload.ai_generated ?? false,
  ]);

  const task = rows[0];
  await logActivity(projectId, { userId, action: "task_created", entityType: "task", entityId: task.id, entityTitle: task.title });
  return task;
}

export async function updateTaskService({ organizationId, projectId, taskId, userId, payload }) {
  await assertProject(organizationId, projectId);

  const allowed = {
    title: "title", description: "description", category: "category",
    priority: "priority", due_date: "due_date", dueDate: "due_date",
    reminder_at: "reminder_at", reminderAt: "reminder_at",
    assignee_name: "assignee_name", assigneeName: "assignee_name",
    assignee_email: "assignee_email", assigneeEmail: "assignee_email",
    assignee_avatar: "assignee_avatar",
    estimated_cost: "estimated_cost", estimatedCost: "estimated_cost",
    actual_cost: "actual_cost", actualCost: "actual_cost",
    labels: "labels", progress: "progress",
  };

  const fields = [];
  const vals = [];
  let i = 1;

  // Handle status separately for completed_at logic
  if (payload.status !== undefined) {
    const s = payload.status.toUpperCase();
    fields.push(`status = $${i++}`); vals.push(s);
    if (s === "DONE") { fields.push(`completed_at = NOW()`); }
    else { fields.push(`completed_at = NULL`); }
  }

  for (const [k, v] of Object.entries(payload)) {
    if (k === "status") continue;
    const col = allowed[k];
    if (col) {
      const val = v;
      fields.push(`${col} = $${i++}`);
      vals.push(val);
    }
  }
  if (!fields.length) throw new AppError("No valid fields", 400);
  fields.push("updated_at = NOW()");
  vals.push(taskId, projectId);

  const { rows } = await db.query(
    `UPDATE planner_tasks SET ${fields.join(", ")} WHERE id = $${i} AND project_id = $${i + 1} RETURNING *`,
    vals
  );
  if (!rows[0]) throw new AppError("Task not found", 404);
  await logActivity(projectId, { userId, action: "task_updated", entityType: "task", entityId: taskId, entityTitle: rows[0].title });
  return rows[0];
}

export async function deleteTaskService({ organizationId, projectId, taskId, userId }) {
  await assertProject(organizationId, projectId);
  await db.query("DELETE FROM planner_tasks WHERE id = $1 AND project_id = $2", [taskId, projectId]);
  await logActivity(projectId, { userId, action: "task_deleted", entityType: "task", entityId: taskId });
}

export async function reorderTasksService({ organizationId, projectId, status, orderedIds }) {
  await assertProject(organizationId, projectId);
  for (let i = 0; i < orderedIds.length; i++) {
    await db.query(
      "UPDATE planner_tasks SET position_order = $1 WHERE id = $2 AND project_id = $3",
      [i, orderedIds[i], projectId]
    );
  }
}

export async function bulkUpdateTasksService({ organizationId, projectId, userId, taskIds, payload }) {
  await assertProject(organizationId, projectId);
  if (!Array.isArray(taskIds) || !taskIds.length) throw new AppError("taskIds required", 400);

  const allowed = { status: "status", priority: "priority", category: "category", assignee_email: "assignee_email" };
  const fields = [];
  const vals = [];
  let i = 1;

  if (payload.status) { fields.push(`status = $${i++}`); vals.push(payload.status.toUpperCase()); }
  if (payload.priority) { fields.push(`priority = $${i++}`); vals.push(payload.priority.toUpperCase()); }
  if (payload.category !== undefined) { fields.push(`category = $${i++}`); vals.push(payload.category); }

  if (!fields.length) throw new AppError("No valid fields for bulk update", 400);
  fields.push("updated_at = NOW()");

  const placeholders = taskIds.map((_, idx) => `$${i + idx}`).join(",");
  vals.push(...taskIds);

  await db.query(
    `UPDATE planner_tasks SET ${fields.join(", ")} WHERE id IN (${placeholders}) AND project_id = $${i + taskIds.length}`,
    [...vals, projectId]
  );
  await logActivity(projectId, { userId, action: "tasks_bulk_updated" });
}

// ── TIMELINE ───────────────────────────────────────────────────────────────

export async function getTimelineService({ organizationId, projectId }) {
  await assertProject(organizationId, projectId);
  const { rows } = await db.query(
    "SELECT * FROM planner_timeline_items WHERE project_id = $1 ORDER BY event_date ASC NULLS LAST, start_time ASC NULLS LAST, position_order",
    [projectId]
  );
  return rows;
}

export async function createTimelineItemService({ organizationId, projectId, userId, payload }) {
  await assertProject(organizationId, projectId);
  const { title, description, eventDate, startTime, endTime, durationMinutes, category, color, location, assigneeName, isMilestone, isPublic } = payload;
  if (!title?.trim()) throw new AppError("title is required", 400);

  const { rows } = await db.query(`
    INSERT INTO planner_timeline_items
      (project_id, title, description, event_date, start_time, end_time,
       duration_minutes, category, color, location, assignee_name, is_milestone, is_public, ai_generated)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING *
  `, [
    projectId, title.trim(), description ?? null,
    eventDate ?? null, startTime ?? null, endTime ?? null,
    durationMinutes ?? null, category ?? null, color ?? null,
    location ?? null, assigneeName ?? null,
    isMilestone ?? false, isPublic ?? false,
    payload.ai_generated ?? false,
  ]);
  const item = rows[0];
  await logActivity(projectId, { userId, action: "timeline_item_created", entityType: "timeline", entityId: item.id, entityTitle: item.title });
  return item;
}

export async function updateTimelineItemService({ organizationId, projectId, itemId, userId, payload }) {
  await assertProject(organizationId, projectId);

  const allowed = {
    title: "title", description: "description",
    event_date: "event_date", eventDate: "event_date",
    start_time: "start_time", startTime: "start_time",
    end_time: "end_time", endTime: "end_time",
    duration_minutes: "duration_minutes", durationMinutes: "duration_minutes",
    category: "category", color: "color", location: "location",
    assignee_name: "assignee_name", assigneeName: "assignee_name",
    is_milestone: "is_milestone", isMilestone: "is_milestone",
    is_public: "is_public", isPublic: "is_public",
    position_order: "position_order",
  };

  const fields = [];
  const vals = [];
  let i = 1;
  for (const [k, v] of Object.entries(payload)) {
    const col = allowed[k];
    if (col) { fields.push(`${col} = $${i++}`); vals.push(v); }
  }
  if (!fields.length) throw new AppError("No valid fields", 400);
  fields.push("updated_at = NOW()");
  vals.push(itemId, projectId);

  const { rows } = await db.query(
    `UPDATE planner_timeline_items SET ${fields.join(", ")} WHERE id = $${i} AND project_id = $${i + 1} RETURNING *`,
    vals
  );
  if (!rows[0]) throw new AppError("Timeline item not found", 404);
  return rows[0];
}

export async function deleteTimelineItemService({ organizationId, projectId, itemId, userId }) {
  await assertProject(organizationId, projectId);
  await db.query("DELETE FROM planner_timeline_items WHERE id = $1 AND project_id = $2", [itemId, projectId]);
  await logActivity(projectId, { userId, action: "timeline_item_deleted", entityType: "timeline", entityId: itemId });
}

export async function reorderTimelineItemsService({ organizationId, projectId, orderedIds }) {
  await assertProject(organizationId, projectId);
  for (let i = 0; i < orderedIds.length; i++) {
    await db.query(
      "UPDATE planner_timeline_items SET position_order = $1 WHERE id = $2 AND project_id = $3",
      [i, orderedIds[i], projectId]
    );
  }
}

// ── BUDGET ─────────────────────────────────────────────────────────────────

export async function getBudgetService({ organizationId, projectId }) {
  await assertProject(organizationId, projectId);

  const [projectRes, itemsRes] = await Promise.all([
    db.query("SELECT total_budget, currency FROM planner_projects WHERE id = $1", [projectId]),
    db.query("SELECT * FROM planner_budget_items WHERE project_id = $1 ORDER BY category, position_order", [projectId]),
  ]);

  const proj = projectRes.rows[0] ?? {};
  const items = itemsRes.rows;
  const totalBudget = Number(proj.total_budget || 0);
  const totalEstimated = items.reduce((s, b) => s + Number(b.estimated_cost || 0), 0);
  const totalActual = items.reduce((s, b) => s + Number(b.actual_cost || 0), 0);
  const totalPaid = items.reduce((s, b) => s + Number(b.paid_amount || 0), 0);

  const spendByCategory = Object.values(
    items.reduce((acc, b) => {
      const cat = b.category || "Other";
      if (!acc[cat]) acc[cat] = { category: cat, estimated: 0, actual: 0, paid: 0 };
      acc[cat].estimated += Number(b.estimated_cost || 0);
      acc[cat].actual    += Number(b.actual_cost || 0);
      acc[cat].paid      += Number(b.paid_amount || 0);
      return acc;
    }, {})
  );

  const pct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  const budgetHealth = pct > 100 ? "OVER_BUDGET" : pct > 80 ? "WARNING" : "HEALTHY";

  return {
    items,
    total_budget: totalBudget,
    total_estimated: totalEstimated,
    total_actual: totalActual,
    total_paid: totalPaid,
    total_unpaid: totalActual - totalPaid,
    remaining: totalBudget - totalActual,
    overspend: Math.max(0, totalActual - totalBudget),
    spend_by_category: spendByCategory,
    budget_health: budgetHealth,
    currency: proj.currency ?? "USD",
  };
}

export async function createBudgetItemService({ organizationId, projectId, userId, payload }) {
  await assertProject(organizationId, projectId);
  const { title, category, vendorName, estimatedCost, actualCost, paidAmount, currency, paymentStatus, dueDate, notes } = payload;
  if (!title?.trim()) throw new AppError("title is required", 400);

  const { rows } = await db.query(`
    INSERT INTO planner_budget_items
      (project_id, title, category, vendor_name, estimated_cost, actual_cost,
       paid_amount, currency, payment_status, due_date, notes, ai_suggested)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *
  `, [
    projectId, title.trim(), category ?? null, vendorName ?? null,
    estimatedCost ?? 0, actualCost ?? 0, paidAmount ?? 0,
    currency ?? "USD", paymentStatus ?? "UNPAID",
    dueDate ?? null, notes ?? null, payload.ai_suggested ?? false,
  ]);
  const item = rows[0];
  await logActivity(projectId, { userId, action: "budget_item_created", entityType: "budget", entityId: item.id, entityTitle: item.title });
  return item;
}

export async function updateBudgetItemService({ organizationId, projectId, itemId, userId, payload }) {
  await assertProject(organizationId, projectId);

  const allowed = {
    title: "title", category: "category",
    vendor_name: "vendor_name", vendorName: "vendor_name",
    estimated_cost: "estimated_cost", estimatedCost: "estimated_cost",
    actual_cost: "actual_cost", actualCost: "actual_cost",
    paid_amount: "paid_amount", paidAmount: "paid_amount",
    currency: "currency",
    payment_status: "payment_status", paymentStatus: "payment_status",
    due_date: "due_date", dueDate: "due_date",
    notes: "notes", receipt_url: "receipt_url",
  };

  const fields = [];
  const vals = [];
  let i = 1;
  for (const [k, v] of Object.entries(payload)) {
    const col = allowed[k];
    if (col) { fields.push(`${col} = $${i++}`); vals.push(v); }
  }
  if (!fields.length) throw new AppError("No valid fields", 400);
  fields.push("updated_at = NOW()");
  vals.push(itemId, projectId);

  const { rows } = await db.query(
    `UPDATE planner_budget_items SET ${fields.join(", ")} WHERE id = $${i} AND project_id = $${i + 1} RETURNING *`,
    vals
  );
  if (!rows[0]) throw new AppError("Budget item not found", 404);
  return rows[0];
}

export async function deleteBudgetItemService({ organizationId, projectId, itemId, userId }) {
  await assertProject(organizationId, projectId);
  await db.query("DELETE FROM planner_budget_items WHERE id = $1 AND project_id = $2", [itemId, projectId]);
  await logActivity(projectId, { userId, action: "budget_item_deleted", entityType: "budget", entityId: itemId });
}

// ── VENDORS ────────────────────────────────────────────────────────────────

export async function getVendorsService({ organizationId, projectId }) {
  await assertProject(organizationId, projectId);
  const { rows } = await db.query(
    "SELECT * FROM planner_vendors WHERE project_id = $1 ORDER BY category, name",
    [projectId]
  );

  const grouped = {};
  let totalConfirmed = 0;
  let totalQuoted = 0;
  for (const v of rows) {
    const cat = v.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(v);
    if (["booked", "confirmed", "BOOKED", "CONFIRMED"].includes(v.booking_status)) {
      totalConfirmed += Number(v.confirmed_price || 0);
    }
    totalQuoted += Number(v.quoted_price || 0);
  }

  return {
    vendors: rows,
    grouped,
    total_confirmed_spend: totalConfirmed,
    total_quoted_spend: totalQuoted,
  };
}

export async function createVendorService({ organizationId, projectId, userId, payload }) {
  await assertProject(organizationId, projectId);
  const name = payload.name;
  if (!name?.trim()) throw new AppError("name is required", 400);

  const category       = payload.category ?? null;
  const contact_name   = payload.contact_name  ?? payload.contactName  ?? null;
  const contact_email  = payload.contact_email ?? payload.contactEmail ?? null;
  const contact_phone  = payload.contact_phone ?? payload.contactPhone ?? null;
  const website_url    = payload.website_url   ?? payload.websiteUrl   ?? null;
  const image_url      = payload.image_url     ?? null;
  const quoted_price   = payload.quoted_price  ?? payload.quotedPrice  ?? payload.priceQuoted ?? null;
  const confirmed_price = payload.confirmed_price ?? payload.confirmedPrice ?? null;
  const currency       = payload.currency ?? "USD";
  const notes          = payload.notes ?? null;
  const rating         = payload.rating ?? null;
  const booking_status = (payload.booking_status ?? payload.status ?? "researching").toLowerCase();

  const google_place_id = payload.google_place_id ?? payload.googlePlaceId ?? null;

  const { rows } = await db.query(`
    INSERT INTO planner_vendors
      (project_id, name, category, contact_name, contact_email, contact_phone,
       website_url, image_url, quoted_price, confirmed_price, currency, notes,
       rating, booking_status, ai_suggested, google_place_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    ON CONFLICT (project_id, google_place_id) WHERE google_place_id IS NOT NULL
    DO UPDATE SET
      name          = EXCLUDED.name,
      category      = EXCLUDED.category,
      website_url   = EXCLUDED.website_url,
      image_url     = EXCLUDED.image_url,
      contact_phone = EXCLUDED.contact_phone,
      notes         = EXCLUDED.notes,
      updated_at    = NOW()
    RETURNING *
  `, [
    projectId, name.trim(), category,
    contact_name, contact_email, contact_phone,
    website_url, image_url, quoted_price, confirmed_price, currency,
    notes, rating, booking_status,
    payload.ai_suggested ?? false,
    google_place_id,
  ]);
  const vendor = rows[0];
  await logActivity(projectId, { userId, action: "vendor_created", entityType: "vendor", entityId: vendor.id, entityTitle: vendor.name });
  return vendor;
}

export async function updateVendorService({ organizationId, projectId, vendorId, userId, payload }) {
  await assertProject(organizationId, projectId);

  const allowed = {
    name: "name", category: "category",
    contact_name: "contact_name", contactName: "contact_name",
    contact_email: "contact_email", contactEmail: "contact_email",
    contact_phone: "contact_phone", contactPhone: "contact_phone",
    website_url: "website_url", websiteUrl: "website_url",
    quoted_price: "quoted_price", quotedPrice: "quoted_price", priceQuoted: "quoted_price",
    confirmed_price: "confirmed_price", confirmedPrice: "confirmed_price", priceConfirmed: "confirmed_price",
    currency: "currency",
    booking_status: "booking_status", status: "booking_status",
    notes: "notes", rating: "rating", contract_url: "contract_url",
    image_url: "image_url",
    google_place_id: "google_place_id", googlePlaceId: "google_place_id",
    ai_suggested: "ai_suggested",
  };

  const fields = [];
  const vals = [];
  let i = 1;
  for (const [k, v] of Object.entries(payload)) {
    const col = allowed[k];
    if (col) {
      const val = col === "booking_status" ? String(v).toLowerCase() : v;
      fields.push(`${col} = $${i++}`);
      vals.push(val);
    }
  }

  if (payload.status === "CONFIRMED" || payload.status === "confirmed" || payload.status === "booked") {
    fields.push(`confirmed_at = NOW()`);
  }

  if (!fields.length) throw new AppError("No valid fields", 400);
  fields.push("updated_at = NOW()");
  vals.push(vendorId, projectId);

  const { rows } = await db.query(
    `UPDATE planner_vendors SET ${fields.join(", ")} WHERE id = $${i} AND project_id = $${i + 1} RETURNING *`,
    vals
  );
  if (!rows[0]) throw new AppError("Vendor not found", 404);
  return rows[0];
}

export async function deleteVendorService({ organizationId, projectId, vendorId, userId }) {
  await assertProject(organizationId, projectId);
  await db.query("DELETE FROM planner_vendors WHERE id = $1 AND project_id = $2", [vendorId, projectId]);
  await logActivity(projectId, { userId, action: "vendor_deleted", entityType: "vendor", entityId: vendorId });
}

// ── TEAM ───────────────────────────────────────────────────────────────────

export async function getTeamService({ organizationId, projectId }) {
  await assertProject(organizationId, projectId);

  // Check if project is linked to an event
  const { rows: projectRows } = await db.query(
    "SELECT event_id FROM planner_projects WHERE id = $1",
    [projectId]
  );
  const eventId = projectRows[0]?.event_id;

  // If linked to event, use event team
  if (eventId) {
    // Clean up any orphaned planner_team_members (shouldn't exist for event-linked projects)
    await db.query(
      "DELETE FROM planner_team_members WHERE project_id = $1",
      [projectId]
    );

    const { rows } = await db.query(`
      SELECT
        em.user_id,
        em.role,
        em.joined_at AS created_at,
        em.joined_at AS accepted_at,
        u.full_name AS name,
        u.email,
        u.avatar_url,
        COUNT(t.id)::int AS assigned_task_count
      FROM event_members em
      JOIN users u ON u.id = em.user_id
      LEFT JOIN planner_tasks t ON t.assignee_email = u.email AND t.project_id = $1
      WHERE em.event_id = $2 AND em.deleted_at IS NULL
      GROUP BY em.user_id, em.role, em.joined_at, u.full_name, u.email, u.avatar_url
      ORDER BY em.joined_at
    `, [projectId, eventId]);
    return rows;
  }

  // Otherwise use planner team
  const { rows } = await db.query(`
    SELECT m.*,
      COUNT(t.id)::int AS assigned_task_count
    FROM planner_team_members m
    LEFT JOIN planner_tasks t ON t.assignee_email = m.email AND t.project_id = m.project_id
    WHERE m.project_id = $1
    GROUP BY m.id
    ORDER BY m.created_at
  `, [projectId]);
  return rows;
}

export async function inviteTeamMemberService({ organizationId, projectId, userId, payload }) {
  await assertProject(organizationId, projectId);
  const { name, email, role } = payload;
  if (!email?.trim()) throw new AppError("email is required", 400);

  // Get user's subscription plan to check limits
  const { rows: userRows } = await db.query(
    `SELECT subscription_plan, is_subscribed FROM users WHERE id = $1`,
    [userId]
  );
  const user = userRows[0];
  const plan = user?.is_subscribed ? (user.subscription_plan || 'free') : 'free';

  // Use same team limits as event team page
  const planLimit = PLANS[plan]?.teamMembers ?? 1;
  const maxTeamMembers = planLimit === Infinity ? Infinity : planLimit;

  // Check if project is linked to an event
  const { rows: projectRows } = await db.query(
    "SELECT event_id FROM planner_projects WHERE id = $1",
    [projectId]
  );
  const eventId = projectRows[0]?.event_id;

  // If linked to event, use event team invite logic
  if (eventId) {
    // Check current team member count
    const { rows: teamCountRows } = await db.query(
      `SELECT COUNT(*)::int as count FROM event_members
       WHERE event_id = $1 AND deleted_at IS NULL`,
      [eventId]
    );
    const currentTeamCount = teamCountRows[0]?.count || 0;

    // Enforce team limits (total members including owner)
    if (maxTeamMembers !== Infinity && currentTeamCount >= maxTeamMembers) {
      const maxAdmins = maxTeamMembers - 1;
      throw new AppError(`Team limit reached. Your ${plan} plan allows up to ${maxAdmins} admin${maxAdmins === 1 ? '' : 's'}.`, 403);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists as team member
    const { rows: existingMemberRows } = await db.query(
      `SELECT em.user_id FROM event_members em
       JOIN users u ON u.id = em.user_id
       WHERE LOWER(u.email) = $1 AND em.event_id = $2 AND em.deleted_at IS NULL
       LIMIT 1`,
      [normalizedEmail, eventId]
    );
    if (existingMemberRows.length) {
      throw new AppError("This user is already a team member", 409);
    }

    // Check if email belongs to an existing user account
    const { rows: userRows } = await db.query(
      "SELECT id, full_name FROM users WHERE LOWER(email) = $1 LIMIT 1",
      [normalizedEmail]
    );
    const existingUser = userRows[0];

    if (existingUser) {
      // User exists - add directly to event_members
      // First try to update any deleted or email-only record
      await db.query(
        `UPDATE event_members SET user_id = $1, email = NULL, role = $3, deleted_at = NULL, joined_at = NOW()
         WHERE event_id = $2 AND user_id IS NULL AND deleted_at IS NULL
           AND LOWER(COALESCE(email, '')) = $4`,
        [existingUser.id, eventId, role || 'ADMIN', normalizedEmail]
      );

      // Then upsert the main record
      const { rows } = await db.query(`
        INSERT INTO event_members (event_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (event_id, user_id) DO UPDATE
        SET deleted_at = NULL, role = $3, joined_at = NOW()
        RETURNING *
      `, [eventId, existingUser.id, role || 'ADMIN']);

      if (rows[0]) {
        await logActivity(projectId, { userId, action: "team_member_added", entityType: "team", entityId: existingUser.id, entityTitle: existingUser.full_name });
        return {
          user_id: existingUser.id,
          name: existingUser.full_name,
          email: normalizedEmail,
          role: role || 'ADMIN',
          type: 'added'
        };
      }
      return null;
    } else {
      // User doesn't exist - create email-only pending member
      const { rows } = await db.query(`
        INSERT INTO event_members (event_id, email, role, joined_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT DO NOTHING
        RETURNING *
      `, [eventId, normalizedEmail, role || 'ADMIN']);

      await logActivity(projectId, { userId, action: "team_member_invited", entityType: "team", entityId: null, entityTitle: normalizedEmail });
      return { type: 'invited', email: normalizedEmail };
    }
  }

  // Otherwise use planner team
  // Check current planner team member count (excluding owner/creator)
  const { rows: plannerTeamCountRows } = await db.query(
    `SELECT COUNT(*)::int as count FROM planner_team_members
     WHERE project_id = $1`,
    [projectId]
  );
  const currentPlannerTeamCount = plannerTeamCountRows[0]?.count || 0;

  // Enforce team limits for planner team as well
  if (maxTeamMembers !== Infinity && currentPlannerTeamCount >= maxTeamMembers) {
    throw new AppError(`Team member limit reached. Your ${plan} plan allows ${maxTeamMembers} team member${maxTeamMembers === 1 ? '' : 's'}. Upgrade to add more.`, 403);
  }

  const displayName = name?.trim() || email.split("@")[0];
  const { rows } = await db.query(`
    INSERT INTO planner_team_members (project_id, name, email, role)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT DO NOTHING
    RETURNING *
  `, [projectId, displayName, email.toLowerCase().trim(), role ?? "EDITOR"]);

  const member = rows[0];
  if (member) {
    await logActivity(projectId, { userId, action: "team_member_invited", entityType: "team", entityId: member.id, entityTitle: member.name });
  }
  return member ?? null;
}

export async function updateTeamMemberService({ organizationId, projectId, memberId, userId, payload }) {
  await assertProject(organizationId, projectId);
  const { role } = payload;
  if (!role) throw new AppError("role required", 400);

  // Check if project is linked to an event
  const { rows: projectRows } = await db.query(
    "SELECT event_id FROM planner_projects WHERE id = $1",
    [projectId]
  );
  const eventId = projectRows[0]?.event_id;

  // If linked to event, update event_members
  if (eventId) {
    const { rows } = await db.query(
      "UPDATE event_members SET role = $1 WHERE event_id = $2 AND user_id = $3 AND deleted_at IS NULL RETURNING *",
      [role.toUpperCase(), eventId, memberId]
    );
    if (!rows[0]) throw new AppError("Member not found", 404);
    return rows[0];
  }

  // Otherwise update planner_team_members
  const { rows } = await db.query(
    "UPDATE planner_team_members SET role = $1 WHERE id = $2 AND project_id = $3 RETURNING *",
    [role.toUpperCase(), memberId, projectId]
  );
  if (!rows[0]) throw new AppError("Member not found", 404);
  return rows[0];
}

export async function removeTeamMemberService({ organizationId, projectId, memberId, userId }) {
  await assertProject(organizationId, projectId);

  // Check if project is linked to an event
  const { rows: projectRows } = await db.query(
    "SELECT event_id FROM planner_projects WHERE id = $1",
    [projectId]
  );
  const eventId = projectRows[0]?.event_id;

  // If linked to event, soft delete from event_members (same as event team page)
  if (eventId) {
    await db.query(
      "UPDATE event_members SET deleted_at = NOW() WHERE event_id = $1 AND user_id = $2",
      [eventId, memberId]
    );
    await logActivity(projectId, { userId, action: "team_member_removed", entityType: "team", entityId: memberId });
    return;
  }

  // Otherwise remove from planner team
  await db.query("DELETE FROM planner_team_members WHERE id = $1 AND project_id = $2", [memberId, projectId]);
  await logActivity(projectId, { userId, action: "team_member_removed", entityType: "team", entityId: memberId });
}

// ── NOTES ──────────────────────────────────────────────────────────────────

export async function getNotesService({ organizationId, projectId }) {
  await assertProject(organizationId, projectId);
  const { rows } = await db.query(
    "SELECT * FROM planner_notes WHERE project_id = $1 ORDER BY is_pinned DESC, updated_at DESC",
    [projectId]
  );
  return rows;
}

export async function createNoteService({ organizationId, projectId, userId, payload }) {
  await assertProject(organizationId, projectId);
  const { title, content, tags, isPinned } = payload;

  const { rows } = await db.query(`
    INSERT INTO planner_notes (project_id, user_id, title, content, tags, is_pinned)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
  `, [projectId, userId, title ?? null, content ?? null,
      tags ?? [], isPinned ?? false]);
  return rows[0];
}

export async function updateNoteService({ organizationId, projectId, noteId, userId, payload }) {
  await assertProject(organizationId, projectId);
  const allowed = {
    title: "title", content: "content",
    is_pinned: "is_pinned", isPinned: "is_pinned",
    tags: "tags",
  };

  const fields = [];
  const vals = [];
  let i = 1;
  for (const [k, v] of Object.entries(payload)) {
    const col = allowed[k];
    if (col) {
      const val = v;
      fields.push(`${col} = $${i++}`);
      vals.push(val);
    }
  }
  if (!fields.length) throw new AppError("No valid fields", 400);
  fields.push("updated_at = NOW()");
  vals.push(noteId, projectId);

  const { rows } = await db.query(
    `UPDATE planner_notes SET ${fields.join(", ")} WHERE id = $${i} AND project_id = $${i + 1} RETURNING *`,
    vals
  );
  if (!rows[0]) throw new AppError("Note not found", 404);
  return rows[0];
}

export async function deleteNoteService({ organizationId, projectId, noteId, userId }) {
  await assertProject(organizationId, projectId);
  await db.query("DELETE FROM planner_notes WHERE id = $1 AND project_id = $2", [noteId, projectId]);
}

// ── FILES ──────────────────────────────────────────────────────────────────

export async function getFilesService({ organizationId, projectId, folder }) {
  await assertProject(organizationId, projectId);
  let query = "SELECT * FROM planner_files WHERE project_id = $1";
  const vals = [projectId];
  if (folder) { query += " AND folder = $2"; vals.push(folder); }
  query += " ORDER BY uploaded_at DESC";
  const { rows } = await db.query(query, vals);
  return rows;
}

export async function uploadFileService({ organizationId, projectId, userId, fileData }) {
  await assertProject(organizationId, projectId);
  const { fileName, fileUrl, fileSize, mimeType, folder, tags } = fileData;

  const { rows } = await db.query(`
    INSERT INTO planner_files (project_id, user_id, folder, file_name, file_url, file_size, mime_type, tags)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `, [
    projectId, userId,
    folder ?? "general", fileName, fileUrl,
    fileSize ?? null, mimeType ?? null,
    tags ?? [],
  ]);
  return rows[0];
}

export async function deleteFileService({ organizationId, projectId, fileId, userId }) {
  await assertProject(organizationId, projectId);
  await db.query("DELETE FROM planner_files WHERE id = $1 AND project_id = $2", [fileId, projectId]);
  await logActivity(projectId, { userId, action: "file_deleted", entityType: "file", entityId: fileId });
}

// ── AI GENERATION ──────────────────────────────────────────────────────────

export async function generateAIBriefService({ organizationId, userId, projectId }) {
  const project = await getProjectService({ organizationId, projectId });

  const ctx = {
    title: project.title, event_type: project.event_type,
    event_date: project.event_date, guest_count: project.guest_count,
    total_budget: project.total_budget, venue: project.venue,
    days_remaining: project.days_remaining,
    task_stats: project.task_stats,
    vendor_count: project.vendors.length,
    confirmed_vendors: project.vendors.filter(v => ["booked","confirmed"].includes(v.booking_status?.toLowerCase())).length,
    budget_used: project.budget.total_actual,
    budget_total: project.budget.total_budget,
  };

  const system = `You are an expert event planning strategist. Return ONLY valid JSON. Be concise — keep every string field under 30 words, limit arrays to 5 items max.`;
  const user = `Generate an AI planning brief for this event:
${JSON.stringify(ctx, null, 2)}

Return JSON (be concise, arrays max 5 items, strings max 30 words):
{
  "health_score": 0,
  "headline": "...",
  "executive_summary": "...",
  "strengths": ["..."],
  "risks": [{ "risk": "...", "severity": "LOW|MEDIUM|HIGH|CRITICAL", "mitigation": "..." }],
  "critical_path": [{ "task": "...", "deadline": "...", "dependency": "...", "risk": "LOW|MEDIUM|HIGH" }],
  "budget_analysis": { "status": "...", "summary": "...", "recommendations": ["..."] },
  "vendor_analysis": { "summary": "...", "missing_vendors": ["..."], "concerns": ["..."] },
  "timeline_analysis": { "summary": "...", "conflicts": ["..."], "bottlenecks": ["..."] },
  "week_by_week_plan": [{ "week_label": "...", "focus": "...", "actions": ["..."] }],
  "urgent_actions": [{ "action": "...", "reason": "...", "due_by": "..." }],
  "opportunities": ["..."]
}`;

  const { content, usage, latencyMs } = await callAI({
    feature: "planner_brief", systemPrompt: system, userPrompt: user,
    responseFormat: "json", maxTokens: 6000,
  });

  const healthScore = safeInt(content.health_score ?? project.health_score, 50);

  await db.query(
    "UPDATE planner_projects SET ai_brief = $1, health_score = $2, updated_at = NOW() WHERE id = $3",
    [JSON.stringify(content), healthScore, projectId]
  );
  logAIGeneration({ organizationId, userId, feature: "planner_brief", usage, inputSnapshot: JSON.stringify(ctx).slice(0, 500), outputSnapshot: JSON.stringify(content).slice(0, 500), latencyMs });
  await logActivity(projectId, { userId, action: "ai_brief_generated" });
  return content;
}

export async function generateAITasksService({ organizationId, userId, projectId }) {
  const { rows: [project] } = await db.query(
    "SELECT * FROM planner_projects WHERE id = $1 AND organization_id = $2",
    [projectId, organizationId]
  );
  if (!project) throw new AppError("Project not found", 404);

  const system = `You are an expert event planning project manager. Return ONLY valid JSON. Keep descriptions under 15 words.`;
  const user = `Generate 25-30 tasks for this event:
Event Type: ${project.event_type || "general"}
Event Date: ${project.event_date || "TBD"}
Guest Count: ${project.guest_count || "unknown"}
Budget: ${project.total_budget || "unknown"} ${project.currency || "USD"}
Venue: ${project.venue || "TBD"}
Days Until Event: ${project.event_date ? Math.ceil((new Date(project.event_date) - new Date()) / 86400000) : "unknown"}

Return JSON array (25-30 items, descriptions max 15 words):
[{
  "title": "...",
  "description": "...",
  "category": "...",
  "priority": "HIGH|MEDIUM|LOW",
  "due_date_offset_days": 0,
  "estimated_cost": null
}]`;

  const { content, usage, latencyMs } = await callAI({
    feature: "planner_tasks", systemPrompt: system, userPrompt: user,
    responseFormat: "json", maxTokens: 4000,
  });

  const taskList = Array.isArray(content) ? content : (content.tasks ?? []);
  const eventDate = project.event_date ? new Date(project.event_date) : null;

  const insertedTasks = [];
  for (const t of taskList.slice(0, 50)) {
    let dueDate = null;
    if (eventDate && t.due_date_offset_days != null) {
      const d = new Date(eventDate);
      d.setDate(d.getDate() - Math.abs(t.due_date_offset_days));
      dueDate = d.toISOString().split("T")[0];
    }
    const { rows } = await db.query(`
      INSERT INTO planner_tasks
        (project_id, title, description, category, priority, due_date, estimated_cost, ai_generated, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,true,'TODO')
      RETURNING *
    `, [
      projectId, t.title, t.description ?? null, t.category ?? null,
      (t.priority ?? "MEDIUM").toUpperCase(), dueDate,
      safeNum(t.estimated_cost),
    ]);
    insertedTasks.push(rows[0]);
  }

  logAIGeneration({ organizationId, userId, feature: "planner_tasks", usage, inputSnapshot: project.title, outputSnapshot: `${insertedTasks.length} tasks`, latencyMs });
  await logActivity(projectId, { userId, action: "ai_tasks_generated", metadata: { count: insertedTasks.length } });
  return insertedTasks;
}

export async function generateAITimelineService({ organizationId, userId, projectId }) {
  const { rows: [project] } = await db.query(
    "SELECT * FROM planner_projects WHERE id = $1 AND organization_id = $2",
    [projectId, organizationId]
  );
  if (!project) throw new AppError("Project not found", 404);

  const system = `You are an expert event day-of coordinator. Return ONLY valid JSON. Keep each description under 20 words.`;
  const user = `Generate a realistic day-of timeline for:
Event Type: ${project.event_type || "general"}
Event Date: ${project.event_date || "TBD"}
Guest Count: ${project.guest_count || "unknown"}
Venue: ${project.venue || "TBD"}

Return JSON array of 15-20 items max:
[{
  "title": "...",
  "description": "...",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "duration_minutes": 30,
  "category": "...",
  "is_milestone": false
}]`;

  const { content, usage, latencyMs } = await callAI({
    feature: "planner_timeline", systemPrompt: system, userPrompt: user,
    responseFormat: "json", maxTokens: 4000,
  });

  const items = Array.isArray(content) ? content : (content.timeline ?? []);
  const insertedItems = [];
  for (const item of items.slice(0, 30)) {
    const { rows } = await db.query(`
      INSERT INTO planner_timeline_items
        (project_id, title, description, event_date, start_time, end_time,
         duration_minutes, category, is_milestone, ai_generated)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
      RETURNING *
    `, [
      projectId, item.title, item.description ?? null,
      project.event_date ?? null,
      item.start_time ?? null, item.end_time ?? null,
      safeInt(item.duration_minutes), item.category ?? null,
      item.is_milestone ?? false,
    ]);
    insertedItems.push(rows[0]);
  }

  logAIGeneration({ organizationId, userId, feature: "planner_timeline", usage, inputSnapshot: project.title, outputSnapshot: `${insertedItems.length} items`, latencyMs });
  await logActivity(projectId, { userId, action: "ai_timeline_generated", metadata: { count: insertedItems.length } });
  return insertedItems;
}

export async function generateAIBudgetService({ organizationId, userId, projectId }) {
  const { rows: [project] } = await db.query(
    "SELECT * FROM planner_projects WHERE id = $1 AND organization_id = $2",
    [projectId, organizationId]
  );
  if (!project) throw new AppError("Project not found", 404);

  const system = `You are an expert event budget planner. Return ONLY valid JSON.`;
  const user = `Suggest budget line items for:
Event Type: ${project.event_type || "general"}
Guest Count: ${project.guest_count || "unknown"}
Total Budget: ${project.total_budget || "unknown"} ${project.currency || "USD"}
Venue: ${project.venue || "TBD"}

Return JSON array:
[{
  "title": "...",
  "category": "...",
  "estimated_cost": 0,
  "vendor_name": null,
  "notes": null
}]`;

  const { content, usage, latencyMs } = await callAI({
    feature: "planner_budget", systemPrompt: system, userPrompt: user,
    responseFormat: "json", maxTokens: 3000,
  });

  const items = Array.isArray(content) ? content : (content.items ?? []);
  const inserted = [];
  for (const item of items.slice(0, 30)) {
    const { rows } = await db.query(`
      INSERT INTO planner_budget_items
        (project_id, title, category, vendor_name, estimated_cost, notes, ai_suggested, currency)
      VALUES ($1,$2,$3,$4,$5,$6,true,$7)
      RETURNING *
    `, [
      projectId, item.title, item.category ?? null,
      item.vendor_name ?? null, safeNum(item.estimated_cost, 0),
      item.notes ?? null, project.currency ?? "USD",
    ]);
    inserted.push(rows[0]);
  }

  logAIGeneration({ organizationId, userId, feature: "planner_budget", usage, inputSnapshot: project.title, outputSnapshot: `${inserted.length} items`, latencyMs });
  await logActivity(projectId, { userId, action: "ai_budget_generated", metadata: { count: inserted.length } });
  return inserted;
}

export async function generateAIVendorsService({ organizationId, userId, projectId }) {
  const { rows: [project] } = await db.query(
    "SELECT * FROM planner_projects WHERE id = $1 AND organization_id = $2",
    [projectId, organizationId]
  );
  if (!project) throw new AppError("Project not found", 404);

  const system = `You are an expert event vendor coordinator. Return ONLY valid JSON.`;
  const user = `Suggest vendor categories needed for:
Event Type: ${project.event_type || "general"}
Guest Count: ${project.guest_count || "unknown"}
Venue: ${project.venue || "TBD"}
Budget: ${project.total_budget || "unknown"} ${project.currency || "USD"}

Return JSON array:
[{
  "name": "...",
  "category": "...",
  "notes": "..."
}]`;

  const { content, usage, latencyMs } = await callAI({
    feature: "planner_vendors", systemPrompt: system, userPrompt: user,
    responseFormat: "json", maxTokens: 3000,
  });

  const vendors = Array.isArray(content) ? content : (content.vendors ?? []);
  const inserted = [];
  for (const v of vendors.slice(0, 20)) {
    const { rows } = await db.query(`
      INSERT INTO planner_vendors
        (project_id, name, category, notes, booking_status, ai_suggested, currency)
      VALUES ($1,$2,$3,$4,'researching',true,$5)
      RETURNING *
    `, [projectId, v.name, v.category ?? null, v.notes ?? null, project.currency ?? "USD"]);
    inserted.push(rows[0]);
  }

  logAIGeneration({ organizationId, userId, feature: "planner_vendors", usage, inputSnapshot: project.title, outputSnapshot: `${inserted.length} vendors`, latencyMs });
  await logActivity(projectId, { userId, action: "ai_vendors_generated", metadata: { count: inserted.length } });
  return inserted;
}

export async function generateRiskAnalysisService({ organizationId, userId, projectId }) {
  const project = await getProjectService({ organizationId, projectId });

  const system = `You are an expert event risk analyst. Return ONLY valid JSON.`;
  const user = `Analyze risks for this event project:
${JSON.stringify({
  title: project.title, event_type: project.event_type,
  days_remaining: project.days_remaining, task_stats: project.task_stats,
  vendor_count: project.vendors.length,
  budget_used: project.budget.total_actual,
  budget_total: project.budget.total_budget,
}, null, 2)}

Return JSON:
{
  "overall_risk": "LOW|MEDIUM|HIGH|CRITICAL",
  "risk_score": 0,
  "risks": [{ "category": "...", "risk": "...", "severity": "LOW|MEDIUM|HIGH|CRITICAL", "probability": "...", "mitigation": "...", "deadline": "..." }],
  "immediate_actions": [{ "action": "...", "priority": "...", "reason": "..." }]
}`;

  const { content, usage, latencyMs } = await callAI({
    feature: "planner_risk", systemPrompt: system, userPrompt: user,
    responseFormat: "json", maxTokens: 3000,
  });

  logAIGeneration({ organizationId, userId, feature: "planner_risk", usage, inputSnapshot: project.title, outputSnapshot: JSON.stringify(content).slice(0, 500), latencyMs });
  return content;
}

// ── SETTINGS ───────────────────────────────────────────────────────────────

export async function getSettingsService({ organizationId, projectId }) {
  const { rows: [p] } = await db.query(
    "SELECT id, title, event_type, event_date, event_end_date, guest_count, total_budget, currency, venue, city, country, style_notes, color, status FROM planner_projects WHERE id = $1 AND organization_id = $2",
    [projectId, organizationId]
  );
  if (!p) throw new AppError("Project not found", 404);
  return p;
}

export async function updateSettingsService({ organizationId, projectId, userId, payload }) {
  return updateProjectService({ organizationId, projectId, userId, payload });
}
