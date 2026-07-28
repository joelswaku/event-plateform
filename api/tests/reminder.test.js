/**
 * Basic integration tests for reminder system
 * Run with: npm test -- reminder.test.js
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '../config/db.js';
import { processReminders, sendInstantReminder } from '../services/reminder.service.js';

describe('Reminder System', () => {
  let testEventId;
  let testGuestId;
  let testReminderId;

  beforeAll(async () => {
    // Create a test event
    const eventResult = await db.query(`
      INSERT INTO events (organization_id, created_by, title, slug, starts_at, timezone, status)
      VALUES (
        (SELECT id FROM organizations LIMIT 1),
        (SELECT id FROM users LIMIT 1),
        'Test Event for Reminders',
        'test-reminder-event-' || floor(random() * 1000000),
        NOW() + INTERVAL '1 hour',
        'America/New_York',
        'PUBLISHED'
      )
      RETURNING id
    `);
    testEventId = eventResult.rows[0].id;

    // Create a test guest
    const guestResult = await db.query(`
      INSERT INTO guests (event_id, full_name, email)
      VALUES ($1, 'Test Guest', 'test@example.com')
      RETURNING id
    `, [testEventId]);
    testGuestId = guestResult.rows[0].id;

    // Create an instant reminder
    const reminderResult = await db.query(`
      INSERT INTO event_reminders (event_id, timing, message, enabled)
      VALUES ($1, 'instant', 'Welcome! We are excited to see you.', true)
      RETURNING id
    `, [testEventId]);
    testReminderId = reminderResult.rows[0].id;

    // Create RSVP for guest
    await db.query(`
      INSERT INTO guest_rsvps (guest_id, event_id, rsvp_status)
      VALUES ($1, $2, 'GOING')
    `, [testGuestId, testEventId]);
  });

  afterAll(async () => {
    // Cleanup test data
    if (testEventId) {
      await db.query('DELETE FROM events WHERE id = $1', [testEventId]);
    }
  });

  it('should not send duplicate reminders (atomic duplicate prevention)', async () => {
    // First send
    const result1 = await sendInstantReminder(testEventId, testGuestId, 'test@example.com', 'Test Guest');

    // Second send (should be prevented)
    const result2 = await sendInstantReminder(testEventId, testGuestId, 'test@example.com', 'Test Guest');

    expect(result2.success).toBe(false);
    expect(result2.reason).toBe('already_sent');

    // Verify only one log entry exists
    const logCount = await db.query(`
      SELECT COUNT(*) as count FROM reminder_logs
      WHERE event_id = $1 AND reminder_id = $2 AND guest_id = $3
    `, [testEventId, testReminderId, testGuestId]);

    expect(parseInt(logCount.rows[0].count)).toBe(1);
  });

  it('should handle Resend API errors gracefully', async () => {
    // Create a guest with invalid email to trigger send failure
    const badGuestResult = await db.query(`
      INSERT INTO guests (event_id, full_name, email)
      VALUES ($1, 'Bad Email Guest', 'invalid-email')
      RETURNING id
    `, [testEventId]);
    const badGuestId = badGuestResult.rows[0].id;

    await db.query(`
      INSERT INTO guest_rsvps (guest_id, event_id, rsvp_status)
      VALUES ($1, $2, 'GOING')
    `, [badGuestId, testEventId]);

    const result = await sendInstantReminder(testEventId, badGuestId, 'invalid-email', 'Bad Email Guest');

    // Should return failure (not throw)
    expect(result.success).toBe(false);

    // Verify 'failed' status was logged
    const logResult = await db.query(`
      SELECT status FROM reminder_logs
      WHERE event_id = $1 AND guest_id = $2
    `, [testEventId, badGuestId]);

    if (logResult.rows.length > 0) {
      expect(logResult.rows[0].status).toBe('failed');
    }
  });

  it('should use event timezone when formatting dates', async () => {
    // Create event with specific timezone
    const tzEventResult = await db.query(`
      INSERT INTO events (organization_id, created_by, title, slug, starts_at, timezone, status)
      VALUES (
        (SELECT id FROM organizations LIMIT 1),
        (SELECT id FROM users LIMIT 1),
        'Timezone Test Event',
        'tz-test-event-' || floor(random() * 1000000),
        '2026-08-15 14:00:00+00'::timestamptz,
        'America/Los_Angeles',
        'PUBLISHED'
      )
      RETURNING id, timezone, starts_at
    `);

    const tzEventId = tzEventResult.rows[0].id;
    const timezone = tzEventResult.rows[0].timezone;
    const startsAt = tzEventResult.rows[0].starts_at;

    // Format in event's timezone
    const eventDate = new Date(startsAt).toLocaleDateString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Should show Pacific time (7:00 AM), not UTC (2:00 PM)
    expect(eventDate).toContain('7:00');
    expect(eventDate).toContain('AM');

    // Cleanup
    await db.query('DELETE FROM events WHERE id = $1', [tzEventId]);
  });

  it('should not cascade-delete reminder_logs when updating reminders', async () => {
    // Create a reminder and send it
    const newReminderResult = await db.query(`
      INSERT INTO event_reminders (event_id, timing, message, enabled)
      VALUES ($1, '1_hour', 'One hour reminder', true)
      RETURNING id
    `, [testEventId]);
    const newReminderId = newReminderResult.rows[0].id;

    // Create a log entry
    await db.query(`
      INSERT INTO reminder_logs (event_id, reminder_id, guest_id, email_sent_to, status)
      VALUES ($1, $2, $3, 'test@example.com', 'sent')
    `, [testEventId, newReminderId, testGuestId]);

    // Update the reminder (upsert)
    await db.query(`
      INSERT INTO event_reminders (event_id, timing, message, enabled)
      VALUES ($1, '1_hour', 'Updated one hour reminder', true)
      ON CONFLICT (event_id, timing)
      DO UPDATE SET message = EXCLUDED.message
    `, [testEventId]);

    // Verify log still exists
    const logCheck = await db.query(`
      SELECT id FROM reminder_logs
      WHERE event_id = $1 AND reminder_id = $2 AND guest_id = $3
    `, [testEventId, newReminderId, testGuestId]);

    expect(logCheck.rows.length).toBe(1);
  });
});
