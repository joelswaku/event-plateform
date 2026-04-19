// import * as analyticsService from "../services/analytics.service.js";

// function handleControllerError(res, error, fallbackMessage = "Internal server error") {
//   console.error(error);

//   return res.status(error?.statusCode || 500).json({
//     success: false,
//     message: error?.message || fallbackMessage,
//     ...(error?.details ? { details: error.details } : {}),
//   });
// }

// // export async function getEventAnalyticsDashboard(req, res) {
// //   try {
// //     const { eventId } = req.params;

// //     const result = await analyticsService.getEventAnalyticsDashboardService({
// //       eventId,
// //       organizationId: req.organizationId,
// //       userId: req.user?.id,
// //     });

// //     return res.status(200).json({
// //       success: true,
// //       message: "Event analytics dashboard fetched successfully",
// //       data: result,
// //     });
// //   } catch (error) {
// //     return handleControllerError(res, error, "Failed to fetch analytics dashboard");
// //   }
// // }
// // services/analytics.service.js

// export async function getEventAnalyticsDashboardService({
//   eventId,
//   organizationId,
//   userId,
// }) {
//   const client = await db.connect();

//   try {
//     await client.query("BEGIN");

//     /*
//     ---------------------------------------
//     1. SECURITY CHECK
//     ---------------------------------------
//     */
//     const eventCheck = await client.query(
//       `
//       SELECT id FROM events
//       WHERE id=$1 AND organization_id=$2
//       `,
//       [eventId, organizationId]
//     );

//     if (!eventCheck.rows.length) {
//       throw new AppError("Event not found", 404);
//     }

//     /*
//     ---------------------------------------
//     2. FETCH WIDGET CONFIGURATION
//     ---------------------------------------
//     */
//     const widgetsRes = await client.query(
//       `
//       SELECT *
//       FROM event_dashboard_widgets
//       WHERE event_id=$1
//       AND is_enabled = true
//       ORDER BY position_order ASC
//       `,
//       [eventId]
//     );

//     const widgets = widgetsRes.rows;

//     /*
//     ---------------------------------------
//     3. FETCH ANALYTICS DATA
//     ---------------------------------------
//     */

//     // Ticket sales
//     const salesRes = await client.query(
//       `
//       SELECT
//         COUNT(*) AS total_orders,
//         COALESCE(SUM(total_amount),0) AS total_revenue
//       FROM ticket_orders
//       WHERE event_id=$1
//       AND payment_status='PAID'
//       `,
//       [eventId]
//     );

//     // Check-ins
//     const checkinRes = await client.query(
//       `
//       SELECT COUNT(*) AS total_checkins
//       FROM ticket_scans
//       WHERE event_id=$1
//       AND scan_result='SUCCESS'
//       `,
//       [eventId]
//     );

//     // Guests
//     const guestsRes = await client.query(
//       `
//       SELECT COUNT(*) AS total_guests
//       FROM guests
//       WHERE event_id=$1
//       `,
//       [eventId]
//     );

//     /*
//     ---------------------------------------
//     4. MAP WIDGETS WITH DATA
//     ---------------------------------------
//     */

//     const analyticsMap = {
//       total_sales: salesRes.rows[0],
//       checkins: checkinRes.rows[0],
//       guests: guestsRes.rows[0],
//     };

//     const finalWidgets = widgets.map((widget) => ({
//       ...widget,
//       data: analyticsMap[widget.widget_key] || null,
//     }));

//     await client.query("COMMIT");

//     return {
//       widgets: finalWidgets,
//       summary: {
//         sales: salesRes.rows[0],
//         checkins: checkinRes.rows[0],
//         guests: guestsRes.rows[0],
//       },
//     };
//   } catch (error) {
//     await client.query("ROLLBACK");
//     throw error;
//   } finally {
//     client.release();
//   }
// }
// export async function getTicketSalesAnalytics(req, res) {
//   try {
//     const { eventId } = req.params;

//     const result = await analyticsService.getTicketSalesAnalyticsService({
//       eventId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Ticket sales analytics fetched successfully",
//       data: result,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to fetch ticket sales analytics");
//   }
// }

// export async function getTicketCheckinAnalytics(req, res) {
//   try {
//     const { eventId } = req.params;

//     const result = await analyticsService.getTicketCheckinAnalyticsService({
//       eventId,
//       organizationId: req.organizationId,
//       userId: req.user?.id,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Ticket check-in analytics fetched successfully",
//       data: result,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to fetch ticket check-in analytics");
//   }
// }

import * as analyticsService from "../services/analytics.service.js";

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);

  return res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.message || fallbackMessage,
    ...(error?.details ? { details: error.details } : {}),
  });
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/
export async function getEventAnalyticsDashboard(req, res) {
  try {
    const { eventId } = req.params;

    const result = await analyticsService.getEventAnalyticsDashboardService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Dashboard fetched successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch dashboard");
  }
}

/*
|--------------------------------------------------------------------------
| TICKET SALES
|--------------------------------------------------------------------------
*/
export async function getTicketSalesAnalytics(req, res) {
  try {
    const { eventId } = req.params;

    const result = await analyticsService.getTicketSalesAnalyticsService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Ticket sales analytics fetched",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch ticket sales analytics");
  }
}

/*
|--------------------------------------------------------------------------
| CHECK-IN ANALYTICS
|--------------------------------------------------------------------------
*/
export async function getTicketCheckinAnalytics(req, res) {
  try {
    const { eventId } = req.params;

    const result = await analyticsService.getTicketCheckinAnalyticsService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Check-in analytics fetched",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch check-in analytics");
  }
}
export async function getRevenueTimeline(req, res) {
  try {
    const { eventId } = req.params;
    const { interval } = req.query;

    const result = await analyticsService.getRevenueTimelineService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user.id,
      interval,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

export async function getConversionAnalytics(req, res) {
  try {
    const { eventId } = req.params;

    const result = await analyticsService.getConversionAnalyticsService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user.id,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

export async function getInsights(req, res) {
  try {
    const { eventId } = req.params;

    const result = await analyticsService.getEventInsightsService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user.id,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error);
  }
}