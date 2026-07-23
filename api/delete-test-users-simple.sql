-- Delete all test users and their related data
BEGIN;

-- Show what will be deleted
SELECT 'Users to delete:' as info;
SELECT email, full_name, email_verified, created_at FROM users
WHERE email LIKE '%joel%'
   OR email LIKE '%test%'
   OR email = 'www.joelswaku@gmail.com'
ORDER BY created_at DESC;

-- Delete related data manually (avoiding FK issues)
DELETE FROM auth_sessions WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

DELETE FROM audit_logs WHERE actor_user_id IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

DELETE FROM event_guests WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

DELETE FROM events WHERE created_by IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

DELETE FROM subscriptions WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

DELETE FROM notifications WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

DELETE FROM organizations WHERE owner_id IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

-- Finally delete the users themselves
DELETE FROM users
WHERE email LIKE '%joel%'
   OR email LIKE '%test%';

-- Show results
SELECT 'Cleanup complete!' as result;
SELECT COUNT(*) as remaining_users FROM users;

COMMIT;
