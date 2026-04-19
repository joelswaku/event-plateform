
import { stripe } from "../config/stripe.js";
import { db } from "../config/db.js";
import { issueTicketsForOrderService } from "../services/ticket-issuance.service.js";
import { completeDonationFromWebhookService } from "../services/engagement.service.js";

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

  // Only process success
  if (event.type !== "payment_intent.succeeded") {
    return res.status(200).json({ received: true });
  }

  const paymentIntent = event.data.object;

  /*
  ========================================
  1. HANDLE DONATIONS (NO TRANSACTION HERE)
  ========================================
  */
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

  /*
  ========================================
  2. HANDLE TICKET ORDERS (WITH TRANSACTION)
  ========================================
  */

  const orderId = paymentIntent?.metadata?.order_id;

  if (!orderId) {
    console.error("❌ Missing order_id in metadata");
    return res.status(400).json({ message: "Missing order_id" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    console.log("✅ PAYMENT SUCCESS FOR ORDER:", orderId);

    // Lock order
    const orderRes = await client.query(
      `
      SELECT *
      FROM ticket_orders
      WHERE id = $1
      FOR UPDATE
      `,
      [orderId]
    );

    const order = orderRes.rows[0];

    if (!order) {
      throw new Error("Order not found");
    }

    /*
    ----------------------------------------
    IDEMPOTENCY CHECK
    ----------------------------------------
    */
    if (order.payment_status === "PAID") {
      console.log("⚠️ Order already processed:", orderId);

      await client.query("COMMIT");

      return res.status(200).json({ received: true });
    }

    /*
    ----------------------------------------
    UPDATE ORDER
    ----------------------------------------
    */
    await client.query(
      `
      UPDATE ticket_orders
      SET
        payment_status = 'PAID',
        order_status = 'COMPLETED',
        paid_at = NOW(),
        provider_payment_intent_id = $2,
        updated_at = NOW()
      WHERE id = $1
      `,
      [orderId, paymentIntent.id]
    );

    await client.query("COMMIT");

    /*
    ========================================
    3. ISSUE TICKETS (OUTSIDE TRANSACTION)
    ========================================
    */
    try {
      await issueTicketsForOrderService(orderId);
      console.log("🎟 Tickets issued for order:", orderId);
    } catch (err) {
      console.error("⚠️ Ticket issuance failed:", err.message);
      // Do NOT fail webhook
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("❌ Webhook error:", err);

    return res.status(500).json({
      success: false,
      message: "Webhook failed",
    });
  } finally {
    client.release();
  }
}










// import { stripe } from "../config/stripe.js";
// import { db } from "../config/db.js";
// import { issueTicketsForOrderService } from "../services/ticket-issuance.service.js";
// import { completeDonationFromWebhookService } from "../services/engagement.service.js";

// export async function stripeWebhook(req, res) {
//   const sig = req.headers["stripe-signature"];

//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     console.error("❌ Webhook signature error:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   console.log("🔥 STRIPE EVENT:", event.type);

//   /*
//   ========================================
//   HANDLE ONLY IMPORTANT EVENTS
//   ========================================
//   */
//   if (event.type !== "payment_intent.succeeded") {
//     return res.status(200).json({ received: true });
//   }

//   const paymentIntent = event.data.object;

//   const client = await db.connect();

//   try {
//     await client.query("BEGIN");

//     /*
//     ========================================
//     1. HANDLE DONATIONS FIRST
//     ========================================
//     */
//     if (paymentIntent?.metadata?.kind === "event_donation") {
//       console.log("💰 Donation detected");

//       // This service already has its own transaction logic
//       await completeDonationFromWebhookService(paymentIntent);

//       await client.query("COMMIT");

//       return res.status(200).json({ received: true });
//     }

//     /*
//     ========================================
//     2. HANDLE TICKET ORDERS
//     ========================================
//     */
//     const orderId = paymentIntent.metadata?.order_id;

//     if (!orderId) {
//       throw new Error("Missing order_id in metadata");
//     }

//     console.log("✅ PAYMENT SUCCESS FOR ORDER:", orderId);

//     /*
//     ----------------------------------------
//     LOCK ORDER (prevent double processing)
//     ----------------------------------------
//     */
//     const orderRes = await client.query(
//       `
//       SELECT *
//       FROM ticket_orders
//       WHERE id = $1
//       FOR UPDATE
//       `,
//       [orderId]
//     );

//     const order = orderRes.rows[0];

//     if (!order) {
//       throw new Error("Order not found");
//     }

//     /*
//     ----------------------------------------
//     IDEMPOTENCY CHECK 🔥
//     ----------------------------------------
//     */
//     if (order.payment_status === "PAID") {
//       console.log("⚠️ Order already processed:", orderId);

//       await client.query("COMMIT");

//       return res.status(200).json({ received: true });
//     }

//     /*
//     ----------------------------------------
//     UPDATE ORDER
//     ----------------------------------------
//     */
//     await client.query(
//       `
//       UPDATE ticket_orders
//       SET
//         payment_status = 'PAID',
//         order_status = 'COMPLETED',
//         paid_at = NOW(),
//         provider_payment_intent_id = $2,
//         updated_at = NOW()
//       WHERE id = $1
//       `,
//       [orderId, paymentIntent.id]
//     );

//     await client.query("COMMIT");

//     /*
//     ========================================
//     3. ISSUE TICKETS (OUTSIDE TRANSACTION) 🔥
//     ========================================
//     */
//     try {
//       await issueTicketsForOrderService(orderId);
//       console.log("🎟 Tickets issued for order:", orderId);
//     } catch (err) {
//       console.error("⚠️ Ticket issuance failed:", err.message);
//       // DO NOT FAIL WEBHOOK
//     }

//     return res.status(200).json({ received: true });
//   } catch (err) {
//     await client.query("ROLLBACK");

//     console.error("❌ Webhook error:", err);

//     return res.status(500).json({
//       success: false,
//       message: "Webhook failed",
//     });
//   } finally {
//     client.release();
//   }
// }