import * as messagingService from "../services/messaging.service.js";

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);

  return res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.message || fallbackMessage,
    ...(error?.details ? { details: error.details } : {}),
  });
}

export async function createMessage(req, res) {
  try {
    const { eventId } = req.params;

    const result = await messagingService.createOutboundMessageService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Message created successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create message");
  }
}

export async function listMessages(req, res) {
  try {
    const { eventId } = req.params;

    const result = await messagingService.listOutboundMessagesService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch messages");
  }
}