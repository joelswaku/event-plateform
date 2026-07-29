# How to Compare DEV and PRODUCTION Database Schemas

## Quick Comparison Method

### Step 1: Run on DEV Database (Local)

```bash
cd C:/projects/event-plateform/api
psql -U postgres -d liteevent_dev -f migrations/FIND_SCHEMA_DIFFERENCES.sql > dev_schema.txt
```

### Step 2: Run on PRODUCTION Database (Railway)

**Option A: Railway Dashboard**
1. Go to Railway → PostgreSQL → Data tab
2. Copy contents of `migrations/FIND_SCHEMA_DIFFERENCES.sql`
3. Paste and execute
4. Copy the output and save to `prod_schema.txt`

**Option B: Railway CLI**
```bash
railway login
railway link  # Select your project
railway run psql $DATABASE_URL -f migrations/FIND_SCHEMA_DIFFERENCES.sql > prod_schema.txt
```

### Step 3: Compare the Outputs

```bash
# Windows
fc dev_schema.txt prod_schema.txt

# Or use VS Code
code --diff dev_schema.txt prod_schema.txt
```

## What to Look For

The script checks for:

### ✅ Critical Tables
- `ticket_orders`, `issued_tickets`
- `event_donations`
- `webhook_events`
- `event_reminders`, `reminder_logs`
- `chat_messages`, `chat_conversations`
- `planner_*` tables
- `auth_sessions`

### ✅ Critical Columns
- `ticket_orders.client_request_id` ⚠️ **Payment safety**
- `event_donations.client_request_id` ⚠️ **Payment safety**
- `webhook_events.updated_at`
- `chat_messages.flagged`, `reported_at`
- `chat_conversations.archived`
- `users.stripe_customer_id`, `subscription_id`, `is_subscribed`

### ✅ Critical Indexes
- `ticket_orders_event_request_id_unique` ⚠️ **Prevents double charges**
- `event_donations_event_request_id_unique`
- `idx_event_reminders_event_id`
- `idx_reminder_logs_*`

## Expected Output

### If Schemas Match ✅
```
=== CHECKING CRITICAL TABLES ===
NOTICE: ALL CRITICAL TABLES EXIST ✓

=== CHECKING CRITICAL COLUMNS ===
NOTICE: ALL CRITICAL COLUMNS EXIST ✓

=== CHECKING CRITICAL INDEXES ===
NOTICE: ALL CRITICAL INDEXES EXIST ✓
```

### If Production Missing Migrations ❌
```
=== CHECKING CRITICAL TABLES ===
NOTICE: MISSING TABLES: event_reminders, reminder_logs

=== CHECKING CRITICAL COLUMNS ===
NOTICE: MISSING COLUMNS: ticket_orders.client_request_id, webhook_events.updated_at

=== CHECKING CRITICAL INDEXES ===
NOTICE: MISSING INDEXES: ticket_orders_event_request_id_unique
```

## Fix Missing Items

If you see missing items in production:

1. **Run the migration file:**
   ```sql
   -- On Railway production
   \i migrations/RUN_ON_RAILWAY_PRODUCTION.sql
   ```

2. **Verify the fix:**
   ```sql
   -- Run the verification again
   \i migrations/FIND_SCHEMA_DIFFERENCES.sql
   ```

3. **Should now show:**
   ```
   ALL CRITICAL TABLES EXIST ✓
   ALL CRITICAL COLUMNS EXIST ✓
   ALL CRITICAL INDEXES EXIST ✓
   ```

## Detailed Comparison

For a full detailed comparison (all tables, all columns, all indexes):

```bash
# DEV
psql -U postgres -d liteevent_dev -f migrations/VERIFY_SCHEMA_MATCH.sql > dev_full_schema.txt

# PRODUCTION (via Railway)
railway run psql $DATABASE_URL -f migrations/VERIFY_SCHEMA_MATCH.sql > prod_full_schema.txt

# Compare
code --diff dev_full_schema.txt prod_full_schema.txt
```

This will show you:
- Every table
- Every column with data types
- Every index
- Every constraint
- Every trigger
- Row counts

## Common Issues

### Issue 1: client_request_id Missing
**Impact**: Users can be charged twice on double-click  
**Fix**: Run `RUN_ON_RAILWAY_PRODUCTION.sql`

### Issue 2: event_reminders Table Missing
**Impact**: Email reminders won't work  
**Fix**: Run `RUN_ON_RAILWAY_PRODUCTION.sql`

### Issue 3: webhook_events.updated_at Missing
**Impact**: Can't track webhook retry attempts  
**Fix**: Run `RUN_ON_RAILWAY_PRODUCTION.sql`

### Issue 4: Different Column Counts
**Cause**: Dev has newer migrations than production  
**Fix**: Run all missing migrations from `RUN_ON_RAILWAY_PRODUCTION.sql`

## Automation Script

Save this as `compare_schemas.sh`:

```bash
#!/bin/bash
echo "Comparing DEV and PRODUCTION schemas..."

# Run on DEV
psql -U postgres -d liteevent_dev -f api/migrations/FIND_SCHEMA_DIFFERENCES.sql > dev_schema.txt

# Run on PRODUCTION
railway run psql $DATABASE_URL -f api/migrations/FIND_SCHEMA_DIFFERENCES.sql > prod_schema.txt

# Compare
echo ""
echo "=== COMPARISON RESULT ==="
if diff dev_schema.txt prod_schema.txt > /dev/null; then
  echo "✅ DEV and PRODUCTION schemas match!"
else
  echo "❌ DIFFERENCES FOUND:"
  diff dev_schema.txt prod_schema.txt
  echo ""
  echo "Run: railway run psql \$DATABASE_URL -f api/migrations/RUN_ON_RAILWAY_PRODUCTION.sql"
fi
```

Make executable:
```bash
chmod +x compare_schemas.sh
./compare_schemas.sh
```

## Quick Check (Without Files)

One-liner to check if production needs migrations:

```bash
railway run psql $DATABASE_URL -c "SELECT 
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='ticket_orders' AND column_name='client_request_id') AS payment_safe,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='event_reminders') AS reminders_ready,
  EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='ticket_orders_event_request_id_unique') AS idempotency_protected;"
```

Should return:
```
 payment_safe | reminders_ready | idempotency_protected 
--------------+-----------------+----------------------
 t            | t               | t
```

If any show `f` (false), run migrations.
