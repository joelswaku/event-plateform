import { db } from "../config/db.js";

// ── Plan definitions ──────────────────────────────────────────────────────────
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    events: 1,
    guests: 50,
    templates: 3,
    freeTemplateStyle: "CLASSIC",
    lockedTemplates: true,
    lockedStyles: true,
    teamMembers: 1,
    customDomain: false,
    analytics: false,
    advancedBuilder: false,
    stripeTicketing: false,
    qrScanner: true,
    platformFeePercent: 0,
    pageBuilder: true,
    guestEmailReminders: 0,
    rsvp: true,
  },

  starter: {
    name: "Starter",
    price: 19,
    events: 5,
    guests: 500,
    templates: Infinity,
    freeTemplateStyle: null,
    lockedTemplates: false,
    lockedStyles: false,
    teamMembers: 2,
    customDomain: false,
    analytics: true,
    advancedBuilder: true,
    stripeTicketing: true,
    qrScanner: true,
    platformFeePercent: 2,
    pageBuilder: true,
    guestEmailReminders: 1,
    rsvp: true,
  },

  pro: {
    name: "Pro",
    price: 49,
    events: Infinity,
    guests: Infinity,
    templates: Infinity,
    freeTemplateStyle: null,
    lockedTemplates: false,
    lockedStyles: false,
    teamMembers: 4,
    customDomain: true,
    analytics: true,
    advancedBuilder: true,
    stripeTicketing: true,
    qrScanner: true,
    platformFeePercent: 1.5,
    pageBuilder: true,
    guestEmailReminders: Infinity,
    rsvp: true,
  },

  enterprise: {
    name: "Enterprise",
    price: null,
    events: Infinity,
    guests: Infinity,
    templates: Infinity,
    freeTemplateStyle: null,
    lockedTemplates: false,
    lockedStyles: false,
    teamMembers: Infinity,
    customDomain: true,
    analytics: true,
    advancedBuilder: true,
    stripeTicketing: true,
    qrScanner: true,
    platformFeePercent: 0,
    pageBuilder: true,
    guestEmailReminders: Infinity,
    whiteLabel: true,
    sso: true,
    apiAccess: true,
    rsvp: true,
  },

  // "premium" is what activateSubscriptionService writes to subscription_plan.
  // Treat it as equivalent to "pro" (all features, unlimited everything).
  premium: {
    name: "Premium",
    price: 19,
    events: Infinity,
    guests: Infinity,
    templates: Infinity,
    freeTemplateStyle: null,
    lockedTemplates: false,
    lockedStyles: false,
    teamMembers: Infinity,
    customDomain: true,
    analytics: true,
    advancedBuilder: true,
    stripeTicketing: true,
    qrScanner: true,
    platformFeePercent: 0,
    pageBuilder: true,
    guestEmailReminders: Infinity,
    rsvp: true,
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
  if (!row || !row.is_subscribed) return "free";
  const validPlans = ["starter", "pro", "enterprise", "premium"];
  return validPlans.includes(row.subscription_plan) ? row.subscription_plan : "free";
}

/** Count non-deleted events in an org. */
export async function countOrgEvents(client, organizationId) {
  const result = await client.query(
    `SELECT COUNT(*) AS total FROM events WHERE organization_id = $1 AND deleted_at IS NULL`,
    [organizationId]
  );
  return parseInt(result.rows[0]?.total ?? 0, 10);
}

/** Count ALL events in an org, including soft-deleted ones. Used for free plan enforcement. */
export async function countAllOrgEvents(client, organizationId) {
  const result = await client.query(
    `SELECT COUNT(*) AS total FROM events WHERE organization_id = $1`,
    [organizationId]
  );
  return parseInt(result.rows[0]?.total ?? 0, 10);
}

