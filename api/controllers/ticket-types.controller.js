// controllers/ticket-types.controller.js
import * as service from "../services/ticket-types.service.js";

function handleError(res, error) {
  console.error(error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal error",
  });
}

export async function createTicketType(req, res) {
  try {
    const { eventId } = req.params;

    const result = await service.createTicketTypeService({
      eventId,
      organizationId: req.organizationId,
      payload: req.body,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getPublicTickets(req, res) {
  try {
    const { eventId } = req.params;

    const tickets = await service.getPublicTicketsService(eventId);

    res.json({
      success: true,
      tickets,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getAdminTickets(req, res) {
  try {
    const { eventId } = req.params;

    const tickets = await service.getAdminTicketsService(
      eventId,
      req.organizationId
    );

    res.json({
      success: true,
      tickets,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateTicketType(req, res) {
  try {
    const { ticketId } = req.params;

    const updated = await service.updateTicketTypeService(
      ticketId,
      req.body
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    handleError(res, err);
  }
}