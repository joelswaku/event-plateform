-- ============================================================================
-- DATABASE SCHEMA VERIFICATION
-- Compare this output between DEV and PRODUCTION to find mismatches
-- ============================================================================

-- ============================================================================
-- 1. LIST ALL TABLES
-- ============================================================================
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 2. LIST ALL COLUMNS WITH TYPES
-- ============================================================================
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 3. LIST ALL INDEXES
-- ============================================================================
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. LIST ALL CONSTRAINTS
-- ============================================================================
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================================
-- 5. LIST ALL TRIGGERS
-- ============================================================================
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 6. LIST ALL FUNCTIONS
-- ============================================================================
SELECT
  routine_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================================================
-- 7. CRITICAL TABLES CHECK
-- Check if all critical tables exist
-- ============================================================================
SELECT
  'ticket_orders' AS table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_orders') AS exists;

SELECT
  'event_donations' AS table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_donations') AS exists;

SELECT
  'event_reminders' AS table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_reminders') AS exists;

SELECT
  'reminder_logs' AS table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reminder_logs') AS exists;

SELECT
  'webhook_events' AS table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_events') AS exists;

SELECT
  'chat_messages' AS table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') AS exists;

SELECT
  'chat_conversations' AS table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_conversations') AS exists;

-- ============================================================================
-- 8. CRITICAL COLUMNS CHECK
-- Check if critical columns exist
-- ============================================================================
SELECT
  'ticket_orders.client_request_id' AS column_check,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_orders' AND column_name = 'client_request_id'
  ) AS exists;

SELECT
  'event_donations.client_request_id' AS column_check,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_donations' AND column_name = 'client_request_id'
  ) AS exists;

SELECT
  'webhook_events.updated_at' AS column_check,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_events' AND column_name = 'updated_at'
  ) AS exists;

SELECT
  'chat_messages.flagged' AS column_check,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'flagged'
  ) AS exists;

SELECT
  'chat_conversations.archived' AS column_check,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_conversations' AND column_name = 'archived'
  ) AS exists;

-- ============================================================================
-- 9. CRITICAL INDEXES CHECK
-- ============================================================================
SELECT
  'ticket_orders_event_request_id_unique' AS index_name,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'ticket_orders_event_request_id_unique'
  ) AS exists;

SELECT
  'event_donations_event_request_id_unique' AS index_name,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'event_donations_event_request_id_unique'
  ) AS exists;

SELECT
  'idx_event_reminders_event_id' AS index_name,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_event_reminders_event_id'
  ) AS exists;

SELECT
  'idx_reminder_logs_guest_id' AS index_name,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_reminder_logs_guest_id'
  ) AS exists;

-- ============================================================================
-- 10. TABLE ROW COUNTS (to verify data exists)
-- ============================================================================
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users;
SELECT 'events' AS table_name, COUNT(*) AS row_count FROM events;
SELECT 'guests' AS table_name, COUNT(*) AS row_count FROM guests;
SELECT 'ticket_orders' AS table_name, COUNT(*) AS row_count FROM ticket_orders;
SELECT 'issued_tickets' AS table_name, COUNT(*) AS row_count FROM issued_tickets;
SELECT 'webhook_events' AS table_name, COUNT(*) AS row_count FROM webhook_events;
SELECT 'event_reminders' AS table_name, COUNT(*) AS row_count FROM event_reminders;

-- ============================================================================
-- 11. QUICK SCHEMA SUMMARY
-- ============================================================================
SELECT
  'Total Tables' AS metric,
  COUNT(*) AS value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT
  'Total Indexes' AS metric,
  COUNT(*) AS value
FROM pg_indexes
WHERE schemaname = 'public';

SELECT
  'Total Constraints' AS metric,
  COUNT(*) AS value
FROM information_schema.table_constraints
WHERE table_schema = 'public';

SELECT
  'Total Triggers' AS metric,
  COUNT(*) AS value
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- ============================================================================
-- DONE - Compare output between DEV and PRODUCTION
-- Any differences indicate missing migrations
-- ============================================================================
