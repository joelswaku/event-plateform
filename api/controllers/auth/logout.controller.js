
import * as authService from "../../services/auth.service.js";

export async function logout(req, res) {


  try {
    const refreshToken = req.cookies?.refreshToken || null;
      
     

    await authService.logoutUser({
      refreshToken,
      res,
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    const status = error.statusCode || 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Logout failed",
    });
  }
}