-- Fix password_hash column to allow NULL for OAuth users
-- Google/social login users don't have passwords

BEGIN;

-- Make password_hash nullable
ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- Add check constraint: either has password OR uses OAuth
-- (This ensures every user has some way to authenticate)
ALTER TABLE users
ADD CONSTRAINT user_has_auth_method
CHECK (
  password_hash IS NOT NULL
  OR google_id IS NOT NULL
  OR facebook_id IS NOT NULL
);

COMMIT;

-- Verify the change
\d users