/** Count non-deleted guests for a specific event. */
export async function countEventGuests(client, eventId) {
  const result = await client.query(
    `SELECT COUNT(*) AS total FROM guests WHERE event_id = $1 AND deleted_at IS NULL`,
    [eventId]
  );
  return parseInt(result.rows[0]?.total ?? 0, 10);
}

/** Resolve plan from the event's organization owner — used for public RSVP paths where no auth userId is available. */
export async function getEventOwnerPlan(client, eventId) {
  const result = await client.query(
    `SELECT u.subscription_plan, u.is_subscribed
     FROM events e
     JOIN organizations o ON o.id = e.organization_id
     JOIN users u ON u.id = o.owner_user_id
     WHERE e.id = $1 LIMIT 1`,
    [eventId]
  );
  const row = result.rows[0];
  if (!row || !row.is_subscribed) return "free";
  const validPlans = ["starter", "pro", "enterprise", "premium"];
  return validPlans.includes(row.subscription_plan) ? row.subscription_plan : "free";
}

// ── Enforcement functions ─────────────────────────────────────────────────────

/**
 * Throws a structured 403 if the org has hit the plan's event cap.
 * Call this inside a transaction before inserting a new event.
 */
export async function assertCanCreateEvent(client, userId, organizationId) {
  const plan  = await getUserPlan(client, userId);
  const limit = PLANS[plan].events;
  if (limit === Infinity) return;

  // Free plan: count all events ever created (including deleted) so deleting
  // and recreating is not a workaround. Paid plans count only active events.
  const current = plan === "free"
    ? await countAllOrgEvents(client, organizationId)
    : await countOrgEvents(client, organizationId);

  if (current >= limit) {
    const err = new Error("Event limit reached for your current plan.");
    err.statusCode = 403;
    err.code = LIMIT_CODES.EVENTS;
    err.details = { code: LIMIT_CODES.EVENTS, plan, limit, current, feature: "events" };
    throw err;
  }
}

/**
 * Throws 403 if the event has hit the plan's guest cap.
 * Pass userId when the caller has an authenticated user (organizer-side).
 * Pass userId=null for public RSVP paths — plan is looked up via event owner.
 */
export async function assertCanCreateGuest(client, eventId, userId = null) {
  const plan  = userId ? await getUserPlan(client, userId) : await getEventOwnerPlan(client, eventId);
  const limit = PLANS[plan].guests;
  if (limit === Infinity) return;

  const current = await countEventGuests(client, eventId);
  if (current >= limit) {
    const err = new Error(`Guest limit reached. Your ${plan} plan allows up to ${limit} guests per event.`);
    err.statusCode = 403;
    err.code = LIMIT_CODES.GUESTS;
    err.details = { code: LIMIT_CODES.GUESTS, plan, limit, current, feature: "guests" };
    throw err;
  }
}

/** Throws 403 if free user tries to apply a non-CLASSIC template. */
export async function assertCanUseTemplate(client, userId, themeId) {
  const plan = await getUserPlan(client, userId);
  const p = PLANS[plan];
  if (p.lockedTemplates && themeId !== p.freeTemplateStyle) {
    const err = new Error("This template requires Starter plan or above.");
    err.statusCode = 403;
    err.code = "PLAN_LIMIT_TEMPLATES";
    err.details = {
      code: "PLAN_LIMIT_TEMPLATES",
      feature: "templates",
      plan,
      allowedStyle: p.freeTemplateStyle,
    };
    throw err;
  }
}

/** Throws 403 if user's plan does not include ticket selling. */
export async function assertCanSellTicket(client, userId) {
  const plan = await getUserPlan(client, userId);
  if (!PLANS[plan]?.stripeTicketing) {
    const err = new Error("Ticket selling requires Starter plan or above.");
    err.statusCode = 403;
    err.code = "PLAN_LIMIT_FEATURE";
    err.details = {
      code: "PLAN_LIMIT_FEATURE",
      feature: "stripeTicketing",
      plan,
    };
    throw err;
  }
}

