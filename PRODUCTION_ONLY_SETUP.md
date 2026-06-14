# ✅ LiteEvent Production-Only Setup - Complete

## Overview

Your infrastructure is now configured for **production-only deployment** optimized for launch.

**Cost:** $120-150/month

**No staging environment** until traffic justifies it.

---

## 🎯 What's Configured

### Production Environment

**Location:** `terraform/environments/production/`

```
✅ ECS Fargate (API, Web, Vendors) - 1 task each
✅ RDS PostgreSQL db.t4g.micro (Single-AZ)
✅ CloudFront CDN
✅ Application Load Balancer
✅ VPC Endpoints (NO NAT Gateway)
✅ Secrets Manager (all secrets)
✅ GitHub OIDC (no AWS keys)
✅ SES Email
✅ ECS Exec enabled
```

### What's Disabled (Cost Savings)

```
❌ NAT Gateway (-$45/month)
❌ Redis (-$12/month)
❌ Multi-AZ RDS (-$45/month)
❌ Staging environment (-$100/month)
─────────────────────────────────
   Savings: -$202/month
```

---

## 💰 Cost Breakdown

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

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** | Complete 60-min deployment guide |
| **[terraform/environments/production/](terraform/environments/production/)** | Production infrastructure |
| **[.github/workflows/deploy-production.yml](.github/workflows/deploy-production.yml)** | GitHub Actions (manual approval) |
| [terraform/environments/production/README.md](terraform/environments/production/README.md) | Quick reference |

---

## 🚀 Quick Deploy

### 1. AWS Setup (15 min)

```bash
# Create S3 backend
aws s3 mb s3://liteevent-terraform-state --region us-east-1

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name liteevent-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Request ACM certificate (AWS Console)
# Domains: *.liteevent.com, liteevent.com
```

### 2. Configure & Deploy (20 min)

```bash
cd terraform/environments/production

# Generate secrets
export JWT_SECRET=$(openssl rand -base64 64)
export JWT_REFRESH_SECRET=$(openssl rand -base64 64)
export DB_PASSWORD=$(openssl rand -base64 32)

# Configure
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Fill in your values

# Deploy
terraform init
terraform plan
terraform apply
```

### 3. GitHub Setup (10 min)

```bash
# 1. Create environment "production" with required reviewers
# 2. Add secrets:
#    - AWS_ACCOUNT_ID
#    - PRODUCTION_API_URL
#    - PRODUCTION_STRIPE_PUBLISHABLE_KEY
```

### 4. Deploy Code (5 min)

```bash
git push origin main
# → Approve in GitHub Actions tab
# → Auto-deploys
```

**Total time: ~60 minutes**

---

## 🔄 Deployment Flow

```
main branch only
  → Push code
  → GitHub Actions builds images
  → Pause for manual approval ✋
  → Approve in Actions tab
  → Deploy to production ECS
  → Health checks
  → Done ✅
```

**No staging environment.**

**Every deployment requires manual approval.**

---

## 📊 When to Upgrade

### Add Redis (+$12/month)

**When:**
- Need BullMQ job queues
- Session storage
- Rate limiting

**How:**
```hcl
enable_redis = true
```

### Enable Multi-AZ (+$45/month)

**When:**
- Can't afford 30-60 min downtime
- Revenue > $10,000/month

**How:**
```hcl
db_instance_class = "db.t4g.small"
multi_az = true
```

### Add Staging (+$100/month)

**When:**
- Multiple developers
- Need to test before production
- Revenue > $5,000/month

**How:**
```bash
cd terraform/environments/staging
cp ../production/terraform.tfvars terraform.tfvars
terraform init
terraform apply
```

---

## ✅ Production-Only Advantages

### Lower Costs

- **$120-150/month** instead of $250-300/month
- No duplicate infrastructure
- No staging environment overhead

### Simpler Operations

- One environment to manage
- Fewer deployments
- Less complexity
- Lower cognitive load

### Faster Deployment

- No staging step required
- Direct to production
- Manual approval ensures safety

### Perfect for Launch

- Minimal viable infrastructure
- Room to scale up
- Can add staging later
- Revenue-justified upgrades

---

## 🎯 Launch Strategy

### Phase 1: Launch (Month 1-3)

**Infrastructure:**
- Production-only ✅
- db.t4g.micro ✅
- 1 task per service ✅
- No Redis ✅
- Single-AZ ✅

**Cost:** $120-150/month

**When to upgrade:** 1,000+ active users OR $5,000+ revenue

### Phase 2: Growth (Month 4-6)

**Add:**
- Redis for job queues
- Scale to 2 tasks per service
- Add CloudWatch dashboards

**Cost:** ~$180/month

**When to upgrade:** 5,000+ users OR $10,000+ revenue

### Phase 3: Scale (Month 7-12)

**Add:**
- Staging environment
- Multi-AZ RDS
- 3-5 tasks per service

**Cost:** ~$300-400/month

**When to upgrade:** 10,000+ users OR $25,000+ revenue

### Phase 4: Enterprise (Year 2+)

**Add:**
- Multiple regions
- Advanced monitoring
- Dedicated support
- 10+ tasks per service

**Cost:** $800-1,200/month

---

## 🆘 Quick Reference

### Deploy

```bash
cd terraform/environments/production
terraform apply
```

### Push Code

```bash
git push origin main
# Approve in GitHub Actions
```

### Shell Into Container

```bash
TASK=$(aws ecs list-tasks --cluster liteevent-production-cluster --service-name liteevent-production-api-service --query 'taskArns[0]' --output text)
aws ecs execute-command --cluster liteevent-production-cluster --task $TASK --container api --interactive --command "/bin/sh"
```

### View Logs

```bash
aws logs tail /ecs/liteevent-production/api --follow
```

### Run Migrations

```bash
# Add [migrate] to commit message
git commit -m "Add users table [migrate]"
git push origin main
```

### View Costs

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-06-01,End=2026-06-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost
```

---

## 📚 Documentation

**Deployment guides:**
1. **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** ← Start here (complete 60-min guide)
2. [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) ← Updated requirements
3. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) ← Full reference guide
4. [terraform/environments/production/README.md](terraform/environments/production/README.md) ← Quick reference

**Workflows:**
- [.github/workflows/deploy-production.yml](.github/workflows/deploy-production.yml) ← Manual approval required

---

## ✅ Checklist

### Infrastructure

- [ ] S3 backend created
- [ ] DynamoDB lock table created
- [ ] ACM certificate issued
- [ ] terraform.tfvars configured
- [ ] Terraform applied
- [ ] DNS records configured

### GitHub

- [ ] Environment "production" created
- [ ] Required reviewers added
- [ ] Secrets configured
- [ ] Workflow tested

### Application

- [ ] Code deployed
- [ ] Database migrations run
- [ ] Health checks passing
- [ ] Email sending (SES)
- [ ] Stripe working

### Monitoring

- [ ] CloudWatch alarms
- [ ] Billing alerts
- [ ] Cost monitoring

---

## 🎉 You're Ready!

**Your production-only setup is complete:**

✅ Cost-optimized at $120-150/month
✅ Production-grade infrastructure
✅ NO NAT Gateway (saves $45/month)
✅ Manual deployment approval
✅ All secrets in Secrets Manager
✅ ECS Exec for debugging
✅ CloudFront for performance
✅ Room to scale when needed

**Deploy with:**

```bash
cd terraform/environments/production
terraform apply
```

**Then push code:**

```bash
git push origin main
```

**Approve deployment in GitHub Actions tab.**

---

**Production-only. Simple. Cost-effective. Ready to scale.**
