-- Fix Google OAuth - Remove NOT NULL constraint from password_hash
-- This allows Google users (who don't have passwords) to be created

BEGIN;

-- First, check current constraint
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'password_hash';

-- Remove NOT NULL constraint
ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- Verify it's removed
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'password_hash';

-- Show result (should show is_nullable = YES)
SELECT 'password_hash can now be NULL for OAuth users' as status;

COMMIT;
