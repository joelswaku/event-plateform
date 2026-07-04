# AWS Infrastructure Preservation Guide

## 🎯 Purpose

This document explains how to keep your AWS infrastructure ready for when you exceed 20,000 users, while currently using Railway for cost-effective deployment.

## 📊 When to Switch to AWS

### Metrics to Monitor

```sql
-- Check total user count
SELECT COUNT(*) as total_users FROM users;

-- Check active users (last 30 days)
SELECT COUNT(DISTINCT user_id) as active_users 
FROM user_sessions 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Check events created (growth indicator)
SELECT COUNT(*) as total_events FROM events;
SELECT COUNT(*) as events_last_month 
FROM events 
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Switch Triggers
- ✅ **Total users approaching 20,000** (start planning at 15,000)
- ✅ **Monthly active users > 10,000**
- ✅ **Average response time > 500ms**
- ✅ **Database queries slowing down**
- ✅ **Need for geographic distribution**
- ✅ **Compliance requirements (SOC2, HIPAA, etc.)**

## 🏗️ AWS Infrastructure Overview

Your AWS infrastructure is fully defined in Terraform and includes:

### Core Services

1. **VPC** (`terraform/modules/vpc/`)
   - 3 Availability Zones
   - Public and Private Subnets
   - NAT Gateways
   - Internet Gateway

2. **ECS Fargate** (`terraform/modules/ecs/`)
   - API Service
   - Web Service
   - Vendors Service
   - Auto-scaling based on CPU/Memory

3. **RDS PostgreSQL** (`terraform/modules/rds/`)
   - Multi-AZ deployment
   - Automated backups
   - Read replicas ready

4. **ElastiCache Redis** (`terraform/modules/elasticache/`)
   - Cluster mode
   - Automatic failover

5. **Application Load Balancer** (`terraform/modules/alb/`)
   - SSL/TLS termination
   - Path-based routing
   - Health checks

6. **CloudFront CDN** (`terraform/modules/cloudfront/`)
   - Edge caching
   - DDoS protection

7. **S3** (`terraform/modules/s3/`)
   - Static asset storage
   - Backup storage

## 🔒 Keeping AWS Ready

### 1. Maintain Terraform State

Your Terraform configurations are in: `c:\projects\event-plateform\terraform\`

**DO NOT DELETE:**
- `terraform/` directory
- `.github/workflows/deploy-production.yml`
- Any AWS-related documentation

**Keep Updated:**
```bash
# Periodically update Terraform providers
cd terraform/environments/production
terraform init -upgrade

# Validate configurations (no cost)
terraform validate

# Check what would be created (no cost)
terraform plan
```

### 2. Keep GitHub Secrets

Maintain these GitHub secrets even while using Railway:

| Secret Name | Purpose | Status |
|-------------|---------|--------|
| `AWS_ACCOUNT_ID` | Your AWS account | Keep |
| `DATABASE_URL` | RDS connection (future) | Keep |
| `RAILWAY_TOKEN` | Railway deployments | Active |
| `RAILWAY_API_URL` | Railway API endpoint | Active |

### 3. AWS IAM Resources

**Keep These Resources Active (minimal cost):**
- GitHub OIDC Role (`liteevent-production-github-actions-role`)
- ECR Repositories (empty = $0)
- IAM Policies

**You can DELETE (to save cost):**
- Running ECS Tasks
- RDS Instances
- ElastiCache Clusters
- NAT Gateways ($0.045/hour = ~$32/month)
- Load Balancers ($0.025/hour = ~$18/month)

### 4. Preserve ECR Repositories

Keep your Docker image repositories but delete old images:

```bash
# List ECR repositories
aws ecr describe-repositories --region us-east-1

# Keep the repositories but delete images
aws ecr batch-delete-image \
  --repository-name liteevent-production-api \
  --image-ids imageTag=latest \
  --region us-east-1
