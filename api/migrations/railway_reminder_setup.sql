-- ============================================================================
-- RAILWAY PRODUCTION MIGRATION
-- Create event reminder system tables and constraints
-- ============================================================================
-- This migration:
-- 1. Creates event_reminders table
-- 2. Creates reminder_logs table
-- 3. Adds unique constraints for atomic operations
-- 4. Creates indexes for performance
-- 5. Seeds default instant reminders for existing events
--
-- Safe to run multiple times (idempotent)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Starting reminder system migration...';

  -- ============================================================================
  -- 1. CREATE event_reminders TABLE
  -- ============================================================================
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_reminders') THEN
    CREATE TABLE event_reminders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      timing VARCHAR(50) NOT NULL,
      message TEXT,
      enabled BOOLEAN NOT NULL DEFAULT true,
      locked BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: event_reminders';
  ELSE
    RAISE NOTICE 'Table already exists: event_reminders';
  END IF;

  -- ============================================================================
  -- 2. CREATE reminder_logs TABLE
  -- ============================================================================
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reminder_logs') THEN
    CREATE TABLE reminder_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      reminder_id UUID NOT NULL REFERENCES event_reminders(id) ON DELETE CASCADE,
      guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
      email_sent_to VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'sent',
      sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: reminder_logs';
  ELSE
    RAISE NOTICE 'Table already exists: reminder_logs';
  END IF;

  -- ============================================================================
  -- 3. CREATE INDEXES
  -- ============================================================================
  -- event_reminders indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_reminders_event_id') THEN
    CREATE INDEX idx_event_reminders_event_id ON event_reminders(event_id);
    RAISE NOTICE 'Created index: idx_event_reminders_event_id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_reminders_enabled') THEN
    CREATE INDEX idx_event_reminders_enabled ON event_reminders(enabled) WHERE enabled = true;
    RAISE NOTICE 'Created index: idx_event_reminders_enabled';
  END IF;

  -- reminder_logs indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reminder_logs_event_id') THEN
    CREATE INDEX idx_reminder_logs_event_id ON reminder_logs(event_id);
    RAISE NOTICE 'Created index: idx_reminder_logs_event_id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reminder_logs_reminder_id') THEN
    CREATE INDEX idx_reminder_logs_reminder_id ON reminder_logs(reminder_id);
    RAISE NOTICE 'Created index: idx_reminder_logs_reminder_id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reminder_logs_guest_id') THEN
    CREATE INDEX idx_reminder_logs_guest_id ON reminder_logs(guest_id);
    RAISE NOTICE 'Created index: idx_reminder_logs_guest_id';
  END IF;

  -- ============================================================================
  -- 4. REMOVE DUPLICATES (if any exist)
  -- ============================================================================
  DELETE FROM event_reminders
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id, timing ORDER BY created_at DESC) as rn
      FROM event_reminders
    ) t
    WHERE rn > 1
  );

  DELETE FROM reminder_logs
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id, reminder_id, guest_id ORDER BY created_at DESC) as rn
      FROM reminder_logs
    ) t
    WHERE rn > 1
  );

  -- ============================================================================
  -- 5. ADD UNIQUE CONSTRAINTS
  -- ============================================================================
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

  -- ============================================================================
  -- 6. SEED DEFAULT INSTANT REMINDERS
  -- ============================================================================
  INSERT INTO event_reminders (event_id, timing, message, enabled, locked)
  SELECT
    e.id,
    'instant',
    'Thank you for registering! We''ll send you more details as the event approaches.',
    true,
    false
  FROM events e
  WHERE NOT EXISTS (
    SELECT 1 FROM event_reminders er WHERE er.event_id = e.id AND er.timing = 'instant'
  )
  AND e.deleted_at IS NULL;

  RAISE NOTICE 'Reminder system migration completed successfully!';

END $$;

-- Add table comments
COMMENT ON TABLE event_reminders IS 'Stores reminder configurations for events (instant, 1 hour before, 24 hours before, etc.)';
COMMENT ON TABLE reminder_logs IS 'Tracks which reminders have been sent to which guests to prevent duplicates';
