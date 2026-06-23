# 🔧 FIX: Database Connection Failed

## The Error
```
[14:20:45.948] ERROR (1): Database connection failed
```

## Root Cause
Your recent commits changed the database password, but there's a mismatch between:
- RDS actual password
- Secrets Manager stored password
- Or: password has special characters that need URL encoding

---

## 🎯 SOLUTION - Step by Step

### Step 1: Get RDS Database Endpoint

1. **Go to RDS Console:**
   https://console.aws.amazon.com/rds/home?region=us-east-1#databases:

2. **Click on:** `liteevent-production-postgres` (or similar name)

3. **Copy the Endpoint** (under Connectivity & security section)
   - It looks like: `liteevent-production-postgres.xxxxx.us-east-1.rds.amazonaws.com`
   - **Write it down!**

---

### Step 2: Check Current Password in Secrets Manager

1. **Go to Secrets Manager:**
   https://console.aws.amazon.com/secretsmanager/secret?name=liteevent%2Fproduction%2Fdatabase&region=us-east-1

2. **Click: "Retrieve secret value"**

3. **Check the password field** - what does it show?

---

### Step 3: Fix the Secret (Choose One Option)

### Option A: Use Simple Password (Recommended for Quick Fix)

Let's use a simple password without special characters:

1. **First, update RDS password:**
   - Go back to RDS Console
   - Click your database → **"Modify"**
   - Scroll to **"Master password"**
   - Enter: `LiteEvent2026Pass`
   - Scroll down, check **"Apply immediately"** ✅
   - Click **"Modify DB instance"**
   - **Wait 2-3 minutes** for it to apply

2. **Then, update Secrets Manager:**
   - Go to Secrets Manager (link above)
   - Click **"Retrieve secret value"** → **"Edit"**
   - Replace the entire JSON with this:

```json
{
  "url": "postgresql://liteevent_admin:LiteEvent2026Pass@YOUR-ENDPOINT-HERE:5432/liteevent_prod",
  "host": "YOUR-ENDPOINT-HERE",
  "port": "5432",
  "username": "liteevent_admin",
  "password": "LiteEvent2026Pass",
  "database": "liteevent_prod"
}
```

3. **Replace `YOUR-ENDPOINT-HERE`** with the actual endpoint you copied in Step 1
   - Example: `liteevent-production-postgres.c1a2b3c4d5e6.us-east-1.rds.amazonaws.com`

4. **Click "Save"**

---

### Option B: Use Current Password with URL Encoding

If you want to keep your current password:

1. **What's your current RDS password?**
   - Check what you set in RDS last time

2. **If it has special characters, URL-encode them:**
   - `+` → `%2B`
   - `=` → `%3D`
   - `@` → `%40`
   - `#` → `%23`
   - `/` → `%2F`
   - `&` → `%26`
   - `?` → `%3F`
   - `%` → `%25`

3. **Update Secrets Manager** with the URL-encoded password in the `url` field only:

```json
{
  "url": "postgresql://liteevent_admin:URL_ENCODED_PASSWORD@endpoint:5432/liteevent_prod",
  "host": "endpoint-here",
  "port": "5432",
  "username": "liteevent_admin",
  "password": "ACTUAL_PASSWORD_NO_ENCODING",
  "database": "liteevent_prod"
}
```

**IMPORTANT:** 
- `url` field: Use URL-encoded password
- `password` field: Use plain password (no encoding)

---

### Step 4: Check Security Groups

While RDS is updating, let's verify security groups:

1. **Get ECS Security Group ID:**
   - Go to: https://console.aws.amazon.com/ec2/home?region=us-east-1#SecurityGroups:
   - Search for: `liteevent-production-ecs-tasks-sg`
   - Copy the **Security group ID** (looks like `sg-0abc123def456`)

2. **Check RDS Security Group:**
   - Go back to RDS Console → Your database
   - Under **Connectivity & security**, click the security group link
   - Go to **"Inbound rules"** tab
   - **Look for this rule:**
     - Type: PostgreSQL
     - Port: 5432
     - Source: `sg-0abc123def456` (your ECS security group)

3. **If the rule is MISSING, add it:**
   - Click **"Edit inbound rules"**
   - Click **"Add rule"**
   - Set:
     - **Type:** PostgreSQL
     - **Port:** 5432
     - **Source:** Custom → Paste ECS security group ID
     - **Description:** Allow ECS to access RDS
   - Click **"Save rules"**

---

### Step 5: Force New ECS Deployment

Now that secrets are fixed, force containers to restart:

1. **Go to ECS Console:**
   https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service/health?region=us-east-1

2. **Click "Update" button** (top right, in orange/blue)

3. **Check the box: "Force new deployment"** ✅

4. **Scroll to bottom, click "Update"**

5. **Wait 2-3 minutes**
   - Watch the "Deployments" section
   - Primary deployment should show "Running count" increasing

---

### Step 6: Verify It's Fixed

**Method 1: Check ECS Service**
- Stay on the ECS service page
- Wait for "Running count: 2/2" (both containers running)
- Health status should be "HEALTHY"

**Method 2: Check Logs**
- Go back to CloudWatch Logs (same link as before)
- Look for NEW log streams (after your deployment)
- Should see:
```
[INFO] Server running on port 5000
[INFO] Database connected successfully
[INFO] ✓ Database connection successful
```

**Method 3: Test the Endpoint**
Open in browser:
```
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health
```

Should return:
```json
{
  "success": true,
  "message": "API is healthy"
}
```

---

## 🚨 If Still Not Working

### Check for More Specific Error

1. Go to CloudWatch Logs
2. Look at the NEWEST log stream
3. Copy the FULL error message (not just "Database connection failed")

The detailed error might say:
- `password authentication failed` → Password is wrong
- `ECONNREFUSED` → Security group blocking
- `getaddrinfo ENOTFOUND` → Wrong endpoint
- `timeout` → Security group or network issue

**Send me the detailed error and I'll give you the exact fix!**

---

## 📋 Quick Checklist

Before forcing new deployment, verify:

- [ ] RDS password updated (if changed)
- [ ] Secrets Manager `url` field has correct endpoint
- [ ] Secrets Manager `url` field has correct password (URL-encoded if special chars)
- [ ] Secrets Manager `password` field has correct password (NOT encoded)
- [ ] Secrets Manager `database` field is `liteevent_prod`
- [ ] RDS security group allows ECS security group on port 5432
- [ ] Waited 2-3 minutes after RDS password change

---

## 🎯 Expected Timeline

- **Step 1-2:** 2 minutes (gather info)
- **Step 3:** 3 minutes (update password)
- **Step 4:** 2 minutes (check security groups)
- **Step 5:** 3 minutes (force deployment + wait)
- **Total: ~10 minutes**

---

## 💡 Pro Tip

To avoid password issues in the future, use AWS Secrets Manager rotation:
- Secrets Manager can auto-rotate RDS passwords
- Your app will always have the correct password
- Set up after fixing the current issue

---

**Start with Option A (simple password) - it's the fastest way to get your site working again!**

Let me know if you see any different error after forcing the deployment!