```

## 💰 Cost Optimization While Inactive

### Current AWS Costs (All Services Running)
- **ECS Fargate**: ~$50-200/month
- **RDS**: ~$100-300/month
- **ElastiCache**: ~$50-100/month
- **ALB**: ~$20-40/month
- **NAT Gateway**: ~$32/month
- **Data Transfer**: ~$50-200/month
- **Total**: ~$270-840/month

### Minimal AWS Costs (Infrastructure Dormant)
- **ECR (empty)**: $0
- **IAM Roles**: $0
- **S3 (minimal)**: ~$1/month
- **Route53 (if used)**: $0.50/month
- **Total**: ~$1-5/month

### How to Minimize Costs

```bash
# Navigate to Terraform
cd terraform/environments/production

# Destroy compute resources ONLY (keep IAM, ECR)
# Create a minimal configuration file
```

**Create `minimal.tf` for preservation:**

```hcl
# Keep only ECR and IAM resources
module "github_oidc" {
  source = "../../modules/github-oidc"
  # ... existing config
}

# Comment out:
# - module "ecs"
# - module "rds"
# - module "elasticache"
# - module "alb"
# - module "vpc" (or keep VPC, it's cheap)
```

**Or use targeted destroy:**
```bash
# Destroy specific expensive resources
terraform destroy -target=module.ecs
terraform destroy -target=module.rds
terraform destroy -target=module.elasticache
terraform destroy -target=module.alb
```

## 🔄 Switching Back to AWS

### Phase 1: Preparation (2-3 weeks before switch)

```bash
# 1. Update Terraform configurations
cd terraform/environments/production
terraform init

# 2. Plan infrastructure
terraform plan -out=aws-reactivation.tfplan

# 3. Review estimated costs
terraform show aws-reactivation.tfplan
```

### Phase 2: Database Migration (1 week before)

```bash
# 1. Export from Railway PostgreSQL
railway run pg_dump $DATABASE_URL > railway_backup_$(date +%Y%m%d).sql

# 2. Create AWS RDS instance
cd terraform/environments/production
terraform apply -target=module.rds

# 3. Import data to AWS RDS
psql $AWS_DATABASE_URL < railway_backup_20260704.sql

# 4. Verify data integrity
psql $AWS_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $AWS_DATABASE_URL -c "SELECT COUNT(*) FROM events;"
```

### Phase 3: Infrastructure Deployment (1 week before)

```bash
# 1. Apply full Terraform configuration
terraform apply

# 2. Update GitHub secrets
# - DATABASE_URL → AWS RDS URL
# - REDIS_URL → AWS ElastiCache URL

# 3. Build and push Docker images
# This is handled automatically by GitHub Actions
```

### Phase 4: Gradual Traffic Migration

```bash
# 1. Deploy to AWS (via GitHub Actions)
git checkout -b switch-to-aws
git push origin switch-to-aws

# Merge to main triggers AWS deployment

# 2. Test AWS deployment
curl https://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health

# 3. Update DNS (gradual)
# - Add AWS ALB as secondary DNS record
# - Monitor performance
# - Gradually shift weight to AWS
# - Remove Railway DNS after 100% migration
```

### Phase 5: DNS Cutover

**Current DNS (Railway):**
```
api.liteevent.com → railway-production-api.up.railway.app
liteevent.com → railway-production-web.up.railway.app
vendors.liteevent.com → railway-production-vendors.up.railway.app
```

**New DNS (AWS):**
```
api.liteevent.com → liteevent-production-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com
liteevent.com → CloudFront distribution or ALB
vendors.liteevent.com → CloudFront distribution or ALB
```

**Migration Steps:**
1. Lower TTL to 300 seconds (5 min)
2. Wait for TTL expiry
3. Update DNS to AWS
4. Monitor logs on both platforms
5. After 24 hours, disable Railway services

## 📋 Pre-Switch Checklist

### 2 Weeks Before Switch
- [ ] Review and update Terraform configurations
- [ ] Test AWS deployment in staging environment
- [ ] Estimate AWS costs for current load
- [ ] Plan database migration strategy
- [ ] Update team on switch timeline

### 1 Week Before Switch
- [ ] Create RDS instance and import test data
- [ ] Deploy full AWS infrastructure
- [ ] Run smoke tests on AWS
- [ ] Update monitoring and alerting
- [ ] Prepare rollback plan

### 1 Day Before Switch
- [ ] Final database backup from Railway
- [ ] Full infrastructure health check
- [ ] DNS TTL reduced to 300s
- [ ] Team on standby
- [ ] Communication to users prepared

### Day of Switch
- [ ] Export final Railway database
- [ ] Import to AWS RDS
- [ ] Verify data integrity
- [ ] Update DNS records
- [ ] Monitor both platforms
- [ ] Gradual traffic shift

### 1 Week After Switch
- [ ] Monitor AWS costs
- [ ] Verify all features working
- [ ] Database performance check
- [ ] Disable Railway services
- [ ] Update documentation

## 🔐 Maintaining AWS Credentials

### AWS CLI Access
```bash
# Verify AWS access periodically
aws sts get-caller-identity

