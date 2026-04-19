import * as engagementService from "../services/engagement.service.js";

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);

  return res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.message || fallbackMessage,
    ...(error?.details ? { details: error.details } : {}),
  });
}

export async function createGift(req, res) {
  try {
    const { eventId } = req.params;

    const result = await engagementService.createGiftRegistryItemService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Gift registry item created successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create gift registry item");
  }
}

export async function listGifts(req, res) {
  try {
    const { eventId } = req.params;

    const result = await engagementService.listGiftRegistryItemsService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Gift registry items fetched successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch gift registry items");
  }
}

export async function createDonationIntent(req, res) {
  try {
    const { eventId } = req.params;

    const result = await engagementService.createDonationIntentService({
      eventId,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Donation payment intent created successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create donation intent");
  }
}

export async function listDonations(req, res) {
  try {
    const { eventId } = req.params;

    const result = await engagementService.listDonationsService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Donations fetched successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch donations");
  }
}

export async function getEventDashboard(req, res) {
  try {
    const { eventId } = req.params;

    const result = await engagementService.getEngagementDashboardService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Engagement dashboard fetched successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch engagement dashboard");
  }
}