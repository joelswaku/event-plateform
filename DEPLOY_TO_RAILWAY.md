# Deploy Reminder System to Railway - READY NOW

## ✅ Status: PRODUCTION READY

The reminder system now uses the **same email infrastructure** as your working signup, password reset, and RSVP emails.

- ✅ Uses `sendMail` helper (Resend → Brevo → Nodemailer fallback)
- ✅ Same `MAIL_FROM_EMAIL` and `MAIL_FROM_NAME` as existing system
- ✅ Works with Brevo SMTP (already configured in Railway)
- ✅ All 6 production blockers fixed
- ✅ Tested locally with real email delivery

## 🚀 Deploy Now (3 Steps)

### Step 1: Run Railway Migration (5 minutes)

```bash
# Get Railway database URL
cd api
railway run --service api printenv DATABASE_URL > /tmp/railway_db.txt

# Run migration
psql $(cat /tmp/railway_db.txt | grep postgresql) -f migrations/railway_reminder_setup.sql
```

**Expected output:**
```
NOTICE:  Starting reminder system migration...
NOTICE:  Created table: event_reminders
NOTICE:  Created table: reminder_logs
...
NOTICE:  Reminder system migration completed successfully!
```

**Verify tables exist:**
```bash
psql $(cat /tmp/railway_db.txt | grep postgresql) -c "\dt event_reminders"
psql $(cat /tmp/railway_db.txt | grep postgresql) -c "\dt reminder_logs"
```

### Step 2: Set CRON_SECRET (2 minutes)

```bash
# Generate secure token
CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set in Railway
railway variables --set CRON_SECRET=$CRON_SECRET --service api

# Save for step 3
echo "$CRON_SECRET" > .railway-cron-secret.txt
echo "✅ CRON_SECRET saved to .railway-cron-secret.txt"
```

### Step 3: Deploy Code (1 minute)

```bash
# Commit and push
git add .
git commit -m "feat: production-ready reminder system with Brevo email"
git push origin main

# Railway will auto-deploy
```

### Step 4: Configure Railway Cron Job (2 minutes)

1. Go to Railway Dashboard → Your Project → Crons
2. Create or edit `/api/cron/reminders` cron job
3. **Schedule**: `*/1 * * * *` (every minute)
4. **Command**:
   ```bash
   curl -X POST https://api.liteevent.com/api/cron/reminders \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

**Note**: Railway will substitute `$CRON_SECRET` with the environment variable automatically.

## ✅ Verify Deployment (5 minutes)

### 1. Test Unauthorized Request (Should Fail)
```bash
curl -X POST https://api.liteevent.com/api/cron/reminders
```
**Expected**: `{"success":false,"error":"Unauthorized"}`

### 2. Test Authorized Request (Should Succeed)
```bash
curl -X POST https://api.liteevent.com/api/cron/reminders \
  -H "Authorization: Bearer $(cat .railway-cron-secret.txt)"
```
**Expected**: `{"success":true,"sent":0,"message":"No reminders due"}`

### 3. Check Railway Logs
```bash
railway logs --service api --tail 50 | grep Reminders
```
**Expected**: `[Reminders] Starting reminder check...`

### 4. Verify Database
```bash
railway run --service api -- psql $DATABASE_URL -c "SELECT COUNT(*) FROM event_reminders"
railway run --service api -- psql $DATABASE_URL -c "SELECT COUNT(*) FROM reminder_logs"
```

## 📧 Email Configuration (Already Working!)

The reminder system uses your **existing email setup**:

| Variable | Value | Status |
|----------|-------|--------|
| `RESEND_API_KEY` | `re_VAe6ZEMr...` | ✅ Set in Railway |
| `BREVO_SMTP_KEY` | `xsmtpsib-96ba...` | ✅ Set in Railway |
| `MAIL_FROM_EMAIL` | `noreply@liteevent.com` | ✅ Set in Railway |
| `MAIL_FROM_NAME` | `LiteEvent` | ✅ Set in Railway |

**Email flow**:
1. Try Resend first (if domain verified)
2. Fall back to **Brevo SMTP** (your current working system)
3. Fall back to Nodemailer (if needed)

## 🎯 What Happens After Deploy

Once deployed and cron is configured:

1. **Every minute**, Railway cron calls `/api/cron/reminders`
2. System checks for due reminders (instant, 1 hour before, 24 hours before, etc.)
3. Sends emails via **Brevo SMTP** (same as signup/password reset emails)
4. Logs all sends in `reminder_logs` table
5. Prevents duplicates with atomic database constraints

## 📊 Monitoring

### Check for Failed Sends
```bash
railway run --service api -- psql $DATABASE_URL -c \
  "SELECT COUNT(*) FROM reminder_logs WHERE status = 'failed'"
```

### Check for Duplicates (Should be 0)
```bash
railway run --service api -- psql $DATABASE_URL -c "
  SELECT COUNT(*) FROM (
    SELECT event_id, reminder_id, guest_id, COUNT(*) as cnt 
    FROM reminder_logs 
    GROUP BY event_id, reminder_id, guest_id 
    HAVING COUNT(*) > 1
  ) t
"
```

### Recent Reminder Activity
```bash
railway run --service api -- psql $DATABASE_URL -c \
  "SELECT status, COUNT(*), MAX(created_at) 
   FROM reminder_logs 
   WHERE created_at > NOW() - INTERVAL '24 hours' 
   GROUP BY status"
```

## 🔧 Rollback Plan

If issues occur:

1. **Disable cron**: Go to Railway dashboard → Crons → Pause the reminder cron job
2. **Check logs**: `railway logs --service api --tail 100`
3. **Rollback code**: `git revert HEAD && git push`
4. **Keep database**: Migration is safe and should NOT be rolled back

## 🎉 Summary

**Current Status**:
- ✅ Code ready (uses existing email system)
- ✅ Tested locally with real email delivery
- ✅ All fixes verified
- ⏳ Pending: Railway migration + CRON_SECRET + deploy

**Time to deploy**: ~15 minutes total

**Risk level**: Low (uses existing working email infrastructure)

---

## Quick Deploy Commands (Copy-Paste)

```bash
# 1. Run migration
cd api
RAILWAY_DB=$(railway run --service api printenv DATABASE_URL | grep postgresql)
psql "$RAILWAY_DB" -f migrations/railway_reminder_setup.sql

# 2. Set CRON_SECRET
CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables --set CRON_SECRET=$CRON_SECRET --service api
echo "$CRON_SECRET" > .railway-cron-secret.txt

# 3. Deploy
git add .
git commit -m "feat: production-ready reminder system"
git push origin main

# 4. Test after deploy
curl -X POST https://api.liteevent.com/api/cron/reminders \
  -H "Authorization: Bearer $(cat .railway-cron-secret.txt)"
```

Then configure the cron job in Railway dashboard with the command from Step 4 above.
