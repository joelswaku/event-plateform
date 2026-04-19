import { z } from "zod";
import * as authService from "../../services/auth.service.js";

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(100),
});

export async function resetPassword(req, res) {
  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errors: parsed.error.flatten(),
    });
  }

  try {
    await authService.resetPassword({
      token: parsed.data.token,
      newPassword: parsed.data.password,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    const status = error.statusCode || 400;

    return res.status(status).json({
      success: false,
      message: error.message || "Password reset failed",
    });
  }
}