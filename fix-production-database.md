# 🔧 Fix Production Database Connection - FINAL FIX

## Problem
API container cannot connect to RDS database - password or connection string issue.

---

## ⚡ SOLUTION (Run on machine with AWS CLI)

### Step 1: Get RDS Endpoint

```bash
aws rds describe-db-instances \
  --db-instance-identifier liteevent-production-postgres \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

**Expected output:**
```
liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com
```

---

### Step 2: Update Secrets Manager with CORRECT Format

**CRITICAL:** The DATABASE_URL must be in this EXACT format:

```bash
# Get the endpoint first
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier liteevent-production-postgres \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Update secret with CORRECT format
aws secretsmanager update-secret \
  --secret-id liteevent/production/database \
  --secret-string "{
    \"username\": \"liteevent_admin\",
    \"password\": \"Liteeventswama\",
    \"engine\": \"postgres\",
    \"host\": \"$RDS_ENDPOINT\",
    \"port\": 5432,
    \"dbname\": \"liteevent_production\",
    \"url\": \"postgresql://liteevent_admin:Liteeventswama@$RDS_ENDPOINT:5432/liteevent_production\"
  }"
```

---

### Step 3: Verify Secret Format

```bash
aws secretsmanager get-secret-value \
  --secret-id liteevent/production/database \
  --query SecretString \
  --output text | jq '.'
```

**Should show:**
```json
{
  "username": "liteevent_admin",
  "password": "Liteeventswama",
  "engine": "postgres",
  "host": "liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "liteevent_production",
  "url": "postgresql://liteevent_admin:Liteeventswama@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"
}
```

---

### Step 4: Verify RDS Password

Check if RDS password was actually applied:

```bash
aws rds describe-db-instances \
  --db-instance-identifier liteevent-production-postgres \
  --query 'DBInstances[0].PendingModifiedValues'
```

**If output shows:**
```json
{
  "MasterUserPassword": "****"
}
```

**This means password change is PENDING!** You need to apply it immediately.

---

### Step 5: Force Apply RDS Password Change

**If password is pending, run:**

```bash
aws rds modify-db-instance \
  --db-instance-identifier liteevent-production-postgres \
  --master-user-password Liteeventswama \
  --apply-immediately
```

**Wait 2-3 minutes for it to apply.**

---

### Step 6: Test Database Connection

```bash
# Test if you can connect (from a machine with psql)
psql "postgresql://liteevent_admin:Liteeventswama@$RDS_ENDPOINT:5432/liteevent_production" -c "SELECT 1;"
```

**Should return:**
```
 ?column? 
----------
        1
(1 row)
```

---

### Step 7: Force New ECS Deployment

```bash
# Force API service to restart with new secrets
aws ecs update-service \
  --cluster liteevent-production-cluster \
  --service liteevent-production-api-service \
  --force-new-deployment
```

---

### Step 8: Monitor Deployment

```bash
# Watch service status
aws ecs describe-services \
  --cluster liteevent-production-cluster \
  --services liteevent-production-api-service \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'

# Watch logs
aws logs tail /ecs/liteevent-production-api --follow
```

**Look for:**
```
✅ [INFO] Database connected successfully
✅ [INFO] Server running on port 5000
```

---

## 🔍 Common Issues:

### Issue 1: "password authentication failed"

**Cause:** RDS password doesn't match Secrets Manager

**Fix:**
```bash
# Force RDS password update
aws rds modify-db-instance \
  --db-instance-identifier liteevent-production-postgres \
  --master-user-password Liteeventswama \
  --apply-immediately

# Wait 2-3 minutes, then restart ECS service
```

---

### Issue 2: "could not translate host name to address"

**Cause:** Wrong RDS endpoint in DATABASE_URL

**Fix:** Go back to Step 2, make sure you use the ACTUAL endpoint from Step 1

---

### Issue 3: "Connection refused"

**Cause:** Security group not allowing ECS → RDS

**Fix:**
```bash
# Get ECS security group
ECS_SG=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=*ecs-tasks*" \
  --query 'SecurityGroups[?contains(GroupName, `liteevent-production`)].GroupId' \
  --output text)

# Get RDS security group  
RDS_SG=$(aws rds describe-db-instances \
  --db-instance-identifier liteevent-production-postgres \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text)

# Add rule to allow ECS → RDS
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --source-group $ECS_SG
```

---

## ✅ Success Indicators:

After completing all steps, you should see:

1. **ECS Service:**
   - Running count: 1/1
   - Health status: HEALTHY

2. **CloudWatch Logs:**
   ```
   [INFO] Database connected successfully
   [INFO] Server running on port 5000
   ```

3. **API Health Check:**
   ```bash
   curl http://LOAD_BALANCER_DNS/health
   # Returns: {"success":true,"message":"API is healthy"}
   ```

---

## 📋 Quick Checklist:

- [ ] Get RDS endpoint
- [ ] Update Secrets Manager with correct format
- [ ] Verify secret contents
- [ ] Check if RDS password is pending
- [ ] Force apply RDS password if needed
- [ ] Wait 2-3 minutes
- [ ] Force new ECS deployment
- [ ] Monitor logs for success
- [ ] Test API health endpoint

---

**Run these commands from a machine with AWS CLI configured!**
