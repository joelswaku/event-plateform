import { acceptTermsService } from "../../services/auth.service.js";
import { audit }              from "../../services/audit.service.js";

const CURRENT_LEGAL_VERSION = "2026.1";

export async function acceptTerms(req, res) {
  try {
    const userId  = req.user.id;
    const ip      = req.ip;
    const ua      = req.headers["user-agent"];

    // The API owns the version so a client cannot record acceptance of an old policy.
    const result = await acceptTermsService({ userId, version: CURRENT_LEGAL_VERSION, ip, userAgent: ua });

    // Audit log — never blocks the response
    audit({
      adminId:      userId,
      action:       "terms_accepted",
      resourceType: "user",
      resourceId:   userId,
      details: {
        terms_version:    CURRENT_LEGAL_VERSION,
        accepted_at:      result?.terms_accepted_at,
        ip,
        user_agent:       ua,
      },
      ip,
      userAgent: ua,
    });

    return res.json({
      success:               true,
      terms_accepted_at:     result?.terms_accepted_at,
      terms_version_accepted: result?.terms_version_accepted,
    });
  } catch (e) {
    console.error("[acceptTerms]", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}
