-- Add deleted_at to events table for soft deletes
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance (queries often filter WHERE deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at);

SELECT 'events.deleted_at column added' as result;
