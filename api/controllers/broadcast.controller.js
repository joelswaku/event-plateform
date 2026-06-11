import {
  listBroadcasts,
  getBroadcast,
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
  sendBroadcast,
  getBroadcastStats,
} from "../services/broadcast.service.js";

function err(e) { return e.statusCode ?? e.status ?? 500; }

export async function listBroadcastsCtrl(req, res) {
  try {
    const { limit = 20, offset = 0, status } = req.query;
    const data = await listBroadcasts({ limit: Number(limit), offset: Number(offset), status });
    return res.json({ success: true, ...data });
  } catch (e) {
    return res.status(err(e)).json({ success: false, message: e.message });
  }
}

export async function getBroadcastCtrl(req, res) {
  try {
    const broadcast = await getBroadcast(req.params.id);
    if (!broadcast) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, broadcast });
  } catch (e) {
    return res.status(err(e)).json({ success: false, message: e.message });
  }
}

export async function createBroadcastCtrl(req, res) {
  try {
    const { title, body, image_url, deep_link, audience, scheduled_at } = req.body;
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ success: false, message: "title and body are required" });
    }
    const broadcast = await createBroadcast({
      title, body, image_url, deep_link, audience, scheduled_at,
      createdBy: req.user.id,
    });
    return res.status(201).json({ success: true, broadcast });
  } catch (e) {
    return res.status(err(e)).json({ success: false, message: e.message });
  }
}

export async function updateBroadcastCtrl(req, res) {
  try {
    const broadcast = await updateBroadcast(req.params.id, req.body);
    if (!broadcast) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, broadcast });
  } catch (e) {
    return res.status(err(e)).json({ success: false, message: e.message });
  }
}

export async function deleteBroadcastCtrl(req, res) {
  try {
    await deleteBroadcast(req.params.id);
    return res.json({ success: true });
  } catch (e) {
    return res.status(err(e)).json({ success: false, message: e.message });
  }
}

export async function sendBroadcastCtrl(req, res) {
  try {
    const result = await sendBroadcast(req.params.id);
    return res.json({ success: true, ...result });
  } catch (e) {
    return res.status(err(e)).json({ success: false, message: e.message });
  }
}

export async function getBroadcastStatsCtrl(req, res) {
  try {
    const stats = await getBroadcastStats();
    return res.json({ success: true, stats });
  } catch (e) {
    return res.status(err(e)).json({ success: false, message: e.message });
  }
}
