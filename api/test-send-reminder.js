/**
 * Test script to send a real reminder email
 * Usage: node test-send-reminder.js YOUR_EMAIL@gmail.com
 */

import { db } from './config/db.js';
import { sendInstantReminder } from './services/reminder.service.js';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = process.argv[2];

if (!testEmail || !testEmail.includes('@')) {
  console.error('❌ Usage: node test-send-reminder.js YOUR_EMAIL@gmail.com');
  process.exit(1);
}

async function testReminderEmail() {
  try {
    console.log('🚀 Starting reminder email test...');
    console.log(`📧 Target email: ${testEmail}`);
    console.log('');

    // 1. Create a test event
    console.log('1️⃣ Creating test event...');
    const eventResult = await db.query(`
      INSERT INTO events (
        organization_id,
        created_by,
        title,
        slug,
        starts_at,
        timezone,
        status,
        allow_rsvp,
        open_rsvp,
        venue_name,
        city,
        country
      ) VALUES (
        (SELECT id FROM organizations LIMIT 1),
        (SELECT id FROM users LIMIT 1),
        'Test Reminder Event',
        'test-reminder-' || floor(random() * 1000000),
        NOW() + INTERVAL '2 hours',
        'America/New_York',
        'PUBLISHED',
        true,
        true,
        'Test Venue',
        'New York',
        'USA'
      )
      RETURNING id, title, slug
    `);
    const event = eventResult.rows[0];
    console.log(`✅ Event created: ${event.title} (${event.id})`);
    console.log('');

    // 2. Create instant reminder
    console.log('2️⃣ Creating instant reminder...');
    const reminderResult = await db.query(`
      INSERT INTO event_reminders (event_id, timing, message, enabled)
      VALUES ($1, 'instant', $2, true)
      RETURNING id
    `, [
      event.id,
      'Welcome! 🎉 Thank you for registering for our test event. This is a test email from the new reminder system with proper error handling, timezone support, and duplicate prevention.'
    ]);
    const reminder = reminderResult.rows[0];
    console.log(`✅ Instant reminder created: ${reminder.id}`);
    console.log('');

    // 3. Create test guest
    console.log('3️⃣ Creating test guest...');
    const guestResult = await db.query(`
      INSERT INTO guests (event_id, full_name, email)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [event.id, 'Test User', testEmail]);
    const guest = guestResult.rows[0];
    console.log(`✅ Guest created: ${guest.id} (${testEmail})`);
    console.log('');

    // 4. Create RSVP
    console.log('4️⃣ Creating RSVP (GOING)...');
    await db.query(`
      INSERT INTO guest_rsvps (guest_id, event_id, rsvp_status)
      VALUES ($1, $2, 'GOING')
    `, [guest.id, event.id]);
    console.log('✅ RSVP created');
    console.log('');

    // 5. Send instant reminder
    console.log('5️⃣ Sending instant reminder email...');
    console.log('⏳ Please wait...');
    console.log('⚠️  Note: Using test mode. In production, verify liteevent.com domain in Resend');
    const result = await sendInstantReminder(event.id, guest.id, testEmail, 'Test User');

    console.log('');
    if (result.success) {
      console.log('✅ ✅ ✅ EMAIL SENT SUCCESSFULLY! ✅ ✅ ✅');
      console.log('');
      console.log('📬 Check your inbox at:', testEmail);
      console.log('📧 Subject: "✓ Test Reminder Event - Registration Confirmed"');
      console.log('🔍 If not in inbox, check spam/promotions folder');
      console.log('');

      // Check the log
      const logResult = await db.query(`
        SELECT * FROM reminder_logs
        WHERE event_id = $1 AND guest_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      `, [event.id, guest.id]);

      if (logResult.rows.length > 0) {
        const log = logResult.rows[0];
        console.log('📝 Reminder log entry:');
        console.log(`   - Status: ${log.status}`);
        console.log(`   - Sent to: ${log.email_sent_to}`);
        console.log(`   - Sent at: ${log.sent_at}`);
      }
    } else {
      console.log('❌ EMAIL SEND FAILED');
      console.log('Error:', result.error || result.reason);

      // Check if it was already sent
      if (result.reason === 'already_sent') {
        console.log('');
        console.log('ℹ️  This is actually GOOD - it means duplicate prevention is working!');
        console.log('The email was already sent in a previous test run.');
      }
    }

    console.log('');
    console.log('🧹 Cleanup: Test data remains in database for inspection');
    console.log(`   Event ID: ${event.id}`);
    console.log(`   Guest ID: ${guest.id}`);
    console.log('');
    console.log('To clean up manually:');
    console.log(`   DELETE FROM events WHERE id = '${event.id}';`);

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

testReminderEmail();