# Update credentials if needed
aws configure
```

### GitHub OIDC Role
The IAM role `liteevent-production-github-actions-role` allows GitHub Actions to deploy without long-term credentials.

**Keep this role active** - it costs $0 and is required for automated deployments.

## 📊 Monitoring While on Railway

Set up alerts for when to switch:

```javascript
// Add to your API monitoring
const USER_COUNT_THRESHOLD = 15000; // Start planning at 15K

// Periodic check (daily cron job)
async function checkUserGrowth() {
  const userCount = await db.query('SELECT COUNT(*) FROM users');

  if (userCount > USER_COUNT_THRESHOLD) {
    // Send alert to admin
    await sendEmail({
      to: 'admin@liteevent.com',
      subject: '⚠️ Approaching AWS Switch Threshold',
      body: `Current users: ${userCount}. Consider switching to AWS.`
    });
  }
}
```

## 📝 Documentation to Maintain

Keep these files updated:
- ✅ `AWS-PRESERVATION-GUIDE.md` (this file)
- ✅ `AWS_DEPLOYMENT_GUIDE.md`
- ✅ `PRODUCTION_DEPLOYMENT.md`
- ✅ `terraform/` - All Terraform configurations
- ✅ `.github/workflows/deploy-production.yml`

## 🎯 Quick Reference Commands

```bash
# Check AWS infrastructure status
cd terraform/environments/production
terraform show

# Estimate costs for reactivation
terraform plan

# Validate Terraform configs
terraform validate

# Check Railway user count
railway run --service api psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Deploy to Railway (current)
.\deploy-switcher.ps1 -Platform railway

# Switch to AWS (when ready)
.\deploy-switcher.ps1 -Platform aws
```

## 🚨 Emergency Rollback

If AWS deployment fails, rollback to Railway:

```bash
# 1. Revert DNS to Railway
# Update DNS records back to Railway domains

# 2. Verify Railway is still running
railway status

# 3. If Railway was stopped, redeploy
railway up --service api
railway up --service web
railway up --service vendors

# 4. Monitor logs
railway logs --service api
```

## 💡 Best Practices

1. **Test in Staging**: Always test AWS deployment in staging environment first
2. **Backup Everything**: Database, configurations, environment variables
3. **Monitor Costs**: Set AWS billing alerts before switching
4. **Gradual Migration**: Don't switch 100% of traffic immediately
5. **Keep Railway Running**: Maintain Railway for 1 week after switch
6. **Document Changes**: Update docs with actual AWS URLs and configurations

## 📞 Support Contacts

- **AWS Support**: [AWS Console](https://console.aws.amazon.com/support/)
- **Railway Support**: [Railway Discord](https://discord.gg/railway)
- **Terraform**: [Terraform Docs](https://www.terraform.io/docs)

---

**Last Updated**: 2026-07-04
**Next Review**: Check quarterly or when approaching 15,000 users
