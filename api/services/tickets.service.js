// tickets.service.js

import { db } from "../config/db.js";
import { stripe } from "../config/stripe.js";
import { issueTicketsForOrderService } from "./ticket-issuance.service.js";
import { createNotificationService, getEventOwnerIdService } from "./notifications.service.js";

class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function normalizeItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Order must contain at least one ticket item", 400);
  }

  return items.map((item) => ({
    ticket_type_id: item.ticket_type_id,
    quantity: Number(item.quantity),
  }));
}

function ensurePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError(`${fieldName} must be a positive integer`, 400);
  }
}

function toMoneyNumber(value) {
  return Number(value || 0);
}

export async function confirmOrderPaymentService(orderId) {
  const orderRes = await db.query(
    `SELECT o.* FROM ticket_orders o WHERE o.id = $1 AND o.deleted_at IS NULL LIMIT 1`,
    [orderId]
  );
  const order = orderRes.rows[0];
  if (!order) throw new AppError("Order not found", 404);

  if (order.payment_status === "PAID") {
    return { status: "already_issued" };
  }

  if (order.provider !== "STRIPE" || !order.provider_payment_intent_id) {
    throw new AppError("Cannot verify this order", 400);
  }

  // provider_payment_intent_id is the Stripe Checkout Session ID (cs_...)
  const session = await stripe.checkout.sessions.retrieve(order.provider_payment_intent_id);

  if (session.payment_status !== "paid") {
    return { status: "not_paid" };
  }

  await db.query(
    `UPDATE ticket_orders
     SET payment_status = 'PAID', order_status = 'COMPLETED',
         paid_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND payment_status != 'PAID'`,
    [orderId]
  );

  await issueTicketsForOrderService(orderId);
  return { status: "issued" };
}

