
import { loginSchema } from "../../validators/auth.validator.js";
import * as authService from "../../services/auth.service.js";

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = await authService.loginUser({
      email: parsed.data.email,
      password: parsed.data.password,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      deviceName: req.headers["x-device-name"] || null,
      res,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      ...result,

    });
  } catch (error) {
    const status = error.statusCode || 401;

    return res.status(status).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
}