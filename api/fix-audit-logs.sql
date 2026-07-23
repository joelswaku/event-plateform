-- Add missing columns to audit_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN organization_id UUID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'admin_email'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN admin_email TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'resource_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN resource_id TEXT;
    END IF;
END $$;

-- Add index for organization queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);

SELECT 'audit_logs table updated' as result;
