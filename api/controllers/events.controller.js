import * as eventsService from "../services/events.service.js";

/**
 * Helper to send consistent error responses
 */
console.log(` controller hit`);

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);

  const status = error.statusCode || 500;

  return res.status(status).json({
    success: false,
    message: error.message || fallbackMessage,
    ...(error.details ? { details: error.details } : {}),
  });
}

/**
 * POST /events
 */
// export async function createEvent(req, res) {
//     console.log(`my organization id in controller is: `);
//   try {
//     const userId = req.user?.id;
//     const organizationId = req.organizationId;
//     console.log(`my organization id is: `,organizationId);
//     console.log(`my user id is: `,userId);
    

//     const event = await eventsService.createEventService({
//       userId,
//       organizationId,
//       payload: req.body,
//     });
    
//     return res.status(201).json({
//       success: true,
//       message: "Event created successfully",
//       data: event,
//     });
//   } catch (error) {
//     return handleControllerError(res, error, "Failed to create event");
//   }
// }
/**
 * CREATE EVENT
 */

export async function createEvent(req, res) {
    try {
      const userId = req.user?.id;
      const organizationId = req.organizationId;
  
      const event = await eventsService.createEventService({
        userId,
        organizationId,
        payload: req.body,
      });
  
      return res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: event,
      });
  
    } catch (error) {
      return handleControllerError(res, error, "Failed to create event");
    }
  }
  

/**
 * GET /events
 * Query params:
 * ?page=1&limit=20&status=draft&event_type=wedding&search=joel&sort_by=starts_at&sort_order=desc
 */
export async function listEvents(req, res) {
  try {
    const organizationId = req.organizationId;

    const result = await eventsService.listEventsService({
      organizationId,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch events");
  }
}

/**
 * GET /events/:id
 */
export async function getEventById(req, res) {
  try {
    const organizationId = req.organizationId;
    const eventId = req.params.id;

    const event = await eventsService.getEventByIdService({
      eventId,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Event fetched successfully",
      data: event,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch event");
  }
}

/**
 * PATCH /events/:id
 */
export async function updateEvent(req, res) {
  try {
    const userId = req.user?.id;
    const organizationId = req.organizationId;
    const eventId = req.params.id;

    const event = await eventsService.updateEventService({
      eventId,
      organizationId,
      userId,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to update event");
  }
}

/**
 * DELETE /events/:id
 * soft delete
 */
export async function deleteEvent(req, res) {
  try {
    const userId = req.user?.id;
    const organizationId = req.organizationId;
    const eventId = req.params.id;

    await eventsService.deleteEventService({
      eventId,
      organizationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to delete event");
  }
}

/**
 * POST /events/:id/publish
 */
export async function publishEvent(req, res) {
  try {
    const userId = req.user?.id;
    const organizationId = req.organizationId;
    const eventId = req.params.id;

    const event = await eventsService.publishEventService({
      eventId,
      organizationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Event published successfully",
      data: event,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to publish event");
  }
}

/**
 * POST /events/:id/unpublish
 */
export async function unpublishEvent(req, res) {
  try {
    const userId = req.user?.id;
    const organizationId = req.organizationId;
    const eventId = req.params.id;

    const event = await eventsService.unpublishEventService({
      eventId,
      organizationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Event moved back to draft successfully",
      data: event,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to unpublish event");
  }
}

/**
 * POST /events/:id/cancel
 */
export async function cancelEvent(req, res) {
  try {
    const userId = req.user?.id;
    const organizationId = req.organizationId;
    const eventId = req.params.id;

    const event = await eventsService.cancelEventService({
      eventId,
      organizationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Event cancelled successfully",
      data: event,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to cancel event");
  }
}

/**
 * POST /events/:id/archive
 */
export async function archiveEvent(req, res) {
  try {
    const userId = req.user?.id;
    const organizationId = req.organizationId;
    const eventId = req.params.id;

    const event = await eventsService.archiveEventService({
      eventId,
      organizationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Event archived successfully",
      data: event,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to archive event");
  }
}

/**
 * POST /events/:id/restore
 */
export async function restoreEvent(req, res) {
  try {
    const userId = req.user?.id;
    const organizationId = req.organizationId;
    const eventId = req.params.id;

    const event = await eventsService.restoreEventService({
      eventId,
      organizationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Event restored successfully",
      data: event,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to restore event");
  }
}

/**
 * POST /events/:id/duplicate
 */
export async function duplicateEvent(req, res) {
  try {
    const userId = req.user?.id;
    const organizationId = req.organizationId;
    const eventId = req.params.id;

    const event = await eventsService.duplicateEventService({
      eventId,
      organizationId,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Event duplicated successfully",
      data: event,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to duplicate event");
  }
}

/**
 * GET /events/:id/dashboard
 */
export async function getEventDashboard(req, res) {
  try {
    const organizationId = req.organizationId;
    const eventId = req.params.id;

    const dashboard = await eventsService.getEventDashboardService({
      eventId,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Event dashboard fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch event dashboard");
  }
}

/**
 * GET /events/public/:slug
 */
export async function getPublicEventBySlug(req, res) {
  try {
    const slug = req.params.slug;

    const event = await eventsService.getPublicEventBySlugService({ slug });

    return res.status(200).json({
      success: true,
      message: "Public event fetched successfully",
      data: event,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch public event");
  }
}

