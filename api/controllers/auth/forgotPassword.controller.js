import { forgotPasswordSchema } from "../../validators/auth.validator.js";
import * as authService from "../../services/auth.service.js";

export async function forgotPassword(req, res) {
  const parsed = forgotPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errors: parsed.error.flatten(),
    });
  }

  try {
    await authService.requestPasswordReset({
      email: parsed.data.email,
    });

    return res.status(200).json({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    const status = error.statusCode || 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Password reset request failed",
    });
  }
}