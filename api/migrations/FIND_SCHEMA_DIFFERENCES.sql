-- ============================================================================
-- FIND SCHEMA DIFFERENCES BETWEEN DEV AND PRODUCTION
-- Run this on BOTH databases and compare the output
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLES THAT SHOULD EXIST
-- ============================================================================
\echo '=== CHECKING CRITICAL TABLES ==='

DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  t TEXT;
  tables_to_check TEXT[] := ARRAY[
    'users',
    'organizations',
    'events',
    'guests',
    'ticket_orders',
    'issued_tickets',
    'ticket_types',
    'event_donations',
    'webhook_events',
    'event_reminders',
    'reminder_logs',
    'chat_messages',
    'chat_conversations',
    'planner_projects',
    'planner_tasks',
    'planner_vendors',
    'planner_budget_items',
    'audit_logs',
    'auth_sessions',
    'notifications'
  ];
BEGIN
  FOREACH t IN ARRAY tables_to_check LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
      missing_tables := array_append(missing_tables, t);
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE 'MISSING TABLES: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE 'ALL CRITICAL TABLES EXIST ✓';
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: CRITICAL COLUMNS THAT SHOULD EXIST
-- ============================================================================
\echo '=== CHECKING CRITICAL COLUMNS ==='

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Payment idempotency
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ticket_orders' AND column_name = 'client_request_id') THEN
    missing_columns := array_append(missing_columns, 'ticket_orders.client_request_id');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_donations' AND column_name = 'client_request_id') THEN
    missing_columns := array_append(missing_columns, 'event_donations.client_request_id');
  END IF;

  -- Webhook tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_events' AND column_name = 'updated_at') THEN
    missing_columns := array_append(missing_columns, 'webhook_events.updated_at');
  END IF;

  -- Chat moderation
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'flagged') THEN
      missing_columns := array_append(missing_columns, 'chat_messages.flagged');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'reported_at') THEN
      missing_columns := array_append(missing_columns, 'chat_messages.reported_at');
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'archived') THEN
      missing_columns := array_append(missing_columns, 'chat_conversations.archived');
    END IF;
  END IF;

  -- User fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
    missing_columns := array_append(missing_columns, 'users.stripe_customer_id');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_id') THEN
    missing_columns := array_append(missing_columns, 'users.subscription_id');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_subscribed') THEN
    missing_columns := array_append(missing_columns, 'users.is_subscribed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'terms_accepted_at') THEN
    missing_columns := array_append(missing_columns, 'users.terms_accepted_at');
  END IF;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE NOTICE 'MISSING COLUMNS: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'ALL CRITICAL COLUMNS EXIST ✓';
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: CRITICAL INDEXES
-- ============================================================================
\echo '=== CHECKING CRITICAL INDEXES ==='

DO $$
DECLARE
  missing_indexes TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ticket_orders_event_request_id_unique') THEN
    missing_indexes := array_append(missing_indexes, 'ticket_orders_event_request_id_unique');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'event_donations_event_request_id_unique') THEN
    missing_indexes := array_append(missing_indexes, 'event_donations_event_request_id_unique');
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_reminders') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_reminders_event_id') THEN
      missing_indexes := array_append(missing_indexes, 'idx_event_reminders_event_id');
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reminder_logs') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reminder_logs_guest_id') THEN
      missing_indexes := array_append(missing_indexes, 'idx_reminder_logs_guest_id');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reminder_logs_event_id') THEN
      missing_indexes := array_append(missing_indexes, 'idx_reminder_logs_event_id');
    END IF;
  END IF;

  IF array_length(missing_indexes, 1) > 0 THEN
    RAISE NOTICE 'MISSING INDEXES: %', array_to_string(missing_indexes, ', ');
  ELSE
    RAISE NOTICE 'ALL CRITICAL INDEXES EXIST ✓';
  END IF;
END $$;

-- ============================================================================
-- SECTION 4: TABLE COUNT COMPARISON
-- ============================================================================
\echo '=== TABLE COUNTS ==='

SELECT
  COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- ============================================================================
-- SECTION 5: LIST ALL TABLES (for manual comparison)
-- ============================================================================
\echo '=== ALL TABLES IN DATABASE ==='

SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- SECTION 6: COLUMN COUNT PER TABLE
-- ============================================================================
\echo '=== COLUMN COUNTS PER TABLE ==='

SELECT
  table_name,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- SECTION 7: DETAILED COLUMN INFO FOR CRITICAL TABLES
-- ============================================================================
\echo '=== TICKET_ORDERS COLUMNS ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ticket_orders'
ORDER BY ordinal_position;

\echo '=== EVENT_DONATIONS COLUMNS ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'event_donations'
ORDER BY ordinal_position;

\echo '=== WEBHOOK_EVENTS COLUMNS ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'webhook_events'
ORDER BY ordinal_position;

\echo '=== EVENT_REMINDERS COLUMNS ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'event_reminders'
ORDER BY ordinal_position;

\echo '=== USERS COLUMNS (subscription fields) ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'stripe_customer_id',
    'subscription_id',
    'subscription_plan',
    'subscription_status',
    'subscription_current_period_end',
    'is_subscribed',
    'terms_accepted_at'
  )
ORDER BY ordinal_position;

-- ============================================================================
-- DONE - Save this output and compare DEV vs PRODUCTION
-- ============================================================================
