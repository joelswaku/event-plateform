# 🚀 LiteEvent Production Deployment

**Production-only configuration** optimized for launch at **$120-150/month**.

## Architecture

```
GitHub (main branch)
  → Manual Approval Required
  → Build & Deploy to Production

Production Environment:
  ✓ ECS Fargate (API, Web, Vendors) - 1 task each
  ✓ RDS PostgreSQL db.t4g.micro (Single-AZ)
  ✓ CloudFront CDN
  ✓ VPC Endpoints (NO NAT Gateway)
  ✓ Secrets Manager
  ✓ GitHub OIDC
  ✓ SES Email
  ✓ ECS Exec enabled

Disabled for launch:
  ✗ NAT Gateway
  ✗ Redis
  ✗ Multi-AZ RDS
  ✗ Staging environment
```

## Cost: $120-150/month

```
VPC Endpoints (7):            $42/month
Application Load Balancer:    $25/month
ECS Fargate (3 × 1 task):     $30/month
RDS db.t4g.micro:             $15/month
CloudFront:                   $15/month
S3 + CloudWatch:              $10/month
Secrets Manager:              $2/month
ECR:                          $2/month
SES:                          $2/month
Route53:                      $1/month
Data Transfer:                $5/month
─────────────────────────────────────
TOTAL:                        ~$149/month
```

## Quick Deploy

### 1. Prerequisites

```bash
# Install Terraform
brew install terraform  # or download from terraform.io

# Install AWS CLI
brew install awscli

# Configure AWS
aws configure
```

### 2. Create ACM Certificate

1. Go to AWS Certificate Manager (us-east-1)
2. Request certificate for: `*.liteevent.com`, `liteevent.com`
3. Validate via DNS (add CNAME records)
4. Copy certificate ARN

### 3. Generate Secrets

```bash
# JWT secrets
openssl rand -base64 64  # Use for jwt_secret
openssl rand -base64 64  # Use for jwt_refresh_secret

# Database password
openssl rand -base64 32
```

### 4. Configure

```bash
cd terraform/environments/production

# Copy example
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required values:**
- AWS account ID
- ACM certificate ARN
- Domain name
- Database password
- JWT secrets
- Stripe LIVE keys
- Google OAuth credentials

### 5. Deploy

```bash
# Initialize
terraform init

# Preview
terraform plan

# Deploy (takes ~15-20 minutes)
terraform apply

# Save outputs
terraform output > outputs.txt
```

### 6. Configure DNS

```bash
# Get DNS configuration
terraform output dns_configuration
```

Add these records to Route53:

```
liteevent.com          A (Alias) → ALB
www.liteevent.com      CNAME     → liteevent.com
vendors.liteevent.com  A (Alias) → ALB
api.liteevent.com      A (Alias) → ALB
```

### 7. Set Up GitHub

**Create GitHub Environment:**
1. Repo → Settings → Environments
2. New environment: "production"
3. Add required reviewers (yourself)

**Add GitHub Secrets:**
```
AWS_ACCOUNT_ID: 123456789012
PRODUCTION_API_URL: https://api.liteevent.com
PRODUCTION_STRIPE_PUBLISHABLE_KEY: pk_live_...
```

### 8. Deploy Code

```bash
# Push to main branch
git push origin main

# GitHub will:
# 1. Wait for your approval
# 2. Build Docker images
# 3. Push to ECR
# 4. Deploy to ECS
```

## Verify Deployment

```bash
# Check services
aws ecs describe-services \
  --cluster liteevent-production-cluster \
  --services liteevent-production-api-service

# Test endpoints
curl https://api.liteevent.com/health
curl https://liteevent.com
curl https://vendors.liteevent.com

# View logs
aws logs tail /ecs/liteevent-production/api --follow
```

## ECS Exec (Debug)

```bash
# Get task
TASK=$(aws ecs list-tasks \
  --cluster liteevent-production-cluster \
  --service-name liteevent-production-api-service \
  --query 'taskArns[0]' --output text)

# Shell into container
aws ecs execute-command \
  --cluster liteevent-production-cluster \
  --task $TASK \
  --container api \
  --interactive \
  --command "/bin/sh"

# Inside container:
$ npm run migrate
$ node scripts/seed.js
$ exit
```

## When to Add Staging

Add a staging environment when:
- You have > 1,000 active users
- Monthly revenue > $5,000
- Need to test before production
- Have multiple developers

Cost: +$100-120/month

## When to Enable Redis

Enable Redis when:
- You need BullMQ job queues
- Session storage required
- Rate limiting needed
- Caching improves performance

```hcl
# In terraform.tfvars
enable_redis = true
```

Cost: +$12/month

## When to Enable Multi-AZ

Enable Multi-AZ RDS when:
- Uptime is critical
- You can't afford 30-60 min downtime
- Monthly revenue justifies cost

```hcl
# In terraform.tfvars
db_instance_class = "db.t4g.small"
multi_az = true
```

Cost: +$45/month

## Scaling Up

As traffic grows:

**At 1,000 users:**
- Keep current setup
- Monitor performance

**At 5,000 users:**
- Add Redis: `enable_redis = true`
- Scale to 2 tasks per service
- Cost: ~$180/month

**At 10,000 users:**
- Enable Multi-AZ RDS
- Scale to 3-5 tasks per service
- Add staging environment
- Cost: ~$300-400/month

**At 50,000 users:**
- Upgrade to db.r6g.large
- 10+ tasks per service
- Add caching layer
- Cost: ~$800-1,200/month

## Troubleshooting

**ECS tasks not starting:**
```bash
aws logs tail /ecs/liteevent-production/api --follow
```

**Can't pull from ECR:**
```bash
# Check VPC endpoints
aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.us-east-1.ecr.api"
```

**ECS Exec not working:**
```bash
# Verify SSM endpoints exist
aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.us-east-1.ssm"
```

**High costs:**
```bash
# Check current spend
aws ce get-cost-and-usage \
  --time-period Start=2026-06-01,End=2026-06-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost
```

## Monitoring

**Set up CloudWatch alarms:**
```bash
# High CPU
aws cloudwatch put-metric-alarm \
  --alarm-name liteevent-api-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

# Database connections
aws cloudwatch put-metric-alarm \
  --alarm-name liteevent-db-connections \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

## Support

**Documentation:**
- [AWS_DEPLOYMENT_GUIDE.md](../../AWS_DEPLOYMENT_GUIDE.md)
- [DEPLOYMENT_GUIDE.md](../../DEPLOYMENT_GUIDE.md)

**Quick commands:**
```bash
# Deploy
terraform apply

# View outputs
terraform output

# Shell into container
aws ecs execute-command --cluster ... --task ... --container api --interactive --command "/bin/sh"

# View logs
aws logs tail /ecs/liteevent-production/api --follow
```

---

**Production-only setup for launch.**

Upgrade to staging + Multi-AZ + Redis when revenue justifies the additional $150-200/month cost.
