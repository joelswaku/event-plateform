# AWS Scaling Plan (20K+ Users)

## Current Setup
- **Railway** (< 20K users) - Cost: ~$50-100/month
- **AWS Ready** (20K+ users) - Cost: ~$270-840/month

## When to Switch

Monitor user count:
```sql
SELECT COUNT(*) FROM users;
```

**Switch triggers:**
- Total users > 15,000 (start planning)
- Total users > 20,000 (execute switch)
- Performance degradation
- Need geographic distribution

## AWS Infrastructure (Preserved)

All AWS configs in `terraform/` directory:
- **VPC:** Multi-AZ networking
- **ECS Fargate:** Container orchestration
- **RDS:** PostgreSQL with replicas
- **ElastiCache:** Redis cluster
- **ALB:** Load balancer with SSL
- **CloudFront:** Global CDN

## Quick Switch Process

### 1. Activate AWS (1-2 days before switch)
```bash
cd terraform/environments/production
terraform init
terraform apply
```

### 2. Migrate Data
```bash
# Export from Railway
railway run pg_dump $DATABASE_URL > railway_backup.sql

# Import to AWS
psql $AWS_DATABASE_URL < railway_backup.sql
```

### 3. Update DNS
```
api.liteevent.com → AWS ALB
liteevent.com → AWS CloudFront
```

### 4. Deploy via GitHub Actions
```bash
git push origin main
# GitHub Actions automatically deploys to AWS
```

## Cost Comparison

| Service | Railway | AWS |
|---------|---------|-----|
| Compute | $20-50 | $50-200 |
| Database | $15-30 | $100-300 |
| Cache | $10-20 | $50-100 |
| CDN | Included | $20-50 |
| **Total** | **$50-100** | **$270-840** |

## Terraform Maintained

All infrastructure as code preserved in:
- `terraform/main.tf`
- `terraform/modules/`
- `terraform/environments/production/`
- `.github/workflows/deploy-production.yml`

Ready to deploy anytime with one command: `terraform apply`
