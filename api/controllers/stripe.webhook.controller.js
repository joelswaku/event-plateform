
import { stripe } from "../config/stripe.js";
import { db } from "../config/db.js";
import { issueTicketsForOrderService } from "../services/ticket-issuance.service.js";
import {
  completeDonationFromWebhookService,
  completeDonationSubscriptionActivatedService,
  recordDonationRenewalService,
} from "../services/engagement.service.js";
import {
  activateSubscriptionService,
  renewSubscriptionService,
  cancelSubscriptionService,
  updateSubscriptionStatusService,
} from "../services/subscription.service.js";

async function markWebhookProcessed(webhookRecordId) {
  if (!webhookRecordId) return;
  await db.query(
    `UPDATE webhook_events
     SET processed = true, processed_at = NOW(), error_message = NULL
     WHERE id = $1`,
    [webhookRecordId]
  );
}

async function markWebhookFailed(webhookRecordId, error) {
  if (!webhookRecordId) return;
  await db.query(
    `UPDATE webhook_events SET error_message = $1 WHERE id = $2`,
    [error?.message ?? String(error), webhookRecordId]
  ).catch(() => {});
}

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

  /* ── CRITICAL FIX #3: Idempotency — skip already-processed events, but allow retries on failures ── */
  let webhookRecordId = null;
  try {
    // Insert first so simultaneous Stripe deliveries cannot race past a
    // separate SELECT. A retry of an unprocessed event is deliberately allowed.
    const insert = await db.query(
      `INSERT INTO webhook_events (provider, event_type, external_event_id, payload, processed)
       VALUES ('stripe', $1, $2, $3, false)
       ON CONFLICT (external_event_id) DO NOTHING
       RETURNING id`,
      [event.type, event.id, JSON.stringify(event.data.object)]
    );

    if (insert.rows.length > 0) {
      webhookRecordId = insert.rows[0].id;
    } else {
      const existing = await db.query(
        `SELECT id, processed FROM webhook_events WHERE external_event_id = $1`,
        [event.id]
      );
      const record = existing.rows[0];
      if (!record) throw new Error("Webhook idempotency record was not found");
      if (record.processed) {
        console.log("⚠️  Duplicate webhook skipped (already processed):", event.id);
        return res.status(200).json({ received: true });
      }

      webhookRecordId = record.id;
      await db.query(
        `UPDATE webhook_events SET payload = $1 WHERE id = $2`,
        [JSON.stringify(event.data.object), webhookRecordId]
      );
    }
  } catch (err) {
    console.error("❌ Webhook idempotency check failed:", err.message);
    // Return 500 to trigger Stripe retry
    return res.status(500).json({ success: false, message: "Database error" });
  }

  /* ── Failed payment events — mark orders/donations as failed ── */
  if (event.type === "checkout.session.expired") {
    try {
      const session = event.data.object;
      await db.query(
        `UPDATE ticket_orders SET order_status='EXPIRED', updated_at=NOW()
         WHERE provider_payment_intent_id=$1 AND order_status='PENDING'`,
        [session.id]
      );
      await markWebhookProcessed(webhookRecordId);
      return res.status(200).json({ received: true });
    } catch (err) {
      await markWebhookFailed(webhookRecordId, err);
      return res.status(500).json({ success: false, message: "Webhook processing failed" });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    try {
      const pi = event.data.object;
      const orderId = pi?.metadata?.order_id;
      if (orderId) {
        await db.query(
          `UPDATE ticket_orders SET order_status='PAYMENT_FAILED', updated_at=NOW() WHERE id=$1`,
          [orderId]
        );
      }
      await markWebhookProcessed(webhookRecordId);
      return res.status(200).json({ received: true });
    } catch (err) {
      await markWebhookFailed(webhookRecordId, err);
      return res.status(500).json({ success: false, message: "Webhook processing failed" });
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    console.warn("⚠️ Invoice payment failed for subscription:", invoice.subscription);
    // Could notify the user here via notifications service
    await markWebhookProcessed(webhookRecordId);
    return res.status(200).json({ received: true });
  }

  /* ── Subscription lifecycle events ── */
  try {
    if (event.type === "checkout.session.completed" && event.data.object.mode === "subscription") {
      const session = event.data.object;
      if (session.metadata?.kind === "event_donation") {
        // Donation subscription activated
        await completeDonationSubscriptionActivatedService(session);
      } else {
        // Platform subscription activated
        await activateSubscriptionService(session);
      }
      // CRITICAL FIX #3: Mark as processed ONLY after successful processing
      await markWebhookProcessed(webhookRecordId);
      return res.status(200).json({ received: true });
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      // Check if this is a donation subscription renewal
      const isDonationSub = invoice.subscription_details?.metadata?.kind === "event_donation"
        || invoice.lines?.data?.[0]?.metadata?.kind === "event_donation";
      if (isDonationSub) {
        await recordDonationRenewalService(invoice);
      } else {
        await renewSubscriptionService(invoice);
      }
      // CRITICAL FIX #3: Mark as processed ONLY after successful processing
      await markWebhookProcessed(webhookRecordId);
      return res.status(200).json({ received: true });
    }

    if (event.type === "customer.subscription.updated") {
      await updateSubscriptionStatusService(event.data.object);
      // CRITICAL FIX #3: Mark as processed ONLY after successful processing
      await markWebhookProcessed(webhookRecordId);
      return res.status(200).json({ received: true });
    }
    if (event.type === "customer.subscription.deleted") {
      await cancelSubscriptionService(event.data.object);
      // CRITICAL FIX #3: Mark as processed ONLY after successful processing
      await markWebhookProcessed(webhookRecordId);
      return res.status(200).json({ received: true });
    }
  } catch (err) {
    console.error("❌ Subscription webhook error:", err.message);
    // CRITICAL FIX #3: Record error but return 500 to trigger Stripe retry
    await markWebhookFailed(webhookRecordId, err);
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }

  // Only ticket payments below
  if (event.type !== "payment_intent.succeeded") {
    await markWebhookProcessed(webhookRecordId);
    return res.status(200).json({ received: true });
  }

  const paymentIntent = event.data.object;

  /* ── Donations ── */
  if (paymentIntent?.metadata?.kind === "event_donation") {
    try {
      console.log("💰 Donation detected");
      await completeDonationFromWebhookService(paymentIntent);
      await markWebhookProcessed(webhookRecordId);
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error("❌ Donation webhook error:", err);
      await markWebhookFailed(webhookRecordId, err);
      // Return 500 to trigger Stripe retry - donation must complete
      return res.status(500).json({ success: false, message: "Donation processing failed" });
    }
  }

  /* ── Ticket orders ── */
  const orderId = paymentIntent?.metadata?.order_id;

  if (!orderId) {
    console.warn("⚠️ payment_intent.succeeded has no order_id in metadata — ignoring");
    await markWebhookProcessed(webhookRecordId);
    return res.status(200).json({ received: true });
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

    // Check if order already paid
    const alreadyPaid = order.payment_status === "PAID";

    if (alreadyPaid) {
      console.log("⚠️ Order already marked PAID:", orderId);
      // CRITICAL: Check if tickets were actually issued
      const ticketsIssued = await client.query(
        `SELECT 1 FROM issued_tickets WHERE order_id = $1 LIMIT 1`,
        [orderId]
      );

        if (ticketsIssued.rows.length > 0) {
          console.log("✅ Tickets already issued, safe to acknowledge");
          await client.query("COMMIT");
          await markWebhookProcessed(webhookRecordId);
          return res.status(200).json({ received: true });
      }

      console.log("❌ Payment marked PAID but no tickets issued - retrying issuance");
      // Fall through to ticket issuance - don't return yet
    } else {
      // First time processing - mark as paid
      await client.query(
        `UPDATE ticket_orders
         SET payment_status = 'PAID', order_status = 'COMPLETED',
             paid_at = NOW(), provider_payment_intent_id = $2, updated_at = NOW()
         WHERE id = $1`,
        [orderId, paymentIntent.id]
      );
    }

    await client.query("COMMIT");

    // CRITICAL: Ticket issuance must succeed - return 500 to retry if it fails
    try {
      await issueTicketsForOrderService(orderId);
      console.log("🎟 Tickets issued for order:", orderId);
        await markWebhookProcessed(webhookRecordId);
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error("❌ Ticket issuance failed:", err.message);
        await markWebhookFailed(webhookRecordId, err);
      // Return 500 to trigger Stripe retry - customer paid but got no tickets
      return res.status(500).json({ success: false, message: "Ticket issuance failed" });
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Webhook error:", err);
    await markWebhookFailed(webhookRecordId, err);
    return res.status(500).json({ success: false, message: "Webhook failed" });
  } finally {
    client.release();
  }
}
