-- Delete all test users and their data (FINAL VERSION)
BEGIN;

-- Show users to be deleted
SELECT '=== USERS TO DELETE ===' as info;
SELECT email, full_name, email_verified FROM users
WHERE email LIKE '%joel%' OR email LIKE '%test%'
ORDER BY created_at DESC;

-- Delete in correct order (child tables first)
DELETE FROM auth_sessions WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

DELETE FROM audit_logs WHERE actor_user_id IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

DELETE FROM user_notifications WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

DELETE FROM notifications WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

DELETE FROM events WHERE created_by IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

DELETE FROM organization_subscriptions WHERE organization_id IN (
  SELECT id FROM organizations WHERE owner_id IN (
    SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
  )
);

DELETE FROM organizations WHERE owner_id IN (
  SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%'
);

-- Finally delete users
DELETE FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%';

-- Show results
SELECT '=== CLEANUP COMPLETE ===' as result;
SELECT COUNT(*) as remaining_users FROM users;

COMMIT;
