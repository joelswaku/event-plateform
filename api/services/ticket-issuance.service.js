// ticket-issuance.service.js
import crypto from "crypto";
import { db } from "../config/db.js";
import { sendTicketIssuedEmail } from "../utils/sendEmail.js";

class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function generateQrToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function issueTicketsForOrderService(orderId) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    /*
    --------------------------------------
    LOCK ORDER (prevent double issuance)
    --------------------------------------
    */
    const orderRes = await client.query(
      `
      SELECT o.*, e.title AS event_title
      FROM ticket_orders o
      JOIN events e ON e.id = o.event_id
      WHERE o.id=$1
      AND o.deleted_at IS NULL
      FOR UPDATE
      `,
      [orderId],
    );

    const order = orderRes.rows[0];

    if (!order) throw new AppError("Order not found", 404);

    if (order.payment_status !== "PAID") {
      throw new AppError("Order is not paid yet", 400);
    }

    /*
    --------------------------------------
    PREVENT DUPLICATE ISSUE (LOCKED)
    --------------------------------------
    */
    const existingIssuedRes = await client.query(
      `SELECT 1 FROM issued_tickets WHERE order_id=$1 LIMIT 1`,
      [orderId],
    );

    if (existingIssuedRes.rows.length > 0) {
      await client.query("COMMIT");

      return (
        await db.query(
          `
        SELECT it.*, tt.name AS ticket_type_name
        FROM issued_tickets it
        JOIN ticket_types tt ON tt.id = it.ticket_type_id
        WHERE it.order_id=$1
        ORDER BY it.created_at ASC
        `,
          [orderId],
        )
      ).rows;
    }

    /*
    --------------------------------------
    LOCK ORDER ITEMS
    --------------------------------------
    */
    const itemsRes = await client.query(
      `
      SELECT toi.*, tt.name AS ticket_type_name
      FROM ticket_order_items toi
      JOIN ticket_types tt ON tt.id = toi.ticket_type_id
      WHERE toi.order_id=$1
      FOR UPDATE
      `,
      [orderId],
    );

    const items = itemsRes.rows;

    if (!items.length) {
      throw new AppError("Order has no ticket items", 400);
    }

    /*
    --------------------------------------
    SAFE STOCK UPDATE (WITH LOCK)
    --------------------------------------
    */
    for (const item of items) {
      const update = await client.query(
        `
        UPDATE ticket_types
        SET quantity_sold = quantity_sold + $1,
            updated_at = NOW()
        WHERE id = $2
        AND (
          quantity_total IS NULL
          OR quantity_sold + $1 <= quantity_total
        )
        RETURNING id
        `,
        [item.quantity, item.ticket_type_id],
      );

      if (!update.rows[0]) {
        throw new AppError(
          `Not enough stock for ${item.ticket_type_name}`,
          409,
        );
      }
    }

    /*
    --------------------------------------
    CREATE TICKETS
    --------------------------------------
    */
    const issuedTickets = [];

    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        const qrToken = generateQrToken();

        const insert = await client.query(
          `
          INSERT INTO issued_tickets
          (
            event_id,
            order_id,
            order_item_id,
            ticket_type_id,
            holder_name,
            holder_email,
            qr_token,
            qr_status,
            created_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE',NOW())
          RETURNING *
          `,
          [
            order.event_id,
            order.id,
            item.id,
            item.ticket_type_id,
            order.buyer_name,
            order.buyer_email,
            qrToken,
          ],
        );

        issuedTickets.push({
          ...insert.rows[0],
          ticket_type_name: item.ticket_type_name,
        });
      }
    }

    await client.query("COMMIT");

    /*
    --------------------------------------
    SEND EMAIL (OUTSIDE TX)
    --------------------------------------
    */
    if (order.buyer_email) {
      sendTicketIssuedEmail({
        to: order.buyer_email,
        buyerName: order.buyer_name,
        eventName: order.event_title,
        tickets: issuedTickets,
      }).catch((e) => {
        console.error("Email failed:", e.message);
      });
    }

    return issuedTickets;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// import crypto from "crypto";
// import { db } from "../config/db.js";
// import { sendTicketIssuedEmail } from "../utils/sendEmail.js";

// class AppError extends Error {
//   constructor(message, statusCode = 400, details = null) {
//     super(message);
//     this.statusCode = statusCode;
//     this.details = details;
//   }
// }

