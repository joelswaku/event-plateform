import { db } from "../config/db.js";
import { sendMail } from "../utils/sendEmail.js";
import { generateReminderEmail, generateReminderTextEmail } from "../templates/reminder-email.js";

/**
 * Process and send event reminders
 * This should be called every minute by a cron job
 */
export async function processReminders() {
  try {
    console.log('[Reminders] Starting reminder check...');

    const now = new Date();
    const remindersToSend = await findDueReminders(now);

    console.log(`[Reminders] Found ${remindersToSend.length} reminders to send`);

    if (remindersToSend.length === 0) {
      return { success: true, sent: 0, message: 'No reminders due' };
    }

    let sent = 0;
    let failed = 0;

    for (const reminder of remindersToSend) {
      try {
        await sendReminderToGuests(reminder);
        sent++;
      } catch (error) {
        console.error(`[Reminders] Failed to send reminder for event ${reminder.event_id}:`, error);
        failed++;
      }
    }

    console.log(`[Reminders] Completed. Sent: ${sent}, Failed: ${failed}`);

    return { success: true, sent, failed };
  } catch (error) {
    console.error('[Reminders] Error processing reminders:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Find reminders that are due to be sent
 */
async function findDueReminders(now) {
  const result = await db.query(`
    SELECT
      er.id as reminder_id,
      er.event_id,
      er.timing,
      er.message,
      e.title as event_title,
      e.starts_at,
      e.venue_name,
      e.city,
      e.country,
      e.slug,
      e.timezone
    FROM event_reminders er
    JOIN events e ON e.id = er.event_id
    WHERE er.enabled = true
      AND e.starts_at IS NOT NULL
      AND e.status != 'CANCELLED'
      AND e.status != 'ARCHIVED'
  `);

  const dueReminders = [];

  for (const row of result.rows) {
    const eventStartTime = new Date(row.starts_at);
    const shouldSend = shouldSendReminder(now, eventStartTime, row.timing);

    if (shouldSend) {
      dueReminders.push(row);
    }
  }

  return dueReminders;
}

/**
 * Check if a reminder should be sent based on timing
 */
function shouldSendReminder(now, eventStartTime, timing) {
  const diffMs = eventStartTime.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  // Map timing to minutes before event
  const timingMap = {
    'instant': null, // Handled separately on registration
    '1_minute': 1,
    '15_minutes': 15,
    '30_minutes': 30,
    '1_hour': 60,
    '2_hours': 120,
    '6_hours': 360,
    '12_hours': 720,
    '24_hours': 1440,
    '3_days': 4320,
    '7_days': 10080,
    '14_days': 20160,
    '30_days': 43200,
  };

  const targetMinutes = timingMap[timing];

  if (targetMinutes === null || targetMinutes === undefined) {
    return false;
  }

  // Send if we're within 1 minute of the target time
  // (since cron runs every minute, this gives us a 1-minute window)
  return diffMinutes >= targetMinutes - 1 && diffMinutes <= targetMinutes + 1;
}

/**
 * Send instant reminder to a single guest when they RSVP
 */
export async function sendInstantReminder(eventId, guestId, guestEmail, guestName) {
  try {
    // Check if there's an enabled instant reminder for this event
    const reminderResult = await db.query(`
      SELECT id, event_id, message, timing
      FROM event_reminders
      WHERE event_id = $1 AND timing = 'instant' AND enabled = true
      LIMIT 1
    `, [eventId]);

    if (reminderResult.rows.length === 0) {
      console.log(`[Reminders] No instant reminder configured for event ${eventId}`);
      return { success: false, reason: 'no_instant_reminder' };
    }

    const reminder = reminderResult.rows[0];

    // Atomic check-and-insert to prevent duplicate sends
    const logResult = await db.query(`
      INSERT INTO reminder_logs (event_id, reminder_id, guest_id, email_sent_to, status)
      VALUES ($1, $2, $3, $4, 'pending')
      ON CONFLICT (event_id, reminder_id, guest_id) DO NOTHING
      RETURNING id
    `, [eventId, reminder.id, guestId, guestEmail]);

    if (logResult.rows.length === 0) {
      console.log(`[Reminders] Instant reminder already sent to ${guestEmail}`);
      return { success: false, reason: 'already_sent' };
    }

    const logId = logResult.rows[0].id;

    // Get event details
    const eventResult = await db.query(`
      SELECT title, starts_at, venue_name, city, country, slug, timezone
      FROM events
      WHERE id = $1
      LIMIT 1
    `, [eventId]);

    if (eventResult.rows.length === 0) {
      console.log(`[Reminders] Event ${eventId} not found`);
      return { success: false, reason: 'event_not_found' };
    }

    const event = eventResult.rows[0];
    const eventUrl = `https://liteevent.com/e/${event.slug}`;
    const eventLocation = [event.venue_name, event.city, event.country].filter(Boolean).join(', ') || null;

    // Format date/time in event's timezone
    const eventTimezone = event.timezone || 'UTC';
    const eventDate = event.starts_at ? new Date(event.starts_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: eventTimezone
    }) : 'TBD';

    const eventTime = event.starts_at ? new Date(event.starts_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: eventTimezone
    }) : '';

    const htmlBody = generateReminderEmail({
      guestName: guestName || guestEmail.split('@')[0],
      eventTitle: event.title,
      eventDate,
      eventTime,
      eventLocation,
      eventUrl,
      message: reminder.message,
      timing: 'instant',
    });

    const textBody = generateReminderTextEmail({
      guestName: guestName || guestEmail.split('@')[0],
      eventTitle: event.title,
      eventDate,
      eventTime,
      eventLocation,
      eventUrl,
      message: reminder.message,
      timing: 'instant',
    });

    // Send email using existing sendMail helper (tries Resend → Brevo → Nodemailer)
    try {
      const result = await sendMail({
        to: guestEmail,
        subject: `✓ ${event.title} - Registration Confirmed`,
        html: htmlBody,
        name: guestName || guestEmail.split('@')[0]
      });

      // Update log status to sent
      await db.query(`
        UPDATE reminder_logs
        SET status = 'sent', sent_at = NOW()
        WHERE id = $1
      `, [logId]);

      console.log(`[Reminders] Sent instant reminder to ${guestEmail} for event ${event.title}`);

      return { success: true };
    } catch (error) {
      console.error(`[Reminders] Failed to send instant reminder to ${guestEmail}:`, error);

      // Update log status to failed
      await db.query(`
        UPDATE reminder_logs
        SET status = 'failed', sent_at = NOW()
        WHERE id = $1
      `, [logId]);

      return { success: false, error: error.message || 'Email send failed' };
    }

    console.log(`[Reminders] Sent instant reminder to ${guestEmail} for event ${event.title}`);

    return { success: true };
  } catch (error) {
    console.error(`[Reminders] Failed to send instant reminder:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Send reminder to all guests of an event
 */
async function sendReminderToGuests(reminder) {
  const { reminder_id, event_id, event_title, starts_at, venue_name, city, country, slug, message, timing, timezone } = reminder;

  // Get all confirmed guests (GOING status in RSVP)
  const guestsResult = await db.query(`
    SELECT g.id, g.email, g.full_name
    FROM guests g
    LEFT JOIN guest_rsvps gr ON gr.guest_id = g.id AND gr.event_id = g.event_id
    WHERE g.event_id = $1
      AND gr.rsvp_status = 'GOING'
      AND g.email IS NOT NULL
      AND g.email != ''
      AND g.deleted_at IS NULL
  `, [event_id]);

  console.log(`[Reminders] Sending to ${guestsResult.rows.length} guests for event: ${event_title}`);

  const eventUrl = `https://liteevent.com/e/${slug}`;
  const eventLocation = [venue_name, city, country].filter(Boolean).join(', ') || null;

  // Format date/time in event's timezone
  const eventTimezone = timezone || 'UTC';
  const eventDate = new Date(starts_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: eventTimezone
  });

  const eventTime = new Date(starts_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: eventTimezone
  });

  for (const guest of guestsResult.rows) {
    try {
      // Atomic check-and-insert to prevent duplicate sends from concurrent cron runs
      const logResult = await db.query(`
        INSERT INTO reminder_logs (event_id, reminder_id, guest_id, email_sent_to, status)
        VALUES ($1, $2, $3, $4, 'pending')
        ON CONFLICT (event_id, reminder_id, guest_id) DO NOTHING
        RETURNING id
      `, [event_id, reminder_id, guest.id, guest.email]);

      if (logResult.rows.length === 0) {
        console.log(`[Reminders] Already sent to ${guest.email}, skipping`);
        continue;
      }

      const logId = logResult.rows[0].id;

      const guestName = guest.full_name || guest.email.split('@')[0];

      const htmlBody = generateReminderEmail({
        guestName,
        eventTitle: event_title,
        eventDate,
        eventTime,
        eventLocation,
        eventUrl,
        message,
        timing,
      });

      const textBody = generateReminderTextEmail({
        guestName,
        eventTitle: event_title,
        eventDate,
        eventTime,
        eventLocation,
        eventUrl,
        message,
        timing,
      });

      // Send email using existing sendMail helper (tries Resend → Brevo → Nodemailer)
      try {
        await sendMail({
          to: guest.email,
          subject: `${timing === 'instant' ? '✓' : '🔔'} ${event_title} ${timing === 'instant' ? '- Registration Confirmed' : '- Event Reminder'}`,
          html: htmlBody,
          name: guestName
        });

        // Update log status to sent
        await db.query(`
          UPDATE reminder_logs
          SET status = 'sent', sent_at = NOW()
          WHERE id = $1
        `, [logId]);

        console.log(`[Reminders] Sent to ${guest.email}`);
      } catch (sendError) {
        console.error(`[Reminders] Failed to send to ${guest.email}:`, sendError);

        // Update log status to failed
        await db.query(`
          UPDATE reminder_logs
          SET status = 'failed', sent_at = NOW()
          WHERE id = $1
        `, [logId]);

        continue;
      }

    } catch (error) {
      console.error(`[Reminders] Failed to send to ${guest.email}:`, error);

      // Try to update log status to failed (logId might not be defined if insert failed)
      if (typeof logId !== 'undefined') {
        try {
          await db.query(`
            UPDATE reminder_logs
            SET status = 'failed', sent_at = NOW()
            WHERE id = $1
          `, [logId]);
        } catch (updateError) {
          console.error(`[Reminders] Failed to update log status:`, updateError);
        }
      }
    }
  }
}
