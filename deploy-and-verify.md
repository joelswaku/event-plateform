# 🚀 Complete Deployment & Verification

## Current Status
✅ DNS records added
❌ Database connection failing (502 error)

---

## 🔧 Step 1: Fix Database Connection (CRITICAL)

### A) Update RDS Password

1. **Go to RDS:** https://console.aws.amazon.com/rds/home?region=us-east-1#databases:

2. **Click your database** (liteevent-production-postgres or similar)

3. **Copy the Endpoint** - Write it here: `___________________________`

4. **Click "Modify"**
   - Scroll to "Master password"
   - Enter: `LiteEvent2026Pass`
   - Scroll down
   - Check ✅ "Apply immediately"
   - Click "Modify DB instance"
   - **Wait 2-3 minutes**

### B) Update Secrets Manager

1. **Go to Secrets:** https://console.aws.amazon.com/secretsmanager/secret?name=liteevent%2Fproduction%2Fdatabase&region=us-east-1

2. **Click "Retrieve secret value"**

3. **Click "Edit"**

4. **Replace with this** (use YOUR endpoint from step A.3):

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

5. **Click "Save"**

### C) Check Security Groups

1. **Get ECS Security Group ID:**
   - Go to: https://console.aws.amazon.com/ec2/home?region=us-east-1#SecurityGroups:
   - Search: `liteevent-production-ecs-tasks-sg`
   - Copy the ID: `sg-_______________`

2. **Check RDS Security Group:**
   - Go back to RDS → Your database → Connectivity & security
   - Click the security group link
   - Go to "Inbound rules" tab
   - **Must have this rule:**
     - Type: PostgreSQL
     - Port: 5432
     - Source: (ECS security group ID from above)

3. **If missing, add it:**
   - Click "Edit inbound rules"
   - Click "Add rule"
   - Type: PostgreSQL
   - Port: 5432
   - Source: Custom → (paste ECS security group ID)
   - Click "Save rules"

---

## 🚀 Step 2: Deploy All Services

### A) Force API Service Deployment

1. **Go to ECS:** https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services?region=us-east-1

2. **Click:** `liteevent-production-api-service`

3. **Click "Update"** (top right orange button)

4. Check ✅ "Force new deployment"

5. **Click "Update"**

6. **Wait 2-3 minutes** - watch "Running count" become 2/2

### B) Force Web Service Deployment

1. Go back to services list

2. **Click:** `liteevent-production-web-service`

3. **Click "Update"**

4. Check ✅ "Force new deployment"

5. **Click "Update"**

6. **Wait 2-3 minutes**

### C) Force Vendors Service Deployment

1. Go back to services list

2. **Click:** `liteevent-production-vendors-service`

3. **Click "Update"**

4. Check ✅ "Force new deployment"

5. **Click "Update"**

6. **Wait 2-3 minutes**

---

## ✅ Step 3: Verify Everything Works

### Test 1: ALB Health Check

**Open in browser:**
```
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health
```

**Expected:**
```json
{
  "success": true,
  "message": "API is healthy",
  "uptime": 123.45,
  "environment": "production"
}
```

**If you see 502:** Check CloudWatch logs for new error

---

### Test 2: API Root Endpoint

**Open in browser:**
```
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/
```

**Expected:**
```json
{
  "success": true,
  "message": "Welcome to Event Platform API",
  "version": "1.0.0",
  "docs": "/api/docs",
  "health": "/health"
}
```

---

### Test 3: Web Frontend

**Open in browser:**
```
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com
```

**Expected:** Should see your landing page (not 502 error)

---

### Test 4: DNS Records

**What DNS records did you add?**

If you added:
- `liteevent.com` → ALB
- `api.liteevent.com` → ALB
- `vendors.liteevent.com` → ALB

**Test them:**

```
http://liteevent.com/health
http://api.liteevent.com/health
http://vendors.liteevent.com
```

**Note:** DNS can take 5-60 minutes to propagate!

---

## 📊 Step 4: Monitor Deployment

### A) Check ECS Service Status

**For each service (API, Web, Vendors):**

1. Go to: https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services?region=us-east-1

2. Check each service shows:
   - ✅ Status: ACTIVE
   - ✅ Running count: 2/2 (or 1/1 for web/vendors)
   - ✅ Health: HEALTHY

### B) Check CloudWatch Logs

**API Logs:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

**Look for:**
```
✅ [INFO] Server running on port 5000
✅ [INFO] Database connected successfully
✅ [INFO] ✓ Database connection successful
```

**Should NOT see:**
```
❌ [ERROR] Database connection failed
❌ [ERROR] password authentication failed
```

### C) Check Target Group Health

**Go to:** https://console.aws.amazon.com/ec2/home?region=us-east-1#TargetGroups:

**For each target group starting with `liteevent-production`:**
1. Click it
2. Go to "Targets" tab
3. All targets should show: ✅ **healthy** (green)

---

## 🎯 Success Criteria

### All these should be ✅:

- [ ] RDS password updated
- [ ] Secrets Manager updated
- [ ] Security group allows ECS → RDS
- [ ] API service: 2/2 running, HEALTHY
- [ ] Web service: 1/1 running, HEALTHY
- [ ] Vendors service: 1/1 running, HEALTHY
- [ ] ALB health check returns 200 OK
- [ ] No errors in CloudWatch logs
- [ ] All target groups show healthy targets
- [ ] DNS records pointing to ALB

---

## 🔍 Troubleshooting

### If API still shows 502:

1. **Check CloudWatch Logs** - what's the new error?
2. **Check ECS Tasks** - are they running or stopped?
3. **Check RDS** - did the password modification complete?

### If DNS not working:

- DNS takes 5-60 minutes to propagate
- Test with ALB URL first
- Check your DNS provider settings
- Verify CNAME/A records point to correct ALB

### If containers keep restarting:

1. Check logs for startup errors
2. Verify all secrets exist
3. Check database name matches (could be `eventplatform` vs `liteevent_prod`)

---

## 📋 Quick Status Check Commands

### Check if RDS is accessible from your location:

Open terminal and run:
```bash
nslookup YOUR-RDS-ENDPOINT
```

Should resolve to an IP address.

### Check DNS propagation:

```
https://www.whatsmydns.net/#CNAME/liteevent.com
```

Enter your domain and check if it resolves globally.

---

## 🆘 What to Send Me If Issues

1. **CloudWatch Logs** - latest error message
2. **ECS Status** - running count for each service
3. **Target Health** - screenshot or description
4. **Test Results** - what URLs work/don't work

---

## 🎉 When Everything Works

You should be able to access:

- ✅ `http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com` → Web
- ✅ `http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health` → API health
- ✅ `http://liteevent.com` → Web (after DNS propagates)
- ✅ `http://api.liteevent.com/health` → API health (after DNS propagates)
- ✅ `http://vendors.liteevent.com` → Vendors portal (after DNS propagates)

**Total deployment time: ~10 minutes**

Let me know what happens after Step 1 (fixing database connection)!
