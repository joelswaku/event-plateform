# 🚀 LiteEvent AWS Deployment Guide

## Overview

This guide covers the complete deployment of LiteEvent to AWS using a cost-optimized, production-ready infrastructure.

### Architecture Highlights

✅ **NO NAT Gateway** - Uses VPC Endpoints instead (saves $45/month)  
✅ **GitHub OIDC** - No AWS access keys in CI/CD  
✅ **Secrets Manager** - All secrets encrypted at rest  
✅ **ECS Exec** - Shell into containers for debugging  
✅ **SES Only** - No third-party email services  
✅ **CloudFront CDN** - Fast global content delivery  
✅ **Auto-deployment** - Staging auto-deploys, Production requires approval

---

## 💰 Cost Estimate

### **Target: $100-140/month**

```
VPC Endpoints (6 interfaces):   $42/month  (ECR, Logs, SSM x3, S3 free)
Application Load Balancer:       $25/month
ECS Fargate (3 services):        $30/month  (1 task each, 512MB-1GB)
RDS PostgreSQL (db.t4g.micro):   $15/month  (single-AZ)
CloudFront CDN:                  $15/month  (first TB free, then minimal)
S3 Storage + CloudWatch:         $10/month
Secrets Manager:                 $2/month   (4 secrets)
ECR Storage:                     $2/month   (5 images per repo)
SES:                             $2/month   (62k emails free/month)
Route53:                         $1/month   (1 hosted zone)
Data Transfer:                   $5/month   (reduced via CloudFront)
────────────────────────────────────────
TOTAL:                           ~$149/month
```

**Monthly breakdown:**
- **Minimum (staging):** ~$100-120/month
- **Production:** ~$140-160/month
- **Both environments:** ~$250-280/month

---

## 🏗️ Architecture

### Network Architecture (NO NAT Gateway!)

```
┌─────────────────────────────────────────────────────────┐
│  Internet                                                │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
    ┌────────────────┐
    │   CloudFront   │  ← Global CDN
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │      ALB       │  ← HTTPS only (public subnets)
    └────────┬───────┘
             │
             ▼
    ┌────────────────────────────────────┐
    │   ECS Fargate (private subnets)    │
    │   ┌──────┐ ┌──────┐ ┌──────────┐  │
    │   │ API  │ │ Web  │ │ Vendors  │  │
    │   └──────┘ └──────┘ └──────────┘  │
    └────────┬──────────┬────────────────┘
             │          │
             │          ▼
             │   ┌────────────────┐
             │   │  VPC Endpoints │  ← Instead of NAT Gateway!
             │   ├────────────────┤
             │   │ ✓ ECR API      │
             │   │ ✓ ECR DKR      │
             │   │ ✓ CloudWatch   │
             │   │ ✓ SSM          │
             │   │ ✓ SSMMessages  │
             │   │ ✓ EC2Messages  │
             │   │ ✓ S3 (gateway) │
             │   └────────────────┘
             │
             ▼
    ┌────────────────┐
    │  RDS Postgres  │  ← db.t4g.micro, single-AZ
    └────────────────┘
```

### Key Differences from Traditional Setup:

| Component | Traditional | LiteEvent Architecture |
|-----------|-------------|------------------------|
| **Outbound internet** | NAT Gateway ($45/mo) | VPC Endpoints ($42/mo) |
| **Docker images** | Pull via NAT | ECR VPC Endpoints |
| **Logging** | Push via NAT | CloudWatch VPC Endpoint |
| **ECS Exec** | Via NAT | SSM VPC Endpoints |
| **S3 access** | Via NAT | S3 Gateway Endpoint (free!) |
| **Authentication** | AWS Keys | GitHub OIDC |
| **Secrets** | Environment vars | Secrets Manager |
| **Email** | Resend ($$$) | SES (62k free/month) |

---

## 📋 Prerequisites

### 1. AWS Account Setup

- [ ] AWS account with admin access
- [ ] AWS CLI installed and configured
- [ ] Terraform installed (>= 1.0)

### 2. Domain & SSL

- [ ] Domain registered (e.g., liteevent.com)
- [ ] ACM SSL certificate created in `us-east-1`
  - Domains: `*.liteevent.com`, `liteevent.com`
  - Validation: DNS (CNAME records added)
  - Status: Issued

