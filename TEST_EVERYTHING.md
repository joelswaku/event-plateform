# 🧪 Test Everything After Deployment

## Quick Test URLs

### Via ALB (works immediately)
```
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/
http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/api/docs
```

### Via DNS (after propagation - 5-60 mins)
```
http://liteevent.com
http://api.liteevent.com/health
http://vendors.liteevent.com
```

---

## ✅ Test Checklist

### 1. API Health Check
**URL:** `http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health`

**Expected Response:**
```json
{
  "success": true,
  "message": "API is healthy",
  "uptime": 123.45,
  "timestamp": "2026-06-18T...",
  "environment": "production"
}
```

**Status:** [ ] Pass [ ] Fail

---

### 2. API Root
**URL:** `http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/`

**Expected Response:**
```json
{
  "success": true,
  "message": "Welcome to Event Platform API",
  "version": "1.0.0",
  "docs": "/api/docs",
  "health": "/health"
}
```

**Status:** [ ] Pass [ ] Fail

---

### 3. Web Frontend
**URL:** `http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com`

**Expected:** Landing page loads (not 502)

**Status:** [ ] Pass [ ] Fail

---

### 4. API Documentation
**URL:** `http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/api/docs`

**Expected:** Swagger/OpenAPI documentation page

**Status:** [ ] Pass [ ] Fail

---

### 5. Vendors Portal
**URL:** Use ALB URL (routing should work)

**Expected:** Vendors portal loads

**Status:** [ ] Pass [ ] Fail

---

### 6. DNS Resolution (wait 5-60 mins)
**URL:** `http://liteevent.com`

**Expected:** Same as web frontend

**Status:** [ ] Pass [ ] Fail [ ] Waiting for DNS

---

### 7. API via DNS
**URL:** `http://api.liteevent.com/health`

**Expected:** Same as API health check

**Status:** [ ] Pass [ ] Fail [ ] Waiting for DNS

---

## 🔍 Check AWS Services Status

### ECS Services
https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services?region=us-east-1

- [ ] liteevent-production-api-service: 2/2 running, HEALTHY
- [ ] liteevent-production-web-service: 1/1 running, HEALTHY
- [ ] liteevent-production-vendors-service: 1/1 running, HEALTHY

### Target Groups
https://console.aws.amazon.com/ec2/home?region=us-east-1#TargetGroups:

- [ ] liteevent-production-api-tg: All targets healthy
- [ ] liteevent-production-web-tg: All targets healthy
- [ ] liteevent-production-vendors-tg: All targets healthy

### CloudWatch Logs (No Errors)
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups

- [ ] /ecs/liteevent-production/api: No ERROR messages
- [ ] /ecs/liteevent-production/web: No ERROR messages
- [ ] /ecs/liteevent-production/vendors: No ERROR messages

---

## 🎯 Full Functionality Tests

### Test User Registration
```bash
curl -X POST http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected:** Success response with user data

---

### Test Login
```bash
curl -X POST http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected:** Success response with JWT token

---

## 📊 Performance Tests

### Check Response Time
```bash
curl -w "\nTime: %{time_total}s\n" \
  http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health
```

**Expected:** < 1 second

---

### Check SSL (if configured)
```bash
curl https://liteevent.com/health
```

**Expected:** Works if you have ACM certificate configured

---

## 🔐 Security Checks

### Headers Check
```bash
curl -I http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health
```

**Look for:**
- X-Content-Type-Options
- X-Frame-Options
- Content-Security-Policy

---

## 🌐 DNS Propagation Check

**Tool:** https://www.whatsmydns.net/

**Test these:**
1. `liteevent.com` → Should point to ALB
2. `api.liteevent.com` → Should point to ALB
3. `vendors.liteevent.com` → Should point to ALB

**ALB DNS Name:** `liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com`

---

## ✅ All Systems Go Checklist

**Infrastructure:**
- [ ] RDS database accessible
- [ ] Security groups configured
- [ ] Secrets Manager populated
- [ ] ECR images pushed
- [ ] ECS tasks running
- [ ] ALB routing correctly
- [ ] Target groups healthy

**Application:**
- [ ] API responds to /health
- [ ] Web frontend loads
- [ ] Vendors portal loads
- [ ] Database connections work
- [ ] No errors in logs

**DNS:**
- [ ] DNS records added
- [ ] DNS propagated (check whatsmydns.net)
- [ ] All domains resolve correctly

**Functionality:**
- [ ] Can register new user
- [ ] Can login
- [ ] Can access protected routes
- [ ] Response times acceptable

---

## 🎉 Success Indicators

**You know everything is working when:**

1. ✅ All ECS services show 2/2 or 1/1 running
2. ✅ All target groups show healthy
3. ✅ Health endpoint returns 200 OK
4. ✅ No errors in CloudWatch logs
5. ✅ Web frontend loads without 502
6. ✅ Can login and use the app
7. ✅ DNS resolves (after propagation)

---

## 🆘 If Something Fails

**Share with me:**
1. Which test failed
2. Error message received
3. Status of ECS services (running count)
4. Latest CloudWatch log error

I'll help you fix it immediately!
