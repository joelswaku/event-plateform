import { acceptTermsService } from "../../services/auth.service.js";
import { audit }              from "../../services/audit.service.js";

export async function acceptTerms(req, res) {
  try {
    const userId  = req.user.id;
    const version = req.body?.version ?? "2025.1";
    const ip      = req.ip;
    const ua      = req.headers["user-agent"];

    const result = await acceptTermsService({ userId, version, ip, userAgent: ua });

    // Audit log — never blocks the response
    audit({
      adminId:      userId,
      action:       "terms_accepted",
      resourceType: "user",
      resourceId:   userId,
      details: {
        terms_version:    version,
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