### 3. GitHub Repository

- [ ] GitHub repository created
- [ ] GitHub Actions enabled

### 4. Secrets to Generate

```bash
# Generate JWT secrets (64 characters each)
openssl rand -base64 64

# Generate database password (32 characters)
openssl rand -base64 32
```

---

## 🔧 Setup Instructions

### Step 1: Create S3 Backend for Terraform State

```bash
# Create S3 bucket for state
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

### Step 2: Configure Staging Environment

```bash
cd terraform/environments/staging

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required values in `terraform.tfvars`:**

```hcl
# AWS Configuration
aws_region   = "us-east-1"
project_name = "liteevent"
environment  = "staging"

# Database (stored in Secrets Manager)
db_name     = "liteevent_staging"
db_username = "liteevent_admin"
db_password = "<STRONG_PASSWORD_HERE>"  # Generated above

# SSL Certificate
acm_certificate_arn            = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID"
acm_certificate_arn_cloudfront = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID"

# Domain Names
domain_name         = "liteevent.com"
web_domain_name     = "staging.liteevent.com"
vendors_domain_name = "vendors-staging.liteevent.com"
frontend_url        = "https://staging.liteevent.com"

# GitHub OIDC
github_org  = "your-github-org"
github_repo = "event-plateform"

# Application Secrets (stored in Secrets Manager)
jwt_secret              = "<64_CHAR_SECRET>"  # Generated above
jwt_refresh_secret      = "<DIFFERENT_64_CHAR_SECRET>"
stripe_secret_key       = "sk_test_..."  # Test key for staging
stripe_publishable_key  = "pk_test_..."
stripe_webhook_secret   = "whsec_..."
google_client_id        = "YOUR_CLIENT_ID.apps.googleusercontent.com"
google_client_secret    = "YOUR_CLIENT_SECRET"

# Optional: Cloudinary
cloudinary_cloud_name = "your-cloud"
cloudinary_api_key    = "your-key"
cloudinary_api_secret = "your-secret"

# Cost Optimization
enable_redis = false  # Not needed for launch
```

### Step 3: Deploy Staging Infrastructure

```bash
cd terraform/environments/staging

# Initialize Terraform
terraform init

# Review what will be created
terraform plan

# Deploy! (takes ~15-20 minutes)
terraform apply

# Save outputs for reference
terraform output > outputs.txt
```

### Step 4: Configure DNS

After Terraform completes, get the DNS configuration:

```bash
terraform output dns_configuration
```

Create these records in Route53 or your DNS provider:

```dns
# Main website
staging.liteevent.com          A (Alias)  → ALB DNS Name

# Vendors portal
vendors-staging.liteevent.com  A (Alias)  → ALB DNS Name

# API
api-staging.liteevent.com      A (Alias)  → ALB DNS Name

# SES verification
_amazonses.liteevent.com       TXT        → Verification token

# DKIM (get from SES console)
<selector>._domainkey.liteevent.com  CNAME → AWS DKIM endpoint
```

### Step 5: Verify SES Domain

```bash
# Check SES verification status
aws ses get-identity-verification-attributes \
  --identities liteevent.com \
  --region us-east-1

# Request production access (removes sending limits)
# Go to: AWS Console → SES → Account Dashboard → Request Production Access
```

### Step 6: Set Up GitHub Actions

#### Create GitHub Environment

1. Go to GitHub repo → Settings → Environments
2. Create environment: **`production`**
3. Add protection rules:
   - ✅ Required reviewers: (add yourself)
   - ✅ Wait timer: 0 minutes

#### Add GitHub Secrets

Go to Settings → Secrets and variables → Actions:

```
# AWS Account
AWS_ACCOUNT_ID: 123456789012

# Staging URLs
STAGING_API_URL: https://api-staging.liteevent.com
STAGING_STRIPE_PUBLISHABLE_KEY: pk_test_...

# Production URLs
PRODUCTION_API_URL: https://api.liteevent.com
PRODUCTION_STRIPE_PUBLISHABLE_KEY: pk_live_...
```

### Step 7: First Deployment

```bash
# Create develop branch for staging
git checkout -b develop
git push origin develop

# GitHub Actions will automatically:
# 1. Build Docker images
# 2. Push to ECR
# 3. Deploy to ECS staging
```

