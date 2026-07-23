-- Complete test data cleanup
BEGIN;

-- Show what will be deleted
SELECT '=== USERS TO DELETE ===' as info;
SELECT email, full_name, email_verified FROM users
WHERE email LIKE '%joel%' OR email LIKE '%test%'
ORDER BY created_at DESC;

-- Get all events created by test users
CREATE TEMP TABLE test_user_ids AS
SELECT id FROM users WHERE email LIKE '%joel%' OR email LIKE '%test%';

CREATE TEMP TABLE test_event_ids AS
SELECT id FROM events WHERE created_by IN (SELECT id FROM test_user_ids);

CREATE TEMP TABLE test_org_ids AS
SELECT id FROM organizations WHERE owner_user_id IN (SELECT id FROM test_user_ids);

-- Delete everything related to these events (deepest level first)
DELETE FROM ticket_order_items WHERE order_id IN (
  SELECT id FROM ticket_orders WHERE event_id IN (SELECT id FROM test_event_ids)
);

DELETE FROM ticket_orders WHERE event_id IN (SELECT id FROM test_event_ids);

DELETE FROM ticket_types WHERE event_id IN (SELECT id FROM test_event_ids);

DELETE FROM event_pages WHERE event_id IN (SELECT id FROM test_event_ids);

-- Delete auth sessions
DELETE FROM auth_sessions WHERE user_id IN (SELECT id FROM test_user_ids);

-- Delete audit logs
DELETE FROM audit_logs WHERE actor_user_id IN (SELECT id FROM test_user_ids);

-- Delete notifications
DELETE FROM user_notifications WHERE user_id IN (SELECT id FROM test_user_ids);
DELETE FROM notifications WHERE user_id IN (SELECT id FROM test_user_ids);

-- Delete events
DELETE FROM events WHERE id IN (SELECT id FROM test_event_ids);

-- Delete organization subscriptions
DELETE FROM organization_subscriptions WHERE organization_id IN (SELECT id FROM test_org_ids);

-- Delete organizations
DELETE FROM organizations WHERE id IN (SELECT id FROM test_org_ids);

-- Finally delete users
DELETE FROM users WHERE id IN (SELECT id FROM test_user_ids);

-- Show results
SELECT '=== CLEANUP COMPLETE ===' as result;
SELECT COUNT(*) as remaining_users FROM users;

COMMIT;
