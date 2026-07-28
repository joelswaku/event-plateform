# Railway Production Deployment - Reminder System

## ⚠️ CRITICAL: Schema Mismatch Detected

**Railway production database is MISSING the reminder system tables!**

### Database Comparison Results

| Component | Local Dev | Railway Prod | Status |
|-----------|-----------|--------------|--------|
| `event_reminders` | ✅ EXISTS | ❌ MISSING | **BLOCKER** |
| `reminder_logs` | ✅ EXISTS | ❌ MISSING | **BLOCKER** |
| Total tables | 90 | 90 | Same count |

**Railway has**: `reminders` table (old/unused by current code)  
**Code expects**: `event_reminders` + `reminder_logs` tables

### What This Means

❌ **Deploying the code now will cause IMMEDIATE production errors:**
- All reminder API calls will fail with "table does not exist"
- Cron job will crash every minute
- RSVP confirmations will fail

## CORRECTED Deployment Steps

### Step 1: Create Reminder Tables in Railway (REQUIRED)

Run the comprehensive migration that creates tables + constraints in one go:

```bash
# Get Railway database URL
cd api
export RAILWAY_DB=$(railway run --service api printenv DATABASE_URL | grep postgresql)

# Run comprehensive migration
psql "$RAILWAY_DB" -f migrations/railway_reminder_setup.sql
```

**Expected Output:**
```
NOTICE:  Starting reminder system migration...
NOTICE:  Created table: event_reminders
NOTICE:  Created table: reminder_logs
NOTICE:  Created index: idx_event_reminders_event_id
NOTICE:  Created index: idx_event_reminders_enabled
NOTICE:  Created index: idx_reminder_logs_event_id
NOTICE:  Created index: idx_reminder_logs_reminder_id
NOTICE:  Created index: idx_reminder_logs_guest_id
NOTICE:  Added constraint: event_reminders_event_id_timing_key
NOTICE:  Added constraint: reminder_logs_event_reminder_guest_key
NOTICE:  Reminder system migration completed successfully!
```

### Step 2: Verify Migration Success

```bash
# Check tables exist
psql "$RAILWAY_DB" -c "\dt event_reminders"
psql "$RAILWAY_DB" -c "\dt reminder_logs"

# Check constraints exist
psql "$RAILWAY_DB" -c "SELECT conname FROM pg_constraint WHERE conname LIKE '%reminder%'"
```

Expected constraints:
- `event_reminders_event_id_timing_key`
- `reminder_logs_event_reminder_guest_key`

### Step 3: Set CRON_SECRET

```bash
# Generate secure token
CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set in Railway
railway variables --set CRON_SECRET=$CRON_SECRET --service api

# Save token for step 5
echo "CRON_SECRET=$CRON_SECRET" >> .railway-cron-secret.txt
echo "⚠️ SAVE THIS TOKEN - needed for cron job configuration"
```

### Step 4: Deploy Code to Railway

```bash
# Commit changes (if not already done)
git add .
git commit -m "feat: production-ready reminder system with fixes"

# Push to trigger Railway deployment
git push origin main
```

### Step 5: Configure Railway Cron Job

1. Go to Railway Dashboard → Your Project → Crons
2. Find or create the `/api/cron/reminders` cron job
3. Set schedule: `*/1 * * * *` (every minute)
4. Update command to include auth:

```bash
curl -X POST https://api.liteevent.com/api/cron/reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Note**: Railway will substitute `$CRON_SECRET` with the environment variable automatically

### Step 6: Verification

#### 6.1 Check Tables
```bash
psql "$RAILWAY_DB" -c "SELECT COUNT(*) FROM event_reminders"
psql "$RAILWAY_DB" -c "SELECT COUNT(*) FROM reminder_logs"
```

#### 6.2 Test Unauthorized Request (Should Fail)
```bash
curl -X POST https://api.liteevent.com/api/cron/reminders
# Expected: {"success":false,"error":"Unauthorized"}
```

#### 6.3 Test Authorized Request (Should Succeed)
```bash
curl -X POST https://api.liteevent.com/api/cron/reminders \
  -H "Authorization: Bearer <your-CRON_SECRET>"
