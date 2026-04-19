// tickets.service.js

import { db } from "../config/db.js";
import { stripe } from "../config/stripe.js";
import { issueTicketsForOrderService } from "./ticket-issuance.service.js";

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
      SELECT id, title, deleted_at
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

    let clientSecret = null;
    let providerPaymentIntentId = null;
    const paymentRequired = total > 0;

    if (paymentRequired) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "usd",
        metadata: {
          order_id: order.id,
          event_id: eventId,
        },
        receipt_email: order.buyer_email || undefined,
      });

      providerPaymentIntentId = paymentIntent.id;
      clientSecret = paymentIntent.client_secret;

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
      client_secret: clientSecret,
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