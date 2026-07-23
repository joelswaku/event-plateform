-- Create user_status enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM (
        'PENDING',
        'ACTIVE',
        'SUSPENDED',
        'DELETED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status user_status DEFAULT 'ACTIVE'::user_status NOT NULL;
    END IF;
END $$;

-- Add phone_verified
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT false NOT NULL;
    END IF;
END $$;

-- Add last_login_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add deleted_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add default_organization_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'default_organization_id'
    ) THEN
        ALTER TABLE users ADD COLUMN default_organization_id UUID;
    END IF;
END $$;

SELECT 'Users table updated successfully' as result;
