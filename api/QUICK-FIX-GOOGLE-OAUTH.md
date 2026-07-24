# Quick Fix for Google OAuth Error

## Problem
`null value in column "password_hash" violates not-null constraint`

Google users don't have passwords, but the database requires it.

## Solution

### Option 1: Railway Dashboard (Easiest)

1. Go to Railway project: https://railway.com/project/4bbc96a8-25e0-4e46-8194-579788d89501
2. Click on "PostgreSQL" service
3. Click "Query" tab
4. Paste this SQL:

```sql
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
```

5. Click "Run Query"
6. Done! ✅

### Option 2: Railway CLI

```bash
cd api
railway run psql "$DATABASE_URL" -c "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;"
```

### Option 3: Direct psql

If you have the DATABASE_URL:
```bash
psql $DATABASE_URL -c "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;"
```

## Test After Fix

1. Go to https://liteevent.com/login
2. Click "Continue with Google"
3. Select your email
4. Should work! ✅

## What This Does

Makes the `password_hash` column optional:
- Regular users (email/password): Have password_hash ✅
- Google users: No password_hash, use google_id ✅
- Both can login successfully ✅
