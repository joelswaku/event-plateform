import * as service from "../services/public-pages.service.js";

export async function getPublicEventPageBySlug(req, res) {
  try {
    const data = await service.getPublicEventPageBySlugService({
      slug: req.params.slug,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch public event page",
    });
  }
}