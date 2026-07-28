# Production Ready Checklist - Reminder System

## ✅ Code Fixes Complete

All 6 production blockers have been fixed and tested:

| Fix | Status | Verified |
|-----|--------|----------|
| 1. Resend error handling | ✅ Complete | Errors logged as 'failed' |
| 2. Cascade-delete prevention | ✅ Complete | Upsert pattern preserves logs |
| 3. Invitation RSVP instant reminders | ✅ Complete | Uses sendInstantReminder |
| 4. Timezone formatting | ✅ Complete | Event timezone fetched & used |
| 5. Cron authentication | ✅ Complete | CRON_SECRET middleware |
| 6. Atomic duplicate prevention | ✅ Complete | INSERT...ON CONFLICT tested |

## ✅ Local Testing Complete

- [x] Migration runs successfully on local database
- [x] Unique constraints created (`event_reminders_event_id_timing_key`, `reminder_logs_event_reminder_guest_key`)
- [x] Real email sent to joelswaku@gmail.com
- [x] Duplicate prevention tested and working
- [x] Error handling tested with invalid domain
- [x] Database logs created correctly

## 📋 Pre-Deployment Requirements

### 1. Verify Domain in Resend (CRITICAL)

**liteevent.com must be verified before deploying**

1. Go to https://resend.com/domains
2. Check if `liteevent.com` is listed and verified
3. If not verified:
   - Add DNS records (SPF, DKIM)
   - Wait for verification (usually < 5 minutes)

**Current status**: Project uses `noreply@liteevent.com` already configured in `MAIL_FROM_EMAIL`

### 2. Railway Database Migration

Run on Railway production database:

```bash
# Get Railway database URL
cd api
export RAILWAY_DB=$(railway run --service api printenv DATABASE_URL | grep postgresql)

# Run comprehensive migration (creates tables + constraints)
psql "$RAILWAY_DB" -f migrations/railway_reminder_setup.sql
```

**Expected output**:
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

### 3. Set CRON_SECRET in Railway

```bash
# Generate secure token
CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set in Railway
railway variables --set CRON_SECRET=$CRON_SECRET --service api

# Save for cron configuration
echo "CRON_SECRET=$CRON_SECRET" > .railway-cron-secret.txt
```

## 🚀 Deployment Steps

### Step 1: Verify Resend Domain ⚠️ CRITICAL
- [ ] Confirm `liteevent.com` is verified at resend.com/domains
- [ ] Test send from Railway: `railway run --service api node test-send-reminder.js YOUR_EMAIL`

### Step 2: Run Railway Migration
- [ ] Run `railway_reminder_setup.sql` on Railway database
- [ ] Verify tables exist: `psql "$RAILWAY_DB" -c "\dt event_reminders"`
- [ ] Verify constraints: `psql "$RAILWAY_DB" -c "SELECT conname FROM pg_constraint WHERE conname LIKE '%reminder%'"`

### Step 3: Set CRON_SECRET
- [ ] Generate and set `CRON_SECRET` in Railway environment
- [ ] Save token for step 5

### Step 4: Deploy Code
```bash
git add .
git commit -m "feat: production-ready reminder system"
git push origin main
```

### Step 5: Configure Railway Cron Job

In Railway Dashboard → Crons:

**Schedule**: `*/1 * * * *` (every minute)

