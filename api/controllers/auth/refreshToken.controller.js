import { refreshTokenSchema } from "../../validators/auth.validator.js";
import * as authService from "../../services/auth.service.js";

export async function refreshToken(req, res) {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken || null;
 
  const parsed = refreshTokenSchema.safeParse({
    refresh_token: incomingRefreshToken,
  });

  if (!parsed.success) {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing or invalid",
    });
  }

  try {
    const result = await authService.rotateRefreshToken({
      refreshToken: parsed.data.refresh_token,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      deviceName: req.headers["x-device-name"] || null,
      res,
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      ...result,
    });
  } catch (error) {
    const status = error.statusCode || 401;

    return res.status(status).json({
      success: false,
      message: error.message || "Invalid refresh token",
    });
  }
}