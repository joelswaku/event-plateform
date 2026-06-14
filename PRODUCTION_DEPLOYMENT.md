# 🚀 LiteEvent Production Deployment Guide

**Production-only deployment** optimized for launch at **$120-150/month**.

No staging environment needed until you have traffic and revenue to justify it.

---

## 📋 Overview

### What You're Deploying

```
Production Environment (Single Environment)
├── ECS Fargate (3 services, 1 task each)
├── RDS PostgreSQL (db.t4g.micro, Single-AZ)
├── CloudFront CDN
├── VPC Endpoints (NO NAT Gateway)
├── Secrets Manager (all secrets encrypted)
├── GitHub OIDC (no AWS keys)
├── SES (email delivery)
└── ECS Exec (container debugging)
```

### What's NOT Included (Cost Savings)

```
✗ NAT Gateway (-$45/month)
✗ Redis (-$12/month)
✗ Multi-AZ RDS (-$45/month)
✗ Staging environment (-$100/month)
─────────────────────────────
  Total savings: -$202/month
```

### Target Cost

**$120-150/month** for production-only deployment

---

## ⚡ Quick Start (60 minutes)

### Step 1: AWS Prerequisites (10 min)

```bash
# Install AWS CLI
brew install awscli  # macOS
# or: https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure
```

**You need:**
- AWS account with admin access
- AWS CLI installed and configured
- Terraform >= 1.0 installed

### Step 2: Create SSL Certificate (15 min)

1. Go to **AWS Certificate Manager** (us-east-1 region)
2. Click **"Request certificate"**
3. Add domains:
   - `liteevent.com`
   - `*.liteevent.com` (wildcard)
