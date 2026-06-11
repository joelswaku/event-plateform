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

export async function createManualDonation(req, res) {
  try {
    const result = await engagementService.createManualDonationService({
      eventId: req.params.eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to record donation");
  }
}

export async function deleteDonation(req, res) {
  try {
    const result = await engagementService.deleteDonationService({
      eventId: req.params.eventId,
      donationId: req.params.donationId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to delete donation");
  }
}

export async function getDonationConfig(req, res) {
  try {
    const result = await engagementService.getDonationConfigService({ eventId: req.params.eventId });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to get donation config");
  }
}

export async function saveDonationConfig(req, res) {
  try {
    const result = await engagementService.saveDonationConfigService({
      eventId: req.params.eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      amounts: req.body.amounts,
      message: req.body.message,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to save donation config");
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

export async function getTermsStatus(req, res) {
  try {
    const result = await engagementService.getTermsStatusService({ userId: req.user.id });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to get terms status");
  }
}

export async function acceptTerms(req, res) {
  try {
    const result = await engagementService.acceptTermsService({
      userId:    req.user.id,
      ipAddress: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.headers["user-agent"],
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Failed to record terms acceptance");
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