/** Throws 403 if user has no reminders or has hit their per-guest reminder quota. */
export async function assertCanSendReminder(client, userId, alreadySentCount) {
  const plan = await getUserPlan(client, userId);
  const limit = PLANS[plan]?.guestEmailReminders ?? 0;
  if (limit === 0) {
    const err = new Error("Email reminders require Starter plan or above.");
    err.statusCode = 403;
    err.code = "PLAN_LIMIT_FEATURE";
    err.details = {
      code: "PLAN_LIMIT_FEATURE",
      feature: "guestEmailReminders",
      plan,
    };
    throw err;
  }
  if (limit !== Infinity && alreadySentCount >= limit) {
    const err = new Error("Reminder limit reached. Upgrade to Pro for unlimited reminders.");
    err.statusCode = 403;
    err.code = "PLAN_LIMIT_FEATURE";
    err.details = {
      code: "PLAN_LIMIT_FEATURE",
      feature: "guestEmailReminders",
      plan,
      limit,
      used: alreadySentCount,
    };
    throw err;
  }
}

/** Throws 403 if the event has hit the plan's team member cap. */
export async function assertCanAddTeamMember(client, userId, eventId) {
  const plan  = await getUserPlan(client, userId);
  const limit = PLANS[plan]?.teamMembers ?? 1;
  if (limit === Infinity) return;

  const result = await client.query(
    `SELECT COUNT(*) AS total FROM event_members WHERE event_id = $1 AND deleted_at IS NULL`,
    [eventId]
  );
  const current = parseInt(result.rows[0]?.total ?? 0, 10);

  if (current >= limit) {
    const maxAdmins = limit - 1;
    const err = new Error(`Team limit reached. Your ${plan} plan allows up to ${maxAdmins} admin${maxAdmins === 1 ? "" : "s"}.`);
    err.statusCode = 403;
    err.code = "PLAN_LIMIT_FEATURE";
    err.details = { code: "PLAN_LIMIT_FEATURE", feature: "teamMembers", plan, limit: maxAdmins, current: current - 1 };
    throw err;
  }
}

// ── Fee calculation ───────────────────────────────────────────────────────────

export function calculatePlatformFee(plan, ticketAmountCents) {
  const pct = PLANS[plan]?.platformFeePercent ?? 2;
  if (pct === 0) return 0;
  return Math.round(ticketAmountCents * pct / 100);
}

// ── Summary ───────────────────────────────────────────────────────────────────

/**
 * Returns the plan summary for a user — used by /subscription/status
 * so the frontend can render accurate upgrade prompts.
 */
export async function getPlanSummary(client, userId, organizationId) {
  const plan       = await getUserPlan(client, userId);
  const p          = PLANS[plan];
  // Free plan: report all-time event count so UI correctly shows limit as hit
  // even if the user deleted their one event.
  const eventCount = plan === "free"
    ? await countAllOrgEvents(client, organizationId)
    : await countOrgEvents(client, organizationId);

  return {
    plan,
    limits: {
      events:    p.events    === Infinity ? null : p.events,
      templates: p.templates === Infinity ? null : p.templates,
      guests:    p.guests    === Infinity ? null : p.guests,
    },
    usage: {
      events: eventCount,
    },
    features: {
      customDomain:        p.customDomain,
      analytics:           p.analytics,
      advancedBuilder:     p.advancedBuilder,
      rsvp:                p.rsvp,
      pageBuilder:         p.pageBuilder,
      lockedTemplates:     p.lockedTemplates,
      lockedStyles:        p.lockedStyles,
      freeTemplateStyle:   p.freeTemplateStyle,
      stripeTicketing:     p.stripeTicketing,
      guestEmailReminders: p.guestEmailReminders === Infinity ? null : p.guestEmailReminders,
      platformFeePercent:  p.platformFeePercent,
    },
    freeTemplateStyle: p.freeTemplateStyle ?? null,
  };
}