---

## 🎯 Production Deployment

### Step 1: Configure Production Environment

```bash
cd terraform/environments/production

# Copy staging config as template
cp ../staging/terraform.tfvars terraform.tfvars

# Update for production
nano terraform.tfvars
```

**Key changes for production:**

```hcl
environment  = "production"

# Use LIVE Stripe keys
stripe_secret_key      = "sk_live_..."  # LIVE key!
stripe_publishable_key = "pk_live_..."

# Production domains (no "staging" prefix)
web_domain_name     = "liteevent.com"
vendors_domain_name = "vendors.liteevent.com"
frontend_url        = "https://liteevent.com"

# Stronger database password
db_password = "<DIFFERENT_STRONG_PASSWORD>"

# Different JWT secrets than staging
jwt_secret         = "<NEW_64_CHAR_SECRET>"
jwt_refresh_secret = "<NEW_64_CHAR_SECRET>"
```

### Step 2: Deploy Production

```bash
cd terraform/environments/production

terraform init
terraform plan
terraform apply

# Save outputs
terraform output > outputs.txt
```

### Step 3: Configure Production DNS

```dns
liteevent.com              A (Alias)  → Production ALB
www.liteevent.com          CNAME      → liteevent.com
vendors.liteevent.com      A (Alias)  → Production ALB
api.liteevent.com          A (Alias)  → Production ALB
```

### Step 4: Deploy Code to Production

```bash
# Merge to main branch
git checkout main
git merge develop
git push origin main

# GitHub Actions will:
# 1. Wait for manual approval (required!)
# 2. Build images
# 3. Push to ECR
# 4. Deploy to production ECS
```

---

## 🔐 Secrets Manager Usage

All secrets are stored in AWS Secrets Manager, NOT in environment variables or code.

### How It Works

1. **Terraform creates secrets** during `terraform apply`
2. **ECS tasks read secrets** automatically via IAM permissions
3. **No secrets in Git** ever

### Accessing Secrets

```bash
# View a secret
aws secretsmanager get-secret-value \
  --secret-id liteevent/production/database \
  --region us-east-1 \
  --query SecretString \
  --output text | jq .

# Rotate a secret (updates Secrets Manager and ECS)
cd terraform/environments/production
terraform apply -var="jwt_secret=NEW_SECRET_HERE"
```

### Secret Structure

```json
// liteevent/production/database
{
  "username": "liteevent_admin",
  "password": "...",
  "host": "liteevent-production-db.xxx.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "liteevent",
  "url": "postgresql://..."
}

// liteevent/production/jwt
{
  "jwt_secret": "...",
  "jwt_refresh_secret": "..."
}

// liteevent/production/stripe
{
  "secret_key": "sk_live_...",
  "publishable_key": "pk_live_...",
  "webhook_secret": "whsec_..."
}
```

---

## 🐛 Debugging with ECS Exec

Shell into running containers without SSH!

```bash
# Get task ARN
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

# Now you're inside!
$ ls
$ npm run migrate
$ node scripts/seed.js
$ cat .env
$ exit
```

**Common tasks:**

```bash
# Run database migrations
$ npm run migrate

# Check environment variables
$ env | grep DATABASE

# View application logs
$ tail -f /var/log/app.log

# Test database connection
$ node -e "const {db} = require('./config/db'); db.query('SELECT NOW()').then(console.log)"
```

---

## 📊 Monitoring

### CloudWatch Dashboards

After deployment, create a dashboard to monitor:

- ECS CPU/Memory usage
- RDS connections and CPU
- ALB request count and latency
- VPC Endpoint data transfer
- Secrets Manager API calls

### Set Up Alarms

```bash
# High API CPU
aws cloudwatch put-metric-alarm \
  --alarm-name liteevent-production-api-high-cpu \
  --alarm-description "API CPU > 80%" \
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
  --alarm-name liteevent-production-db-connections \
  --alarm-description "RDS connections > 50" \
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

## 🚨 Troubleshooting

### ECS Tasks Not Starting

```bash
# Check service events
aws ecs describe-services \
  --cluster liteevent-production-cluster \
  --services liteevent-production-api-service

