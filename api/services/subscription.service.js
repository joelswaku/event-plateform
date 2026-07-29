import { stripe } from "../config/stripe.js";
import { db } from "../config/db.js";
import { getPlanSummary, getUserPlan } from "./planLimits.service.js";

const FRONTEND_URL    = process.env.FRONTEND_URL    || "http://localhost:3000";
const STARTER_PRICE_ID = process.env.STRIPE_STARTER_PRICE_ID;
const PRO_PRICE_ID     = process.env.STRIPE_PRO_PRICE_ID;

/** Map a Stripe price ID to our internal plan name. Rejects unknown price IDs. */
function planFromPriceId(priceId) {
  if (STARTER_PRICE_ID && priceId === STARTER_PRICE_ID) return "starter";
  if (PRO_PRICE_ID     && priceId === PRO_PRICE_ID)     return "pro";
  // CRITICAL: reject unknown price IDs — prevent unauthorized access grants
  throw Object.assign(
    new Error(`Invalid price ID. Only Starter and Pro plans are available.`),
    { statusCode: 400, code: "INVALID_PRICE_ID" }
  );
}

export async function getSubscriptionStatusService(userId) {
  const client = await db.connect();
  try {
    const res = await client.query(
      `SELECT stripe_customer_id, subscription_id, subscription_status,
              subscription_plan, subscription_current_period_end, is_subscribed,
              default_organization_id
       FROM users WHERE id = $1`,
      [userId]
    );
    const u = res.rows[0];
    if (!u) throw Object.assign(new Error("User not found"), { statusCode: 404 });

    const organizationId = u.default_organization_id;
    const summary        = organizationId
      ? await getPlanSummary(client, userId, organizationId)
      : { limits: { events: 1, templates: 3, guests: 50 }, usage: { events: 0 }, features: {}, freeTemplateStyle: "CLASSIC" };

    // Auto-correct legacy "premium" plan name stored before per-tier pricing
    if (u.is_subscribed && u.subscription_plan === "premium" && u.subscription_id) {
      try {
        const sub  = await stripe.subscriptions.retrieve(u.subscription_id, { expand: ["items.data.price"] });
        const plan = planFromPriceId(sub.items?.data?.[0]?.price?.id);
        await client.query(`UPDATE users SET subscription_plan = $1 WHERE id = $2`, [plan, userId]);
        u.subscription_plan = plan;
      } catch { /* non-fatal — return stored plan if Stripe is unavailable */ }
    }

    // Use the same runtime entitlement check as protected API endpoints. A
    // stale database flag can never keep a cancelled or expired plan active.
    const effectivePlan = await getUserPlan(client, userId);
    const hasActiveEntitlement = effectivePlan !== "free";

    return {
      is_subscribed:       hasActiveEntitlement,
      plan:                effectivePlan,
      subscription_status: u.subscription_status              ?? null,
      current_period_end:  u.subscription_current_period_end  ?? null,
      limits:              summary.limits,
      usage:               summary.usage,
      features:            summary.features,
      freeTemplateStyle:   summary.freeTemplateStyle,
    };
  } finally {
    client.release();
  }
}

