import {
  getNotificationsService,
  markNotificationReadService,
  markAllReadService,
} from "../services/notifications.service.js";

function httpStatus(err) {
  return err.statusCode ?? err.status ?? 500;
}

export async function getNotifications(req, res) {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const data = await getNotificationsService(req.user.id, { limit, offset });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error("[notifications] getNotifications:", err.message);
    return res.status(httpStatus(err)).json({ success: false, message: err.message });
  }
}

export async function markOneRead(req, res) {
  try {
    const data = await markNotificationReadService(req.user.id, req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[notifications] markOneRead:", err.message);
    return res.status(httpStatus(err)).json({ success: false, message: err.message });
  }
}

export async function markAllRead(req, res) {
  try {
    const data = await markAllReadService(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[notifications] markAllRead:", err.message);
    return res.status(httpStatus(err)).json({ success: false, message: err.message });
  }
}
