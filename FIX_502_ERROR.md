# 🚨 502 Bad Gateway - Production Debugging Guide

## Current Issue
Your production deployment at `http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com` is returning **502 Bad Gateway**.

This means:
- ✅ ALB (Load Balancer) is working
- ❌ ECS containers are NOT healthy or NOT responding

---

## 🔍 Step 1: Check AWS Console (URGENT)

### A) Check ECS Service Status
**Go to:** https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service/health?region=us-east-1

**Look for:**
- **Running tasks:** Should be `2/2` (2 running, 2 desired)
- **Task status:** Should show "RUNNING" in green
- **Health status:** Should be "HEALTHY"

**If you see:**
- `0/2 running` = Containers are crashing immediately
- `STOPPED` tasks = Click on them to see "Stopped reason"
- `UNHEALTHY` = Health check is failing

---

### B) Check CloudWatch Logs (MOST IMPORTANT)
**Go to:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

**Instructions:**
1. Click the most recent log stream (at the top)
2. Scroll to find **ERROR** messages (red text)
3. Copy the first error you see

**Common errors and what they mean:**

```
❌ "ECONNREFUSED" or "Connection refused"
   → Database is not accessible from ECS

❌ "DATABASE_URL is not defined"
   → Secrets Manager secrets not configured properly

❌ "Error: connect ETIMEDOUT"
   → Security group blocking RDS access

❌ "getaddrinfo ENOTFOUND"
   → DNS resolution failing (wrong endpoint)

❌ "password authentication failed"
   → Wrong database password
```

---

### C) Check Target Group Health
**Go to:** https://console.aws.amazon.com/ec2/home?region=us-east-1#TargetGroups:

**Instructions:**
1. Find target groups starting with `liteevent-production`
2. Click on each one
3. Go to "Targets" tab
4. Check target health status

**What you should see:**
- ✅ Status: `healthy` (green)

**If you see:**
- ❌ `initial` = Container just started, waiting for health checks
- ❌ `unhealthy` = Health check endpoint failing
- ❌ `unused` = No targets registered (containers not starting)

---

## 🔧 Step 2: Common Fixes

### Fix #1: Database Connection Error

**Problem:** ECS containers can't reach RDS database

**Check:**
1. Go to **RDS Console** → Find your database
2. Check **Security Groups**
3. **Inbound rules** should allow:
   - Port: `5432`
   - Source: ECS security group (starts with `liteevent-production-ecs-tasks-sg`)

**If missing, add the rule:**
```
Type: PostgreSQL
Port: 5432
Source: <ECS security group ID>
```

---

### Fix #2: Wrong Database Password

**Problem:** Password in Secrets Manager doesn't match RDS

**Solution:**
1. Go to **Secrets Manager** → `liteevent/production/database`
2. Click "Retrieve secret value"
3. Check the `url` field
4. Make sure password matches RDS master password

**The URL should look like:**
```
postgresql://username:PASSWORD@endpoint:5432/database
```

**If password is wrong:**
1. Go to RDS Console → Modify database
2. Set new master password
3. Check "Apply immediately"
4. Update Secrets Manager with new password
5. Force new ECS deployment

---

### Fix #3: Missing Environment Variables

**Problem:** Secrets not properly injected into containers

**Check these secrets exist:**
- `liteevent/production/database`
- `liteevent/production/jwt`
- `liteevent/production/stripe`
- `liteevent/production/google-oauth`

**Go to:** https://console.aws.amazon.com/secretsmanager/home?region=us-east-1

**Each secret should have these fields:**

**database secret:**
```json
{
  "url": "postgresql://user:pass@endpoint:5432/db",
  "host": "xxx.rds.amazonaws.com",
  "port": "5432",
  "username": "liteevent_admin",
  "password": "your-password",
  "database": "liteevent_prod"
}
```

**jwt secret:**
```json
{
  "jwt_secret": "your-secret-here",
  "jwt_refresh_secret": "your-refresh-secret"
}
```

---

### Fix #4: Container Crash on Startup

**If logs show:**
```
Module not found
Cannot find module 'xyz'
Syntax error
```

**This means the Docker image has issues.**

**Solution:**
1. Check if latest build succeeded in GitHub Actions
2. Go to: https://github.com/joelswaku/event-plateform/actions
3. Click on the most recent "Deploy to Production" workflow
4. Check if build step succeeded

**If build failed:**
- Fix the code issue
- Push to `main` branch
- Wait for new deployment

---

## 🔍 Step 3: Get Detailed Error Info

### Using AWS CLI (if installed)

**Check service status:**
```bash
aws ecs describe-services \
  --cluster liteevent-production-cluster \
  --services liteevent-production-api-service \
  --region us-east-1 \
  --query 'services[0].{Running:runningCount,Desired:desiredCount}'
```

**Get stopped task reason:**
```bash
aws ecs describe-tasks \
  --cluster liteevent-production-cluster \
  --tasks $(aws ecs list-tasks \
    --cluster liteevent-production-cluster \
    --service-name liteevent-production-api-service \
    --desired-status STOPPED \
    --region us-east-1 \
    --max-items 1 \
    --query 'taskArns[0]' \
    --output text) \
  --region us-east-1 \
  --query 'tasks[0].{Reason:stoppedReason,ExitCode:containers[0].exitCode}'
```

**View latest logs:**
```bash
aws logs tail /ecs/liteevent-production/api \
  --follow \
  --since 10m \
  --region us-east-1
```

---

## 🎯 Most Likely Causes (Based on Your Setup)

### 1. **Database Password Issue (80% chance)**
Your recent commits show database password changes. The password in Secrets Manager might not match RDS.

**Quick fix:**
1. Reset RDS password to something simple (for testing)
2. Update `liteevent/production/database` secret with new password
3. Force new deployment:
```bash
aws ecs update-service \
  --cluster liteevent-production-cluster \
  --service liteevent-production-api-service \
  --force-new-deployment \
  --region us-east-1
```

---

### 2. **Security Group Blocking RDS (15% chance)**
ECS tasks can't reach the database.

**Check in AWS Console:**
- RDS → Your database → Connectivity & security → Security groups
- Click the security group
- Inbound rules → Should see ECS security group allowed on port 5432

---

### 3. **Container Startup Error (5% chance)**
Something in your code is crashing the container.

**Check logs for:**
- Module import errors
- Syntax errors
- Missing dependencies

---

## 📋 What to Send Me

After checking the above, please share:

1. **ECS Service Status:**
   - Running count (e.g., "0/2" or "2/2")
   - Task status (RUNNING, STOPPED, PENDING)

2. **CloudWatch Logs:**
   - Copy the first ERROR message you see
   - Or screenshot the logs

3. **Target Group Health:**
   - Status of targets (healthy, unhealthy, unused)

4. **Stopped Task Reason (if any):**
   - Go to ECS → Tasks → Click stopped task
   - Copy "Stopped reason"

---

## 🆘 Emergency Quick Fix

If you need the site up FAST and can't debug:

1. **Go back to working version:**
```bash
cd C:\projects\event-plateform
git log --oneline -10
# Find a commit SHA before the issues started
# Push it to trigger redeployment
git push origin <SHA>:main --force
```

2. **Or manually fix in AWS Console:**
- Go to RDS → Modify database
- Change master password to something simple
- Apply immediately
- Update Secrets Manager with new password
- Force new ECS deployment

---

## 📞 Next Steps

**Please check the AWS Console and share:**
1. ECS service running count
2. Any ERROR from CloudWatch logs
3. Target health status

I'll help you fix it immediately once I know the exact error!
