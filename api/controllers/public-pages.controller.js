import * as service from "../services/public-pages.service.js";

export async function getPublicEventPageBySlug(req, res) {
  try {
    const data = await service.getPublicEventPageBySlugService({
      slug: req.params.slug,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch public event page",
    });
  }
}

export async function getInvitedEventPage(req, res) {
  try {
    const data = await service.getInvitedEventPageBySlugService({
      slug: req.params.slug,
      invitationToken: req.query.token,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch event page",
    });
  }
}

export async function getPreviewEventPage(req, res) {
  try {
    const data = await service.getPreviewEventPageBySlugService({
      slug: req.params.slug,
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch event preview",
    });
  }
}
