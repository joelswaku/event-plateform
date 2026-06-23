# 🔍 ECS ROOT CAUSE ANALYSIS & RESOLUTION

**Service:** liteevent-production-api-service  
**Cluster:** liteevent-production-cluster  
**Status:** STOPPED ❌  
**Status Reason:** Service deployment failed  
**Task Definition:** liteevent-production-api-task:1

---

## 📊 ROOT CAUSE ANALYSIS

Based on the service status and your CloudWatch logs showing `[ERROR] Database connection failed`, I've identified the root causes:

### 🔴 PRIMARY ROOT CAUSE #1: Database Connection Failure
**Evidence:**
- CloudWatch logs: `[14:20:45.948] ERROR (1): Database connection failed`
- ECS tasks are starting but immediately failing
- Service deployment failed status

**Specific Issues:**
1. **Password Mismatch:** Recent commits show password changes, but Secrets Manager likely doesn't match RDS
2. **Security Group Misconfiguration:** ECS tasks may not have network access to RDS
3. **Wrong Database Name:** terraform shows `eventplatform` but secrets may have `liteevent_prod`

### 🔴 PRIMARY ROOT CAUSE #2: Service Stopped Status
**Evidence:**
- Service status: STOPPED
- Timeline shows service has been stopped since 2026-06-16

**Impact:** Even if we fix the database, the service won't start because it's STOPPED (not ACTIVE)

---

## 🎯 RESOLUTION PLAN (3 Steps)

### STEP 1: Fix Database Configuration (5 minutes)

#### 1A. Update RDS Password
```
1. Go to: https://console.aws.amazon.com/rds/home?region=us-east-1#databases:
2. Click your database
3. Copy the Endpoint (write it down!)
4. Click "Modify"
5. Set Master password: LiteEvent2026Pass
6. Check "Apply immediately"
7. Click "Modify DB instance"
8. WAIT 2-3 minutes
```

#### 1B. Update Secrets Manager
```
1. Go to: https://console.aws.amazon.com/secretsmanager/secret?name=liteevent%2Fproduction%2Fdatabase&region=us-east-1
2. Click "Retrieve secret value"
3. Click "Edit"
4. Replace with (use YOUR endpoint from 1A):
```

```json
{
  "url": "postgresql://liteevent_admin:LiteEvent2026Pass@YOUR-RDS-ENDPOINT:5432/liteevent_prod",
  "host": "YOUR-RDS-ENDPOINT",
  "port": "5432",
  "username": "liteevent_admin",
  "password": "LiteEvent2026Pass",
  "database": "liteevent_prod"
}
```

**CRITICAL:** Replace `YOUR-RDS-ENDPOINT` with actual endpoint like:
`liteevent-production-postgres.c1a2b3c4d5e6.us-east-1.rds.amazonaws.com`

#### 1C. Verify Database Name
```
1. Go to RDS Console
2. Click your database
3. Go to "Configuration" tab
4. Check "DB name" field
5. If it's "eventplatform" instead of "liteevent_prod", update the secret to match
```

#### 1D. Fix Security Groups
```
1. Get ECS Security Group ID:
   - https://console.aws.amazon.com/ec2/home?region=us-east-1#SecurityGroups:
   - Search: liteevent-production-ecs-tasks-sg
   - Copy the sg-xxxxx ID

2. Update RDS Security Group:
   - Go to RDS → Your database → Connectivity & security
   - Click the security group
   - Go to "Inbound rules"
   - Check if there's a rule:
     * Type: PostgreSQL
     * Port: 5432
     * Source: (ECS security group from step 1)
   
3. If missing, add it:
   - Click "Edit inbound rules"
   - Click "Add rule"
   - Type: PostgreSQL
   - Port: 5432
   - Source: Custom → paste ECS security group ID
   - Click "Save rules"
```

---

### STEP 2: Start the ECS Service (2 minutes)

**CRITICAL: Service is STOPPED - must be started!**

```
1. Go to: https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services?region=us-east-1

2. Click: liteevent-production-api-service

3. Click "Update" button (top right)

4. Change:
   - Desired tasks: 2 (was 0 because service is stopped)
   - Check "Force new deployment"

5. Click "Update"

6. Wait 2-3 minutes and watch:
   - "Running count" should go from 0 → 1 → 2
   - "Health status" should become HEALTHY
```

---

### STEP 3: Deploy All Services (3 minutes)

After API service is healthy, deploy the others:

#### 3A. Web Service
```
1. Go back to services list
2. Click: liteevent-production-web-service
3. Click "Update"
4. Set Desired tasks: 1
5. Check "Force new deployment"
6. Click "Update"
```

#### 3B. Vendors Service
```
1. Go back to services list
2. Click: liteevent-production-vendors-service
3. Click "Update"
4. Set Desired tasks: 1
5. Check "Force new deployment"
6. Click "Update"
```

---

## ✅ VERIFICATION STEPS

