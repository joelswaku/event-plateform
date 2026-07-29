# Railway Production Database Migration Guide

## ⚠️ CRITICAL: Run All Migrations on Production

This guide will help you apply all database migrations to your Railway production database.

## Method 1: Railway Dashboard (Recommended)

### Step 1: Access Railway Database

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project: **event-plateform** (or similar)
3. Click on your **PostgreSQL** service
4. Click on the **Data** tab
5. Click **Open Postgres Database**

### Step 2: Run Migration SQL

1. Copy the entire contents of: `api/migrations/RUN_ON_RAILWAY_PRODUCTION.sql`
2. Paste into the Railway SQL query editor
3. Click **Execute** or **Run**
4. Verify no errors occurred

### Step 3: Verify Migrations

Run the verification queries at the bottom of the SQL file:

```sql
-- Check payment idempotency
SELECT column_name FROM information_schema.columns
WHERE table_name = 'ticket_orders' AND column_name = 'client_request_id';

-- Check event reminders
SELECT table_name FROM information_schema.tables
WHERE table_name = 'event_reminders';

-- Check reminder logs
SELECT table_name FROM information_schema.tables
WHERE table_name = 'reminder_logs';

-- Check webhook updated_at
SELECT column_name FROM information_schema.columns
WHERE table_name = 'webhook_events' AND column_name = 'updated_at';
```

All queries should return results. If any return empty, that migration failed.

## Method 2: Railway CLI

### Step 1: Login to Railway

```bash
railway login
```

### Step 2: Link to Production Project

```bash
cd C:/projects/event-plateform/api
railway link
# Select your project and production environment
```

### Step 3: Connect to Production Database

```bash
railway connect postgres
```

This opens a PostgreSQL terminal connected to production.

### Step 4: Run Migration File

From the Railway psql prompt:

```sql
\i migrations/RUN_ON_RAILWAY_PRODUCTION.sql
```

OR copy-paste the SQL directly.

### Step 5: Verify

```sql
\dt event_reminders
\dt reminder_logs
\d ticket_orders
\d webhook_events
```

## Method 3: Direct psql Connection

### Step 1: Get Database URL

From Railway dashboard:
1. Click PostgreSQL service
2. Click **Connect**
3. Copy the **Postgres Connection URL**

### Step 2: Connect with psql

```bash
psql "postgresql://postgres:PASSWORD@HOST:PORT/DATABASE"
```

Replace with your actual connection URL from Railway.

### Step 3: Run Migration

```sql
\i C:/projects/event-plateform/api/migrations/RUN_ON_RAILWAY_PRODUCTION.sql
```

## What These Migrations Add

### 1. Payment Idempotency (CRITICAL)
- Prevents duplicate charges from double-clicks
- Adds `client_request_id` to `ticket_orders` and `event_donations`
- **Why critical**: Without this, users can be charged twice

### 2. Event Reminders
- `event_reminders` table - Stores reminder configurations per event
- `reminder_logs` table - Tracks sent reminder emails
- **Features**: Instant confirmation, scheduled reminders (1hr, 24hr, etc.)

### 3. Webhook Tracking
- Adds `updated_at` to `webhook_events`
- **Why needed**: Track webhook retry attempts

### 4. Chat Moderation
- Adds flagging and reporting to chat messages
- Adds archive feature to conversations
- **Why needed**: Admin moderation tools

## Verification Checklist

After running migrations, verify:

- [ ] `ticket_orders` has `client_request_id` column
- [ ] `event_donations` has `client_request_id` column
- [ ] Unique indexes created on both tables
- [ ] `event_reminders` table exists with proper indexes
- [ ] `reminder_logs` table exists with proper indexes
- [ ] `webhook_events` has `updated_at` column and trigger
- [ ] `chat_messages` has moderation columns
- [ ] `chat_conversations` has archive columns

## Rollback (If Needed)

If anything goes wrong, you can rollback specific migrations:

```sql
-- Rollback payment idempotency
DROP INDEX IF EXISTS ticket_orders_event_request_id_unique;
DROP INDEX IF EXISTS event_donations_event_request_id_unique;
ALTER TABLE ticket_orders DROP COLUMN IF EXISTS client_request_id;
ALTER TABLE event_donations DROP COLUMN IF EXISTS client_request_id;

-- Rollback event reminders
DROP TABLE IF EXISTS reminder_logs CASCADE;
DROP TABLE IF EXISTS event_reminders CASCADE;

-- Rollback webhook updated_at
DROP TRIGGER IF EXISTS webhook_events_updated_at_trigger ON webhook_events;
DROP FUNCTION IF EXISTS update_webhook_events_updated_at();
ALTER TABLE webhook_events DROP COLUMN IF EXISTS updated_at;

-- Rollback chat moderation
ALTER TABLE chat_messages DROP COLUMN IF EXISTS flagged;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS reported_at;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS reported_by;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS report_reason;
ALTER TABLE chat_conversations DROP COLUMN IF EXISTS archived;
ALTER TABLE chat_conversations DROP COLUMN IF EXISTS archived_at;
```

## Important Notes

1. **Backup First**: Railway automatically backs up your database, but you can also create a manual backup before running migrations
2. **Zero Downtime**: All migrations use `IF NOT EXISTS` so they're safe to run multiple times
3. **No Data Loss**: All migrations are additive - they only add columns/tables, never remove data
4. **Production Safe**: Migrations use `ALTER TABLE ADD COLUMN IF NOT EXISTS` - safe for live databases

## After Migration

Once migrations are applied:

1. ✅ Payment idempotency protection is active
2. ✅ Event reminders system is ready
3. ✅ Webhook retry tracking is enabled
4. ✅ Chat moderation tools are available

## Need Help?

If you encounter errors:
1. Check Railway logs: `railway logs`
2. Check database connection: `railway connect postgres`
3. Verify environment variables are set correctly
4. Contact support with the specific error message

## Database Credentials Security

⚠️ **REMINDER**: After running migrations, make sure to:
1. Rotate the database password (credentials were in `secret.json` in Git history)
2. Update all services with new password
3. Purge `secret.json` from Git history

See `PRODUCTION_READY_STATUS.md` for full security checklist.
