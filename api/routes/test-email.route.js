// api/routes/test-email.route.js
import express from "express";
import { sendWelcomeEmail } from "../utils/sendEmail.js";

const router = express.Router();

router.get("/test-email", async (req, res) => {
  try {
    const result = await sendWelcomeEmail({
      to: "joelswaku@gmail.com",
      name: "Joel",
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Test email failed:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;