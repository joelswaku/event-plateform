
// controllers/guests.public.controller.js
import * as guestsService from "../services/guests.service.js";

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);

  const statusCode = error?.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error?.message || fallbackMessage,
    ...(error?.details ? { details: error.details } : {}),
  });
}

export async function getInvitationByToken(req, res) {
  try {
    const { token } = req.params;

    const invitation = await guestsService.getInvitationByTokenService({
      token,
    });

    return res.status(200).json({
      success: true,
      message: "Invitation fetched successfully",
      data: invitation,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch invitation");
  }
}

export async function submitInvitationRsvp(req, res) {
  try {
    const { token } = req.params;

    const result = await guestsService.submitInvitationRsvpService({
      token,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "RSVP submitted successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to submit RSVP");
  }
}