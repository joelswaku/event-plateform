# 🔧 FINAL FIX - AWS Console Only

## Problem
API keeps crashing with "Database connection failed"

## Root Causes
1. ❌ Secrets Manager has wrong password
2. ❌ AWS RDS database is EMPTY (no tables)

---

## FIX #1: Update Secrets Manager (2 minutes)

### Step 1: Open Secrets Manager
https://console.aws.amazon.com/secretsmanager/secret?name=liteevent%2Fproduction%2Fdatabase&region=us-east-1

### Step 2: Click "Retrieve secret value"

### Step 3: Click "Edit"

### Step 4: Replace EVERYTHING with this:

```json
{
  "username": "liteevent_admin",
  "password": "LiteEvent2026Pass",
  "host": "liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "liteevent_production",
  "url": "postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"
}
```

### Step 5: Click "Save"

✅ Secret updated!

---

## FIX #2: Create Database Tables (5 minutes)

You have 23 migration files that need to run. Since local connection fails, we'll use AWS Systems Manager.

### Option A: Quick SQL Schema (Fast - 2 minutes)

I'll create a single SQL file with all the schema. You can run it via RDS Query Editor.

### Option B: Allow Your IP to RDS (Recommended - 5 minutes)

1. **Get Your IP:**
   - Go to: https://www.whatismyip.com/
   - Copy your IPv4 address (e.g., 203.0.113.45)

2. **Open RDS Security Group:**
   - Go to: https://console.aws.amazon.com/ec2/home?region=us-east-1#SecurityGroups:
   - Search: `liteevent-production-rds-sg`
   - Click on it
   - Click "Inbound rules" tab
   - Click "Edit inbound rules"

3. **Add Rule:**
   - Click "Add rule"
   - Type: PostgreSQL
   - Port: 5432 (auto-filled)
   - Source: Custom
   - In the box, paste your IP address and add `/32` (e.g., `203.0.113.45/32`)
   - Description: "My local IP for migrations"
   - Click "Save rules"

4. **Run Migrations Locally:**
   ```powershell
   cd C:\projects\event-plateform\api
   $env:DATABASE_URL="postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"
   npm run migrate
   ```

5. **Remove Your IP (Security):**
   - Go back to Security Group
   - Delete the rule you just added
   - Click "Save rules"

✅ Database tables created!

---

## FIX #3: Force New Deployment (1 minute)

1. **Go to ECS:**
   https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service?region=us-east-1

2. **Click "Update"**

3. **Check "Force new deployment"**

4. **Click "Update"**

5. **Wait 2 minutes** - watch "Running count" go from 0 → 2

✅ API is now running!

---

## Verify It Works

1. **Check Logs:**
   https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

   **You should see:**
   ```
   [INFO] Database connected successfully
   [INFO] Server running on port 5000
   ```

2. **Test API:**
   http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health

   **Should return:**
   ```json
   {"success":true,"message":"API is healthy"}
   ```

---

## If You Still Get Errors

**Error: "password authentication failed"**
→ RDS password doesn't match Secrets Manager. Go to RDS Console and reset password to `LiteEvent2026Pass`

**Error: "database does not exist"**
→ Database name is wrong. Check RDS Configuration tab for actual DB name

**Error: "relation 'users' does not exist"**
→ Migrations didn't run. Follow Option B above to run migrations

---

## Summary

1. ✅ Update Secrets Manager password
2. ✅ Allow your IP to RDS
3. ✅ Run migrations locally
4. ✅ Remove your IP from RDS
5. ✅ Force new ECS deployment
6. ✅ Verify logs show success

**Total time: 10 minutes**

---

**START HERE:** Fix #1 (Update Secrets Manager)
