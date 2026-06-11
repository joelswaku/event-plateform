import { stripe } from "../config/stripe.js";
import { db } from "../config/db.js";
import { getPlanSummary } from "./planLimits.service.js";

const FRONTEND_URL    = process.env.FRONTEND_URL    || "http://localhost:3000";
const STARTER_PRICE_ID = process.env.STRIPE_STARTER_PRICE_ID;
const PRO_PRICE_ID     = process.env.STRIPE_PRO_PRICE_ID;

/** Map a Stripe price ID to our internal plan name. */
function planFromPriceId(priceId) {
  if (STARTER_PRICE_ID && priceId === STARTER_PRICE_ID) return "starter";
  if (PRO_PRICE_ID     && priceId === PRO_PRICE_ID)     return "pro";
  return "pro"; // unknown paid price → default to pro
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

    return {
      is_subscribed:       u.is_subscribed                    ?? false,
      plan:                u.subscription_plan                ?? "free",
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

  const uRes = await db.query(`SELECT email, full_name, stripe_customer_id FROM users WHERE id = $1`, [userId]);
  const user = uRes.rows[0];
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.full_name, metadata: { user_id: userId } });
    customerId = customer.id;
    await db.query(`UPDATE users SET stripe_customer_id = $1 WHERE id = $2`, [customerId, userId]);
  }

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
  });

  return { url: session.url, sessionId: session.id };
}

export async function createPortalSessionService(userId) {
  if (!stripe) throw Object.assign(new Error("Payment processing is not configured."), { statusCode: 503 });
  const uRes = await db.query(`SELECT stripe_customer_id FROM users WHERE id = $1`, [userId]);
  const user = uRes.rows[0];
  if (!user?.stripe_customer_id) throw Object.assign(new Error("No billing account found"), { statusCode: 400 });

  const session = await stripe.billingPortal.sessions.create({
    customer:   user.stripe_customer_id,
    return_url: `${FRONTEND_URL}/billing`,
  });
  return { url: session.url };
}

export async function activateSubscriptionService(checkoutSession) {
  const userId = checkoutSession.subscription_data?.metadata?.user_id || checkoutSession.metadata?.user_id;
  if (!userId) return;

  const subId = typeof checkoutSession.subscription === "string"
    ? checkoutSession.subscription : checkoutSession.subscription?.id;
  if (!subId) return;

  const sub    = await stripe.subscriptions.retrieve(subId, { expand: ["items.data.price"] });
  const plan   = planFromPriceId(sub.items?.data?.[0]?.price?.id);
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
    expand: ["subscription"],
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
    ? await stripe.subscriptions.retrieve(sub, { expand: ["items.data.price"] })
    : sub;

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
  const plan     = isActive ? planFromPriceId(priceId) : "free";
  await db.query(
    `UPDATE users SET is_subscribed = $2, subscription_status = $3, subscription_plan = $4,
     subscription_current_period_end = to_timestamp($5), updated_at = NOW() WHERE id = $1`,
    [userId, isActive, subscription.status, plan, subscription.current_period_end]
  );
}
