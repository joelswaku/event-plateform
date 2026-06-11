import * as legal from "../services/legal.service.js";

function err(res, e, msg = "Internal server error") {
  console.error(e);
  return res.status(e?.statusCode || 500).json({ success: false, message: e?.message || msg });
}

export async function getPublicLegalPage(req, res) {
  try {
    const page = await legal.getLegalPageService(req.params.slug);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    res.json({ success: true, data: page });
  } catch (e) { err(res, e); }
}

export async function getAdminLegalPage(req, res) {
  try {
    const page = await legal.getAdminLegalPageService(req.params.slug);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    res.json({ success: true, data: page });
  } catch (e) { err(res, e); }
}

export async function listLegalPages(req, res) {
  try {
    res.json({ success: true, data: await legal.listLegalPagesService() });
  } catch (e) { err(res, e); }
}

export async function upsertLegalPage(req, res) {
  try {
    const page = await legal.upsertLegalPageService({ ...req.body, userId: req.user?.id });
    res.json({ success: true, data: page });
  } catch (e) { err(res, e); }
}

export async function deleteLegalPage(req, res) {
  try {
    await legal.deleteLegalPageService(req.params.slug);
    res.json({ success: true });
  } catch (e) { err(res, e); }
}
