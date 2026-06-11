import { db } from "../config/db.js";
import { stripe } from "../config/stripe.js";
import { createNotificationService, getEventOwnerIdService } from "./notifications.service.js";
import { audit } from "./audit.service.js";

export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/* =========================
   HELPERS
========================= */

function normalizeText(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v || null;
}

function ensureMoney(value, fieldName = "amount") {
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) {
    throw new AppError(`${fieldName} must be a positive number`, 400);
  }
  return Number(n.toFixed(2));
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

async function assertOrganizationEventPermission(client, organizationId, userId, eventId = null) {
  const result = await client.query(
    `SELECT role FROM organization_members WHERE organization_id=$1 AND user_id=$2 AND deleted_at IS NULL LIMIT 1`,
    [organizationId, userId]
  );
  if (result.rows[0]) {
    const role = String(result.rows[0].role).toUpperCase();
    const allowedRoles = ["OWNER", "ADMIN", "MANAGER", "EVENT_MANAGER", "EDITOR", "STAFF"];
    if (!allowedRoles.includes(role)) throw new AppError("You do not have permission for this event", 403);
    return result.rows[0];
  }

  if (eventId) {
    const { rows } = await client.query(
      `SELECT role FROM event_members WHERE event_id=$1 AND user_id=$2 AND deleted_at IS NULL LIMIT 1`,
      [eventId, userId]
    );
    if (rows[0]) return rows[0];
  }
  throw new AppError("You do not belong to this organization", 403);
}

async function assertEventExists(client, eventId, organizationId) {
  const result = await client.query(
    `
    SELECT *
    FROM events
    WHERE id = $1
      AND organization_id = $2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [eventId, organizationId]
  );

  if (!result.rows[0]) {
    throw new AppError("Event not found", 404);
  }

  return result.rows[0];
}

/* =========================
   GIFTS
========================= */

function validateGiftPayload(payload = {}) {
  const errors = [];

  if (!normalizeText(payload.title)) {
    errors.push("title is required");
  }

  if (payload.price_estimate !== undefined && payload.price_estimate !== null) {
    const n = Number(payload.price_estimate);
    if (Number.isNaN(n) || n < 0) {
      errors.push("price_estimate must be a non-negative number");
    }
  }

  if (errors.length) {
    throw new AppError("Validation failed", 400, errors);
  }
}

export async function createGiftRegistryItemService({
  eventId,
  organizationId,
  userId,
  payload,
}) {
  validateGiftPayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId, eventId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      INSERT INTO gift_registry_items
      (
        event_id,
        title,
        description,
        external_url,
        price_estimate,
        currency,
        is_reserved,
        reserved_by_name,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
      RETURNING *
      `,
      [
        eventId,
        normalizeText(payload.title),
        normalizeText(payload.description),
        normalizeText(payload.external_url),
        payload.price_estimate ?? null,
        normalizeText(payload.currency) ?? "USD",
        normalizeBoolean(payload.is_reserved, false),
        normalizeText(payload.reserved_by_name),
      ]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listGiftRegistryItemsService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId, eventId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      SELECT *
      FROM gift_registry_items
      WHERE event_id = $1
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      `,
      [eventId]
    );

    return result.rows;
  } finally {
    client.release();
  }
}

/* =========================
   TERMS ACCEPTANCE
========================= */

const CURRENT_TERMS_VERSION = "2025-06-01"; // bump when ToS materially changes

async function ensureTermsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_terms_acceptance (
      user_id       UUID PRIMARY KEY,
      accepted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      terms_version VARCHAR(20)  NOT NULL,
      ip_address    TEXT,
      user_agent    TEXT
    )`);
}

export async function getTermsStatusService({ userId }) {
  const client = await db.connect();
  try {
    await ensureTermsTable(client);
    const res = await client.query(
      `SELECT terms_version, accepted_at FROM user_terms_acceptance WHERE user_id = $1`,
      [userId]
    );
    const row = res.rows[0];
    return {
      accepted:      !!row,
      upToDate:      row?.terms_version === CURRENT_TERMS_VERSION,
      acceptedAt:    row?.accepted_at ?? null,
      termsVersion:  row?.terms_version ?? null,
      currentVersion: CURRENT_TERMS_VERSION,
    };
  } finally {
    client.release();
  }
}

