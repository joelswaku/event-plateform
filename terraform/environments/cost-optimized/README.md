# 💰 Cost-Optimized Terraform Configuration

## Overview

This is the **cost-optimized** Terraform setup that keeps your original cheap settings while adding the best features from the modernized infrastructure.

**Target Cost: ~$155/month** (saves $45 from original $200)

---

## 🎯 What Makes This Cost-Optimized?

### **Cost Savings:**

| Optimization | Savings | Details |
|--------------|---------|---------|
| **1 NAT Gateway** (not 2) | **-$45/month** | Single NAT for all AZs |
| **db.t4g.micro** | **-$45/month** | vs. db.t3.small multi-AZ |
| **Single-AZ RDS** | **-$15/month** | vs. Multi-AZ |
| **1 Task per service** | **-$30/month** | vs. 2 tasks |
| **Redis disabled** | **-$15/month** | Enable only if needed |
| **Smaller ECS instances** | **-$15/month** | 512MB/256MB vs 1GB/512MB |
| **CloudFront optional** | **-$15/month** | Use ALB directly |
| **5 images in ECR** (not 10) | **-$1/month** | Less storage |
| **Total Savings** | **-$186/month** | vs. new production setup |

### **Features Added:**

| Feature | Cost | Benefit |
|---------|------|---------|
| **GitHub OIDC** | $0 | No AWS keys in CI/CD! |
| **ECS Exec** | $0 | Shell into containers |
| **S3 VPC Endpoint** | $0 | Saves data transfer |
| **Optional VPC Endpoints** | +$7 | If high traffic |

---

## 💵 Cost Breakdown

### **Base Cost (Always Included):**

```
NAT Gateway (1):              $45/month
ALB:                          $25/month
ECS Fargate (3 services):     $30/month
RDS (db.t4g.micro):           $15/month
S3 + CloudWatch:              $10/month
ECR:                          $2/month
Data Transfer:                $10/month
SES:                          $2/month
Route53:                      $1/month
────────────────────────────────
SUBTOTAL:                     $140/month
```

### **Optional Add-ons:**

```
Redis (cache.t4g.micro):      +$12/month (if enabled)
VPC Endpoints (ECR, Logs):    +$7/month (if enabled)
CloudFront CDN:               +$15/month (if enabled)
────────────────────────────────
OPTIONAL TOTAL:               +$34/month
```

### **Total Cost Scenarios:**

| Scenario | Cost | When to Use |
|----------|------|-------------|
| **Minimal** | $140/month | < 100 users |
| **Base** | $155/month | 100-1,000 users |
| **With Redis** | $167/month | > 1,000 users |
| **With VPC Endpoints** | $162/month | High traffic |
| **Full Featured** | $189/month | All features |

---

## 🚀 Quick Start

### **1. Prerequisites**

```bash
# Install Terraform
brew install terraform  # macOS
# or download from: https://www.terraform.io/downloads

# Install AWS CLI
brew install awscli

# Configure AWS credentials
aws configure
```

### **2. Create ACM Certificate**

Before deploying, create SSL certificate:

```bash
# In AWS Console:
# 1. Go to Certificate Manager (ACM)
# 2. Request certificate
# 3. Add domains:
#    - liteevent.com
#    - *.liteevent.com
# 4. Validate via DNS (add CNAME records)
# 5. Copy certificate ARN
```

### **3. Configure Variables**

```bash
cd terraform/environments/cost-optimized/

# Copy example
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required values:**
- `db_password` - Strong password
- `acm_certificate_arn` - From step 2
- `github_org` and `github_repo` - Your GitHub
- `jwt_secret` and `jwt_refresh_secret` - Random strings
- `stripe_secret_key` - Your Stripe key
- `google_client_id` and `google_client_secret` - OAuth
- `resend_api_key` - Email API key

### **4. Deploy!**

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy (will ask for confirmation)
terraform apply

# Save outputs
terraform output > ../outputs.txt
```

---

## 🎛️ Configuration Options

### **Enable Redis** (adds $12/month)

When to enable:
- You have > 1,000 concurrent users
- Need session management
- Want faster performance

```hcl
# In terraform.tfvars
enable_redis = true
```

### **Enable VPC Endpoints** (adds $7/month)

When to enable:
- High traffic (>100GB/month through NAT)
- Need faster AWS service access
- Want to save NAT data transfer costs

```hcl
# In terraform.tfvars
enable_vpc_endpoints = true
```

Benefits:
- ECR pulls go through endpoint (faster, no NAT)
- CloudWatch logs through endpoint (faster)
- SSM for ECS Exec through endpoint

### **Enable CloudFront** (adds $15/month)

