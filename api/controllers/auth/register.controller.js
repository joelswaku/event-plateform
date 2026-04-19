import { registerSchema } from "../../validators/auth.validator.js";
import * as authService from "../../services/auth.service.js";




export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.flatten(parsed.error);
    return res.status(400).json({
      success: false,
      message: "validation failed",
      errors: {
        message: errors.messageError,
       
       }
    });
  }

  try {
    const result = await authService.registerUser({
      email: parsed.data.email,
      password: parsed.data.password,
      full_name: parsed.data.full_name ,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      deviceName: req.headers["x-device-name"] || null,
      res,
    });
        if(result.error === "Email_already_registered"){
          return res.status(409).json({
            success: false,
            message: "Email already exists",
            
          });
        }
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      ...result,
    });
}catch (error) {

    console.error("REGISTER ERROR:", error)
  
    res.status(500).json({
      success:false,
      message:error.message,
      stack:error.stack
    })
  
  }
}