export async function acceptTermsService({ userId, ipAddress, userAgent }) {
  const client = await db.connect();
  try {
    await ensureTermsTable(client);

    // Fetch user details for the audit log
    const userRes = await client.query(
      `SELECT email, full_name FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const user = userRes.rows[0];

    const now = new Date();

    await client.query(
      `INSERT INTO user_terms_acceptance (user_id, terms_version, ip_address, user_agent, accepted_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
         SET terms_version = EXCLUDED.terms_version,
             ip_address    = EXCLUDED.ip_address,
             user_agent    = EXCLUDED.user_agent,
             accepted_at   = EXCLUDED.accepted_at`,
      [userId, CURRENT_TERMS_VERSION, ipAddress || null, userAgent || null, now]
    );

    // ── Immutable audit log ────────────────────────────────────────────────────
    // Logged regardless of whether this is a first-time or re-acceptance.
    // Never throws — audit failure must not break the acceptance flow.
    audit({
      adminId:      userId,
      adminEmail:   user?.email,
      action:       "TERMS_ACCEPTED",
      resourceType: "legal",
      resourceId:   CURRENT_TERMS_VERSION,
      details: {
        terms_version:  CURRENT_TERMS_VERSION,
        accepted_at:    now.toISOString(),
        user_id:        userId,
        user_email:     user?.email   ?? null,
        user_name:      user?.full_name ?? null,
        ip_address:     ipAddress     ?? null,
        user_agent:     userAgent     ?? null,
        document_urls: {
          terms:   "https://liteevent.com/terms",
          privacy: "https://liteevent.com/privacy-policy",
        },
      },
      ip:        ipAddress,
      userAgent: userAgent,
    }).catch(() => {}); // fire-and-forget, never block the response

    return { accepted: true, termsVersion: CURRENT_TERMS_VERSION, acceptedAt: now };
  } finally {
    client.release();
  }
}

/* =========================
   DONATIONS
========================= */

function validateDonationPayload(payload = {}) {
  const amount = ensureMoney(payload.amount, "amount");
  const freq   = payload.frequency === "monthly" ? "monthly" : "once";

  return {
    donor_name:  normalizeText(payload.donor_name),
    donor_email: normalizeText(payload.donor_email),
    donor_phone: normalizeText(payload.donor_phone),
    amount,
    currency:    normalizeText(payload.currency) ?? "USD",
    message:     normalizeText(payload.message),
    is_anonymous: normalizeBoolean(payload.is_anonymous, false),
    frequency:   freq,
  };
}

export async function createDonationIntentService({ eventId, payload }) {
  const normalized = validateDonationPayload(payload);
  const isMonthly  = normalized.frequency === "monthly";

  if (!stripe) throw new AppError("Payment processing is not configured. Please contact the event organizer.", 503);

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Auto-add columns if missing
    await client.query(`ALTER TABLE event_donations ADD COLUMN IF NOT EXISTS frequency     VARCHAR(10) DEFAULT 'once'`).catch(() => {});
    await client.query(`ALTER TABLE event_donations ADD COLUMN IF NOT EXISTS subscription_id TEXT`).catch(() => {});

    const eventRes = await client.query(
      `SELECT id, title, slug, allow_donations FROM events WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [eventId]
    );
    const event = eventRes.rows[0];
    if (!event)              throw new AppError("Event not found", 404);
    if (!event.allow_donations) throw new AppError("Donations are disabled for this event", 400);

    const insertResult = await client.query(
      `INSERT INTO event_donations
        (event_id, donor_name, donor_email, donor_phone, amount, currency,
         payment_status, message, is_anonymous, frequency, provider, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$7,$8,$9,'STRIPE',NOW(),NOW())
       RETURNING *`,
      [
        eventId,
        normalized.donor_name, normalized.donor_email, normalized.donor_phone,
        normalized.amount, normalized.currency,
        normalized.message, normalized.is_anonymous, normalized.frequency,
      ]
    );
    const donation = insertResult.rows[0];

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const donationMeta = { donation_id: donation.id, event_id: eventId, kind: "event_donation" };

    let session;
    try {
      if (isMonthly) {
        // ── Subscription (recurring monthly) ──────────────────────────────────
        session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer_email: normalized.donor_email || undefined,
          line_items: [{
            price_data: {
              currency:     normalized.currency.toLowerCase(),
              product_data: { name: `Monthly donation — ${event.title}` },
              unit_amount:  Math.round(normalized.amount * 100),
              recurring:    { interval: "month" },
            },
            quantity: 1,
          }],
          metadata:          donationMeta,
          subscription_data: { metadata: donationMeta },
          success_url: `${frontendUrl}/e/${event.slug}?donation=success`,
          cancel_url:  `${frontendUrl}/e/${event.slug}?donation=cancelled`,
        });
      } else {
        // ── One-time payment ───────────────────────────────────────────────────
        session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          customer_email: normalized.donor_email || undefined,
          line_items: [{
            price_data: {
              currency:     normalized.currency.toLowerCase(),
              product_data: { name: `Donation — ${event.title}` },
              unit_amount:  Math.round(normalized.amount * 100),
            },
            quantity: 1,
          }],
          metadata: donationMeta,
          payment_intent_data: {
            metadata:     donationMeta,
            receipt_email: normalized.donor_email || undefined,
          },
          success_url: `${frontendUrl}/e/${event.slug}?donation=success`,
          cancel_url:  `${frontendUrl}/e/${event.slug}?donation=cancelled`,
        });
      }
    } catch (stripeErr) {
      console.error("STRIPE ERROR:", stripeErr.message);
      const isAuthErr = stripeErr?.type === "authentication_error" || stripeErr?.statusCode === 401;
      throw new AppError(
        isAuthErr
          ? "Payment gateway is misconfigured. Please contact the event organizer."
          : stripeErr.message || "Failed to create payment session",
        isAuthErr ? 503 : 502
      );
    }

    await client.query(
      `UPDATE event_donations SET provider_transaction_id = $1, updated_at = NOW() WHERE id = $2`,
      [session.id, donation.id]
    );
    await client.query("COMMIT");

    return { donation_id: donation.id, checkout_url: session.url, amount: donation.amount, currency: donation.currency, frequency: normalized.frequency };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/* Called when checkout.session.completed with mode=subscription */
