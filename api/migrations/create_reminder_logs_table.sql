-- Create table to track sent reminders (prevent duplicates)
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reminder_id UUID NOT NULL REFERENCES event_reminders(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent_to VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_reminder_logs_event_id ON reminder_logs(event_id);
CREATE INDEX idx_reminder_logs_reminder_id ON reminder_logs(reminder_id);
CREATE INDEX idx_reminder_logs_guest_id ON reminder_logs(guest_id);
CREATE UNIQUE INDEX idx_reminder_logs_unique ON reminder_logs(event_id, reminder_id, guest_id);

COMMENT ON TABLE reminder_logs IS 'Tracks sent reminders to prevent duplicates';
