export const validate = (schema) => (req, res, next) => {

    const parsed = schema.safeParse(req.body);
  
    if (!parsed.success) {
  
      const errors = parsed.error.flatten();
  
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.fieldErrors
      });
  
    }
  
    req.validated = parsed.data;
  
    next();
  
  };