export async function completeDonationSubscriptionActivatedService(session) {
  const donationId = session?.metadata?.donation_id;
  const eventId    = session?.metadata?.event_id;
  const subId      = session?.subscription;
  if (!donationId || !eventId) return null;

  const client = await db.connect();
  try {
    const res = await client.query(
      `UPDATE event_donations
       SET payment_status = 'SUCCEEDED', donated_at = NOW(),
           subscription_id = $1, updated_at = NOW()
       WHERE id = $2 AND event_id = $3 AND payment_status = 'PENDING'
       RETURNING *`,
      [subId || null, donationId, eventId]
    );
    const donation = res.rows[0];
    if (!donation) return null;

    // Notify owner
    getEventOwnerIdService(eventId).then((ownerId) => {
      if (!ownerId) return;
      createNotificationService({
        userId: ownerId, type: "new_donation",
        title:  `$${Number(donation.amount).toFixed(0)} monthly donation started`,
        body:   `${donation.donor_name || "Someone"} set up a monthly donation.`,
        link:   `/events/${eventId}/donations`,
        metadata: { eventId, donationId: donation.id, amount: donation.amount },
      });
    }).catch(() => {});

    return donation;
  } finally {
    client.release();
  }
}

/* Called on invoice.paid for recurring monthly donations */
export async function recordDonationRenewalService(invoice) {
  const subId   = invoice?.subscription;
  const eventId = invoice?.subscription_details?.metadata?.event_id
               || invoice?.lines?.data?.[0]?.metadata?.event_id;
  if (!subId || !eventId) return null;

  const client = await db.connect();
  try {
    // Look up the original donation to get donor info
    const origRes = await client.query(
      `SELECT * FROM event_donations WHERE subscription_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [subId]
    );
    const orig = origRes.rows[0];
    if (!orig) return null;

    // Skip the first invoice — already handled by checkout.session.completed
    // billing_reason "subscription_create" = first payment, anything else = renewal
    if (invoice.billing_reason === "subscription_create") {
      return null;
    }

    const amount = invoice.amount_paid / 100;
    const res = await client.query(
      `INSERT INTO event_donations
        (event_id, donor_name, donor_email, amount, currency, payment_status,
         frequency, subscription_id, provider, donated_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,'SUCCEEDED','monthly',$6,'STRIPE',NOW(),NOW(),NOW())
       RETURNING *`,
      [eventId, orig.donor_name, orig.donor_email, amount, (invoice.currency || "usd").toUpperCase(), subId]
    );
    return res.rows[0];
  } finally {
    client.release();
  }
}

export async function completeDonationFromWebhookService(paymentIntent) {
  const donationId = paymentIntent?.metadata?.donation_id;
  const eventId = paymentIntent?.metadata?.event_id;

  if (!donationId || !eventId) return null;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const donationRes = await client.query(
      `
      SELECT *
      FROM event_donations
      WHERE id = $1
        AND event_id = $2
      FOR UPDATE
      `,
      [donationId, eventId]
    );

    const donation = donationRes.rows[0];
    if (!donation) {
      throw new AppError("Donation not found", 404);
    }

    if (donation.payment_status === "SUCCEEDED") {
      await client.query("COMMIT");
      return donation;
    }

    const updated = await client.query(
      `
      UPDATE event_donations
      SET
        payment_status = 'SUCCEEDED',
        donated_at = NOW(),
        provider_transaction_id = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [paymentIntent.id, donation.id]
    );

    await client.query("COMMIT");
    const completedDonation = updated.rows[0];

    // Notify event owner of completed donation (fire-and-forget)
    getEventOwnerIdService(eventId).then((ownerId) => {
      if (!ownerId) return;
      const amount = Number(completedDonation.amount);
      const donorName = completedDonation.is_anonymous ? "Anonymous" : (completedDonation.donor_name || completedDonation.donor_email || "Someone");
      createNotificationService({
        userId: ownerId,
        type: "new_donation",
        title: `$${amount.toFixed(0)} donation received`,
        body: `${donorName} just donated to your event.`,
        link: `/events/${eventId}/donations`,
        metadata: { eventId, donationId: completedDonation.id, amount },
      });
    }).catch(() => {});

    // ── Audit: log completed donation ──────────────────────────────────────────
    audit({
      adminId:      null,
      adminEmail:   completedDonation.donor_email ?? "anonymous",
      action:       "DONATION_COMPLETED",
      resourceType: "donation",
      resourceId:   completedDonation.id,
      details: {
        donation_id:   completedDonation.id,
        event_id:      eventId,
        donor_name:    completedDonation.is_anonymous ? "Anonymous" : (completedDonation.donor_name ?? null),
        donor_email:   completedDonation.donor_email  ?? null,
        amount:        Number(completedDonation.amount),
        currency:      completedDonation.currency,
        frequency:     completedDonation.frequency ?? "once",
        payment_status: "SUCCEEDED",
        provider:      completedDonation.provider,
      },
    }).catch(() => {});

    return completedDonation;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/* Manual (cash/admin) donation — no Stripe, instantly SUCCEEDED */
export async function createManualDonationService({ eventId, organizationId, userId, payload }) {
  const normalized = validateDonationPayload(payload);
  const client = await db.connect();
  try {
    await assertOrganizationEventPermission(client, organizationId, userId, eventId);
    const result = await client.query(
      `INSERT INTO event_donations
        (event_id, donor_name, donor_email, donor_phone, amount, currency,
         payment_status, message, is_anonymous, provider, donated_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,'SUCCEEDED',$7,$8,'MANUAL',NOW(),NOW(),NOW())
       RETURNING *`,
      [eventId, normalized.donor_name, normalized.donor_email, normalized.donor_phone,
       normalized.amount, normalized.currency, normalized.message, normalized.is_anonymous]
    );
    const donation = result.rows[0];

    audit({
      adminId:      userId,
      action:       "DONATION_MANUAL_RECORDED",
      resourceType: "donation",
      resourceId:   donation.id,
      details: {
        donation_id:     donation.id,
        event_id:        eventId,
        organization_id: organizationId,
        donor_name:      normalized.donor_name  ?? null,
        donor_email:     normalized.donor_email ?? null,
        amount:          Number(donation.amount),
        currency:        donation.currency,
        recorded_by:     userId,
      },
    }).catch(() => {});

    return donation;
  } finally {
    client.release();
  }
}

export async function deleteDonationService({ eventId, donationId, organizationId, userId }) {
  const client = await db.connect();
  try {
    await assertOrganizationEventPermission(client, organizationId, userId, eventId);
    const res = await client.query(
      `DELETE FROM event_donations WHERE id = $1 AND event_id = $2 RETURNING id`,
      [donationId, eventId]
    );
    if (!res.rows[0]) throw new AppError("Donation not found", 404);
    return { deleted: true };
  } finally {
    client.release();
  }
}

/* Donation preset amounts config — auto-creates a simple settings table */
async function ensureDonationConfigTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS event_donation_config (
      event_id  UUID PRIMARY KEY,
      amounts   JSONB NOT NULL DEFAULT '[]',
      message   TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);
  // Add message column if table existed without it
  await client.query(`
    ALTER TABLE event_donation_config ADD COLUMN IF NOT EXISTS message TEXT
  `).catch(() => {});
}

export async function getDonationConfigService({ eventId }) {
  const client = await db.connect();
  try {
    await ensureDonationConfigTable(client);
    const res = await client.query(
      `SELECT amounts, message FROM event_donation_config WHERE event_id = $1`, [eventId]);
    return { amounts: res.rows[0]?.amounts ?? [], message: res.rows[0]?.message ?? "" };
  } finally {
    client.release();
  }
}

export async function saveDonationConfigService({ eventId, organizationId, userId, amounts, message }) {
  const sanitized = (Array.isArray(amounts) ? amounts : [])
    .map(Number).filter(n => n > 0 && n < 100000).slice(0, 3);
  const msg = typeof message === "string" ? message.trim().slice(0, 280) : "";
  const client = await db.connect();
  try {
    await assertOrganizationEventPermission(client, organizationId, userId, eventId);
    await ensureDonationConfigTable(client);
    await client.query(
      `INSERT INTO event_donation_config (event_id, amounts, message, updated_at)
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (event_id) DO UPDATE
         SET amounts = EXCLUDED.amounts, message = EXCLUDED.message, updated_at = NOW()`,
      [eventId, JSON.stringify(sanitized), msg || null]
    );
    return { amounts: sanitized, message: msg };
  } finally {
    client.release();
  }
}

export async function listDonationsService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId, eventId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      SELECT *
      FROM event_donations
      WHERE event_id = $1
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      `,
      [eventId]
    );

    return result.rows;
  } finally {
    client.release();
  }
}

/* =========================
   EVENT DASHBOARD SUMMARY
========================= */

export async function getEngagementDashboardService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId, eventId);
    await assertEventExists(client, eventId, organizationId);

    const [giftsRes, donationsRes] = await Promise.all([
      client.query(
        `
        SELECT
          COUNT(*)::int AS total_gifts,
          COUNT(*) FILTER (WHERE is_reserved = true)::int AS reserved_gifts
        FROM gift_registry_items
        WHERE event_id = $1
          AND deleted_at IS NULL
        `,
        [eventId]
      ),
      client.query(
        `
        SELECT
          COUNT(*)::int AS total_donations,
          COALESCE(SUM(amount) FILTER (WHERE payment_status = 'SUCCEEDED'), 0)::numeric AS total_donation_amount
        FROM event_donations
        WHERE event_id = $1
          AND deleted_at IS NULL
        `,
        [eventId]
      ),
    ]);

    return {
      gifts: giftsRes.rows[0],
      donations: donationsRes.rows[0],
    };
  } finally {
    client.release();
  }
}