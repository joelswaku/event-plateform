import * as authService from "../../services/auth.service.js";

export async function verifyEmail(req, res) {
  const { token, code } = req.body;

  if (!token || !code) {
    return res.status(400).json({
      success: false,
      message: "Verification token and code are required",
    });
  }

  try {
    const result = await authService.verifyEmailWithCode({
      token,
      code,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      deviceName: req.headers["x-device-name"] || null,
      res,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function resendCode(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Verification token is required",
    });
  }

  try {
    const result = await authService.resendVerificationCode({ token });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("RESEND CODE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
