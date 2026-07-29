-- ============================================================================
-- RAILWAY PRODUCTION MIGRATIONS
-- Run this file on Railway production database to ensure all migrations are applied
-- ============================================================================

-- Migration: Add payment idempotency keys (1780400000003)
-- Prevents duplicate payment processing from client retries
-- ============================================================================
ALTER TABLE ticket_orders
  ADD COLUMN IF NOT EXISTS client_request_id VARCHAR(128);

ALTER TABLE event_donations
  ADD COLUMN IF NOT EXISTS client_request_id VARCHAR(128);

CREATE UNIQUE INDEX IF NOT EXISTS ticket_orders_event_request_id_unique
  ON ticket_orders (event_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS event_donations_event_request_id_unique
  ON event_donations (event_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

-- ============================================================================
-- Migration: Create event_reminders table
-- Stores automated email reminder configurations per event
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_reminders (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  timing VARCHAR(50) NOT NULL, -- 'instant', '30_days', '14_days', '7_days', '3_days', '24_hours', '12_hours', '6_hours', '2_hours', '1_hour'
  message TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  locked BOOLEAN DEFAULT false, -- instant confirmation is always locked/enabled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON event_reminders(event_id);

-- ============================================================================
-- Migration: Add unique constraint to event_reminders
-- Ensures only one reminder config per timing per event
-- ============================================================================
-- Drop existing constraint if it exists
ALTER TABLE event_reminders
  DROP CONSTRAINT IF EXISTS event_reminders_event_id_timing_unique;

-- Add unique constraint
ALTER TABLE event_reminders
  ADD CONSTRAINT event_reminders_event_id_timing_unique
  UNIQUE (event_id, timing);

-- ============================================================================
-- Migration: Create reminder_logs table
-- Tracks individual reminder emails sent to guests
-- ============================================================================
CREATE TABLE IF NOT EXISTS reminder_logs (
  id SERIAL PRIMARY KEY,
  guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL, -- 'instant', '30_days', etc.
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed', 'bounced'
  error_message TEXT
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_reminder_logs_guest_id ON reminder_logs(guest_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_event_id ON reminder_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON reminder_logs(sent_at);

-- ============================================================================
-- Migration: Add updated_at to webhook_events
-- Tracks when webhook processing was last attempted
-- ============================================================================
ALTER TABLE webhook_events
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_webhook_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_events_updated_at_trigger ON webhook_events;
CREATE TRIGGER webhook_events_updated_at_trigger
  BEFORE UPDATE ON webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_events_updated_at();

-- ============================================================================
-- Migration: Chat admin features
-- Adds admin controls for chat system
-- ============================================================================
-- Add flagged column to chat_messages for moderation
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false;

-- Add reported_at for tracking when message was reported
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS reported_at TIMESTAMP;

-- Add reported_by to track who reported the message
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS reported_by INTEGER REFERENCES users(id);

-- Add report_reason for moderation context
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS report_reason TEXT;

-- Create index for flagged messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_flagged
  ON chat_messages(flagged)
  WHERE flagged = true;

-- Add archived column to chat_conversations
ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Add archived_at timestamp
ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

-- Create index for active conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_archived
  ON chat_conversations(archived)
  WHERE archived = false;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after migrations to verify everything is correct
-- ============================================================================

-- Verify payment idempotency columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ticket_orders' AND column_name = 'client_request_id';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'event_donations' AND column_name = 'client_request_id';

-- Verify event_reminders table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'event_reminders';

-- Verify reminder_logs table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'reminder_logs';

-- Verify webhook_events.updated_at exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'webhook_events' AND column_name = 'updated_at';

-- Verify chat moderation columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'chat_messages' AND column_name IN ('flagged', 'reported_at', 'reported_by', 'report_reason');

-- ============================================================================
-- DONE!
-- All migrations applied successfully
-- ============================================================================
