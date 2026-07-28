# Railway Cron Job Setup - FINAL STEP

## ⚠️ Manual Step Required

Railway cron jobs must be configured through the dashboard.

## 📋 Configuration Details

### Cron Schedule
```
*/1 * * * *
```
(This means: every 1 minute)

### Cron Command
```bash
curl -X POST https://api.liteevent.com/api/cron/reminders -H "Authorization: Bearer $CRON_SECRET"
```

**Important**: Railway will automatically substitute `$CRON_SECRET` with the environment variable.

## 🔧 Setup Steps

1. **Go to Railway Dashboard**
   - Open: https://railway.app/project/4bbc96a8-25e0-4e46-8194-579788d89501

2. **Navigate to Crons**
   - Click on your project → "Crons" tab (or create if not exists)

3. **Create/Edit Cron Job**
   - Click "+ New Cron" (or edit existing `/api/cron/reminders`)
   - **Name**: `reminder-cron` (or any name you prefer)
   - **Schedule**: `*/1 * * * *`
   - **Command**: 
     ```bash
     curl -X POST https://api.liteevent.com/api/cron/reminders -H "Authorization: Bearer $CRON_SECRET"
     ```

4. **Save**
   - Click "Save" or "Create"
   - Cron will start running immediately

## ✅ After Configuration

The cron job will:
- Run every 1 minute
- Call `/api/cron/reminders` endpoint
- Include the `CRON_SECRET` for authentication
- Process any due reminders
- Send emails via Brevo SMTP (same as your other emails)

## 🔍 Verify It's Working

After 2-3 minutes, check:

```bash
# From your terminal
cd api

# Check Railway logs for cron execution
railway logs --service api --tail 50 | grep Reminders

# Should see:
# [Reminders] Starting reminder check...
# [Reminders] Found 0 reminders to send (or more if reminders are due)
```

## 📊 Test the Endpoint

### Test 1: Without Auth (Should Fail)
```bash
curl -X POST https://api.liteevent.com/api/cron/reminders
```
**Expected**: `{"success":false,"error":"Unauthorized"}`

### Test 2: With Auth (Should Succeed)
```bash
curl -X POST https://api.liteevent.com/api/cron/reminders \
  -H "Authorization: Bearer 365f962c8768456c828d216fdbdf1d17307baf592b6be2816bc176ab7ae8f31a"
```
**Expected**: `{"success":true,"sent":0,"message":"No reminders due"}`

---

## 🎉 Once Configured - YOU'RE DONE!

The reminder system will:
- ✅ Check for due reminders every minute
- ✅ Send emails via your working Brevo SMTP
- ✅ Prevent duplicates automatically
- ✅ Log all sends to database
- ✅ Handle errors gracefully

No further action needed - it just works! 🚀
