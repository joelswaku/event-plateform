import express from "express";
import { processReminders } from "../services/reminder.service.js";

const router = express.Router();

/**
 * Middleware to verify cron secret token
 */
function verifyCronAuth(req, res, next) {
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is not set, allow only in development
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Cron] CRON_SECRET not configured in production');
      return res.status(500).json({ success: false, error: 'Cron authentication not configured' });
    }
    console.warn('[Cron] WARNING: No CRON_SECRET set, allowing unauthenticated access (development only)');
    return next();
  }

  // Check Authorization header or query param
  const authHeader = req.headers.authorization;
  const tokenFromQuery = req.query.token;

  const providedToken = authHeader?.replace('Bearer ', '') || tokenFromQuery;

  if (!providedToken || providedToken !== cronSecret) {
    console.warn('[Cron] Unauthorized cron attempt');
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  next();
}

/**
 * Cron endpoint to process reminders
 * Should be called every minute by a cron job
 *
 * Authentication: Requires CRON_SECRET env var matching Authorization: Bearer <token> or ?token=<token>
 * For development: CRON_SECRET is optional
 * For production: set up cron job or Railway cron to hit this every minute with auth token
 */
router.post("/reminders", verifyCronAuth, async (req, res) => {
  try {
    console.log('[Cron] Processing reminders...');
    const result = await processReminders();
    res.json(result);
  } catch (error) {
    console.error('[Cron] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Health check for cron jobs
 */
router.get("/health", (req, res) => {
  res.json({ success: true, message: "Cron service is running", timestamp: new Date().toISOString() });
});

export default router;
