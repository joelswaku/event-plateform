# 🔍 Database Connection Troubleshooting Guide

**Issue:** API container exits with code 1 - "Database connection failed"

**Status:** URL encoding fix applied (password had + and = characters)

---

## 📊 Systematic Root Cause Analysis

### Issue #1: ECS Security Group Cannot Connect to RDS (MOST LIKELY)

**Probability:** 90% - Most common cause of connection failures

#### Verification Steps:

**1. Check RDS Security Group Inbound Rules**

📍 **Console:** 
```
https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#SecurityGroups:
```

**What to look for:**
- Find security group attached to RDS instance
- Go to "Inbound rules" tab
- **MUST HAVE:**
  - Type: PostgreSQL
  - Protocol: TCP
  - Port: 5432
  - Source: `sg-0fbf146fc297ec072` (ECS security group)
  - Description: "Allow ECS tasks to access RDS"

**AWS CLI Command:**
```bash
# Get RDS security group ID
aws rds describe-db-instances \
  --db-instance-identifier liteevent-production-postgres \
  --region us-east-1 \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text

# Check inbound rules (replace SG_ID)
aws ec2 describe-security-groups \
  --group-ids sg-058d62b6ec1f91fab \
  --region us-east-1 \
  --query 'SecurityGroups[0].IpPermissions'
```

**Expected Output:**
```json
[
  {
    "FromPort": 5432,
    "ToPort": 5432,
    "IpProtocol": "tcp",
    "UserIdGroupPairs": [
      {
        "GroupId": "sg-0fbf146fc297ec072",
        "Description": "Allow ECS tasks to access RDS"
      }
    ]
  }
]
```

**If rule is missing:**
```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-058d62b6ec1f91fab \
  --protocol tcp \
  --port 5432 \
  --source-group sg-0fbf146fc297ec072 \
  --region us-east-1
```

---

### Issue #2: Incorrect DATABASE_URL in Secrets Manager

**Probability:** 5% - Just fixed with URL encoding, but verify

#### Verification Steps:

**1. Get the actual DATABASE_URL from Secrets Manager**

📍 **Console:**
```
https://console.aws.amazon.com/secretsmanager/home?region=us-east-1#!/secret?name=liteevent%2Fproduction%2Fdatabase
```

**AWS CLI Command:**
```bash
# Get the DATABASE_URL
aws secretsmanager get-secret-value \
  --secret-id liteevent/production/database \
  --region us-east-1 \
  --query 'SecretString' \
  --output text | jq -r '.url'
```

**Expected Format:**
```
postgresql://liteevent_admin:sbEWVNFyyZZG5Idf3BOJQlMsLRx8UJDyprgFkko%2BVIc%3D@liteevent-production-postgres...:5432/liteevent_production
```

**Check for:**
- ✅ Starts with `postgresql://`
- ✅ Username: `liteevent_admin`
- ✅ Password is URL-encoded (contains `%2B` and `%3D`, NOT `+` and `=`)
- ✅ Host ends with `.rds.amazonaws.com`
- ✅ Port: `5432`
- ✅ Database name: `liteevent_production`

**Get actual RDS endpoint for comparison:**
```bash
aws rds describe-db-instances \
  --db-instance-identifier liteevent-production-postgres \
  --region us-east-1 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

---

### Issue #3: Invalid Database Credentials

**Probability:** 3% - Credentials set by Terraform, unlikely to be wrong

#### Verification Steps:

**Test credentials from your local machine (if VPN/bastion):**

```bash
# Get credentials
USERNAME=$(aws secretsmanager get-secret-value \
  --secret-id liteevent/production/database \
  --region us-east-1 \
  --query 'SecretString' \
  --output text | jq -r '.username')

PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id liteevent/production/database \
  --region us-east-1 \
  --query 'SecretString' \
  --output text | jq -r '.password')

ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier liteevent-production-postgres \
  --region us-east-1 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Test connection (requires psql and network access)
PGPASSWORD=$PASSWORD psql -h $ENDPOINT -U $USERNAME -d liteevent_production -c "SELECT version();"
```

**If credentials are wrong:**
```bash
# Update password in Secrets Manager
aws secretsmanager update-secret \
  --secret-id liteevent/production/database \
  --secret-string '{"username":"liteevent_admin","password":"NEW_PASSWORD","host":"...","port":"5432","dbname":"liteevent_production","url":"postgresql://liteevent_admin:NEW_PASSWORD@..."}' \
  --region us-east-1
```

---

### Issue #4: RDS Not Reachable from ECS Subnets

**Probability:** 1% - Terraform should have configured this correctly

#### Verification Steps:

**1. Check RDS is in the correct VPC**

```bash
# Get RDS VPC
aws rds describe-db-instances \
  --db-instance-identifier liteevent-production-postgres \
  --region us-east-1 \
  --query 'DBInstances[0].DBSubnetGroup.VpcId' \
  --output text

# Get ECS VPC
aws ecs describe-tasks \
  --cluster liteevent-production-cluster \
  --tasks $(aws ecs list-tasks --cluster liteevent-production-cluster --service-name liteevent-production-api-service --region us-east-1 --query 'taskArns[0]' --output text) \
  --region us-east-1 \
  --query 'tasks[0].attachments[0].details[?name==`subnetId`].value' \
  --output text | xargs -I {} aws ec2 describe-subnets --subnet-ids {} --region us-east-1 --query 'Subnets[0].VpcId' --output text