# Expected: {"success":true,"sent":0,"message":"No reminders due"}
```

#### 6.4 Monitor Railway Logs
```bash
railway logs --service api --follow
```

Look for:
```
[Reminders] Starting reminder check...
[Reminders] Found 0 reminders to send
[Reminders] Completed. Sent: 0, Failed: 0
```

#### 6.5 Check for Errors
```bash
# Check for failed sends
psql "$RAILWAY_DB" -c "SELECT * FROM reminder_logs WHERE status = 'failed' LIMIT 5"

# Check cron is running
psql "$RAILWAY_DB" -c "SELECT MAX(created_at) FROM reminder_logs"
```

## Migration File Details

### File: `migrations/railway_reminder_setup.sql`

This comprehensive migration:
- ✅ Creates `event_reminders` table
- ✅ Creates `reminder_logs` table  
- ✅ Creates all necessary indexes
- ✅ Adds unique constraints for atomic operations
- ✅ Seeds default instant reminders for existing events
- ✅ Idempotent (safe to run multiple times)

## Rollback Plan

If deployment fails:

1. **Disable cron immediately**:
   ```bash
   # In Railway dashboard, pause the cron job
   ```

2. **Check logs for errors**:
   ```bash
   railway logs --service api --tail 100
   ```

3. **Rollback code** (if needed):
   ```bash
   git revert HEAD
   git push origin main
   ```

4. **Keep database tables**: The migration is safe and should NOT be rolled back. Tables are ready for next deployment.

## Common Issues

### Issue: "relation event_reminders does not exist"
**Cause**: Migration not run  
**Fix**: Run `railway_reminder_setup.sql` migration

### Issue: Cron returns 401
**Cause**: Token mismatch or not configured  
**Fix**: Verify `CRON_SECRET` in Railway variables matches cron command

### Issue: "duplicate key value violates unique constraint"
**Cause**: Duplicate data (unlikely on first run)  
**Fix**: Migration automatically removes duplicates - re-run it

## Post-Deployment Monitoring

Check these daily for first week:

```bash
# Failed send count
psql "$RAILWAY_DB" -c "SELECT COUNT(*) FROM reminder_logs WHERE status = 'failed'"

# Recent sends
psql "$RAILWAY_DB" -c "SELECT COUNT(*), DATE(created_at) FROM reminder_logs GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 7"

# Duplicate detection working
psql "$RAILWAY_DB" -c "SELECT COUNT(*) FROM (SELECT event_id, reminder_id, guest_id, COUNT(*) as dups FROM reminder_logs GROUP BY event_id, reminder_id, guest_id HAVING COUNT(*) > 1) t"
```

Expected:
- Failed count: Low (< 1% of sends)
- Sends per day: Increasing as events are scheduled
- Duplicates: **0** (atomic insert prevents this)

## Files Changed

- `api/services/reminder.service.js` - Error handling, timezone, atomic inserts
- `api/controllers/reminders.controller.js` - Upsert pattern
- `api/services/guests.service.js` - Instant reminder for invitation RSVPs
- `api/routes/cron.routes.js` - Authentication
- `api/migrations/railway_reminder_setup.sql` - **NEW** Comprehensive Railway migration

## Summary

**Before Code Deploy**:
1. ✅ Run `railway_reminder_setup.sql` migration
2. ✅ Set `CRON_SECRET` environment variable
3. ✅ Verify tables exist

**After Code Deploy**:
1. ✅ Update cron job with auth token
2. ✅ Test unauthorized returns 401
3. ✅ Monitor logs for cron execution
4. ✅ Check for failed sends

**DO NOT** deploy code before running the migration - it will cause production errors.
