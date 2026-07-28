-- Create event_reminders table
CREATE TABLE IF NOT EXISTS event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  timing VARCHAR(50) NOT NULL,
  message TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_enabled ON event_reminders(enabled);

-- Create reminder_logs table for tracking sent reminders
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reminder_id UUID NOT NULL REFERENCES event_reminders(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  email_sent_to VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for reminder_logs
CREATE INDEX IF NOT EXISTS idx_reminder_logs_event_id ON reminder_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_reminder_id ON reminder_logs(reminder_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_guest_id ON reminder_logs(guest_id);

-- Insert default reminders for existing events that don't have any
INSERT INTO event_reminders (event_id, timing, message, enabled, locked)
SELECT
  e.id,
  'instant',
  'Thank you for registering! We''ll send you more details as the event approaches.',
  true,
  false
FROM events e
WHERE NOT EXISTS (
  SELECT 1 FROM event_reminders er WHERE er.event_id = e.id
)
AND e.deleted_at IS NULL;

COMMENT ON TABLE event_reminders IS 'Stores reminder configurations for events';
COMMENT ON TABLE reminder_logs IS 'Tracks which reminders have been sent to which guests';
