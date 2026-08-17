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
    teamMembers: 1, // owner only, no additional team members
    customDomain: false,
    analytics: false,
    advancedBuilder: false,
    // Ticket selling is available on every tier. Paid plans reduce the fee.
    stripeTicketing: true,
    qrScanner: true,
    platformFeePercent: 2,
    pageBuilder: true,
    guestEmailReminders: 0, // instant confirmation is free; scheduled reminders are locked
    planner: false, // no planner access
    rsvp: true,
  },

  starter: {
    name: "Starter",
    price: 19,
    events: 1, // 1 active event maximum
    guests: 500, // 500 guests maximum per event
    templates: Infinity,
    freeTemplateStyle: null,
    lockedTemplates: false,
    lockedStyles: false,
    teamMembers: 2, // owner + 1 additional invited member = 2 total
    customDomain: false,
    analytics: true,
    advancedBuilder: true,
    stripeTicketing: true,
    qrScanner: true,
    platformFeePercent: 2, // 2% platform fee
    pageBuilder: true,
    guestEmailReminders: 1, // 1 custom scheduled reminder; instant confirmation does not count
    planner: true, // full planner access
    rsvp: true,
  },

  pro: {
    name: "Pro",
    price: 49,
    events: 3, // 3 active events maximum
    guests: Infinity, // unlimited guests per event
    templates: Infinity,
    freeTemplateStyle: null,
    lockedTemplates: false,
    lockedStyles: false,
    teamMembers: 4, // owner + 3 additional invited members = 4 total
    customDomain: true,
    analytics: true,
    advancedBuilder: true,
    stripeTicketing: true,
    qrScanner: true,
    platformFeePercent: 1.5, // 1.5% platform fee on paid-ticket subtotal
    pageBuilder: true,
    guestEmailReminders: 5, // 5 email reminders maximum (instant + 4 custom)
    planner: true, // full planner access
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
    planner: true,
    whiteLabel: true,
    sso: true,
    apiAccess: true,
    rsvp: true,
  },

  // "premium" is legacy — treat as equivalent to "pro" for backward compatibility
  premium: {
    name: "Premium",
    price: 49,
    events: 3,
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
    guestEmailReminders: 5, // 5 email reminders maximum (instant + 4 custom)
    planner: true,
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

const ADMIN_GRANT_PLANS = new Set(["starter", "pro", "enterprise"]);

function getActiveAdminPlanOverride(row) {
  const plan = String(row?.admin_plan_override ?? "").toLowerCase();
  if (!ADMIN_GRANT_PLANS.has(plan)) return null;

  if (row.admin_plan_override_expires_at) {
    const expiresAt = new Date(row.admin_plan_override_expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) return null;
  }

  return plan;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * CRITICAL FIX #5: Resolve a user's current plan with strict validation.
 * Checks database flags AND validates period end and subscription status.
 * Returns "free" if ANY required field is missing or invalid.
 */
export async function getUserPlan(client, userId) {
  const result = await client.query(
    `SELECT subscription_plan, is_subscribed, subscription_id, subscription_status,
            subscription_current_period_end, admin_plan_override,
            admin_plan_override_expires_at FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const row = result.rows[0];
  const adminPlan = getActiveAdminPlanOverride(row);
  if (adminPlan) return adminPlan;
  if (!row || !row.is_subscribed) return "free";

  // CRITICAL: Require subscription_id - cannot be subscribed without one
  if (!row.subscription_id) {
    console.warn(`User ${userId} marked subscribed but missing subscription_id`);
    return "free";
  }

  // CRITICAL: Require subscription_status - cannot validate without it
  if (!row.subscription_status) {
    console.warn(`User ${userId} missing subscription_status`);
    return "free";
  }

  // CRITICAL: Validate subscription status is active
  const validStatuses = ["active", "trialing"];
  if (!validStatuses.includes(row.subscription_status)) {
    console.warn(`Invalid subscription status for user ${userId}: ${row.subscription_status}`);
    return "free";
  }

  // CRITICAL: Require period_end for active/trialing subscriptions
  if (!row.subscription_current_period_end) {
    console.warn(`User ${userId} missing subscription_current_period_end`);
    return "free";
  }

  // CRITICAL: Validate subscription period hasn't expired
  const periodEnd = new Date(row.subscription_current_period_end);
  const now = new Date();
  if (periodEnd < now) {
    console.warn(`Subscription expired for user ${userId}, period ended ${periodEnd.toISOString()}`);
    return "free";
  }

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

/**
 * CRITICAL FIX #5: Resolve plan from the event's organization owner with strict validation.
 * Used for public RSVP paths where no auth userId is available.
 * Returns "free" if ANY required field is missing or invalid.
 */
export async function getEventOwnerPlan(client, eventId) {
  const result = await client.query(
    `SELECT u.subscription_plan, u.is_subscribed, u.subscription_id, u.subscription_status,
            u.subscription_current_period_end, u.admin_plan_override,
            u.admin_plan_override_expires_at, u.id as user_id
     FROM events e
     JOIN organizations o ON o.id = e.organization_id
     JOIN users u ON u.id = o.owner_user_id
     WHERE e.id = $1 LIMIT 1`,
    [eventId]
  );
  const row = result.rows[0];
  const adminPlan = getActiveAdminPlanOverride(row);
  if (adminPlan) return adminPlan;
  if (!row || !row.is_subscribed) return "free";

  // CRITICAL: Require all fields for paid plans
  if (!row.subscription_id) {
    console.warn(`Event ${eventId} owner marked subscribed but missing subscription_id`);
    return "free";
  }

  if (!row.subscription_status) {
    console.warn(`Event ${eventId} owner missing subscription_status`);
    return "free";
  }

  // CRITICAL: Validate subscription status is active
  const validStatuses = ["active", "trialing"];
  if (!validStatuses.includes(row.subscription_status)) {
    console.warn(`Event ${eventId} owner invalid subscription status: ${row.subscription_status}`);
    return "free";
  }

  if (!row.subscription_current_period_end) {
    console.warn(`Event ${eventId} owner missing subscription_current_period_end`);
    return "free";
  }

  // CRITICAL: Validate subscription period hasn't expired
  const periodEnd = new Date(row.subscription_current_period_end);
  const now = new Date();
  if (periodEnd < now) {
    console.warn(`Event ${eventId} owner subscription expired, period ended ${periodEnd.toISOString()}`);
    return "free";
  }

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

  // Free plan: count ALL events (including deleted) to force upgrade after deletion
  // Paid plans: count only active events
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

/** Throws 403 only if ticket selling is disabled for a future plan. */
export async function assertCanSellTicket(client, userId) {
  const plan = await getUserPlan(client, userId);
  if (!PLANS[plan]?.stripeTicketing) {
    const err = new Error("Ticket selling is not available on your current plan.");
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
    const err = new Error("Reminder limit reached. Upgrade to Pro for up to 5 reminders.");
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
    const err = new Error(`Team limit reached. Your ${plan} plan allows up to ${maxAdmins} additional team member${maxAdmins === 1 ? "" : "s"}.`);
    err.statusCode = 403;
    err.code = "PLAN_LIMIT_FEATURE";
    err.details = { code: "PLAN_LIMIT_FEATURE", feature: "teamMembers", plan, limit: maxAdmins, current: current - 1 };
    throw err;
  }
}

/** Throws 403 if user's plan does not include planner access. */
export async function assertCanUsePlanner(client, userId) {
  const plan = await getUserPlan(client, userId);
  if (!PLANS[plan]?.planner) {
    const err = new Error("Planner access requires Starter plan or above.");
    err.statusCode = 403;
    err.code = "PLAN_LIMIT_FEATURE";
    err.details = {
      code: "PLAN_LIMIT_FEATURE",
      feature: "planner",
      plan,
    };
    throw err;
  }
}

/**
 * Enforces scheduled-reminder entitlements.
 * Instant Confirmation is included in every plan and does not count toward the limit.
 * Free may retain disabled reminders after a downgrade, but cannot enable any.
 * Starter can enable one; Pro can have up to 5 total reminders (instant + 4 custom).
 * Enterprise has unlimited.
 */
export async function assertCanEnableReminder(client, userId, eventId, newReminders) {
  const plan = await getUserPlan(client, userId);
  const limit = PLANS[plan]?.guestEmailReminders ?? 0;

  const customReminders = newReminders.filter(reminder => reminder.timing !== "instant");
  const enabledCustomReminders = customReminders.filter(reminder => reminder.enabled);
  const totalReminders = newReminders.length; // Total count including instant

  // Free can retain disabled settings, but may not activate a scheduled email.
  if (limit === 0 && enabledCustomReminders.length > 0) {
    const err = new Error("Upgrade to Starter to enable email reminders.");
    err.statusCode = 403;
    err.code = "PLAN_LIMIT_FEATURE";
    err.details = {
      code: "PLAN_LIMIT_FEATURE",
      feature: "guestEmailReminders",
      plan,
      requiredPlan: "starter",
    };
    throw err;
  }

  // Enterprise has unlimited reminders
  if (limit === Infinity) return;

  // Free plan - no active custom reminders allowed (already checked above)
  if (limit === 0) return;

  // Check total reminder count (for Pro plan with 5-reminder limit)
  if (totalReminders > limit) {
    const err = new Error(`Your ${plan} plan allows up to ${limit} total reminders. You have ${totalReminders}.`);
    err.statusCode = 403;
    err.code = "PLAN_LIMIT_FEATURE";
    err.details = {
      code: "PLAN_LIMIT_FEATURE",
      feature: "guestEmailReminders",
      plan,
      limit,
      current: totalReminders,
      requiredPlan: plan === "starter" ? "pro" : "enterprise",
    };
    throw err;
  }

  // Starter may enable one custom reminder. Existing disabled settings remain
  // stored so they are restored if the user later upgrades to Pro.
  if (plan === "starter" && enabledCustomReminders.length > 1) {
    const err = new Error(`Your ${plan} plan allows one active custom reminder. Upgrade to Pro to enable more.`);
    err.statusCode = 403;
    err.code = "PLAN_LIMIT_FEATURE";
    err.details = {
      code: "PLAN_LIMIT_FEATURE",
      feature: "guestEmailReminders",
      plan,
      limit: 1,
      requested: enabledCustomReminders.length,
      requiredPlan: "pro",
    };
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
  // Free plan: count all events (including deleted) so UI shows correct limit status
  // Paid plans: count only active events
  const eventCount = plan === "free"
    ? await countAllOrgEvents(client, organizationId)
    : await countOrgEvents(client, organizationId);

  return {
    plan,
    limits: {
      events:              p.events              === Infinity ? null : p.events,
      templates:           p.templates           === Infinity ? null : p.templates,
      guests:              p.guests              === Infinity ? null : p.guests,
      teamMembers:         p.teamMembers         === Infinity ? null : p.teamMembers,
      guestEmailReminders: p.guestEmailReminders === Infinity ? null : p.guestEmailReminders,
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
      planner:             p.planner, // planner access entitlement
      teamMembers:         p.teamMembers === Infinity ? null : p.teamMembers, // team size limit
    },
    freeTemplateStyle: p.freeTemplateStyle ?? null,
  };
}
