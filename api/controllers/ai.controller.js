import * as aiService from "../services/ai-features.service.js";

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);
  const statusCode = error?.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error?.message || fallbackMessage,
    ...(error?.details ? { details: error.details } : {}),
  });
}

export async function generateEventContent(req, res) {
  try {
    const result = await aiService.generateEventContentService({
      organizationId: req.organizationId,
      userId: req.user.id,
      eventId: req.params.eventId,
      ...req.body,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to generate event content");
  }
}

export async function generateBuilderPage(req, res) {
  try {
    const result = await aiService.generateBuilderPageService({
      organizationId: req.organizationId,
      userId: req.user.id,
      eventId: req.params.eventId,
      ...req.body,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to generate builder page");
  }
}

export async function generateTicketPricing(req, res) {
  try {
    const result = await aiService.generateTicketPricingService({
      organizationId: req.organizationId,
      userId: req.user.id,
      eventId: req.params.eventId,
      ...req.body,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to generate ticket pricing");
  }
}

export async function analyzeGuestList(req, res) {
  try {
    const result = await aiService.analyzeGuestListService({
      organizationId: req.organizationId,
      userId: req.user.id,
      eventId: req.params.eventId,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to analyze guest list");
  }
}

export async function generateSmartSeating(req, res) {
  try {
    const result = await aiService.generateSmartSeatingService({
      organizationId: req.organizationId,
      userId: req.user.id,
      eventId: req.params.eventId,
      ...req.body,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to generate seating");
  }
}

export async function generatePostEventSummary(req, res) {
  try {
    const result = await aiService.generatePostEventSummaryService({
      organizationId: req.organizationId,
      userId: req.user.id,
      eventId: req.params.eventId,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to generate post-event summary");
  }
}

export async function generateEmailCopy(req, res) {
  try {
    const result = await aiService.generateEmailCopyService({
      organizationId: req.organizationId,
      userId: req.user.id,
      eventId: req.params.eventId,
      ...req.body,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to generate email copy");
  }
}

export async function chatbotReply(req, res) {
  try {
    const result = await aiService.chatbotReplyService(req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to process chatbot message");
  }
}

export async function generateRsvpForm(req, res) {
  try {
    const result = await aiService.generateRsvpFormService({
      organizationId: req.organizationId,
      userId: req.user.id,
      eventId: req.params.eventId,
      ...req.body,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to generate RSVP form");
  }
}

export async function getPerformancePrediction(req, res) {
  try {
    const result = await aiService.generatePerformancePredictionService({
      organizationId: req.organizationId,
      userId: req.user.id,
      eventId: req.params.eventId,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to get performance prediction");
  }
}
