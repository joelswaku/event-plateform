import * as authService from "../../services/auth.service.js";

export async function me(req, res) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
   
     
    return res.status(200).json({
      success: true,
      user,
    });
  
   
    
  } catch (error) {
    const status = error.statusCode || 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch current user",
    });
  }
}