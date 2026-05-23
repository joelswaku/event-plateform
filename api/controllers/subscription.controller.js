import {
  getSubscriptionStatusService,
  createCheckoutSessionService,
  createPortalSessionService,
  verifyCheckoutSessionService,
  getStripePricesService,
} from "../services/subscription.service.js";

// Stripe errors expose .statusCode; app errors use .statusCode; DB errors fall back to 500.
function httpStatus(err) {
  return err.statusCode ?? err.status ?? 500;
}

export async function getSubscriptionStatus(req, res) {
  try {
    const data = await getSubscriptionStatusService(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[subscription] getStatus error:", err.message);
    return res.status(httpStatus(err)).json({ success: false, message: err.message });
  }
}

export async function createCheckoutSession(req, res) {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const data = await createCheckoutSessionService(req.user.id, priceId, successUrl, cancelUrl);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[subscription] createCheckout error:", err.message);
    return res.status(httpStatus(err)).json({ success: false, message: err.message });
  }
}

export async function createPortalSession(req, res) {
  try {
    const data = await createPortalSessionService(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[subscription] createPortal error:", err.message);
    return res.status(httpStatus(err)).json({ success: false, message: err.message });
  }
}

export async function verifyCheckoutSession(req, res) {
  try {
    const data = await verifyCheckoutSessionService(req.user.id, req.query.session_id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[subscription] verifySession error:", err.message);
    return res.status(httpStatus(err)).json({ success: false, message: err.message });
  }
}

export async function getStripePrices(req, res) {
  try {
    const data = await getStripePricesService();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[subscription] getStripePrices error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}
