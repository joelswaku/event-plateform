
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
    const isMobile = req.headers["x-client-type"] === "mobile" ||
                     req.headers.authorization?.startsWith("Bearer");

    const result = await authService.loginUser({
      email: parsed.data.email,
      password: parsed.data.password,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      deviceName: req.headers["x-device-name"] || null,
      isMobile,
      res,
    });

    // Web clients: don't send tokens in JSON (they're in httpOnly cookies)
    // Mobile clients: send tokens in JSON response
    const response = {
      success: true,
      message: "Login successful",
      data: {
        user: result.data.user,
        ...(isMobile && {
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        }),
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    const status = error.statusCode || 401;

    return res.status(status).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
}