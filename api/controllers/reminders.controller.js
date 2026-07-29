import { db } from "../config/db.js";
import { assertCanEnableReminder } from "../services/planLimits.service.js";

// Get reminders for an event
export async function getEventReminders(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Check if user has access to this event (must be owner)
    const eventCheck = await db.query(
      `SELECT em.role::TEXT
       FROM event_members em
       WHERE em.event_id = $1 AND em.user_id = $2 AND em.deleted_at IS NULL
       LIMIT 1`,
      [eventId, userId]
    );

    if (eventCheck.rows.length === 0 || eventCheck.rows[0].role !== 'OWNER') {
      return res.status(403).json({ error: "Only the event owner can manage reminders" });
    }

    const result = await db.query(
      `SELECT id, timing, message, enabled, locked, created_at, updated_at
       FROM event_reminders
       WHERE event_id = $1
       ORDER BY
         CASE timing
           WHEN 'instant' THEN 1
           WHEN '30_days' THEN 2
           WHEN '14_days' THEN 3
           WHEN '7_days' THEN 4
           WHEN '3_days' THEN 5
           WHEN '24_hours' THEN 6
           WHEN '12_hours' THEN 7
           WHEN '6_hours' THEN 8
           WHEN '2_hours' THEN 9
           WHEN '1_hour' THEN 10
           WHEN '30_minutes' THEN 11
           WHEN '15_minutes' THEN 12
           ELSE 99
         END`,
      [eventId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching event reminders:", error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
}

// Save reminders for an event
export async function saveEventReminders(req, res) {
  const client = await db.connect();
  try {
    const { eventId } = req.params;
    const { reminders } = req.body;
    const userId = req.user.id;

    await client.query("BEGIN");

    // Check if user has access to this event (must be owner)
    const eventCheck = await client.query(
      `SELECT em.role::TEXT
       FROM event_members em
       WHERE em.event_id = $1 AND em.user_id = $2 AND em.deleted_at IS NULL
       LIMIT 1`,
      [eventId, userId]
    );

    if (eventCheck.rows.length === 0 || eventCheck.rows[0].role !== 'OWNER') {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Only the event owner can manage reminders" });
    }

    // Validate reminders array
    if (!Array.isArray(reminders)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Reminders must be an array" });
    }

    // Enforce plan limit: Starter can only have 1 enabled reminder, Pro has unlimited
    try {
      await assertCanEnableReminder(client, userId, eventId, reminders);
    } catch (err) {
      await client.query("ROLLBACK");
      return res.status(err.statusCode || 403).json({
        error: err.message,
        code: err.code,
        details: err.details,
      });
    }

    // Get existing reminders
    const existingResult = await client.query(
      `SELECT id, timing FROM event_reminders WHERE event_id = $1`,
      [eventId]
    );
    const existingMap = new Map(existingResult.rows.map(r => [r.timing, r.id]));

    // Upsert reminders (preserves reminder_logs via FK)
    const upsertPromises = reminders.map((reminder) => {
      return client.query(
        `INSERT INTO event_reminders (event_id, timing, message, enabled, locked)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (event_id, timing)
         DO UPDATE SET
           message = EXCLUDED.message,
           enabled = EXCLUDED.enabled,
           locked = EXCLUDED.locked,
           updated_at = NOW()
         RETURNING *`,
        [
          eventId,
          reminder.timing,
          reminder.message,
          reminder.enabled ?? true,
          reminder.locked ?? false,
        ]
      );
    });

    const results = await Promise.all(upsertPromises);
    const savedReminders = results.map((r) => r.rows[0]);

    // Delete reminders not in the new set
    const newTimings = reminders.map(r => r.timing);
    if (newTimings.length > 0) {
      await client.query(
        `DELETE FROM event_reminders
         WHERE event_id = $1 AND timing NOT IN (${newTimings.map((_, i) => `$${i + 2}`).join(',')})`,
        [eventId, ...newTimings]
      );
    } else {
      await client.query(`DELETE FROM event_reminders WHERE event_id = $1`, [eventId]);
    }

    await client.query("COMMIT");
    res.json({ success: true, data: savedReminders });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving event reminders:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    res.status(500).json({ error: "Failed to save reminders", details: error.message });
  } finally {
    client.release();
  }
}
