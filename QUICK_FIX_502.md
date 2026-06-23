# ⚡ QUICK FIX - 502 Bad Gateway

## Error
```
[14:20:45.948] ERROR (1): Database connection failed
```

---

## 🎯 3-Minute Fix

### 1. Update RDS Password (2 min)

**Go to:** https://console.aws.amazon.com/rds/home?region=us-east-1#databases:

1. Click your database
2. Click "Modify"
3. Set Master password: `LiteEvent2026Pass`
4. Check "Apply immediately" ✅
5. Click "Modify DB instance"
6. **Copy the Endpoint** (e.g., `xyz.us-east-1.rds.amazonaws.com`)

### 2. Update Secrets Manager (1 min)

**Go to:** https://console.aws.amazon.com/secretsmanager/secret?name=liteevent%2Fproduction%2Fdatabase&region=us-east-1

1. Click "Retrieve secret value"
2. Click "Edit"
3. Paste this (replace `YOUR-ENDPOINT` with actual endpoint):

```json
{
  "url": "postgresql://liteevent_admin:LiteEvent2026Pass@YOUR-ENDPOINT:5432/liteevent_prod",
  "host": "YOUR-ENDPOINT",
  "port": "5432",
  "username": "liteevent_admin",
  "password": "LiteEvent2026Pass",
  "database": "liteevent_prod"
}
```

4. Click "Save"

### 3. Force New Deployment (30 sec)

**Go to:** https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service/health?region=us-east-1

1. Click "Update" button (top right)
2. Check "Force new deployment" ✅
3. Click "Update"

### 4. Wait & Verify (2 min)

**Test:** http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health

**Should return:**
```json
{"success":true,"message":"API is healthy"}
```

---

## 🔒 Security Note

After site is working, change password to something stronger:
1. Generate secure password
2. Update RDS
3. Update Secrets Manager (remember to URL-encode in `url` field!)
4. Force new deployment

---

## 🆘 If Still Not Working

Check CloudWatch Logs for new error:
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

**Common errors:**
- "password authentication failed" → Wait 3 mins for RDS password to apply
- "ECONNREFUSED" → Check security groups (see FIX_DATABASE_CONNECTION_NOW.md)
- "getaddrinfo ENOTFOUND" → Wrong endpoint in secret

**Send me the error and I'll help!**
