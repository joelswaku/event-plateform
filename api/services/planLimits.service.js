import { db } from "../config/db.js";

// ── Plan definitions ──────────────────────────────────────────────────────────
export const PLANS = {
  free: {
    name: "Free",
    events: 1,
    templates: 3,          // all 3 CLASSIC style templates are free
    freeTemplateStyle: "CLASSIC",
    guests: 50,
    teamMembers: 1,
    customDomain: false,
    analytics: false,
    advancedBuilder: false,
    rsvp: true,
    pageBuilder: true,
  },
  premium: {
    name: "Premium",
    events: Infinity,
    templates: Infinity,
    freeTemplateStyle: null,
    guests: Infinity,
    teamMembers: Infinity,
    customDomain: true,
    analytics: true,
    advancedBuilder: true,
    rsvp: true,
    pageBuilder: true,
  },
};

// Error codes the frontend reads to trigger the right upgrade prompt
export const LIMIT_CODES = {
  EVENTS:    "PLAN_LIMIT_EVENTS",
  TEMPLATES: "PLAN_LIMIT_TEMPLATES",
  GUESTS:    "PLAN_LIMIT_GUESTS",
  FEATURE:   "PLAN_LIMIT_FEATURE",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve a user's current plan key from the DB. Defaults to "free". */
export async function getUserPlan(client, userId) {
  const result = await client.query(
    `SELECT subscription_plan, is_subscribed FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const row = result.rows[0];
  if (!row) return "free";
  // Only treat as premium when both fields confirm it
  return row.is_subscribed && row.subscription_plan === "premium"
    ? "premium"
    : "free";
}

/** Count non-deleted events in an org. */
export async function countOrgEvents(client, organizationId) {
  const result = await client.query(
    `SELECT COUNT(*) AS total FROM events WHERE organization_id = $1 AND deleted_at IS NULL`,
    [organizationId]
  );
  return parseInt(result.rows[0]?.total ?? 0, 10);
}

// ── Public enforcement functions ──────────────────────────────────────────────

/**
 * Throws a structured 403 if the org has hit the plan's event cap.
 * Call this inside a transaction before inserting a new event.
 */
export async function assertCanCreateEvent(client, userId, organizationId) {
  const plan  = await getUserPlan(client, userId);
  const limit = PLANS[plan].events;
  if (limit === Infinity) return; // premium — no cap

  const current = await countOrgEvents(client, organizationId);
  if (current >= limit) {
    const err = new Error("Event limit reached for your current plan.");
    err.statusCode = 403;
    err.code = LIMIT_CODES.EVENTS;
    err.details = { code: LIMIT_CODES.EVENTS, plan, limit, current, feature: "events" };
    throw err;
  }
}

/**
 * Returns the plan summary for a user — used by the /subscription/status endpoint
 * so the frontend can render accurate upgrade prompts.
 */
export async function getPlanSummary(client, userId, organizationId) {
  const plan       = await getUserPlan(client, userId);
  const limits     = PLANS[plan];
  const eventCount = await countOrgEvents(client, organizationId);

  return {
    plan,
    limits: {
      events:    limits.events === Infinity ? null : limits.events,
      templates: limits.templates === Infinity ? null : limits.templates,
      guests:    limits.guests === Infinity ? null : limits.guests,
    },
    usage: {
      events: eventCount,
    },
    features: {
      customDomain:    limits.customDomain,
      analytics:       limits.analytics,
      advancedBuilder: limits.advancedBuilder,
      rsvp:            limits.rsvp,
      pageBuilder:     limits.pageBuilder,
    },
    freeTemplateStyle: limits.freeTemplateStyle ?? null,
  };
}
