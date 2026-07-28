-- Test script to send real reminder email
-- Replace YOUR_EMAIL with your actual email address

-- 1. Find or create a test event
DO $$
DECLARE
  test_event_id UUID;
  test_guest_id UUID;
  test_reminder_id UUID;
BEGIN
  -- Create a test event starting in 1 hour
  INSERT INTO events (
    organization_id,
    created_by,
    title,
    slug,
    starts_at,
    timezone,
    status,
    allow_rsvp,
    open_rsvp
  ) VALUES (
    (SELECT id FROM organizations LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Test Reminder Event',
    'test-reminder-' || floor(random() * 1000000),
    NOW() + INTERVAL '1 hour',
    'America/New_York',
    'PUBLISHED',
    true,
    true
  )
  RETURNING id INTO test_event_id;

  RAISE NOTICE 'Created test event: %', test_event_id;

  -- Create an instant reminder for this event
  INSERT INTO event_reminders (event_id, timing, message, enabled)
  VALUES (
    test_event_id,
    'instant',
    'Welcome! Thank you for registering. This is a test reminder email from the new reminder system.',
    true
  )
  RETURNING id INTO test_reminder_id;

  RAISE NOTICE 'Created instant reminder: %', test_reminder_id;

  -- Create a test guest with YOUR email
  INSERT INTO guests (event_id, full_name, email)
  VALUES (
    test_event_id,
    'Test Guest',
    'YOUR_EMAIL_HERE@gmail.com'  -- REPLACE THIS!
  )
  RETURNING id INTO test_guest_id;

  RAISE NOTICE 'Created test guest: %', test_guest_id;

  -- Create RSVP with GOING status
  INSERT INTO guest_rsvps (guest_id, event_id, rsvp_status)
  VALUES (test_guest_id, test_event_id, 'GOING');

  RAISE NOTICE 'Created RSVP';

  -- Output the IDs for manual testing
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test data created!';
  RAISE NOTICE 'Event ID: %', test_event_id;
  RAISE NOTICE 'Guest ID: %', test_guest_id;
  RAISE NOTICE 'Reminder ID: %', test_reminder_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'To send the instant reminder via API:';
  RAISE NOTICE 'Use the open RSVP endpoint or call sendInstantReminder directly';
  RAISE NOTICE '========================================';

END $$;
