# Reminder System Production Fixes

All six production blockers identified in the reminder system have been resolved.

## Issues Fixed

### 1. Silent Resend Failures ✅
**Problem**: Resend API errors were ignored, logged as "sent" anyway  
**Location**: `reminder.service.js` lines 204 and 302  
**Fix**: 
- Check `error` field from Resend response
- Log failures with 'failed' status
- Return early/continue on error instead of proceeding

### 2. Lost Retry State (Cascade Delete) ✅
**Problem**: Saving reminders deleted all existing reminders, cascade-deleting send logs  
**Location**: `reminders.controller.js` line 78  
**Fix**:
- Changed from DELETE + INSERT to UPSERT pattern
- Added unique constraint `(event_id, timing)` on `event_reminders`
- Preserves `reminder_logs` via foreign key relationship
- Only deletes reminders removed from the new set

### 3. RSVP Bypass for Instant Reminders ✅
**Problem**: Invitation RSVP confirmations sent generic QR email, skipped custom instant reminder  
**Location**: `guests.service.js` submitInvitationRsvpService  
**Fix**:
- Try sending instant reminder first (uses owner's custom message)
- Fall back to standard QR confirmation only if no instant reminder configured
- Open RSVPs already used instant reminders; now invitation RSVPs do too

### 4. Timezone Mismatch ✅
**Problem**: Event times formatted in server timezone, not event's saved timezone  
**Location**: `reminder.service.js` date formatting  
**Fix**:
- Fetch `timezone` column from events table
- Pass `timeZone` option to `toLocaleDateString` and `toLocaleTimeString`
- Recipients now see correct local time for the event

### 5. Unauthed Cron Endpoint ✅
**Problem**: `/api/cron/reminders` was public POST with no authentication  
**Location**: `cron.routes.js`  
**Fix**:
- Added `verifyCronAuth` middleware
- Requires `CRON_SECRET` env var in production
- Accepts token via `Authorization: Bearer <token>` or `?token=<token>`
- Development mode allows unauthenticated access with warning

### 6. Race Condition in Duplicate Prevention ✅
**Problem**: Check-then-send-then-log pattern allowed concurrent runs to send duplicates  
**Location**: `reminder.service.js` sendReminderToGuests  
**Fix**:
- Atomic INSERT with ON CONFLICT DO NOTHING at start of send loop
- Added unique constraint `(event_id, reminder_id, guest_id)` on `reminder_logs`
- Insert creates 'pending' log, then updates to 'sent' or 'failed'
- Concurrent runs see conflict and skip

## Files Changed

- `api/services/reminder.service.js` - Error handling, timezone, atomic duplicate prevention
- `api/controllers/reminders.controller.js` - Upsert pattern for saving reminders
- `api/services/guests.service.js` - Instant reminder for invitation RSVPs
- `api/routes/cron.routes.js` - Authentication middleware
- `api/migrations/add_unique_constraint_event_reminders.sql` - Database constraints (NEW)
- `api/tests/reminder.test.js` - Integration tests (NEW)

## Database Migration Required

Run the migration to add unique constraints:

```bash
psql $DATABASE_URL -f api/migrations/add_unique_constraint_event_reminders.sql
```

This migration:
- Removes any duplicate `event_reminders` and `reminder_logs`
- Adds `UNIQUE (event_id, timing)` to `event_reminders`
- Adds `UNIQUE (event_id, reminder_id, guest_id)` to `reminder_logs`

## Environment Variables

Set `CRON_SECRET` in production:

```bash
# Railway or .env
CRON_SECRET=<random-secure-token>
```

Then configure your cron job to include the token:

```bash
# Railway Cron or external scheduler
curl -X POST https://your-api.com/api/cron/reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Test Coverage

Run tests with:
```bash
npm test -- reminder.test.js
```

Tests verify:
- Duplicate prevention (atomic insert)
- Resend error handling (failures logged, not thrown)
- Timezone formatting (Pacific vs UTC)
- Cascade-delete prevention (logs survive upsert)

## Local Testing Status ✅

- ✅ Migration tested on local database
- ✅ Migration is idempotent (safe to run multiple times)
- ✅ Unique constraints created successfully
- ✅ Code syntax validated

## Deployment Checklist

**See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for detailed Railway deployment guide**

- [ ] Run database migration: `psql $DATABASE_URL -f api/migrations/add_unique_constraint_event_reminders.sql`
- [ ] Set `CRON_SECRET` environment variable in Railway
- [ ] Update Railway cron job to include auth token
- [ ] Deploy code to Railway
- [ ] Test unauthorized request returns 401
- [ ] Monitor Railway logs for `[Reminders]` entries
- [ ] Verify no duplicate sends in production logs
- [ ] Check for failed sends: `SELECT * FROM reminder_logs WHERE status = 'failed'`
