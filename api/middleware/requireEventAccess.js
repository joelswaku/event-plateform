import { db } from "../config/db.js";

export async function requireEventAccess(req, res, next) {
  try {
    const userId = req.user.id;
    const eventId = req.params.eventId;

    const { rows } = await db.query(
      `
      SELECT 1
      FROM event_members
      WHERE event_id=$1
      AND user_id=$2
      AND deleted_at IS NULL
      `,
      [eventId, userId]
    );

    if (!rows.length) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this event",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}