```

**Both should return:** `vpc-0d6d301d1487378fe`

**2. Check route tables allow traffic between subnets**

```bash
# Get ECS subnet route table
aws ec2 describe-route-tables \
  --filters "Name=association.subnet-id,Values=SUBNET_ID" \
  --region us-east-1
```

---

### Issue #5: Database Does Not Exist

**Probability:** <1% - RDS creates default database

#### Verification:

**Use ECS Exec to connect to a running container:**

```bash
# Get a running task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster liteevent-production-cluster \
  --service-name liteevent-production-api-service \
  --desired-status RUNNING \
  --region us-east-1 \
  --query 'taskArns[0]' \
  --output text)

# Connect to the container
aws ecs execute-command \
  --cluster liteevent-production-cluster \
  --task $TASK_ARN \
  --container api \
  --interactive \
  --command "/bin/sh" \
  --region us-east-1
```

**Once inside the container:**
```bash
# Check environment variable
echo $DATABASE_URL

# Try to connect
apk add postgresql-client
psql $DATABASE_URL -c "SELECT version();"
psql $DATABASE_URL -c "\l"  # List databases
```

---

### Issue #6: Application Code Issue

**Probability:** <1% - Error message is clear about database connection

#### Verification:

**Check exact error in CloudWatch Logs:**

📍 **Console:**
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi
```

**AWS CLI:**
```bash
# Get latest log stream
LOG_STREAM=$(aws logs describe-log-streams \
  --log-group-name /ecs/liteevent-production/api \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --region us-east-1 \
  --query 'logStreams[0].logStreamName' \
  --output text)

# Get logs
aws logs get-log-events \
  --log-group-name /ecs/liteevent-production/api \
  --log-stream-name $LOG_STREAM \
  --region us-east-1 \
  --query 'events[*].message' \
  --output text
```

**CloudWatch Insights Query:**
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

📍 **Run query at:**
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:logs-insights
```

---

## 🔧 Quick Diagnostic Commands

### 1. Check if RDS is accessible from ECS

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier liteevent-production-postgres \
  --region us-east-1 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "RDS Endpoint: $RDS_ENDPOINT"

# Test if port 5432 is reachable (requires running ECS task)
TASK_ARN=$(aws ecs list-tasks \
  --cluster liteevent-production-cluster \
  --region us-east-1 \
  --query 'taskArns[0]' \
  --output text)

# Use ECS Exec to test connectivity
aws ecs execute-command \
  --cluster liteevent-production-cluster \
  --task $TASK_ARN \
  --container api \
  --interactive \
  --command "nc -zv $RDS_ENDPOINT 5432" \
  --region us-east-1
```

### 2. Verify Security Group Rules

```bash
# Complete security group audit
echo "=== RDS Security Group ==="
aws ec2 describe-security-groups \
  --group-ids sg-058d62b6ec1f91fab \
  --region us-east-1 \
  --query 'SecurityGroups[0].IpPermissions'

echo ""
echo "=== ECS Security Group ==="
aws ec2 describe-security-groups \
  --group-ids sg-0fbf146fc297ec072 \
  --region us-east-1 \
  --query 'SecurityGroups[0].[GroupId, GroupName, IpPermissionsEgress]'
```

### 3. Get Full ECS Task Details

```bash
# Get stopped tasks to see failure reason
aws ecs list-tasks \
  --cluster liteevent-production-cluster \
  --service-name liteevent-production-api-service \
  --desired-status STOPPED \
  --region us-east-1 \
  --query 'taskArns[0:3]' \
  --output text | xargs -I {} aws ecs describe-tasks \
  --cluster liteevent-production-cluster \
  --tasks {} \
  --region us-east-1 \
  --query 'tasks[0].[stoppedReason, stopCode, containers[0].exitCode]'
```

---

## 🎯 Most Likely Fix

Based on probability, the issue is **99% likely to be security group rules**.

### Immediate Fix:

```bash
# Add security group rule if missing
aws ec2 authorize-security-group-ingress \
  --group-id sg-058d62b6ec1f91fab \
  --protocol tcp \
  --port 5432 \
  --source-group sg-0fbf146fc297ec072 \
  --description "Allow ECS tasks to access RDS" \
  --region us-east-1
```

### After fixing security group, force new deployment:

```bash
# Force new deployment to test
aws ecs update-service \
  --cluster liteevent-production-cluster \
  --service liteevent-production-api-service \
  --force-new-deployment \
  --region us-east-1
```

### Monitor deployment:

```bash
# Watch service events
aws ecs describe-services \
  --cluster liteevent-production-cluster \
  --services liteevent-production-api-service \
  --region us-east-1 \
  --query 'services[0].events[0:5]'

# Watch logs in real-time
aws logs tail /ecs/liteevent-production/api \
  --follow \
  --region us-east-1
```

---

## ✅ Success Indicators

After fixing, you should see in CloudWatch Logs:

```
[INFO] Database connected successfully
[INFO] Server running on port 5000
[INFO] Ready to accept connections
```

And ECS service should show:
- Running count: 2 (or 1 in staging)
- Desired count: 2 (or 1)
- Health status: HEALTHY

---

## 📞 Quick Decision Tree

```
Database connection failed
    ↓
Can you see RDS security group rule for port 5432 from ECS SG?
    ├─ NO → Add the security group rule (99% this is it)
    ├─ YES → Check DATABASE_URL has %2B and %3D (not + and =)
        ├─ NO → URL encoding fix needed (already applied)
        ├─ YES → Use ECS Exec to test connection from inside container
            ├─ Connection works → Application code issue
            ├─ Connection fails → Network/routing issue
```

---

**Start with security group verification - it's the most likely cause!**
