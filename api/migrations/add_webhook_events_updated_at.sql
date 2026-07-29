-- Add updated_at column to webhook_events table
-- This is optional but recommended for better audit trail

ALTER TABLE webhook_events
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index for better query performance on unprocessed webhooks
CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed
ON webhook_events(processed) WHERE processed = false;

-- Add comment for documentation
COMMENT ON COLUMN webhook_events.updated_at IS 'Timestamp of last update, useful for tracking retry attempts';
