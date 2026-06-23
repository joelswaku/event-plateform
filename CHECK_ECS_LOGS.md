# 🔍 Check ECS Logs - API Service Failing

**Issue:** ECS service not stabilizing - tasks are failing to start

**Log Group:** `/ecs/liteevent-production/api`

---

## 📊 Quick Check via AWS Console

### Option 1: CloudWatch Logs (Easiest)

1. **Go to CloudWatch Logs:**
   https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups

2. **Find the log group:**
   - Look for: `/ecs/liteevent-production/api`
   - Click on it

3. **View latest log stream:**
   - Click the most recent log stream (top of list)
   - Look for ERROR messages in red
   - Common errors to look for:
     - Database connection errors
     - Missing environment variables
     - Application startup errors
     - Port binding issues

---

### Option 2: ECS Console

1. **Go to ECS Services:**
   https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service/health?region=us-east-1

2. **Check Tasks tab:**
   - Look at task status
   - If tasks are "STOPPED", click on one
   - See "Stopped reason"

3. **View task logs:**
   - Click on a task
   - Click "Logs" tab
   - See the actual error messages

---

## 🔍 Common Issues & Solutions

### Issue #1: Database Connection Error

**Error in logs:**
```
ECONNREFUSED
Could not connect to database
Connection timeout
```

**Cause:** Security group not allowing ECS → RDS traffic

**Solution:**
The Terraform should have configured this, but verify:
- RDS security group allows inbound from ECS security group
- Port 5432 is open

---

### Issue #2: Missing Environment Variables

**Error in logs:**
```
DATABASE_URL is not defined
Required environment variable missing
```

**Cause:** Secrets Manager secrets not properly configured

**Solution:**
Check that these secrets exist in Secrets Manager:
- `liteevent/production/database`
- `liteevent/production/jwt`
- `liteevent/production/stripe`
- `liteevent/production/google-oauth`

---

### Issue #3: Health Check Failing

**Error in logs:**
```
Health check failed
/health endpoint returned 500
```

**Cause:** Application started but isn't healthy

**Solution:**
- Check if database migrations need to run
- Verify all required services are accessible

---

### Issue #4: Port Already in Use

**Error in logs:**
```
EADDRINUSE :::5000
Port 5000 is already in use
```

**Cause:** Multiple processes trying to use the same port

**Solution:**
This shouldn't happen with Fargate, but check task definition

---

### Issue #5: Application Crash on Startup

**Error in logs:**
```
TypeError: Cannot read property...
Module not found
Syntax error
```

**Cause:** Code error or missing dependencies

**Solution:**
- Check if all npm dependencies are in the Docker image
- Verify the application works locally

---

## 📋 What to Look For

When you check the logs, copy the **first ERROR message** you see.

Common patterns:

### Good startup (should see):
```
[INFO] Server running on port 5000
[INFO] Database connected
[INFO] Ready to accept connections
```

### Bad startup (errors):
```
[ERROR] Connection to database failed
[ERROR] Required env var not set
[ERROR] Application crashed
```

---

## 🔧 Quick Fixes

### If it's a database connection issue:

The database endpoint should be automatically injected via Secrets Manager.
The secret should contain:
```json
{
  "url": "postgresql://username:password@endpoint:5432/database"
}
```

### If it's missing environment variables:

Check that all secrets were created by Terraform:
```bash
# In AWS Secrets Manager console
https://console.aws.amazon.com/secretsmanager/home?region=us-east-1
```

Should see:
- liteevent/production/database
- liteevent/production/jwt  
- liteevent/production/stripe
- liteevent/production/google-oauth

---

## 🆘 Share the Error

Once you find the error in CloudWatch Logs, copy and share:

1. The **first ERROR message**
2. A few lines before it (for context)
3. A few lines after it

This will help me diagnose the exact issue!

---

## 📍 Direct Links

**CloudWatch Logs:**
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

**ECS Service:**
https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service/health?region=us-east-1

**Secrets Manager:**
https://console.aws.amazon.com/secretsmanager/home?region=us-east-1

---

**Check the logs and share the error message so I can help fix it!** 🔍