4. Choose **DNS validation**
5. Add CNAME records to your DNS provider
6. Wait for "Issued" status (5-30 minutes)
7. **Copy the certificate ARN** (you'll need it)

### Step 3: Create Terraform Backend (5 min)

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://liteevent-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket liteevent-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket liteevent-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name liteevent-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 4: Prepare to Use Secrets Manager

**DO NOT generate secrets yet.**

Terraform will create empty Secrets Manager containers, then you'll populate them securely after deployment.

This is safer than storing secrets in `terraform.tfvars`.

### Step 5: Configure Terraform (10 min)

```bash
cd terraform/environments/production

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Fill in these values (NO SECRETS IN THIS FILE!):**

```hcl
# ========================================
# AWS Configuration
# ========================================
aws_region   = "us-east-1"
project_name = "liteevent"
environment  = "production"

# ========================================
# SSL Certificate (from Step 2)
# ========================================
acm_certificate_arn            = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID"
acm_certificate_arn_cloudfront = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID"

# ========================================
# Domain Names
# ========================================
domain_name         = "liteevent.com"
web_domain_name     = "liteevent.com"
vendors_domain_name = "vendors.liteevent.com"
frontend_url        = "https://liteevent.com"

# ========================================
# Database - METADATA ONLY (secrets go in Secrets Manager)
# ========================================
db_name     = "liteevent"
db_username = "liteevent_admin"
db_password = "placeholder"  # Will be replaced in Secrets Manager

# ========================================
# GitHub OIDC
# ========================================
github_org  = "your-github-username"
github_repo = "event-plateform"

# ========================================
# Application Secrets - PLACEHOLDERS ONLY
# ========================================
# Real values will be added to Secrets Manager after terraform apply
jwt_secret         = "placeholder"
jwt_refresh_secret = "placeholder"

# ========================================
# Stripe - PUBLIC KEY ONLY (secret goes in Secrets Manager)
# ========================================
stripe_secret_key      = "placeholder"  # Will be added to Secrets Manager
stripe_publishable_key = "pk_live_..."  # This is safe (public key)
stripe_webhook_secret  = "placeholder"  # Will be added to Secrets Manager

# ========================================
# Google OAuth - PUBLIC ID ONLY
# ========================================
google_client_id     = "YOUR_CLIENT_ID.apps.googleusercontent.com"  # Safe (public)
google_client_secret = "placeholder"  # Will be added to Secrets Manager

# ========================================
# Cloudinary (optional) - PLACEHOLDERS
# ========================================
cloudinary_cloud_name = "your-cloud-name"  # Safe (public)
cloudinary_api_key    = "placeholder"      # Will be added to Secrets Manager
cloudinary_api_secret = "placeholder"      # Will be added to Secrets Manager

# ========================================
# Cost Optimization (DO NOT CHANGE for launch)
# ========================================
enable_redis = false  # Keep disabled for launch
db_instance_class = "db.t4g.micro"
```

**Important:** All sensitive values will be added to AWS Secrets Manager after `terraform apply`.

### Step 6: Deploy Infrastructure (20 min)

```bash
cd terraform/environments/production

# Initialize Terraform
terraform init

# Preview what will be created
terraform plan

# Deploy! (takes 15-20 minutes)
terraform apply

# Type "yes" when prompted

# Save outputs for reference
terraform output > outputs.txt
```

**What gets created:**
- VPC with public/private subnets
- 7 VPC Endpoints (ECR, Logs, SSM, S3, etc.)
- RDS PostgreSQL database
- ECS Fargate cluster with 3 services
- Application Load Balancer
- CloudFront distributions
- S3 buckets
- Secrets Manager secrets
- IAM roles and security groups
- ~80-100 AWS resources total

### Step 7: Populate Secrets Manager (10 min)

**Now add your real secrets to AWS Secrets Manager:**

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
DB_PASSWORD=$(openssl rand -base64 32)

# Update database secret
aws secretsmanager update-secret \
  --secret-id liteevent/production/database \
  --secret-string "{
    \"username\": \"liteevent_admin\",
    \"password\": \"$DB_PASSWORD\",
    \"host\": \"$(terraform output -raw rds_endpoint)\",
    \"port\": 5432,
    \"dbname\": \"liteevent\",
    \"url\": \"postgresql://liteevent_admin:$DB_PASSWORD@$(terraform output -raw rds_endpoint)/liteevent\"
  }"

# Update JWT secrets
aws secretsmanager update-secret \
  --secret-id liteevent/production/jwt \
  --secret-string "{
    \"jwt_secret\": \"$JWT_SECRET\",
    \"jwt_refresh_secret\": \"$JWT_REFRESH_SECRET\"
  }"

# Update Stripe secrets
aws secretsmanager update-secret \
  --secret-id liteevent/production/stripe \
  --secret-string "{
    \"secret_key\": \"sk_live_YOUR_STRIPE_SECRET_KEY\",
    \"publishable_key\": \"pk_live_YOUR_STRIPE_PUBLISHABLE_KEY\",
    \"webhook_secret\": \"whsec_YOUR_WEBHOOK_SECRET\"
  }"

# Update Google OAuth secrets
aws secretsmanager update-secret \
  --secret-id liteevent/production/google-oauth \
  --secret-string "{
    \"client_id\": \"YOUR_CLIENT_ID.apps.googleusercontent.com\",
    \"client_secret\": \"YOUR_GOOGLE_CLIENT_SECRET\"
  }"

# Optional: Update Cloudinary secrets
aws secretsmanager update-secret \
  --secret-id liteevent/production/cloudinary \
  --secret-string "{
    \"cloud_name\": \"your-cloud-name\",
    \"api_key\": \"YOUR_CLOUDINARY_API_KEY\",
    \"api_secret\": \"YOUR_CLOUDINARY_API_SECRET\"
  }"
```

**Verify secrets were updated:**
```bash
# View database secret (to confirm it worked)
aws secretsmanager get-secret-value \
  --secret-id liteevent/production/database \
  --query SecretString \
  --output text | jq .
```

**Important:** These commands update the Terraform-created secret containers with your actual values. ECS tasks will automatically read these on startup.

### Step 8: Configure DNS (5 min)

```bash
# Get DNS configuration
terraform output dns_configuration
```

**Add these records to your DNS provider:**

```
Type    Name                      Value
────    ────────────────────      ────────────────────────────────
A       liteevent.com             → ALB DNS (from output)
CNAME   www.liteevent.com         → liteevent.com
A       vendors.liteevent.com     → ALB DNS (from output)
A       api.liteevent.com         → ALB DNS (from output)
TXT     _amazonses.liteevent.com  → SES verification token
```

**For Route53:**
- Use "Alias" records pointing to ALB
- Get ALB DNS from: `terraform output alb_dns_name`

### Step 9: Verify VPC Endpoints (2 min)

**Verify all 7 VPC Endpoints are available:**

```bash
# Check VPC endpoints (should show 7 total)
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=$(terraform output -raw vpc_id)" \
  --query 'VpcEndpoints[].{Service:ServiceName,State:State}' \
  --output table

# Should show:
# 1. com.amazonaws.us-east-1.s3 (Gateway - FREE)
# 2. com.amazonaws.us-east-1.ecr.api (Interface)
# 3. com.amazonaws.us-east-1.ecr.dkr (Interface)
# 4. com.amazonaws.us-east-1.logs (Interface)
# 5. com.amazonaws.us-east-1.ssm (Interface)
# 6. com.amazonaws.us-east-1.ssmmessages (Interface)
# 7. com.amazonaws.us-east-1.ec2messages (Interface)
```

**All endpoints should show `State: available`**

**This confirms ECS tasks can:**
- ✅ Pull Docker images from ECR (no NAT needed)
- ✅ Send logs to CloudWatch (no NAT needed)
- ✅ Use ECS Exec via SSM (no NAT needed)
- ✅ Access S3 (no NAT needed)

**Cost:** 6 interface endpoints × $7/month = $42/month (S3 gateway is free)

### Step 10: Verify SES Domain (5 min)

```bash
# Check verification status
aws ses get-identity-verification-attributes \
  --identities liteevent.com \
  --region us-east-1
```

**Request production access:**
1. Go to **AWS Console** → **SES** → **Account Dashboard**
2. Click **"Request production access"**
3. Fill out form:
   - Mail type: Transactional
   - Website: liteevent.com
   - Use case: "Event ticketing platform sending confirmations and notifications"
4. AWS typically approves within 24 hours

### Step 11: Set Up GitHub (10 min)

**Create GitHub Environment:**

1. Go to your GitHub repo
2. **Settings** → **Environments**
3. Click **"New environment"**
4. Name: `production`
5. **Add protection rules:**
   - ✅ Required reviewers (add yourself)
   - ✅ Wait timer: 0 minutes
6. Click **"Save protection rules"**

**Add GitHub Secrets:**

1. **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add these secrets:

```
Name: AWS_ACCOUNT_ID
Value: 123456789012 (your AWS account ID)

Name: PRODUCTION_API_URL
Value: https://api.liteevent.com

Name: PRODUCTION_STRIPE_PUBLISHABLE_KEY
Value: pk_live_... (from Stripe dashboard)
```

### Step 12: Deploy Application (10 min)

**First, update the backend bucket name in `main.tf`:**

```bash
# Edit production main.tf
nano terraform/environments/production/main.tf

# Change line 13:
backend "s3" {
  bucket = "liteevent-terraform-state"  # Update this to your bucket name
  ...
}
```

**Then push to GitHub:**

```bash
# Commit and push to main branch
git add .
git commit -m "Deploy to production"
git push origin main
```

**GitHub Actions will:**
1. **Pause and wait for your approval** ✋
2. Go to **Actions** tab in GitHub
3. Click on the running workflow
4. Click **"Review deployments"**
5. Select **"production"**
6. Click **"Approve and deploy"**
7. GitHub will:
   - Build Docker images
   - Push to ECR
   - Deploy to ECS
   - Update all services

**Monitor deployment:**
```bash
# Watch the deployment
gh run watch  # or view in GitHub Actions tab
```

---

## ✅ Verify Everything Works

### Check ECS Services

```bash
# List running services
aws ecs list-services \
  --cluster liteevent-production-cluster

# Check service status
aws ecs describe-services \
  --cluster liteevent-production-cluster \
  --services liteevent-production-api-service \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

### Test Endpoints

```bash
# Test API
curl https://api.liteevent.com/health
# Should return: {"status":"ok"}

# Test Web
curl -I https://liteevent.com
# Should return: HTTP/2 200

# Test Vendors
curl -I https://vendors.liteevent.com
# Should return: HTTP/2 200
```

### View Logs

```bash
# API logs
aws logs tail /ecs/liteevent-production/api --follow

# Web logs
aws logs tail /ecs/liteevent-production/web --follow

# Vendors logs
aws logs tail /ecs/liteevent-production/vendors --follow
```

### Shell into Container (ECS Exec)

```bash
# Get running task
TASK=$(aws ecs list-tasks \
  --cluster liteevent-production-cluster \
  --service-name liteevent-production-api-service \
  --query 'taskArns[0]' \
  --output text)

# Exec into API container
aws ecs execute-command \
  --cluster liteevent-production-cluster \
  --task $TASK \
  --container api \
  --interactive \
  --command "/bin/sh"

# You're now inside the container!
$ ls
$ env | grep DATABASE
$ npm run migrate
$ exit
```

---

## 🔧 Daily Operations

### Deploy New Code

Just push to main:

```bash
git push origin main
# → GitHub prompts for approval
# → Approve in Actions tab
# → Auto-deploys
```

### Run Database Migrations

Add `[migrate]` to commit message:

```bash
git commit -m "Add users table [migrate]"
git push origin main
```

Or manually via ECS Exec:

```bash
TASK=$(aws ecs list-tasks --cluster liteevent-production-cluster --service-name liteevent-production-api-service --query 'taskArns[0]' --output text)

aws ecs execute-command \
  --cluster liteevent-production-cluster \
  --task $TASK \
  --container api \
  --interactive \
  --command "npm run migrate"
```

### View Secrets

```bash
# View database secret
aws secretsmanager get-secret-value \
  --secret-id liteevent/production/database \
  --query SecretString \
  --output text | jq .

# View JWT secrets
aws secretsmanager get-secret-value \
  --secret-id liteevent/production/jwt \
  --query SecretString \
  --output text | jq .
```

### Scale Up/Down

```bash
# Scale API to 2 tasks
aws ecs update-service \
  --cluster liteevent-production-cluster \
  --service liteevent-production-api-service \
  --desired-count 2

# Scale back to 1 task
aws ecs update-service \
  --cluster liteevent-production-cluster \
  --service liteevent-production-api-service \
  --desired-count 1
```

---

## 💰 Cost Monitoring

### View Current Spend

```bash
# Current month costs
aws ce get-cost-and-usage \
  --time-period Start=2026-06-01,End=2026-06-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost

# By service
aws ce get-cost-and-usage \
  --time-period Start=2026-06-01,End=2026-06-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

### Set Up Billing Alert

```bash
# Create budget alert at $150/month
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "LiteEvent-Monthly",
    "BudgetLimit": {
      "Amount": "150",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

---

## 📈 When to Upgrade

### Enable Redis ($12/month extra)

**When:**
- You need BullMQ job queues
- Session management required
- Rate limiting needed

**How:**
```hcl
# In terraform.tfvars
enable_redis = true
```

```bash
terraform apply
```

### Enable Multi-AZ ($45/month extra)

**When:**
- Can't afford 30-60 min database downtime
- Monthly revenue > $10,000
- Need 99.95% uptime

**How:**
```hcl
# In terraform.tfvars
db_instance_class = "db.t4g.small"
multi_az = true
```

```bash
terraform apply
```

### Add Staging Environment ($100/month extra)

**When:**
- You have 1,000+ active users
- Monthly revenue > $5,000-10,000
- Multiple developers need to test
- Can't afford production bugs

**Current recommendation:** Skip staging until you hit these metrics. Test locally and deploy to production with manual approval for now.

**Cost vs benefit:** Staging doubles your infrastructure cost. Wait until revenue justifies it.

### Scale ECS Tasks

**When:**
- High traffic (> 1,000 concurrent users)
- CPU/memory > 80%
- Response times > 500ms

**How:**
```bash
# Scale to 2 tasks
aws ecs update-service \
  --cluster liteevent-production-cluster \
  --service liteevent-production-api-service \
  --desired-count 2

# Or update terraform.tfvars:
api_desired_count = 2
web_desired_count = 2
vendors_desired_count = 2
```

---

## 🚨 Troubleshooting

### ECS Tasks Not Starting

```bash
# Check service events
aws ecs describe-services \
  --cluster liteevent-production-cluster \
  --services liteevent-production-api-service

# Check logs
aws logs tail /ecs/liteevent-production/api --follow

# Common issues:
# - Missing environment variables
# - Can't pull from ECR (check VPC endpoints)
# - Database connection failed
# - Health check failing
```

### Can't Pull from ECR

```bash
# Verify ECR endpoints exist
aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.us-east-1.ecr.api"

aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.us-east-1.ecr.dkr"

# Both should show "State": "available"
# and "PrivateDnsEnabled": true
```

### ECS Exec Not Working

```bash
# Verify SSM endpoints
aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.us-east-1.ssm"

# Should show 3 endpoints: ssm, ssmmessages, ec2messages
```

### High Costs

```bash
# Find expensive services
aws ce get-cost-and-usage \
  --time-period Start=2026-06-01,End=2026-06-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Common culprits:
# - Data transfer (check CloudFront)
# - ECS over-provisioned (check task count)
# - RDS idle (t4g.micro should be cheap)
```

---

## 📊 Monitoring

### CloudWatch Metrics

**Important metrics to watch:**
- ECS CPU Utilization
- ECS Memory Utilization
- RDS CPU Utilization
- RDS DatabaseConnections
- ALB TargetResponseTime
- ALB RequestCount

### Set Up Alarms

```bash
# High API CPU
aws cloudwatch put-metric-alarm \
  --alarm-name liteevent-api-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=liteevent-production-api-service Name=ClusterName,Value=liteevent-production-cluster

# Database connections
aws cloudwatch put-metric-alarm \
  --alarm-name liteevent-db-connections \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=liteevent-production-db
```

---

## 🎯 Launch Checklist

### Before Launch

- [ ] SSL certificate issued and validated
- [ ] Terraform applied successfully
- [ ] DNS records configured and propagated
- [ ] SES domain verified
- [ ] SES production access granted
- [ ] GitHub environment "production" created
- [ ] GitHub secrets configured
- [ ] Application deployed to ECS
- [ ] Database migrations run
- [ ] Health checks passing
- [ ] CloudWatch alarms configured
- [ ] Billing alerts set up

### Launch Day

- [ ] Monitor ECS service status
- [ ] Watch CloudWatch logs
- [ ] Check error rates in ALB metrics
- [ ] Monitor database connections
- [ ] Test all critical user flows
- [ ] Verify email delivery (SES)
- [ ] Check Stripe payments working
- [ ] Monitor costs in AWS Cost Explorer

### Post-Launch

- [ ] Review CloudWatch dashboards daily
- [ ] Check costs weekly
- [ ] Run database backups
- [ ] Test ECS Exec access
- [ ] Verify auto-scaling works
- [ ] Monitor SES bounce/complaint rates

---

## 📖 Additional Resources

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [GitHub OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

---

## 🆘 Need Help?

**Quick commands:**

```bash
# View infrastructure outputs
terraform output

# Shell into container
aws ecs execute-command --cluster liteevent-production-cluster --task <TASK> --container api --interactive --command "/bin/sh"

# View logs
aws logs tail /ecs/liteevent-production/api --follow

# Check service status
aws ecs describe-services --cluster liteevent-production-cluster --services liteevent-production-api-service
```

---

**Production-only deployment complete!**

Cost: **$120-150/month**

Upgrade to staging + Multi-AZ + Redis when revenue justifies the additional $150-200/month.
