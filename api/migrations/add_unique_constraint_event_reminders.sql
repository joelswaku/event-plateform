-- Add unique constraints to prevent duplicates and enable atomic operations
-- This prevents cascade-deleting reminder_logs when saving reminders
-- and prevents duplicate sends from concurrent cron runs
--
-- Safe to run multiple times (idempotent)

DO $$
BEGIN
  -- Remove any duplicate event_reminders (keep the most recent)
  DELETE FROM event_reminders
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id, timing ORDER BY created_at DESC) as rn
      FROM event_reminders
    ) t
    WHERE rn > 1
  );

  -- Add unique constraint to event_reminders (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'event_reminders_event_id_timing_key'
  ) THEN
    ALTER TABLE event_reminders
    ADD CONSTRAINT event_reminders_event_id_timing_key UNIQUE (event_id, timing);
    RAISE NOTICE 'Added constraint: event_reminders_event_id_timing_key';
  ELSE
    RAISE NOTICE 'Constraint already exists: event_reminders_event_id_timing_key';
  END IF;

  -- Remove any duplicate reminder_logs (keep the most recent)
  DELETE FROM reminder_logs
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id, reminder_id, guest_id ORDER BY created_at DESC) as rn
      FROM reminder_logs
    ) t
    WHERE rn > 1
  );

  -- Add unique constraint to reminder_logs (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reminder_logs_event_reminder_guest_key'
  ) THEN
    ALTER TABLE reminder_logs
    ADD CONSTRAINT reminder_logs_event_reminder_guest_key UNIQUE (event_id, reminder_id, guest_id);
    RAISE NOTICE 'Added constraint: reminder_logs_event_reminder_guest_key';
  ELSE
    RAISE NOTICE 'Constraint already exists: reminder_logs_event_reminder_guest_key';
  END IF;

END $$;
