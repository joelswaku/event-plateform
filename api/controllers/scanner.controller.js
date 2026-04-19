import * as analyticsService from "../services/analytics.service.js";
import * as ticketCheckinService from "../services/ticket-checkin.service.js";

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);

  return res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.message || fallbackMessage,
    ...(error?.details ? { details: error.details } : {}),
  });
}

export async function syncOfflineTicketScans(req, res) {
  try {
    const { eventId } = req.params;
    const { scans = [], device_id = null } = req.body;

    if (!Array.isArray(scans)) {
      return res.status(400).json({
        success: false,
        message: "scans must be an array",
      });
    }

    const results = [];

    for (const scan of scans) {
      try {
        const result = await ticketCheckinService.checkInIssuedTicketService({
          eventId,
          organizationId: req.organizationId,
          userId: req.user?.id,
          payload: {
            qr_token: scan.qr_token,
            device_id,
          },
        });

        results.push({
          qr_token: scan.qr_token,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          qr_token: scan.qr_token,
          success: false,
          message: error.message,
          statusCode: error.statusCode || 500,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Offline scans processed",
      data: {
        total: results.length,
        success_count: results.filter((r) => r.success).length,
        failure_count: results.filter((r) => !r.success).length,
        results,
      },
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to sync offline scans");
  }
}

export async function getScannerDashboard(req, res) {
  try {
    const { eventId } = req.params;

    const dashboard = await analyticsService.getScannerDashboardService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Scanner dashboard fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch scanner dashboard");
  }
}