When to enable:
- Global users (improves latency)
- Heavy static assets
- Want caching at edge

```hcl
# In terraform.tfvars
enable_cloudfront = true
acm_certificate_arn_cloudfront = "arn:aws:acm:us-east-1:..."
```

---

## 📦 What Gets Created

### **Network (VPC):**
- 1 VPC (10.0.0.0/16)
- 2 Public subnets (across 2 AZs)
- 2 Private subnets (across 2 AZs)
- 1 Internet Gateway
- **1 NAT Gateway** (cost optimized!)
- **1 S3 VPC Endpoint** (free, gateway type)
- Optional: ECR, CloudWatch, SSM endpoints

### **Compute (ECS):**
- 1 ECS Cluster
- 3 Fargate services (API, Web, Vendors)
- 1 task per service (cost optimized!)
- **ECS Exec enabled** (new!)
- Auto-scaling (1-10 tasks)
- CloudWatch log groups

### **Database (RDS):**
- PostgreSQL (db.t4g.micro)
- Single-AZ (cost optimized!)
- 20GB storage
- 7-day backups
- Encryption enabled

### **Cache (Redis - Optional):**
- ElastiCache (cache.t4g.micro)
- Single node (cost optimized!)
- 5-day snapshot retention

### **Load Balancer (ALB):**
- Application Load Balancer
- HTTPS listener (port 443)
- HTTP redirect to HTTPS
- 3 target groups (API, Web, Vendors)

### **Storage (S3):**
- Images bucket (user uploads)
- Assets bucket (static files)
- Encryption enabled
- Lifecycle policies

### **Container Registry (ECR):**
- 3 repositories (API, Web, Vendors)
- Image scanning enabled
- Keep last 5 images (cost optimized!)

### **Email (SES):**
- Domain verification
- DKIM signing
- SPF/DMARC support

### **CI/CD (GitHub OIDC - New!):**
- OIDC provider
- IAM role for GitHub Actions
- ECR push permissions
- ECS deploy permissions
- **No AWS access keys needed!**

---

## 🔧 After Deployment

### **1. Configure DNS**

Terraform will output DNS records to create. Example:

```bash
# Get DNS configuration
terraform output dns_configuration

# Create records in Route53 or your DNS provider:
# liteevent.com → ALB
# www.liteevent.com → CNAME to liteevent.com
# api.liteevent.com → ALB
# vendors.liteevent.com → ALB
```

### **2. Verify SES Domain**

```bash
# Get SES verification token
terraform output ses_domain_verification_token

# Add TXT record:
# Name: _amazonses.liteevent.com
# Value: <token from output>

# Verify in AWS Console after DNS propagates
```

### **3. Build and Push Docker Images**

```bash
# Get ECR URLs
terraform output ecr_api_repository_url
terraform output ecr_web_repository_url
terraform output ecr_vendors_repository_url

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ECR_URL>

# Build and push (from project root)
cd api
docker build -t <ECR_API_URL>:latest .
docker push <ECR_API_URL>:latest

cd ../web
docker build -t <ECR_WEB_URL>:latest .
docker push <ECR_WEB_URL>:latest

cd ../vendors
docker build -t <ECR_VENDORS_URL>:latest .
docker push <ECR_VENDORS_URL>:latest
```

### **4. Set Up GitHub Actions**

Copy the example workflow:

```bash
cp .github/workflows/deploy.yml.example .github/workflows/deploy.yml
```

Add GitHub secrets:
```
AWS_ACCOUNT_ID: <your-account-id>
AWS_REGION: us-east-1
```

Update workflow with your ECR URLs and cluster name.

### **5. Run Database Migrations**

```bash
# Get ECS exec command
terraform output ecs_exec_api_command

# Run migrations
aws ecs execute-command \
  --cluster liteevent-production-cluster \
  --task <task-arn> \
  --container api \
  --interactive \
  --command "npm run migrate"
```

---

## 🎛️ Daily Operations

### **Deploy New Code**

Using GitHub Actions (recommended):
```bash
git push origin main
# GitHub Actions automatically builds and deploys!
```

Manual deployment:
```bash
# Build and push new image
docker build -t <ECR_URL>:latest .
docker push <ECR_URL>:latest

# Force ECS to deploy new version
aws ecs update-service \
  --cluster liteevent-production-cluster \
  --service liteevent-production-api-service \
  --force-new-deployment
```

### **View Logs**

```bash
# API logs
aws logs tail /ecs/liteevent-production/api --follow

# Web logs
aws logs tail /ecs/liteevent-production/web --follow

# Vendors logs
aws logs tail /ecs/liteevent-production/vendors --follow
```

### **Shell into Container (ECS Exec)**