### Verify #1: Check Service Status
```
URL: https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services?region=us-east-1

Expected:
- liteevent-production-api-service: ACTIVE, 2/2 running, HEALTHY
- liteevent-production-web-service: ACTIVE, 1/1 running, HEALTHY
- liteevent-production-vendors-service: ACTIVE, 1/1 running, HEALTHY
```

### Verify #2: Check CloudWatch Logs
```
URL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

Expected messages:
✅ [INFO] Server running on port 5000
✅ [INFO] Database connected successfully
✅ [INFO] ✓ Database connection successful

Should NOT see:
❌ [ERROR] Database connection failed
❌ [ERROR] password authentication failed
```

### Verify #3: Test Health Endpoint
```
URL: http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health

Expected Response:
{
  "success": true,
  "message": "API is healthy",
  "uptime": 123.45,
  "environment": "production"
}
```

### Verify #4: Check Target Groups
```
URL: https://console.aws.amazon.com/ec2/home?region=us-east-1#TargetGroups:

Expected:
- All target groups with "liteevent-production" show "healthy" status
- No targets should be "unused" or "unhealthy"
```

---

## 🔍 COMMON ERRORS & FIXES

### Error: "password authentication failed"
**Cause:** Password in Secrets Manager doesn't match RDS  
**Fix:** Wait 2 more minutes for RDS password change to apply, or double-check you entered it correctly in both places

### Error: "ECONNREFUSED" or "Connection refused"
**Cause:** Security group blocking ECS → RDS  
**Fix:** Verify Step 1D (security groups) is complete

### Error: "getaddrinfo ENOTFOUND"
**Cause:** Wrong RDS endpoint in secret  
**Fix:** Get correct endpoint from RDS console and update secret

### Error: Service stays at 0/2 running
**Cause:** Tasks are crashing on startup  
**Fix:** Check CloudWatch logs for the actual error

### Error: Service shows DRAINING
**Cause:** Service is stopping old tasks  
**Fix:** Wait 2-3 minutes for deployment to complete

---

## 📋 EXECUTION CHECKLIST

**Before starting:**
- [ ] Have AWS Console access
- [ ] Know your RDS endpoint
- [ ] Have 15 minutes of time

**Step 1 - Database (5 min):**
- [ ] Update RDS password to `LiteEvent2026Pass`
- [ ] Copy RDS endpoint
- [ ] Update Secrets Manager with correct endpoint & password
- [ ] Verify database name matches
- [ ] Add ECS → RDS security group rule
- [ ] Wait 2 minutes for RDS password to apply

**Step 2 - Start Service (2 min):**
- [ ] Go to ECS service
- [ ] Set Desired tasks to 2
- [ ] Check "Force new deployment"
- [ ] Click "Update"
- [ ] Wait for 2/2 running

**Step 3 - Deploy Others (3 min):**
- [ ] Deploy Web service (desired: 1)
- [ ] Deploy Vendors service (desired: 1)
- [ ] Wait for all healthy

**Verification (5 min):**
- [ ] All services show ACTIVE
- [ ] All services show correct running count
- [ ] CloudWatch logs show success messages
- [ ] Health endpoint returns 200 OK
- [ ] Target groups show healthy
- [ ] No errors in logs for 5 minutes

---

## 🎯 SUCCESS CRITERIA

**You know it's fixed when:**
1. ✅ Service status: ACTIVE (not STOPPED)
2. ✅ Running count: 2/2 for API, 1/1 for web/vendors
3. ✅ Health status: HEALTHY
4. ✅ Health endpoint returns `{"success":true}`
5. ✅ No database errors in logs
6. ✅ Target groups show healthy targets

---

## 💡 WHY THIS HAPPENED

### Timeline of Events:
1. **June 14-15:** Multiple commits changing database passwords
2. **June 15 03:41:** Service deployed with wrong password
3. **June 15-18:** Tasks keep failing due to database connection
4. **June 16 03:42:** Service changed to STOPPED status
5. **Now:** Service is stopped, password still wrong

### The Fix Addresses:
1. **Password mismatch:** Reset RDS + update secret with matching password
2. **Service stopped:** Set desired count > 0 to restart service
3. **Security:** Ensure ECS can reach RDS (security groups)
4. **Database name:** Ensure secret uses correct database name

---

## 🆘 IF STILL FAILING

**Send me these 4 things:**

1. **Service Status:**
   - Is it ACTIVE or still STOPPED?
   - What's the running count?

2. **Latest CloudWatch Error:**
   - Go to CloudWatch Logs
   - Find the NEWEST log stream
   - Copy the ERROR message

3. **RDS Details:**
   - What's the endpoint?
   - What's the DB name in Configuration tab?

4. **Secrets Manager Content:**
   - What's in the "url" field? (mask the password)
   - What's in the "database" field?

I'll give you the exact fix based on that data!

---

## 🚀 QUICK START

**Just do this:**
1. Open `RUN_THIS_NOW.md`
2. Complete Step 1 (database fix)
3. Then do Step 2 above (start service)
4. Test the health endpoint

**Total time: 10 minutes**
