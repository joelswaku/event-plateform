# ⚡ FIX & DEPLOY - COMPLETE GUIDE

## 🎯 THE PROBLEM

Your ECS service has **2 critical issues**:

1. **Service is STOPPED** ❌ (must be started)
2. **Database connection failing** ❌ (password mismatch)

**Time to fix:** 10-15 minutes

---

## 🔧 FIX #1: Database Connection (5 minutes)

### Open 3 Browser Tabs:

**Tab 1 - RDS:**
```
https://console.aws.amazon.com/rds/home?region=us-east-1#databases:
```

**Tab 2 - Secrets Manager:**
```
https://console.aws.amazon.com/secretsmanager/secret?name=liteevent%2Fproduction%2Fdatabase&region=us-east-1
```

**Tab 3 - Security Groups:**
```
https://console.aws.amazon.com/ec2/home?region=us-east-1#SecurityGroups:
```

---

### Action 1: Update RDS Password (Tab 1)

1. ✅ Click your database (liteevent-production-postgres)
2. ✅ **COPY & SAVE the Endpoint somewhere:**
   ```
   Endpoint: _____________________________________________
   ```
3. ✅ Click "Modify" button
4. ✅ Scroll to "Master password"
5. ✅ Enter: `LiteEvent2026Pass`
6. ✅ Scroll to bottom
7. ✅ Select "Apply immediately" ✅
8. ✅ Click "Modify DB instance"
9. ✅ **Set a 2-minute timer** (password needs time to apply)

---

### Action 2: Update Secret (Tab 2)

While waiting for RDS:

1. ✅ Click "Retrieve secret value"
2. ✅ Click "Edit"
3. ✅ Delete everything
4. ✅ Copy this template:

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

5. ✅ Replace BOTH instances of `YOUR-ENDPOINT-HERE` with the endpoint you copied in Action 1 step 2

**Example of what it should look like:**
```json
{
  "url": "postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.c1a2b3c4d5e6.us-east-1.rds.amazonaws.com:5432/liteevent_prod",
  "host": "liteevent-production-postgres.c1a2b3c4d5e6.us-east-1.rds.amazonaws.com",
  "port": "5432",
  "username": "liteevent_admin",
  "password": "LiteEvent2026Pass",
  "database": "liteevent_prod"
}
```

6. ✅ Click "Save"

---

### Action 3: Fix Security Groups (Tab 3)

1. ✅ In the search box, type: `liteevent-production-ecs-tasks-sg`
2. ✅ Click on it
3. ✅ **Copy the Security group ID:**
   ```
   ECS Security Group: sg-_________________
   ```
4. ✅ Go back (browser back button)
5. ✅ Search for RDS security group (or search "rds")
6. ✅ Click on the RDS security group (usually has "rds" in the name)
7. ✅ Click "Inbound rules" tab
8. ✅ Look for a rule with:
   - Type: PostgreSQL
   - Port: 5432
   - Source: (the ECS security group you copied)

**If you DON'T see this rule:**
9. ✅ Click "Edit inbound rules"
10. ✅ Click "Add rule"
11. ✅ Type: PostgreSQL (select from dropdown)
12. ✅ Port: 5432 (auto-filled)
13. ✅ Source: Custom
14. ✅ In the box, paste the ECS security group ID (sg-xxxx)
15. ✅ Description: "Allow ECS to access RDS"
16. ✅ Click "Save rules"

---

### Wait for Timer ⏰
**Before proceeding, make sure your 2-minute timer is done!**  
(RDS password needs time to apply)

---

## 🚀 FIX #2: Start the ECS Service (3 minutes)

### Open ECS Console:
```
https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services?region=us-east-1
```

### Action 4: Start API Service

1. ✅ Click: `liteevent-production-api-service`
2. ✅ Note the current status - is it STOPPED or ACTIVE?
3. ✅ Click "Update" button (top right, orange/blue)
4. ✅ Scroll to "Desired tasks"
5. ✅ Change from `0` to `2`
6. ✅ Check the box: "Force new deployment" ✅
7. ✅ Scroll to bottom
8. ✅ Click "Update"

**Now watch the page:**
- You'll see "Deployments" section
- "Running count" should go: 0 → 1 → 2
- This takes **2-3 minutes**

**Wait here until you see:**
- ✅ Running count: 2/2
- ✅ Status: ACTIVE
- ✅ Health: HEALTHY (or wait 1 more minute)

---

### Action 5: Start Web Service

1. ✅ Go back to services list (click "Services" in breadcrumb)
2. ✅ Click: `liteevent-production-web-service`
3. ✅ Click "Update"
4. ✅ Set Desired tasks: `1`
5. ✅ Check "Force new deployment" ✅
6. ✅ Click "Update"
7. ✅ Wait for 1/1 running

---

### Action 6: Start Vendors Service

