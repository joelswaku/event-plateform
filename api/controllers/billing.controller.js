import * as billingService from "../services/billing.service.js";

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);

  return res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.message || fallbackMessage,
    ...(error?.details ? { details: error.details } : {}),
  });
}

export async function createDiscount(req, res) {
  try {
    const { eventId } = req.params;

    const result = await billingService.createDiscountCodeService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Discount code created successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create discount code");
  }
}

export async function listDiscounts(req, res) {
  try {
    const { eventId } = req.params;

    const result = await billingService.listDiscountCodesService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Discount codes fetched successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch discount codes");
  }
}

export async function listPlans(req, res) {
  try {
    const result = await billingService.listSubscriptionPlansService();

    return res.status(200).json({
      success: true,
      message: "Subscription plans fetched successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch subscription plans");
  }
}