export async function createCheckoutSessionService(userId, priceId, successUrl, cancelUrl) {
  if (!stripe) throw Object.assign(new Error("Payment processing is not configured."), { statusCode: 503 });
  if (!priceId) throw Object.assign(new Error("priceId is required"), { statusCode: 400 });

  // CRITICAL FIX #1: Whitelist price IDs BEFORE creating checkout session
  // This prevents unauthorized access grants from unknown price IDs
  planFromPriceId(priceId); // throws if priceId is not whitelisted

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // CRITICAL FIX #2: Lock user row to prevent race conditions on double-click
    const uRes = await client.query(
      `SELECT email, full_name, stripe_customer_id, subscription_id, is_subscribed
       FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    const user = uRes.rows[0];
    if (!user) {
      await client.query("ROLLBACK");
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }

    // Check database flag first (fast check)
    if (user.is_subscribed && user.subscription_id) {
      // Verify with Stripe (authoritative source)
      try {
        const existingSub = await stripe.subscriptions.retrieve(user.subscription_id);
        if (["active", "trialing", "past_due"].includes(existingSub.status)) {
          await client.query("ROLLBACK");
          throw Object.assign(
            new Error("You already have an active subscription. Use the billing portal to change your plan."),
            { statusCode: 409, code: "SUBSCRIPTION_EXISTS" }
          );
        }
      } catch (err) {
        // If subscription doesn't exist in Stripe anymore, allow creating a new one
        if (err.statusCode !== 409) {
          console.warn("Subscription not found in Stripe, allowing new checkout:", user.subscription_id);
        } else {
          await client.query("ROLLBACK");
          throw err;
        }
      }
    }

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { user_id: userId }
      });
      customerId = customer.id;
      await client.query(`UPDATE users SET stripe_customer_id = $1 WHERE id = $2`, [customerId, userId]);
    }

    // Generate idempotency key to prevent duplicate sessions from double-clicks
    // Use minute-granularity timestamp so rapid clicks create same session,
    // but user can retry after a minute if they cancel
    const minuteTimestamp = Math.floor(Date.now() / 60000); // Changes every 60 seconds
    const idempotencyKey = `checkout_${userId}_${priceId}_${minuteTimestamp}`;

    const session = await stripe.checkout.sessions.create({
      customer:      customerId,
      mode:          "subscription",
      line_items:    [{ price: priceId, quantity: 1 }],
      success_url:   successUrl || `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:    cancelUrl  || `${FRONTEND_URL}/billing/cancel`,
      // metadata on the session itself — used by the webhook handler
      metadata:          { user_id: userId },
      subscription_data: { metadata: { user_id: userId } },
      allow_promotion_codes: true,
    }, {
      idempotencyKey, // Stripe will reject duplicate requests with same key within 24 hours
    });

    await client.query("COMMIT");
    return { url: session.url, sessionId: session.id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function createPortalSessionService(userId) {
  if (!stripe) throw Object.assign(new Error("Payment processing is not configured."), { statusCode: 503 });
  const uRes = await db.query(`SELECT stripe_customer_id FROM users WHERE id = $1`, [userId]);
  const user = uRes.rows[0];
  if (!user?.stripe_customer_id) throw Object.assign(new Error("No billing account found"), { statusCode: 400 });

  const session = await stripe.billingPortal.sessions.create({
    customer:   user.stripe_customer_id,
    // This is a real page in the web app; /billing has no index route.
    return_url: `${FRONTEND_URL}/settings/billing`,
  });
  return { url: session.url };
}

export async function activateSubscriptionService(checkoutSession) {
  const userId = checkoutSession.subscription_data?.metadata?.user_id || checkoutSession.metadata?.user_id;
  if (!userId) return;

  const subId = typeof checkoutSession.subscription === "string"
    ? checkoutSession.subscription : checkoutSession.subscription?.id;
  if (!subId) return;

  const sub = await stripe.subscriptions.retrieve(subId, { expand: ["items.data.price", "latest_invoice"] });

  // CRITICAL FIX #4: Only grant access if subscription is active/trialing AND payment succeeded
  // This prevents granting access before payment is confirmed
  const isValidStatus = ["active", "trialing"].includes(sub.status);

  // Verify latest invoice is paid (or doesn't require payment for trials)
  let isPaid = false;
  if (typeof sub.latest_invoice === "object" && sub.latest_invoice) {
    isPaid = sub.latest_invoice.status === "paid" || sub.latest_invoice.amount_due === 0;
  } else if (typeof sub.latest_invoice === "string") {
    const invoice = await stripe.invoices.retrieve(sub.latest_invoice);
    isPaid = invoice.status === "paid" || invoice.amount_due === 0;
  }

  if (!isValidStatus) {
    console.warn(`Subscription ${sub.id} not active/trialing (status: ${sub.status}), skipping activation`);
    return;
  }

  if (!isPaid && sub.status !== "trialing") {
    console.warn(`Subscription ${sub.id} invoice not paid, skipping activation`);
    return;
  }

  const plan = planFromPriceId(sub.items?.data?.[0]?.price?.id);

  await db.query(
    `UPDATE users SET is_subscribed = true, subscription_id = $2, subscription_status = $3,
     subscription_plan = $6, subscription_current_period_end = to_timestamp($4),
     stripe_customer_id = COALESCE(stripe_customer_id, $5), updated_at = NOW() WHERE id = $1`,
    [userId, sub.id, sub.status, sub.current_period_end, checkoutSession.customer, plan]
  );
}

export async function renewSubscriptionService(invoice) {
  const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subId) return;
  const sub = await stripe.subscriptions.retrieve(subId);
  const userId = sub.metadata?.user_id;
  if (!userId) return;
  await db.query(
    `UPDATE users SET is_subscribed = true, subscription_status = $2,
     subscription_current_period_end = to_timestamp($3), updated_at = NOW() WHERE id = $1`,
    [userId, sub.status, sub.current_period_end]
  );
}

