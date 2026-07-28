# Railway Deployment Guide - Reminder System Fixes

## Pre-Deployment Checklist

### 1. Run Database Migration

The migration adds unique constraints needed by the code. **Must run before deploying code.**

```bash
# Get your Railway PostgreSQL connection string
railway variables --service postgres

# Run migration
psql $DATABASE_URL -f api/migrations/add_unique_constraint_event_reminders.sql
```

Expected output:
```
NOTICE:  Added constraint: event_reminders_event_id_timing_key
NOTICE:  Added constraint: reminder_logs_event_reminder_guest_key
DO
```

If you run it again (safe to do):
```
NOTICE:  Constraint already exists: event_reminders_event_id_timing_key
NOTICE:  Constraint already exists: reminder_logs_event_reminder_guest_key
DO
```

### 2. Set CRON_SECRET Environment Variable

```bash
# Generate a secure random token
railway run node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set it in Railway
railway variables --set CRON_SECRET=<generated-token>
```

Or via Railway dashboard:
1. Go to your project → Variables
2. Add `CRON_SECRET` with a secure random value
3. Redeploy

### 3. Update Railway Cron Job

In Railway dashboard → Cron Jobs → Edit `/api/cron/reminders`:

**Old** (insecure):
```
*/1 * * * * curl -X POST https://your-api.railway.app/api/cron/reminders
```

**New** (with auth):
```bash
*/1 * * * * curl -X POST https://your-api.railway.app/api/cron/reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

Or using query parameter:
```bash
*/1 * * * * curl -X POST "https://your-api.railway.app/api/cron/reminders?token=$CRON_SECRET"
```

## Deployment Steps

1. **Run migration first** (see above)
2. **Set CRON_SECRET** (see above)
3. **Deploy code** to Railway (push to main branch or manual deploy)
4. **Update cron job** with auth token (see above)
5. **Verify** cron endpoint returns 401 without token:
   ```bash
   curl -X POST https://your-api.railway.app/api/cron/reminders
   # Should return: {"success":false,"error":"Unauthorized"}
   ```

## Local Testing

### 1. Start Local Server

```bash
cd api
npm install
npm start
```

### 2. Test Cron Endpoint (No Auth in Dev)

```bash
# Should work without CRON_SECRET in development
curl -X POST http://localhost:8080/api/cron/reminders

# Response:
# {"success":true,"sent":0,"message":"No reminders due"}
```

### 3. Test With CRON_SECRET

```bash
# Set in .env
echo "CRON_SECRET=test-secret-123" >> api/.env

# Restart server, then test
curl -X POST http://localhost:8080/api/cron/reminders \
  -H "Authorization: Bearer test-secret-123"

# Should succeed
```

### 4. Test Unauthorized Request

```bash
curl -X POST http://localhost:8080/api/cron/reminders \
  -H "Authorization: Bearer wrong-token"

# Should return 401:
# {"success":false,"error":"Unauthorized"}
```

## Verification Checklist

After deployment:

- [ ] Migration ran successfully (check constraints exist)
- [ ] `CRON_SECRET` is set in Railway environment
- [ ] Cron job updated to include auth token
- [ ] Unauthorized requests to `/api/cron/reminders` return 401
- [ ] Authorized cron requests succeed
- [ ] Check Railway logs for `[Reminders]` entries every minute
- [ ] Verify no duplicate sends in `reminder_logs` table
- [ ] Check for failed sends: `SELECT * FROM reminder_logs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10`

## Rollback Plan

If issues occur after deployment:

1. **Immediate**: Disable cron job in Railway dashboard
2. **Investigate**: Check Railway logs for errors
3. **Fix**: Roll back code deployment if needed
4. **Note**: Migration does NOT need to be rolled back (it's safe and only adds constraints)

## Common Issues

### Issue: "duplicate key value violates unique constraint"

**Cause**: Duplicate data exists before migration ran  
**Fix**: The migration automatically removes duplicates. Re-run it:
```bash
psql $DATABASE_URL -f api/migrations/add_unique_constraint_event_reminders.sql
```

### Issue: Cron returns "Cron authentication not configured"

**Cause**: `CRON_SECRET` not set in production  
**Fix**: Set the environment variable in Railway:
```bash
railway variables --set CRON_SECRET=<secure-random-token>
```

### Issue: All cron requests return 401

**Cause**: Railway cron job not updated with token  
**Fix**: Add `-H "Authorization: Bearer $CRON_SECRET"` to curl command in cron config

## Monitoring

Watch for these log patterns:

✅ **Good**:
```
[Reminders] Starting reminder check...
[Reminders] Found 0 reminders to send
[Reminders] Completed. Sent: 0, Failed: 0
```

✅ **Expected** (when reminders are due):
```
[Reminders] Sending to 5 guests for event: Wedding Party
[Reminders] Sent to guest@example.com
```

⚠️ **Warning** (transient failure, will retry):
```
[Reminders] Failed to send to guest@example.com: <error>
```

❌ **Error** (needs investigation):
```
[Cron] Unauthorized cron attempt
```

## Railway-Specific Notes

- Railway automatically injects `DATABASE_URL` - no manual setup needed
- Railway Cron runs in the same environment as your service
- `$CRON_SECRET` in cron command resolves to the environment variable
- Logs are available in Railway dashboard → Deployments → View Logs