# Check task logs
aws logs tail /ecs/liteevent-production/api --follow

# Common issues:
# 1. Image pull failed → Check ECR permissions and VPC endpoints
# 2. Secret not found → Check Secrets Manager and IAM permissions
# 3. Health check failed → Check ALB target group health checks
```

### Can't Pull from ECR

**Symptom:** `CannotPullContainerError`

**Solution:** Verify VPC endpoints are working:

```bash
# Check ECR API endpoint
aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.us-east-1.ecr.api"

# Check ECR DKR endpoint
aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.us-east-1.ecr.dkr"

# Verify private DNS is enabled
# Both should show: "PrivateDnsEnabled": true
```

### ECS Exec Not Working

**Symptom:** `ExecuteCommandException`

**Solution:** Check SSM VPC endpoints:

```bash
# Verify SSM endpoints exist
aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.us-east-1.ssm"

aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.us-east-1.ssmmessages"

aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.us-east-1.ec2messages"

# Verify task has execute command enabled
aws ecs describe-tasks \
  --cluster liteevent-production-cluster \
  --tasks $TASK_ARN \
  --query 'tasks[0].enableExecuteCommand'
# Should return: true
```

### Database Connection Failures

```bash
# Test from ECS task
aws ecs execute-command \
  --cluster liteevent-production-cluster \
  --task $TASK \
  --container api \
  --interactive \
  --command "nc -zv <DB_HOST> 5432"

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids <RDS_SECURITY_GROUP_ID> \
  --query 'SecurityGroups[0].IpPermissions'
```

### GitHub Actions Failures

**Symptom:** `An error occurred (AccessDenied) when calling the AssumeRoleWithWebIdentity operation`

**Solution:** Verify GitHub OIDC:

```bash
# Check IAM OIDC provider exists
aws iam list-open-id-connect-providers

# Check role trust policy
aws iam get-role \
  --role-name liteevent-production-github-actions \
  --query 'Role.AssumeRolePolicyDocument'

# Should allow: token.actions.githubusercontent.com
```

---

## 💡 Best Practices

### 1. Always Use Staging First

```bash
# Deploy to staging
git push origin develop

# Test thoroughly
# Then merge to main

git checkout main
git merge develop
git push origin main
```

### 2. Database Migrations

Add `[migrate]` to commit message to auto-run migrations:

```bash
git commit -m "Add users table [migrate]"
git push origin develop
```

### 3. Secrets Rotation

Rotate secrets quarterly:

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 64)

# Update via Terraform
cd terraform/environments/production
terraform apply -var="jwt_secret=$NEW_SECRET"

# Force ECS redeploy to pick up new secret
aws ecs update-service \
  --cluster liteevent-production-cluster \
  --service liteevent-production-api-service \
  --force-new-deployment
```

### 4. Cost Monitoring

Set up billing alerts:

```bash
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json
```

**budget.json:**
```json
{
  "BudgetName": "LiteEvent-Monthly",
  "BudgetLimit": {
    "Amount": "150",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

---

## 📚 Additional Resources

- [AWS VPC Endpoints Pricing](https://aws.amazon.com/privatelink/pricing/)
- [ECS Exec Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html)
- [GitHub OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] S3 backend created
- [ ] DynamoDB lock table created
- [ ] ACM certificate issued
- [ ] DNS zone configured
- [ ] Secrets generated
- [ ] terraform.tfvars configured

### Staging Deployment

- [ ] `terraform apply` successful
- [ ] DNS records created
- [ ] SES domain verified
- [ ] GitHub secrets configured
- [ ] GitHub environment "production" created
- [ ] First deployment successful
- [ ] Can access staging URLs
- [ ] ECS Exec working

### Production Deployment

- [ ] Production `terraform.tfvars` configured
- [ ] Using LIVE Stripe keys
- [ ] Different secrets than staging
- [ ] `terraform apply` successful
- [ ] Production DNS records created
- [ ] Manual approval working in GitHub
- [ ] Production deployment successful
- [ ] Health checks passing
- [ ] Monitoring/alarms configured

---

**Questions? Issues?**

Check the Terraform outputs:
```bash
terraform output
```

Or exec into a container to debug:
```bash
aws ecs execute-command ... --interactive --command "/bin/sh"
```
