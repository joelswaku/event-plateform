import { db } from "../config/db.js";
import { stripe } from "../config/stripe.js";

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

async function assertOrganizationEventPermission(client, organizationId, userId) {
  const result = await client.query(
    `
    SELECT role
    FROM organization_members
    WHERE organization_id = $1
      AND user_id = $2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [organizationId, userId]
  );

  if (!result.rows[0]) {
    throw new AppError("You do not belong to this organization", 403);
  }

  const role = String(result.rows[0].role).toUpperCase();
  const allowedRoles = ["OWNER", "ADMIN", "MANAGER", "EVENT_MANAGER", "EDITOR", "STAFF"];

  if (!allowedRoles.includes(role)) {
    throw new AppError("You do not have permission for this event", 403);
  }
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

    await assertOrganizationEventPermission(client, organizationId, userId);
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
    await assertOrganizationEventPermission(client, organizationId, userId);
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
   DONATIONS
========================= */

function validateDonationPayload(payload = {}) {
  const amount = ensureMoney(payload.amount, "amount");

  return {
    donor_name: normalizeText(payload.donor_name),
    donor_email: normalizeText(payload.donor_email),
    donor_phone: normalizeText(payload.donor_phone),
    amount,
    currency: normalizeText(payload.currency) ?? "USD",
    message: normalizeText(payload.message),
    is_anonymous: normalizeBoolean(payload.is_anonymous, false),
  };
}

export async function createDonationIntentService({
  eventId,
  payload,
}) {
  const normalized = validateDonationPayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const eventRes = await client.query(
      `
      SELECT id, title, slug, allow_donations, deleted_at
      FROM events
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [eventId]
    );

    const event = eventRes.rows[0];
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    if (!event.allow_donations) {
      throw new AppError("Donations are disabled for this event", 400);
    }

    const insertResult = await client.query(
      `
      INSERT INTO event_donations
      (
        event_id,
        donor_name,
        donor_email,
        donor_phone,
        amount,
        currency,
        payment_status,
        message,
        is_anonymous,
        provider,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$7,$8,'STRIPE',NOW(),NOW())
      RETURNING *
      `,
      [
        eventId,
        normalized.donor_name,
        normalized.donor_email,
        normalized.donor_phone,
        normalized.amount,
        normalized.currency,
        normalized.message,
        normalized.is_anonymous,
      ]
    );

    const donation = insertResult.rows[0];

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: normalized.donor_email || undefined,
      line_items: [
        {
          price_data: {
            currency: normalized.currency.toLowerCase(),
            product_data: { name: `Donation to ${event.title}` },
            unit_amount: Math.round(normalized.amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        donation_id: donation.id,
        event_id: eventId,
        kind: "event_donation",
      },
      payment_intent_data: {
        metadata: {
          donation_id: donation.id,
          event_id: eventId,
          kind: "event_donation",
        },
        receipt_email: normalized.donor_email || undefined,
      },
      success_url: `${frontendUrl}/e/${event.slug}?donation=success`,
      cancel_url: `${frontendUrl}/e/${event.slug}?donation=cancelled`,
    });

    await client.query(
      `
      UPDATE event_donations
      SET
        provider_transaction_id = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [session.id, donation.id]
    );

    await client.query("COMMIT");

    return {
      donation_id: donation.id,
      checkout_url: session.url,
      amount: donation.amount,
      currency: donation.currency,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
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
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
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
    await assertOrganizationEventPermission(client, organizationId, userId);
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
    await assertOrganizationEventPermission(client, organizationId, userId);
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