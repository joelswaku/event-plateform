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

export async function getEventsWithTickets(req, res) {
  try {
    const events = await service.getEventsWithTicketsService(req.organizationId);
    res.json({ success: true, events });
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteTicketType(req, res) {
  try {
    const { ticketId } = req.params;
    const result = await service.deleteTicketTypeService(ticketId, req.organizationId);
    res.json({ success: true, ...result });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getTicketStats(req, res) {
  try {
    const { eventId } = req.params;
    const stats = await service.getTicketStatsService(eventId, req.organizationId);
    res.json({ success: true, data: stats });
  } catch (err) {
    handleError(res, err);
  }
}

export async function listOrders(req, res) {
  try {
    const { eventId } = req.params;
    const limit  = Math.min(Number(req.query.limit)  || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const orders = await service.listOrdersService(eventId, { limit, offset });
    res.json({ success: true, orders });
  } catch (err) {
    handleError(res, err);
  }
}