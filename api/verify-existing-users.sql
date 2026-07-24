-- Mark all existing users as verified
-- (These were created before email verification was required)

BEGIN;

-- Update all users without verification token to be verified
UPDATE users
SET email_verified = true
WHERE verification_token IS NULL
  AND email_verified = false;

-- Show updated users
SELECT
  email,
  email_verified,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

COMMIT;
