-- Add organization_id to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);

SELECT 'events.organization_id column added' as result;