export async function cancelSubscriptionService(subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;
  await db.query(
    `UPDATE users SET is_subscribed = false, subscription_status = 'canceled',
     subscription_plan = 'free', updated_at = NOW() WHERE id = $1`,
    [userId]
  );
}

export async function verifyCheckoutSessionService(userId, sessionId) {
  if (!sessionId) throw Object.assign(new Error("sessionId is required"), { statusCode: 400 });

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "subscription.latest_invoice"],
  });

  // Verify this session belongs to the authenticated user
  const sessionUserId = session.metadata?.user_id;
  if (!sessionUserId || sessionUserId !== String(userId)) {
    throw Object.assign(new Error("Session does not belong to this user"), { statusCode: 403 });
  }

  if (session.payment_status !== "paid") {
    return { is_subscribed: false };
  }

  const sub = session.subscription;
  const subId = typeof sub === "string" ? sub : sub?.id;
  if (!subId) throw Object.assign(new Error("No subscription on session"), { statusCode: 400 });

  const subscription = typeof sub === "string"
    ? await stripe.subscriptions.retrieve(sub, { expand: ["items.data.price", "latest_invoice"] })
    : sub;

  // CRITICAL FIX #4: Validate subscription status and invoice payment before granting access
  const isValidStatus = ["active", "trialing"].includes(subscription.status);

  let isPaid = false;
  if (typeof subscription.latest_invoice === "object" && subscription.latest_invoice) {
    isPaid = subscription.latest_invoice.status === "paid" || subscription.latest_invoice.amount_due === 0;
  } else if (typeof subscription.latest_invoice === "string") {
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
    isPaid = invoice.status === "paid" || invoice.amount_due === 0;
  }

  if (!isValidStatus || (!isPaid && subscription.status !== "trialing")) {
    return {
      is_subscribed: false,
      error: "Subscription not yet active or payment not confirmed"
    };
  }

  const plan = planFromPriceId(subscription.items?.data?.[0]?.price?.id);

  await db.query(
    `UPDATE users SET is_subscribed = true, subscription_id = $2, subscription_status = $3,
     subscription_plan = $6, subscription_current_period_end = to_timestamp($4),
     stripe_customer_id = COALESCE(stripe_customer_id, $5), updated_at = NOW() WHERE id = $1`,
    [userId, subscription.id, subscription.status, subscription.current_period_end, session.customer, plan]
  );

  return {
    is_subscribed: true,
    plan,
    subscription_status: subscription.status,
    current_period_end: subscription.current_period_end,
  };
}

export async function getStripePricesService() {
  if (!stripe) throw Object.assign(new Error("Payment processing is not configured."), { statusCode: 503 });
  const starterId = process.env.STRIPE_STARTER_PRICE_ID;
  const proId     = process.env.STRIPE_PRO_PRICE_ID;

  const [starterRes, proRes] = await Promise.allSettled([
    starterId ? stripe.prices.retrieve(starterId) : Promise.resolve(null),
    proId     ? stripe.prices.retrieve(proId)     : Promise.resolve(null),
  ]);

  const toPrice = (result) => {
    if (result.status !== "fulfilled" || !result.value) return null;
    const p = result.value;
    return {
      id:       p.id,
      amount:   p.unit_amount != null ? p.unit_amount / 100 : null,
      currency: p.currency ?? "usd",
      interval: p.recurring?.interval ?? "month",
    };
  };

  return { starter: toPrice(starterRes), pro: toPrice(proRes) };
}

