import * as builderService from "../services/event-builder.service.js";

function handleControllerError(res, error, fallbackMessage = "Internal server error") {
  console.error(error);

  const statusCode = error?.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error?.message || fallbackMessage,
    ...(error?.details ? { details: error.details } : {}),
  });
}

export async function getEventBuilder(req, res) {
  try {
    const { eventId } = req.params;

    const data = await builderService.getEventBuilderService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Event builder data fetched successfully",
      data,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch builder data");
  }
}

export async function upsertEventPage(req, res) {
  try {
    const { eventId } = req.params;

    const page = await builderService.upsertEventPageService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Event page saved successfully",
      data: page,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to save event page");
  }
}

export async function createSection(req, res) {
  try {
    const { eventId } = req.params;

    const section = await builderService.createSectionService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: section,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create section");
  }
}

export async function updateSection(req, res) {
  try {
    const { eventId, sectionId } = req.params;

    const section = await builderService.updateSectionService({
      eventId,
      sectionId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: section,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to update section");
  }
}

export async function deleteSection(req, res) {
  try {
    const { eventId, sectionId } = req.params;

    await builderService.deleteSectionService({
      eventId,
      sectionId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to delete section");
  }
}

export async function reorderSections(req, res) {
  try {
    const { eventId } = req.params;

    const sections = await builderService.reorderSectionsService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Sections reordered successfully",
      data: sections,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to reorder sections");
  }
}

export async function publishEventPage(req, res) {
  try {
    const { eventId } = req.params;

    const page = await builderService.publishEventPageService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Event page published successfully",
      data: page,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to publish page");
  }
}

export async function unpublishEventPage(req, res) {
  try {
    const { eventId } = req.params;

    const page = await builderService.unpublishEventPageService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Event page unpublished successfully",
      data: page,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to unpublish page");
  }
}

export async function getPreviewEventPage(req, res) {
  try {
    const { eventId } = req.params;

    const data = await builderService.getPreviewEventPageService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Preview data fetched successfully",
      data,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch preview page");
  }
}

export async function createScheduleItem(req, res) {
  try {
    const { eventId } = req.params;

    const item = await builderService.createScheduleItemService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Schedule item created successfully",
      data: item,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create schedule item");
  }
}

export async function createSpeaker(req, res) {
  try {
    const { eventId } = req.params;

    const speaker = await builderService.createSpeakerService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Speaker created successfully",
      data: speaker,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create speaker");
  }
}

export async function uploadEventMedia(req, res) {
  try {
    const { eventId } = req.params;

    const media = await builderService.uploadEventMediaService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Event media uploaded successfully",
      data: media,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to upload event media");
  }
}

export async function selectEventTheme(req, res) {
  try {
    const { eventId } = req.params;

    const settings = await builderService.selectEventThemeService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Theme selected successfully",
      data: settings,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to select theme");
  }
}



