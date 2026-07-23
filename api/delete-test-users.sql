-- Delete all test users and their related data
BEGIN;

-- Get user IDs to delete
CREATE TEMP TABLE users_to_delete AS
SELECT id FROM users
WHERE email LIKE '%joel%'
   OR email LIKE '%test%'
   OR email = 'www.joelswaku@gmail.com';

-- Show what will be deleted
SELECT 'Users to delete:' as info;
SELECT email, full_name, created_at FROM users WHERE id IN (SELECT id FROM users_to_delete);

-- Delete related data (in correct order to avoid FK violations)
DELETE FROM auth_sessions WHERE user_id IN (SELECT id FROM users_to_delete);
DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users_to_delete);
DELETE FROM event_guests WHERE user_id IN (SELECT id FROM users_to_delete);
DELETE FROM events WHERE created_by IN (SELECT id FROM users_to_delete);
DELETE FROM organizations WHERE owner_id IN (SELECT id FROM users_to_delete);
DELETE FROM subscriptions WHERE user_id IN (SELECT id FROM users_to_delete);
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users_to_delete);

-- Finally delete the users
DELETE FROM users WHERE id IN (SELECT id FROM users_to_delete);

-- Show results
SELECT 'Cleanup complete!' as result;
SELECT COUNT(*) as remaining_users FROM users;

COMMIT;
