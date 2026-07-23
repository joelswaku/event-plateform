-- Add entity_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'entity_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN entity_id UUID;
    END IF;
END $$;

SELECT 'entity_id column added' as result;