// function generateQrToken() {
//   return crypto.randomBytes(32).toString("hex");
// }

// export async function issueTicketsForOrderService(orderId) {
//   const client = await db.connect();

//   try {
//     await client.query("BEGIN");

//     const orderRes = await client.query(
//       `
//       SELECT
//         o.*,
//         e.title AS event_title
//       FROM ticket_orders o
//       JOIN events e ON e.id = o.event_id
//       WHERE o.id=$1
//         AND o.deleted_at IS NULL
//       LIMIT 1
//       `,
//       [orderId]
//     );

//     const order = orderRes.rows[0];

//     if (!order) {
//       throw new AppError("Order not found", 404);
//     }

//     if (order.payment_status !== "PAID") {
//       throw new AppError("Order is not paid yet", 400);
//     }

//     const existingIssuedRes = await client.query(
//       `
//       SELECT COUNT(*)::int AS total
//       FROM issued_tickets
//       WHERE order_id=$1
//       `,
//       [orderId]
//     );

//     if (existingIssuedRes.rows[0].total > 0) {
//       await client.query("COMMIT");

//       const existingTicketsRes = await db.query(
//         `
//         SELECT
//           it.*,
//           tt.name AS ticket_type_name
//         FROM issued_tickets it
//         JOIN ticket_types tt ON tt.id = it.ticket_type_id
//         WHERE it.order_id=$1
//         ORDER BY it.created_at ASC
//         `,
//         [orderId]
//       );

//       return existingTicketsRes.rows;
//     }

//     const itemsRes = await client.query(
//       `
//       SELECT
//         toi.*,
//         tt.name AS ticket_type_name,
//         tt.quantity_total,
//         tt.quantity_sold
//       FROM ticket_order_items toi
//       JOIN ticket_types tt ON tt.id = toi.ticket_type_id
//       WHERE toi.order_id=$1
//       ORDER BY toi.created_at ASC
//       `,
//       [orderId]
//     );

//     const items = itemsRes.rows;

//     if (!items.length) {
//       throw new AppError("Order has no ticket items", 400);
//     }

//     /*
//       Reserve final inventory at issuance time.
//       This prevents double counting because createTicketOrderService does not
//       increment quantity_sold.
//     */
//     for (const item of items) {
//       const updateSoldRes = await client.query(
//         `
//         UPDATE ticket_types
//         SET quantity_sold = quantity_sold + $1,
//             updated_at = NOW()
//         WHERE id=$2
//           AND (
//             quantity_total IS NULL
//             OR quantity_sold + $1 <= quantity_total
//           )
//         RETURNING *
//         `,
//         [item.quantity, item.ticket_type_id]
//       );

//       if (!updateSoldRes.rows[0]) {
//         throw new AppError(
//           `Ticket stock unavailable during issuance for type: ${item.ticket_type_name}`,
//           409
//         );
//       }
//     }

//     const issuedTickets = [];

//     for (const item of items) {
//       for (let i = 0; i < item.quantity; i++) {
//         const qrToken = generateQrToken();

//         const insertRes = await client.query(
//           `
//           INSERT INTO issued_tickets
//           (
//             event_id,
//             order_id,
//             order_item_id,
//             ticket_type_id,
//             holder_name,
//             holder_email,
//             qr_token,
//             qr_status,
//             created_at
//           )
//           VALUES
//           ($1,$2,$3,$4,$5,$6,$7,'ACTIVE',NOW())
//           RETURNING *
//           `,
//           [
//             order.event_id,
//             order.id,
//             item.id,
//             item.ticket_type_id,
//             order.buyer_name,
//             order.buyer_email,
//             qrToken,
//           ]
//         );

//         issuedTickets.push({
//           ...insertRes.rows[0],
//           ticket_type_name: item.ticket_type_name,
//         });
//       }
//     }

//     await client.query("COMMIT");

//     if (order.buyer_email) {
//       try {
//         await sendTicketIssuedEmail({
//           to: order.buyer_email,
//           buyerName: order.buyer_name,
//           eventName: order.event_title,
//           tickets: issuedTickets,
//         });
//       } catch (emailError) {
//         console.error("Ticket email failed:", emailError);
//       }
//     }

//     return issuedTickets;
//   } catch (error) {
//     await client.query("ROLLBACK");
//     throw error;
//   } finally {
//     client.release();
//   }
// }
