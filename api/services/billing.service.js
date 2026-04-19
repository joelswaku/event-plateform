import crypto from "crypto";
import { db } from "../config/db.js";

export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function normalizeText(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v || null;
}

function ensurePositiveNumber(value, fieldName) {
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) {
    throw new AppError(`${fieldName} must be a positive number`, 400);
  }
  return Number(n.toFixed(2));
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
    throw new AppError("Forbidden", 403);
  }
}

/* =========================
   DISCOUNT CODES
========================= */

function validateDiscountPayload(payload = {}) {
  const errors = [];

  if (!normalizeText(payload.code)) errors.push("code is required");
  if (!normalizeText(payload.discount_type)) errors.push("discount_type is required");

  try {
    ensurePositiveNumber(payload.discount_value, "discount_value");
  } catch (error) {
    errors.push(error.message);
  }

  if (payload.usage_limit !== undefined && payload.usage_limit !== null) {
    const n = Number(payload.usage_limit);
    if (!Number.isInteger(n) || n <= 0) {
      errors.push("usage_limit must be a positive integer");
    }
  }

  if (errors.length) {
    throw new AppError("Validation failed", 400, errors);
  }
}

export async function createDiscountCodeService({
  eventId,
  organizationId,
  userId,
  payload,
}) {
  validateDiscountPayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);

    const result = await client.query(
      `
      INSERT INTO discount_codes
      (
        event_id,
        code,
        discount_type,
        discount_value,
        usage_limit,
        starts_at,
        ends_at,
        is_active,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
      RETURNING *
      `,
      [
        eventId,
        normalizeText(payload.code).toUpperCase(),
        normalizeText(payload.discount_type).toUpperCase(),
        ensurePositiveNumber(payload.discount_value, "discount_value"),
        payload.usage_limit ?? null,
        payload.starts_at ?? null,
        payload.ends_at ?? null,
        payload.is_active ?? true,
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

export async function listDiscountCodesService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);

    const result = await client.query(
      `
      SELECT *
      FROM discount_codes
      WHERE event_id = $1
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
   INVOICES / PLANS
========================= */

export async function listSubscriptionPlansService() {
  const result = await db.query(
    `
    SELECT *
    FROM subscription_plans
    WHERE deleted_at IS NULL
    ORDER BY price_monthly ASC
    `
  );

  return result.rows;
}

export async function createBillingInvoiceService({
  organizationId,
  subscriptionId = null,
  amount,
  currency = "USD",
  metadata = {},
}) {
  const invoiceNumber = `INV-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const result = await db.query(
    `
    INSERT INTO billing_invoices
    (
      organization_id,
      subscription_id,
      invoice_number,
      amount,
      currency,
      payment_status,
      issued_at,
      metadata,
      created_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,'PENDING',NOW(),$6,NOW(),NOW())
    RETURNING *
    `,
    [
      organizationId,
      subscriptionId,
      invoiceNumber,
      ensurePositiveNumber(amount, "amount"),
      normalizeText(currency) ?? "USD",
      metadata ?? {},
    ]
  );

  return result.rows[0];
}