**Command**:
```bash
curl -X POST https://api.liteevent.com/api/cron/reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

## ✅ Post-Deployment Verification

### Immediate Checks (Within 5 Minutes)

1. **Test unauthorized request (should fail)**:
   ```bash
   curl -X POST https://api.liteevent.com/api/cron/reminders
   # Expected: {"success":false,"error":"Unauthorized"}
   ```

2. **Test authorized request (should succeed)**:
   ```bash
   curl -X POST https://api.liteevent.com/api/cron/reminders \
     -H "Authorization: Bearer <CRON_SECRET>"
   # Expected: {"success":true,"sent":0,"message":"No reminders due"}
   ```

3. **Check Railway logs**:
   ```bash
   railway logs --service api --tail 50
   ```
   Look for: `[Reminders] Starting reminder check...`

4. **Verify tables**:
   ```bash
   psql "$RAILWAY_DB" -c "SELECT COUNT(*) FROM event_reminders"
   psql "$RAILWAY_DB" -c "SELECT COUNT(*) FROM reminder_logs"
   ```

### Monitoring (First 24 Hours)

1. **Check for failed sends**:
   ```bash
   psql "$RAILWAY_DB" -c "SELECT COUNT(*) FROM reminder_logs WHERE status = 'failed'"
   ```

2. **Verify no duplicates**:
   ```bash
   psql "$RAILWAY_DB" -c "
     SELECT COUNT(*) FROM (
       SELECT event_id, reminder_id, guest_id, COUNT(*) as dups 
       FROM reminder_logs 
       GROUP BY event_id, reminder_id, guest_id 
       HAVING COUNT(*) > 1
     ) t
   "
   # Expected: 0
   ```

3. **Check cron execution frequency**:
   ```bash
   psql "$RAILWAY_DB" -c "
     SELECT DATE_TRUNC('minute', created_at) as minute, COUNT(*) 
     FROM reminder_logs 
     WHERE created_at > NOW() - INTERVAL '1 hour' 
     GROUP BY DATE_TRUNC('minute', created_at) 
     ORDER BY minute DESC
   "
   ```

4. **Monitor Railway logs for errors**:
   ```bash
   railway logs --service api --follow | grep -i "reminder\|error\|failed"
   ```

## 🔧 Configuration

### Environment Variables (Already Set)

| Variable | Local | Railway | Purpose |
|----------|-------|---------|---------|
| `RESEND_API_KEY` | ✅ Set | ✅ Set | Resend API authentication |
| `MAIL_FROM_EMAIL` | ✅ `noreply@liteevent.com` | ✅ `noreply@liteevent.com` | Sender email address |
| `MAIL_FROM_NAME` | Optional | Optional | Sender display name |
| `CRON_SECRET` | ⚠️ Optional (dev) | ❌ **MUST SET** | Cron endpoint auth |

### Files Changed

- ✅ `api/services/reminder.service.js` - All 6 fixes implemented
- ✅ `api/controllers/reminders.controller.js` - Upsert pattern
- ✅ `api/services/guests.service.js` - Invitation RSVP support
- ✅ `api/routes/cron.routes.js` - Authentication middleware
- ✅ `api/migrations/railway_reminder_setup.sql` - Comprehensive migration

### New Files

- ✅ `api/migrations/railway_reminder_setup.sql` - Production migration
- ✅ `api/test-send-reminder.js` - Test script
- ✅ `api/test-duplicate-prevention.js` - Duplicate test
- ✅ `RAILWAY_DEPLOYMENT_FINAL.md` - Detailed deployment guide
- ✅ `PRODUCTION_READY_CHECKLIST.md` - This file

## 🎯 Success Criteria

The reminder system is production-ready when:

- [x] All code fixes complete and tested locally
- [x] Local database migration successful
- [x] Real email sent and received
- [x] Duplicate prevention verified
- [ ] Resend domain verified
- [ ] Railway database migration complete
- [ ] `CRON_SECRET` set in Railway
- [ ] Code deployed to Railway
- [ ] Cron job configured with auth
- [ ] Unauthorized requests return 401
- [ ] Authorized requests succeed
- [ ] No duplicates in production logs
- [ ] Failed sends < 1% of total

## 📞 Support

If issues occur:

1. Check Railway logs: `railway logs --service api`
2. Check Resend dashboard: https://resend.com/emails
3. Check database logs: `SELECT * FROM reminder_logs WHERE status = 'failed'`
4. Rollback: Disable cron job in Railway dashboard

## 🎉 Summary

**Code Status**: ✅ Production Ready  
**Local Testing**: ✅ Complete  
**Railway Deployment**: ⚠️ Pending (follow steps above)

Next action: Verify `liteevent.com` domain in Resend, then run Railway migration.
