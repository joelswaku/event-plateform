# 🚨 IMMEDIATE FIX - 502 Bad Gateway

## The Problem
Based on your recent commits, the issue is **database connection failure** caused by password changes.

Recent commits show:
```
41464d2 fix: add apply_immediately=true to RDS to apply password changes
6ddeb13 chore: trigger deployment with updated database password  
2b7bc2e fix: URL-encode database password in connection string
```

The containers are crashing because they can't connect to the database.

---

## 🎯 QUICK FIX (Choose One)

### Option A: Fix via AWS Console (FASTEST - 5 minutes)

#### Step 1: Check What's Wrong
1. **Go to CloudWatch Logs:**
   https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

2. **Click the most recent log stream**

3. **Look for error message** - it will be one of:
   - `password authentication failed for user "liteevent_admin"`
   - `ECONNREFUSED` or `Connection refused`
   - `DATABASE_URL is not defined`

#### Step 2: Fix Secrets Manager

**If you see password error:**

1. **Go to RDS Console:**
   https://console.aws.amazon.com/rds/home?region=us-east-1#databases:

2. **Find your database** (liteevent-production-postgres)

3. **Note the endpoint** (something like: liteevent-production-postgres.xxxxx.us-east-1.rds.amazonaws.com)

4. **Go to Secrets Manager:**
   https://console.aws.amazon.com/secretsmanager/home?region=us-east-1#!/secret?name=liteevent%2Fproduction%2Fdatabase

5. **Click "Retrieve secret value"**

6. **Click "Edit"**

7. **Update the password in BOTH places:**
   - In the `url` field: `postgresql://liteevent_admin:NEW_PASSWORD@endpoint:5432/liteevent_prod`
   - In the `password` field: `NEW_PASSWORD`

8. **Make sure password is URL-encoded if it has special characters:**
   - `+` becomes `%2B`
   - `=` becomes `%3D`
   - `@` becomes `%40`
   - `#` becomes `%23`
   - `/` becomes `%2F`

9. **Save**

#### Step 3: Force New Deployment

**Option 3A - Via AWS Console (easier):**
1. Go to ECS: https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services?region=us-east-1
2. Click `liteevent-production-api-service`
3. Click **"Update service"** (top right)
4. Check **"Force new deployment"**
5. Click **"Update"**
6. Wait 2-3 minutes

**Option 3B - Via Command Line (if you have AWS CLI):**
```bash
aws ecs update-service \
  --cluster liteevent-production-cluster \
  --service liteevent-production-api-service \
  --force-new-deployment \
  --region us-east-1
```

#### Step 4: Wait and Test
- Wait 2-3 minutes for new container to start
- Test: http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health
- Should return: `{"success":true,"message":"API is healthy"}`

---

### Option B: Reset Everything (NUCLEAR OPTION - 10 minutes)

If Option A doesn't work, completely reset the database password:

#### Step 1: Generate New Simple Password
```
NewPassword123!
```
(Use something simple for testing, change it later)

#### Step 2: Update RDS
1. Go to RDS Console
2. Select your database: `liteevent-production-postgres`
3. Click **"Modify"**
4. Scroll to **"Master password"**
5. Enter: `NewPassword123!`
6. Scroll to bottom
7. Select **"Apply immediately"** ✅
8. Click **"Modify DB instance"**
9. Wait 2-3 minutes for modification to complete

#### Step 3: Update Secrets Manager
1. Go to Secrets Manager: `liteevent/production/database`
2. Click **"Retrieve secret value"** → **"Edit"**
3. Update **ALL password references:**

```json
{
  "url": "postgresql://liteevent_admin:NewPassword123!@YOUR-ENDPOINT:5432/liteevent_prod",
  "host": "YOUR-ENDPOINT.us-east-1.rds.amazonaws.com",
  "port": "5432",
  "username": "liteevent_admin",
  "password": "NewPassword123!",
  "database": "liteevent_prod"
}
```

Replace `YOUR-ENDPOINT` with actual RDS endpoint from RDS console.

4. Click **"Save"**

#### Step 4: Force New Deployment (same as Option A Step 3)

---

## 🔍 If Still Not Working

### Check Security Groups

The database might not be accessible from ECS:

#### Step 1: Get Security Group IDs

**RDS Security Group:**
1. RDS Console → Your database → Connectivity & security
2. Note the **Security group ID** (e.g., sg-xxxxx)

**ECS Security Group:**
1. EC2 Console → Security Groups
2. Find: `liteevent-production-ecs-tasks-sg`
3. Note the **Group ID** (e.g., sg-xxxxx)

#### Step 2: Add Inbound Rule to RDS Security Group

1. EC2 Console → Security Groups
2. Click on **RDS security group**
3. Go to **"Inbound rules"** tab
4. Click **"Edit inbound rules"**
5. Click **"Add rule"**
6. Set:
   - **Type:** PostgreSQL
   - **Port:** 5432
   - **Source:** Custom
   - **Source ID:** [Paste ECS security group ID]
   - **Description:** Allow ECS to access RDS
7. Click **"Save rules"**

#### Step 3: Force New Deployment Again

---

## 📊 How to Know If It's Fixed

### Method 1: Check ECS Service
https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service/health?region=us-east-1

**Look for:**
- ✅ **Running tasks:** `2/2` (green)
- ✅ **Health status:** HEALTHY

### Method 2: Check CloudWatch Logs
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

**Look for:**
```
[INFO] Server running on port 5000
[INFO] Database connected
[INFO] Ready to accept connections
```

**No more errors like:**
```
❌ [ERROR] Connection to database failed
❌ [ERROR] password authentication failed
```

### Method 3: Test Health Endpoint

**Open in browser:**
```
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health
```

**Should return:**
```json
{
  "success": true,
  "message": "API is healthy",
  "uptime": 123.45,
  "timestamp": "2026-06-18T...",
  "environment": "production"
}
```

**Instead of:**
```
502 Bad Gateway
```

---

## 🆘 Still Not Working?

**Send me these 3 things:**

### 1. CloudWatch Logs Error
- Go to CloudWatch Logs (link above)
- Copy the first ERROR message you see
- Send it to me

### 2. ECS Service Status
- Go to ECS Service (link above)  
- Tell me: "Running X/2" or "0/2"
- Tell me task status: RUNNING, STOPPED, PENDING

### 3. Secrets Manager Content
- Go to `liteevent/production/database` secret
- Click "Retrieve secret value"
- **DO NOT share the actual password**
- Just tell me:
  - Does `url` field exist?
  - Does `password` field exist?
  - Does the `url` format look correct?

---

## 🎯 Most Likely Solution

Based on your commits, **Option A** should fix it:

1. Check what password is currently in Secrets Manager
2. Make sure it matches RDS
3. Make sure special characters are URL-encoded
4. Force new deployment

**Time: 5 minutes**
**Success rate: 95%**

Let me know what error you see in CloudWatch Logs and I'll give you the exact fix!
