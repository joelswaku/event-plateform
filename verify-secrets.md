# 🔍 Verify Database Secret Configuration

## What You Need to Check

Your database connection is failing because the password in Secrets Manager doesn't match RDS or isn't formatted correctly.

---

## 📋 Step-by-Step Verification

### 1. Check Current RDS Password

**Option A: If you remember what you set it to**
- Write it down: `_________________`

**Option B: If you don't remember**
- You'll need to reset it (instructions below)

---

### 2. Check Secrets Manager Format

Go to: https://console.aws.amazon.com/secretsmanager/secret?name=liteevent%2Fproduction%2Fdatabase&region=us-east-1

Click "Retrieve secret value"

**Your secret should look EXACTLY like this:**

```json
{
  "url": "postgresql://liteevent_admin:YOUR_PASSWORD@YOUR_ENDPOINT:5432/liteevent_prod",
  "host": "YOUR_ENDPOINT",
  "port": "5432",
  "username": "liteevent_admin",
  "password": "YOUR_PASSWORD",
  "database": "liteevent_prod"
}
```

---

### 3. Common Mistakes to Fix

#### ❌ WRONG: Database name mismatch
```json
{
  "database": "eventplatform"  // ← WRONG
}
```

**Your terraform shows db_name default is "eventplatform" but your RDS might be "liteevent_prod"**

#### ✅ CORRECT: Check what's actually in RDS
1. Go to RDS Console
2. Click your database
3. Look at "DB name" field under Configuration tab
4. Use THAT name in the secret

---

#### ❌ WRONG: Password not URL-encoded in url field
```json
{
  "url": "postgresql://user:Pass+Word=123@endpoint:5432/db"
}
```

If your password is `Pass+Word=123`, the `+` and `=` must be encoded:

#### ✅ CORRECT: URL-encoded
```json
{
  "url": "postgresql://user:Pass%2BWord%3D123@endpoint:5432/db",
  "password": "Pass+Word=123"
}
```

**Note:** Only the `url` field needs encoding, NOT the `password` field!

---

#### ❌ WRONG: Wrong endpoint
```json
{
  "host": "localhost",
  "url": "postgresql://user:pass@localhost:5432/db"
}
```

#### ✅ CORRECT: Use RDS endpoint
```json
{
  "host": "liteevent-production-postgres.xxxxx.us-east-1.rds.amazonaws.com",
  "url": "postgresql://user:pass@liteevent-production-postgres.xxxxx.us-east-1.rds.amazonaws.com:5432/db"
}
```

---

## 🔧 Quick Fix Template

### Step 1: Get Your RDS Endpoint

**RDS Console → Your database → Connectivity & security**

Endpoint: `_________________________________`

### Step 2: Determine Your Password

**Choose one:**

**Option A: Reset to simple password**
- RDS Console → Modify → Master password: `LiteEvent2026Pass`
- Check "Apply immediately"
- Wait 2-3 minutes

**Option B: Use existing password**
- You need to know what it currently is
- Current password: `_________________`

### Step 3: Check Database Name

**RDS Console → Your database → Configuration tab**

DB name: `_________________`

(Common values: `liteevent_prod`, `eventplatform`, `liteevent_production`)

### Step 4: Update Secret

**Use this template in Secrets Manager:**

```json
{
  "url": "postgresql://liteevent_admin:LiteEvent2026Pass@YOUR-ENDPOINT:5432/YOUR-DB-NAME",
  "host": "YOUR-ENDPOINT",
  "port": "5432",
  "username": "liteevent_admin",
  "password": "LiteEvent2026Pass",
  "database": "YOUR-DB-NAME"
}
```

Replace:
- `YOUR-ENDPOINT` → from Step 1
- `YOUR-DB-NAME` → from Step 3
- `LiteEvent2026Pass` → your actual password from Step 2

If password has special characters, encode them ONLY in the `url` field!

---

## 🎯 Most Common Issue

Based on your terraform config showing `db_name = "eventplatform"` but your secrets likely have `"database": "liteevent_prod"`, there's a mismatch.

**Check which one is correct:**

1. Go to RDS Console
2. Find the actual database name in Configuration
3. Update your secret to match

---

## ✅ After Fixing Secret

1. Go to ECS Console
2. Update service with "Force new deployment"
3. Wait 2-3 minutes
4. Check logs for success message:
   ```
   [INFO] Database connected successfully
   [INFO] Server running on port 5000
   ```

---

## 🆘 Still Stuck?

**Tell me:**
1. What's the actual database name in RDS?
2. What error do you see after forcing new deployment?
3. Does your password have any of these characters: `+ = @ # / & ?`

I'll give you the exact secret JSON to use!