1. ✅ Go back to services list
2. ✅ Click: `liteevent-production-vendors-service`
3. ✅ Click "Update"
4. ✅ Set Desired tasks: `1`
5. ✅ Check "Force new deployment" ✅
6. ✅ Click "Update"
7. ✅ Wait for 1/1 running

---

## ✅ VERIFY IT WORKS (2 minutes)

### Test 1: Check Services
Stay on the ECS services page and verify:
- [ ] API service: ACTIVE, 2/2 running, HEALTHY
- [ ] Web service: ACTIVE, 1/1 running, HEALTHY
- [ ] Vendors service: ACTIVE, 1/1 running, HEALTHY

---

### Test 2: Check API Health

**Open this URL in a new tab:**
```
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health
```

**You should see:**
```json
{
  "success": true,
  "message": "API is healthy",
  "uptime": 123.45,
  "timestamp": "2026-06-18T...",
  "environment": "production"
}
```

**If you see 502 or 504:**
- Wait 1 more minute (deployment not complete)
- Then go to Test 3 below

---

### Test 3: Check Logs

**Open CloudWatch Logs:**
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi
```

1. ✅ Click the NEWEST log stream (top of the list)
2. ✅ Look for these SUCCESS messages:
   ```
   [INFO] Server running on port 5000
   [INFO] Database connected successfully
   [INFO] ✓ Database connection successful
   ```

**If you still see ERROR:**
```
[ERROR] Database connection failed
```
- RDS password might not be applied yet
- Wait 2 more minutes
- Force another deployment (repeat Action 4)

---

### Test 4: Check Web Frontend

**Open this URL:**
```
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com
```

**You should see:** Your landing page (NOT 502 error)

---

## 🎉 SUCCESS CHECKLIST

All these should be ✅:

- [ ] RDS password updated to `LiteEvent2026Pass`
- [ ] Secrets Manager updated with correct endpoint
- [ ] Security group allows ECS → RDS on port 5432
- [ ] API service: ACTIVE, 2/2 running, HEALTHY
- [ ] Web service: ACTIVE, 1/1 running, HEALTHY
- [ ] Vendors service: ACTIVE, 1/1 running, HEALTHY
- [ ] `/health` endpoint returns `{"success":true}`
- [ ] Web frontend loads without 502
- [ ] Logs show "Database connected successfully"
- [ ] No ERROR messages in recent logs

---

## 🔍 TROUBLESHOOTING

### Problem: Service stays at 0/2 running

**Check:**
1. Go to ECS → Click the service → Tasks tab
2. Click on a STOPPED task
3. Look at "Stopped reason"
4. Check CloudWatch Logs for error

**Common causes:**
- Password still wrong → Check Secrets Manager format
- Security group missing → Verify Action 3
- Wrong database name → Check RDS "DB name" field

---

### Problem: Health check returns 502

**Try these in order:**
1. Wait 1 more minute (deployment might not be complete)
2. Check if tasks are RUNNING (not STOPPED)
3. Check CloudWatch logs for errors
4. Verify target group shows "healthy"

---

### Problem: "password authentication failed" in logs

**Cause:** RDS password hasn't been applied yet OR wrong password

**Fix:**
1. Wait 2 more minutes
2. Go to RDS → Check if modification is complete
3. Double-check Secrets Manager has `LiteEvent2026Pass`
4. Force new deployment again

---

### Problem: Tasks immediately stop after starting

**Check CloudWatch logs for:**
- Database connection errors → Fix password/security
- Missing environment variables → Check Secrets Manager
- Application errors → Check your code

---

## 🆘 STILL NOT WORKING?

**Send me these 3 things:**

1. **ECS Service Status:**
   - Screenshot or describe: Running count, Status, Health

2. **CloudWatch Logs Error:**
   - Go to CloudWatch Logs (Test 3 link above)
   - Copy the ERROR message from the newest log stream

3. **RDS & Secret Details:**
   - RDS endpoint: `______________________`
   - RDS DB name (from Configuration tab): `______________________`
   - Secrets Manager "database" field value: `______________________`

---

## 🎯 AFTER IT'S WORKING

### Test Your DNS (wait 10-30 minutes):
```
http://liteevent.com
http://api.liteevent.com/health
http://vendors.liteevent.com
```

### Set Up Monitoring:
1. Create CloudWatch alarms for:
   - API health check failures
   - High CPU/memory usage
   - Database connection errors

2. Set up SNS notifications for alerts

### Change Password (security):
1. Generate a strong password
2. Update RDS
3. Update Secrets Manager (remember to URL-encode!)
4. Force new deployment

---

## 📊 SUMMARY

**What we fixed:**
1. ✅ Database password mismatch
2. ✅ Security groups (ECS → RDS access)
3. ✅ Service STOPPED status → changed to ACTIVE
4. ✅ Deployed all 3 services (API, Web, Vendors)

**Time invested:** ~10-15 minutes  
**Result:** Fully functional production environment

---

**START NOW:** Begin with Action 1 (Update RDS Password)!
