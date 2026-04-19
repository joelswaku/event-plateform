
// controllers/tickets.controller.js
import * as ticketsService from "../services/tickets.service.js";
import * as ticketCheckinService from "../services/ticket-checkin.service.js";

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
    const { eventId } = req.params; 1

    
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
  } catch (error) {
    return handleControllerError(res, error, "Failed to check in ticket");
  }
}