export async function createTicketOrderService({
  eventId,
  payload,
  buyerUserId = null,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const items = normalizeItems(payload.items);

    if (!payload.buyer_email || !String(payload.buyer_email).trim()) {
      throw new AppError("buyer_email is required", 400);
    }

    const eventRes = await client.query(
      `
      SELECT id, title, slug, deleted_at
      FROM events
      WHERE id=$1
      LIMIT 1
      `,
      [eventId]
    );

    const event = eventRes.rows[0];

    if (!event || event.deleted_at) {
      throw new AppError("Event not found", 404);
    }

    const nowRes = await client.query(`SELECT NOW() AS now`);
    const now = nowRes.rows[0].now;

    let subtotal = 0;
    const preparedItems = [];

    for (const item of items) {
      if (!item.ticket_type_id) {
        throw new AppError("ticket_type_id is required", 400);
      }

      ensurePositiveInteger(item.quantity, "quantity");

      const ticketTypeRes = await client.query(
        `
        SELECT *
        FROM ticket_types
        WHERE id=$1
          AND event_id=$2
          AND is_active=true
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [item.ticket_type_id, eventId]
      );

      const ticketType = ticketTypeRes.rows[0];

      if (!ticketType) {
        throw new AppError("Invalid or inactive ticket type", 404);
      }

      if (
        ticketType.sale_starts_at &&
        new Date(ticketType.sale_starts_at) > new Date(now)
      ) {
        throw new AppError(
          `Sales have not started for ticket type: ${ticketType.name}`,
          400
        );
      }

      if (
        ticketType.sale_ends_at &&
        new Date(ticketType.sale_ends_at) < new Date(now)
      ) {
        throw new AppError(
          `Sales have ended for ticket type: ${ticketType.name}`,
          400
        );
      }

      if (
        ticketType.quantity_total !== null &&
        ticketType.quantity_sold + item.quantity > ticketType.quantity_total
      ) {
        throw new AppError(
          `Not enough quantity available for ticket type: ${ticketType.name}`,
          400
        );
      }

      const unitPrice = toMoneyNumber(ticketType.price);
      const lineTotal = unitPrice * item.quantity;

      subtotal += lineTotal;

      preparedItems.push({
        ticket_type_id: ticketType.id,
        ticket_type_name: ticketType.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        kind: ticketType.kind,
        currency: ticketType.currency,
      });
    }

    const discountAmount = 0;
    const fees = 0;
    const total = subtotal - discountAmount + fees;

    const orderStatus = total === 0 ? "COMPLETED" : "PENDING";
    const paymentStatus = total === 0 ? "PAID" : "PENDING";

    const orderRes = await client.query(
      `
      INSERT INTO ticket_orders
      (
        event_id,
        buyer_user_id,
        buyer_name,
        buyer_email,
        buyer_phone,
        order_status,
        subtotal,
        discount_amount,
        fees,
        total,
        currency,
        provider,
        payment_status,
        paid_at
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'STRIPE',$12,$13)
      RETURNING *
      `,
      [
        eventId,
        buyerUserId,
        payload.buyer_name?.trim() || null,
        String(payload.buyer_email).trim().toLowerCase(),
        payload.buyer_phone?.trim() || null,
        orderStatus,
        subtotal,
        discountAmount,
        fees,
        total,
        "USD",
        paymentStatus,
        total === 0 ? now : null,
      ]
    );

    const order = orderRes.rows[0];
    const createdItems = [];

    for (const item of preparedItems) {
      const itemRes = await client.query(
        `
        INSERT INTO ticket_order_items
        (
          order_id,
          ticket_type_id,
          quantity,
          unit_price,
          line_total
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [
          order.id,
          item.ticket_type_id,
          item.quantity,
          item.unit_price,
          item.line_total,
        ]
      );

      createdItems.push(itemRes.rows[0]);
    }

    let checkoutUrl = null;
    let providerPaymentIntentId = null;
    const paymentRequired = total > 0;

    if (paymentRequired) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const eventSlug = event.slug;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: order.buyer_email || undefined,
        line_items: preparedItems.map((item) => ({
          price_data: {
            currency: (item.currency || "USD").toLowerCase(),
            product_data: { name: item.ticket_type_name },
            unit_amount: Math.round(item.unit_price * 100),
          },
          quantity: item.quantity,
        })),
        metadata: { order_id: order.id, event_id: eventId },
        payment_intent_data: {
          metadata: { order_id: order.id, event_id: eventId },
          receipt_email: order.buyer_email || undefined,
        },
        // Support {ORDER_ID} placeholder so mobile callers can embed the real order ID
        success_url: (payload.success_url || `${frontendUrl}/e/${eventSlug}/tickets?payment=success&order_id=${order.id}`)
          .replace('{ORDER_ID}', order.id),
        cancel_url: payload.cancel_url || `${frontendUrl}/e/${eventSlug}/tickets?payment=cancelled`,
      });

      providerPaymentIntentId = session.id;
      checkoutUrl = session.url;

      await client.query(
        `
        UPDATE ticket_orders
        SET provider_payment_intent_id=$1,
            updated_at=NOW()
        WHERE id=$2
        `,
        [providerPaymentIntentId, order.id]
      );
    }

    await client.query("COMMIT");

    let issuedTickets = null;

    if (!paymentRequired) {
      issuedTickets = await issueTicketsForOrderService(order.id);
      // Notify event owner of free/comp ticket issuance
      getEventOwnerIdService(order.event_id).then((ownerId) => {
        if (!ownerId) return;
        const qty = createdItems.reduce((s, it) => s + (it.quantity || 1), 0);
        createNotificationService({
          userId: ownerId,
          type: "ticket_sold",
          title: `${qty} ticket${qty !== 1 ? "s" : ""} issued`,
          body: `${payload.buyer_email} · ${event.title}`,
          link: `/events/${order.event_id}/tickets`,
          metadata: { eventId: order.event_id, orderId: order.id, quantity: qty, total: Number(order.total) },
        });
      }).catch(() => {});
    }

    return {
      order_id: order.id,
      event_id: order.event_id,
      order_status: paymentRequired ? "PENDING" : "COMPLETED",
      payment_status: paymentRequired ? "PENDING" : "PAID",
      subtotal: Number(order.subtotal),
      discount_amount: Number(order.discount_amount),
      fees: Number(order.fees),
      total: Number(order.total),
      currency: order.currency,
      provider: order.provider,
      provider_payment_intent_id: providerPaymentIntentId,
      payment_required: paymentRequired,
      checkout_url: checkoutUrl,
      items: createdItems,
      issued_tickets: issuedTickets,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}