```bash
# Get task ARN
TASK=$(aws ecs list-tasks \
  --cluster liteevent-production-cluster \
  --service-name liteevent-production-api-service \
  --query 'taskArns[0]' --output text)

# Exec into it
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
$ exit
```

### **Scale Services**

```bash
# Scale up API to 2 tasks
aws ecs update-service \
  --cluster liteevent-production-cluster \
  --service liteevent-production-api-service \
  --desired-count 2
```

### **Database Backup**

Automatic backups are enabled (7-day retention).

Manual snapshot:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier liteevent-production-db \
  --db-snapshot-identifier liteevent-manual-$(date +%Y%m%d)
```

---

## 💰 Cost Optimization Tips

### **1. Monitor Costs**

```bash
# View current month costs
aws ce get-cost-and-usage \
  --time-period Start=2026-06-01,End=2026-06-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost

# Set up billing alert
aws budgets create-budget \
  --budget file://budget.json
```

### **2. Enable VPC Endpoints When:**

Current monthly data transfer through NAT:
```bash
# Check NAT Gateway data transfer
aws cloudwatch get-metric-statistics \
  --namespace AWS/NATGateway \
  --metric-name BytesOutToSource \
  --statistics Sum

# If > 100GB/month, enable VPC endpoints to save costs
```

### **3. Scale Down at Night (Optional)**

For non-critical environments:
```bash
# Scale down at night (save ~$15/month)
# Cron: 0 22 * * * (10 PM)
aws ecs update-service --desired-count 0 ...

# Scale up in morning
# Cron: 0 6 * * * (6 AM)
aws ecs update-service --desired-count 1 ...
```

### **4. Use Reserved Instances (if stable)**

After 3 months of stable usage:
- RDS Reserved Instance: saves 30-60%
- ElastiCache Reserved Instance: saves 30-60%

---

## 🔒 Security Best Practices

### **1. Rotate Secrets Regularly**

```bash
# Update JWT secret
terraform apply -var="jwt_secret=NEW_SECRET"
```

### **2. Enable MFA for AWS Account**

### **3. Review IAM Permissions Quarterly**

### **4. Enable AWS Config** (optional, adds cost)

### **5. Set Up CloudTrail** (optional, adds cost)

---

## 📊 Monitoring

### **CloudWatch Dashboards**

After deployment, create dashboards to monitor:
- ECS CPU/Memory usage
- RDS connections
- ALB request count
- NAT Gateway data transfer

### **Alarms**

Set up CloudWatch alarms for:
- RDS high CPU (>80%)
- ECS task failures
- ALB 5xx errors
- High costs (AWS Budgets)

---

## 🆘 Troubleshooting

### **Issue: ECS tasks not starting**

```bash
# Check task events
aws ecs describe-services \
  --cluster liteevent-production-cluster \
  --services liteevent-production-api-service

# Check task logs
aws logs tail /ecs/liteevent-production/api --since 10m
```

### **Issue: Can't connect to database**

```bash
# Verify security groups
aws ec2 describe-security-groups \
  --group-ids <rds-sg-id>

# Test from ECS task
aws ecs execute-command ... --command "nc -zv <db-host> 5432"
```

### **Issue: High costs**

```bash
# Check top cost services
aws ce get-cost-and-usage \
  --time-period Start=2026-06-01,End=2026-06-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## 🎯 Comparison to Other Setups

| Feature | Original | Cost-Optimized | New (Production) |
|---------|----------|----------------|------------------|
| **Cost** | $200/month | **$155/month** | $225/month |
| NAT Gateways | 2 ($90) | 1 ($45) ✅ | 1 ($45) |
| Database | t4g.micro | t4g.micro ✅ | t3.small multi-AZ |
| ECS Tasks | 1 per service | 1 per service ✅ | 2 per service |
| Redis | Disabled | Disabled ✅ | Enabled |
| GitHub OIDC | ❌ | ✅ | ✅ |
| ECS Exec | ❌ | ✅ | ✅ |
| VPC Endpoints | S3 only | S3 (+ optional) ✅ | 9 endpoints |
| Secrets Manager | ❌ | ❌ | ✅ |

**Best for:**
- **Original**: If you don't need new features
- **Cost-Optimized**: Best value! ⭐
- **New Production**: Enterprise, high-traffic

---

## 📞 Support

**Issues?**
- Check `terraform/QUICK_REFERENCE.md` for common commands
- Review `terraform/STRUCTURE_OVERVIEW.md` for architecture
- See `terraform/MIGRATION_GUIDE.md` for upgrading

---

**Created:** 2026-06-12  
**Target Cost:** ~$155/month  
**Status:** Production-ready ✅
