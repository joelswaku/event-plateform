import * as seatingService from "../services/seating.service.js";

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
| LOCATIONS
|--------------------------------------------------------------------------
*/

export async function createSeatingLocation(req, res) {
  try {
    const { eventId } = req.params;

    const result = await seatingService.createSeatingLocationService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Seating location created successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create seating location");
  }
}

export async function listSeatingLocations(req, res) {
  try {
    const { eventId } = req.params;

    const result = await seatingService.listSeatingLocationsService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Seating locations fetched successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch seating locations");
  }
}

export async function updateSeatingLocation(req, res) {
  try {
    const { eventId, locationId } = req.params;

    const result = await seatingService.updateSeatingLocationService({
      eventId,
      locationId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Seating location updated successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to update seating location");
  }
}

export async function deleteSeatingLocation(req, res) {
  try {
    const { eventId, locationId } = req.params;

    await seatingService.deleteSeatingLocationService({
      eventId,
      locationId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Seating location deleted successfully",
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to delete seating location");
  }
}

/*
|--------------------------------------------------------------------------
| ASSIGNMENTS
|--------------------------------------------------------------------------
*/

export async function assignGuestSeat(req, res) {
  try {
    const { eventId } = req.params;

    const result = await seatingService.assignGuestSeatService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Guest assigned successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to assign guest");
  }
}

export async function removeGuestSeat(req, res) {
  try {
    const { eventId, assignmentId } = req.params;

    await seatingService.removeGuestSeatService({
      eventId,
      assignmentId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Seating assignment removed successfully",
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to remove seating assignment");
  }
}

export async function listSeatingAssignments(req, res) {
  try {
    const { eventId } = req.params;

    const result = await seatingService.listSeatingAssignmentsService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Seating assignments fetched successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch seating assignments");
  }
}

/*
|--------------------------------------------------------------------------
| CHART
|--------------------------------------------------------------------------
*/

export async function getSeatingChart(req, res) {
  try {
    const { eventId } = req.params;

    const result = await seatingService.getSeatingChartService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Seating chart fetched successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch seating chart");
  }
}

/*
|--------------------------------------------------------------------------
| AUTO ASSIGN
|--------------------------------------------------------------------------
*/

export async function autoAssignSeating(req, res) {
  try {
    const { eventId } = req.params;

    const result = await seatingService.autoAssignSeatingService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Auto seating completed successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to auto assign seating");
  }
}

export async function clearSeatingAssignments(req, res) {
  try {
    const { eventId } = req.params;

    const result = await seatingService.clearSeatingAssignmentsService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Seating assignments cleared successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to clear seating assignments");
  }
}