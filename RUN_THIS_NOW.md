# ⚡ RUN THIS NOW - Step by Step

## 🎯 Your Mission: Fix 502 Error & Deploy Everything

**Time needed:** 10-15 minutes
**Current issue:** Database connection failed → 502 Bad Gateway

---

## ✅ STEP 1: Fix Database Password (5 mins)

### 1A. Update RDS Password

**Open this URL:**
```
https://console.aws.amazon.com/rds/home?region=us-east-1#databases:
```

**Do this:**
1. ✅ Click your database (liteevent-production-postgres)
2. ✅ **COPY the Endpoint** - write it here: `_______________________`
3. ✅ Click "Modify" button
4. ✅ Scroll to "Master password"
5. ✅ Enter: `LiteEvent2026Pass`
6. ✅ Scroll to bottom
7. ✅ Check "Apply immediately" ✅
8. ✅ Click "Modify DB instance"
9. ✅ **Wait 2 minutes** (set a timer!)

---

### 1B. Update Secrets Manager

**Open this URL:**
```
https://console.aws.amazon.com/secretsmanager/secret?name=liteevent%2Fproduction%2Fdatabase&region=us-east-1
```

**Do this:**
1. ✅ Click "Retrieve secret value"
2. ✅ Click "Edit"
3. ✅ **DELETE everything**
4. ✅ **PASTE this** (replace YOUR-ENDPOINT with the one you copied in step 1A.2):

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

5. ✅ Click "Save"

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

---

### 1C. Check Security Groups

**Open this URL:**
```
https://console.aws.amazon.com/ec2/home?region=us-east-1#SecurityGroups:
```

**Do this:**
1. ✅ Search for: `liteevent-production-ecs-tasks-sg`
2. ✅ Click on it
3. ✅ **COPY the Security group ID** (looks like sg-0abc123): `_____________`
4. ✅ Go back and search for: `rds` or look for RDS security group
5. ✅ Click on the RDS security group
6. ✅ Go to "Inbound rules" tab
7. ✅ **CHECK if there's a rule:**
   - Type: PostgreSQL
   - Port: 5432
   - Source: (the ECS security group you copied)

**If you DON'T see this rule:**
1. ✅ Click "Edit inbound rules"
2. ✅ Click "Add rule"
3. ✅ Type: PostgreSQL
4. ✅ Port: 5432
5. ✅ Source: Custom → paste the ECS security group ID
6. ✅ Description: "Allow ECS to access RDS"
7. ✅ Click "Save rules"

---

## ✅ STEP 2: Deploy All Services (3 mins)

### 2A. Deploy API Service

**Open this URL:**
```
https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services?region=us-east-1
```

**Do this:**
1. ✅ Click: `liteevent-production-api-service`
2. ✅ Click "Update" button (top right, orange)
3. ✅ Check the box: "Force new deployment" ✅
4. ✅ Scroll to bottom
5. ✅ Click "Update"
6. ✅ **Wait 2 minutes** - watch "Running count" become 2/2

---

### 2B. Deploy Web Service

**Go back to services list** (click "Services" in breadcrumb)

**Do this:**
1. ✅ Click: `liteevent-production-web-service`
2. ✅ Click "Update"
3. ✅ Check: "Force new deployment" ✅
4. ✅ Click "Update"
5. ✅ **Wait 2 minutes**

---

### 2C. Deploy Vendors Service

**Go back to services list**

**Do this:**
1. ✅ Click: `liteevent-production-vendors-service`
2. ✅ Click "Update"
3. ✅ Check: "Force new deployment" ✅
4. ✅ Click "Update"
5. ✅ **Wait 2 minutes**

---

## ✅ STEP 3: Verify Everything Works (2 mins)

### 3A. Test API Health

**Open in browser:**
```
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health
```

**You should see:**
```json
{
  "success": true,
  "message": "API is healthy"
}
```

**If you see 502:**
- Wait 1 more minute (deployment might not be complete)
- Then go to Step 4 below

---

### 3B. Test Web Frontend

**Open in browser:**
```
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com
```

**You should see:** Your landing page (NOT 502 error)

---

### 3C. Check Logs

**Open this URL:**
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi
```

**Do this:**
1. ✅ Click the NEWEST log stream (top of the list)
2. ✅ Look for messages like:
   ```
   [INFO] Server running on port 5000
   [INFO] Database connected successfully
   ```

**You should NOT see:**
```
[ERROR] Database connection failed
```

---

## ✅ STEP 4: If Still Not Working

### Check CloudWatch Logs for New Error

**Same URL as Step 3C above**

**Look for any ERROR messages and tell me:**
1. What's the error message?
2. What's the exact text?

**Common errors after the fix:**
- "password authentication failed" → RDS password not applied yet, wait 2 more mins
- "ECONNREFUSED" → Security group issue, double-check Step 1C
- "getaddrinfo ENOTFOUND" → Wrong endpoint in secret, double-check Step 1B

---

## ✅ STEP 5: Test Your Domain Names (Optional - DNS takes time)

**Wait 10-30 minutes**, then test:

```
http://liteevent.com
http://api.liteevent.com/health
http://vendors.liteevent.com
```

**Check DNS propagation:**
```
https://www.whatsmydns.net/#CNAME/liteevent.com
```

Should point to: `liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com`

---

## 📊 Success Checklist

After completing all steps, you should have:

- [✅] RDS password: `LiteEvent2026Pass`
- [✅] Secrets Manager updated with correct endpoint
- [✅] Security group allows ECS → RDS
- [✅] API service deployed: 2/2 running
- [✅] Web service deployed: 1/1 running  
- [✅] Vendors service deployed: 1/1 running
- [✅] `/health` returns 200 OK
- [✅] Web frontend loads (no 502)
- [✅] No errors in CloudWatch logs
- [ ] DNS working (wait 10-30 mins)

---

## 🎉 DONE!

When you complete all steps, you should be able to access:

✅ `http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com` → Working!
✅ `http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health` → {"success":true}

**After DNS propagates:**
✅ `http://liteevent.com` → Your site!
✅ `http://api.liteevent.com` → Your API!

---

## 🆘 Problems?

**Tell me:**
1. Which step failed?
2. What error message do you see?
3. Screenshot of CloudWatch logs (if API still failing)

**START WITH STEP 1 NOW!** ⚡
