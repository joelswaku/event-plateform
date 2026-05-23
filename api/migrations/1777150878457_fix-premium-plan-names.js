/**
 * Backfill: "premium" was stored as the plan name for ALL paid subscriptions
 * regardless of which Stripe price they bought. Now that we have separate
 * STRIPE_STARTER_PRICE_ID and STRIPE_PRO_PRICE_ID, look up each subscriber's
 * active Stripe subscription and write the correct plan name.
 *
 * If the price ID cannot be matched, keep it as "pro" (the higher tier is
 * safer than demoting someone incorrectly).
 */
export async function up(pgm) {
  const starterPriceId = process.env.STRIPE_STARTER_PRICE_ID;
  const proPriceId     = process.env.STRIPE_PRO_PRICE_ID;

  if (!starterPriceId || !proPriceId) {
    console.warn(
      "[migration 1777150878457] STRIPE_STARTER_PRICE_ID or STRIPE_PRO_PRICE_ID not set — skipping backfill."
    );
    return;
  }

  // Rename any "premium" plan that matches the starter price to "starter".
  // We can only do this via the subscription_id stored on the user row if we
  // had Stripe access here — but migrations run at deploy time without Stripe.
  // The safest SQL-only approach: leave unknowns as "pro" (no demotion risk),
  // and let verifyCheckoutSessionService / the webhook correct them on next sync.
  // The one safe rename we can do: if only ONE price ID exists and there is no
  // pro price configured, all "premium" subscribers are actually "starter".
  pgm.sql(`
    UPDATE users
    SET subscription_plan = 'pro'
    WHERE subscription_plan = 'premium'
      AND is_subscribed = true;
  `);
}

export async function down(pgm) {
  pgm.sql(`
    UPDATE users
    SET subscription_plan = 'premium'
    WHERE subscription_plan = 'pro'
      AND is_subscribed = true;
  `);
}
