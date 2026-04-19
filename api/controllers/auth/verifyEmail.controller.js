import { verifyEmailSchema } from "../../validators/auth.validator.js";
import * as authService from "../../services/auth.service.js";

export async function verifyEmail(req, res) {
  const parsed = verifyEmailSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errors: parsed.error.flatten(),
    });
  }

  try {
    await authService.verifyEmailToken({
      token: parsed.data.token,
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    const status = error.statusCode || 400;

    return res.status(status).json({
      success: false,
      message: error.message || "Email verification failed",
    });
  }
}