export async function updateSubscriptionStatusService(subscription) {
  const userId  = subscription.metadata?.user_id;
  if (!userId) return;
  const isActive = ["active", "trialing"].includes(subscription.status);
  const priceId  = subscription.items?.data?.[0]?.price?.id;
  let plan = "free";
  try {
    plan = isActive ? planFromPriceId(priceId) : "free";
  } catch (err) {
    // If price ID validation fails, log but don't throw — webhook handler needs to continue
    console.error(`Invalid price ID in subscription update: ${priceId}`, err);
    plan = "free";
  }
  await db.query(
    `UPDATE users SET is_subscribed = $2, subscription_status = $3, subscription_plan = $4,
     subscription_current_period_end = to_timestamp($5), updated_at = NOW() WHERE id = $1`,
    [userId, isActive, subscription.status, plan, subscription.current_period_end]
  );
}

/**
 * CRITICAL FIX #2: Change an existing subscription plan instead of creating a duplicate.
 * This is the correct way to upgrade/downgrade a subscription.
 */
export async function changeSubscriptionPlanService(userId, newPriceId) {
  if (!stripe) throw Object.assign(new Error("Payment processing is not configured."), { statusCode: 503 });
  if (!newPriceId) throw Object.assign(new Error("priceId is required"), { statusCode: 400 });

  // Validate the new price ID is whitelisted
  const newPlan = planFromPriceId(newPriceId);

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Lock user row to prevent concurrent plan changes
    const uRes = await client.query(
      `SELECT subscription_id, subscription_plan FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    const user = uRes.rows[0];
    if (!user) {
      await client.query("ROLLBACK");
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    if (!user.subscription_id) {
      await client.query("ROLLBACK");
      throw Object.assign(
        new Error("No active subscription found. Please subscribe first."),
        { statusCode: 400, code: "NO_SUBSCRIPTION" }
      );
    }

    // Retrieve current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.subscription_id);

    if (!["active", "trialing", "past_due"].includes(subscription.status)) {
      await client.query("ROLLBACK");
      throw Object.assign(
        new Error("Current subscription is not active. Please contact support."),
        { statusCode: 400, code: "INACTIVE_SUBSCRIPTION" }
      );
    }

    const currentPriceId = subscription.items.data[0]?.price?.id;
    if (currentPriceId === newPriceId) {
      await client.query("ROLLBACK");
      throw Object.assign(
        new Error("You are already subscribed to this plan."),
        { statusCode: 400, code: "SAME_PLAN" }
      );
    }

    // Stripe is the billing authority. Do not commit a new entitlement before
    // Stripe accepts the price change. A stable idempotency key also makes a
    // network retry safe and prevents duplicate prorations.
    const idempotencyKey = `change_plan_${userId}_${subscription.id}_${newPriceId}`;
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: "create_prorations",
      // Keep the existing plan if Stripe cannot collect a required proration.
      payment_behavior: "error_if_incomplete",
    }, { idempotencyKey });

    const isActive = ["active", "trialing"].includes(updatedSubscription.status);

    // Persist Stripe's final state and the entitlement together. If this DB
    // commit fails after a successful Stripe update, the subscription.updated
    // webhook reconciles the database; access is never granted before Stripe.
    await client.query(
      `UPDATE users
       SET is_subscribed = $1,
           subscription_plan = $2,
           subscription_status = $3,
           subscription_current_period_end = to_timestamp($4),
           updated_at = NOW()
       WHERE id = $5`,
      [isActive, isActive ? newPlan : "free", updatedSubscription.status, updatedSubscription.current_period_end, userId]
    );

    await client.query("COMMIT");

    return {
      success: true,
      plan: isActive ? newPlan : "free",
      subscription_status: updatedSubscription.status,
      current_period_end: updatedSubscription.current_period_end,
    };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
