
// controllers/tickets.controller.js
import * as ticketsService from "../services/tickets.service.js";
import * as ticketCheckinService from "../services/ticket-checkin.service.js";
import * as guestsService from "../services/guests.service.js";

export async function confirmOrderPayment(req, res) {
  try {
    const { orderId } = req.params;
    const result = await ticketsService.confirmOrderPaymentService(orderId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to confirm payment");
  }
}

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);

  return res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.message || fallbackMessage,
    ...(error?.details ? { details: error.details } : {}),
  });
}

export async function createTicketOrder(req, res) {
  try {
    const { eventId } = req.params;

    const result = await ticketsService.createTicketOrderService({
      eventId,
      payload: req.body,
      buyerUserId: req.user?.id ?? null,
    });

    return res.status(201).json({
      success: true,
      message: "Ticket order created successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create ticket order");
  }
}

export async function checkInIssuedTicket(req, res) {
  try {
    const { eventId } = req.params;

    // Try ticket check-in first
    try {
      const result = await ticketCheckinService.checkInIssuedTicketService({
        eventId,
        organizationId: req.organizationId,
        userId: req.user?.id,
        payload: req.body,
      });
      return res.status(200).json({
        success: true,
        message: "Ticket checked in successfully",
        data: result,
      });
    } catch (ticketError) {
      // Only fall back to guest QR when the token simply isn't a ticket
      if (ticketError?.statusCode !== 404) throw ticketError;
    }

    // Fall back: try guest QR pass (same token, different table)
    try {
      const guestResult = await guestsService.checkInGuestByQrTokenService({
        eventId,
        organizationId: req.organizationId,
        userId: req.user?.id,
        qrToken: req.body?.qr_token,
        deviceId: req.body?.device_id ?? null,
      });
      return res.status(200).json({
        success: true,
        message: "Guest checked in successfully",
        data: {
          checked_in: true,
          ticket_type_name: "Guest Pass",
          holder_name: guestResult.guest?.full_name ?? null,
          holder_email: guestResult.guest?.email ?? null,
          checked_in_at: new Date().toISOString(),
        },
      });
    } catch (guestError) {
      const msg = guestError?.message?.toLowerCase() ?? "";
      // Map any "already checked in / already used" variant → 409 (DUPLICATE in mobile)
      if (
        msg.includes("already checked in") ||
        msg.includes("already used") ||
        msg.includes("already check")
      ) {
        return res.status(409).json({
          success: false,
          message: guestError.message,
        });
      }
      throw guestError;
    }
  } catch (error) {
    return handleControllerError(res, error, "Failed to check in");
  }
}