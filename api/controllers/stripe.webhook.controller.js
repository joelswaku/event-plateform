
import { stripe } from "../config/stripe.js";
import { db } from "../config/db.js";
import { issueTicketsForOrderService } from "../services/ticket-issuance.service.js";
import { completeDonationFromWebhookService } from "../services/engagement.service.js";
import {
  activateSubscriptionService,
  renewSubscriptionService,
  cancelSubscriptionService,
  updateSubscriptionStatusService,
} from "../services/subscription.service.js";

export async function stripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("🔥 STRIPE EVENT:", event.type);

  /* ── Idempotency: skip already-processed events ── */
  try {
    const insert = await db.query(
      `INSERT INTO webhook_events (provider, event_type, external_event_id, payload, processed)
       VALUES ('stripe', $1, $2, $3, false)
       ON CONFLICT (external_event_id) DO NOTHING
       RETURNING id`,
      [event.type, event.id, JSON.stringify(event.data.object)]
    );
    if (insert.rows.length === 0) {
      console.log("⚠️  Duplicate webhook skipped:", event.id);
      return res.status(200).json({ received: true });
    }
  } catch (err) {
    console.error("❌ Webhook idempotency check failed:", err.message);
  }

  /* ── Subscription lifecycle events ── */
  try {
    if (event.type === "checkout.session.completed" && event.data.object.mode === "subscription") {
      await activateSubscriptionService(event.data.object);
      await db.query(`UPDATE webhook_events SET processed=true, processed_at=now() WHERE external_event_id=$1`, [event.id]);
      return res.status(200).json({ received: true });
    }
    if (event.type === "invoice.paid") {
      await renewSubscriptionService(event.data.object);
      await db.query(`UPDATE webhook_events SET processed=true, processed_at=now() WHERE external_event_id=$1`, [event.id]);
      return res.status(200).json({ received: true });
    }
    if (event.type === "customer.subscription.updated") {
      await updateSubscriptionStatusService(event.data.object);
      await db.query(`UPDATE webhook_events SET processed=true, processed_at=now() WHERE external_event_id=$1`, [event.id]);
      return res.status(200).json({ received: true });
    }
    if (event.type === "customer.subscription.deleted") {
      await cancelSubscriptionService(event.data.object);
      await db.query(`UPDATE webhook_events SET processed=true, processed_at=now() WHERE external_event_id=$1`, [event.id]);
      return res.status(200).json({ received: true });
    }
  } catch (err) {
    console.error("❌ Subscription webhook error:", err.message);
    await db.query(`UPDATE webhook_events SET error_message=$1 WHERE external_event_id=$2`, [err.message, event.id]);
    return res.status(200).json({ received: true });
  }

  // Only ticket payments below
  if (event.type !== "payment_intent.succeeded") {
    return res.status(200).json({ received: true });
  }

  const paymentIntent = event.data.object;

  /* ── Donations ── */
  if (paymentIntent?.metadata?.kind === "event_donation") {
    try {
      console.log("💰 Donation detected");
      await completeDonationFromWebhookService(paymentIntent);
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error("❌ Donation webhook error:", err);
      return res.status(500).json({ message: "Donation processing failed" });
    }
  }

  /* ── Ticket orders ── */
  const orderId = paymentIntent?.metadata?.order_id;

  if (!orderId) {
    console.error("❌ Missing order_id in metadata");
    return res.status(400).json({ message: "Missing order_id" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    console.log("✅ PAYMENT SUCCESS FOR ORDER:", orderId);

    const orderRes = await client.query(
      `SELECT * FROM ticket_orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );

    const order = orderRes.rows[0];
    if (!order) throw new Error("Order not found");

    if (order.payment_status === "PAID") {
      console.log("⚠️ Order already processed:", orderId);
      await client.query("COMMIT");
      return res.status(200).json({ received: true });
    }

    await client.query(
      `UPDATE ticket_orders
       SET payment_status = 'PAID', order_status = 'COMPLETED',
           paid_at = NOW(), provider_payment_intent_id = $2, updated_at = NOW()
       WHERE id = $1`,
      [orderId, paymentIntent.id]
    );

    await client.query("COMMIT");

    try {
      await issueTicketsForOrderService(orderId);
      console.log("🎟 Tickets issued for order:", orderId);
    } catch (err) {
      console.error("⚠️ Ticket issuance failed:", err.message);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ success: false, message: "Webhook failed" });
  } finally {
    client.release();
  }
}
