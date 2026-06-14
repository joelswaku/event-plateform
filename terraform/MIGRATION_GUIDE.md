# Migration Guide: Legacy to Modernized Terraform

This guide walks through migrating from the legacy Terraform configuration to the new environment-based setup with cost optimizations and enhanced security.

## What's Changing

### Architecture Improvements
- **NAT Gateways**: 2 → 1 (saves ~$45/month)
- **VPC Endpoints**: Added 7 interface endpoints (routing AWS traffic internally)
- **Secrets Manager**: Centralized secret storage (no hardcoded credentials)
- **GitHub OIDC**: CI/CD without AWS access keys
- **ECS Exec**: Shell access to running containers for debugging
- **Environment Separation**: Dedicated staging and production configurations

### Cost Impact
- **Old Setup**: ~$250/month (2 NAT Gateways @ $90, RDS, ECS)
- **New Setup**: ~$180/month production, ~$75/month staging
- **Savings**: ~$70/month (~28% reduction)

## Migration Options

### Option 1: Fresh Deployment (Recommended for Staging)

Deploy new infrastructure alongside the old, then switch traffic.

**Pros**: Zero downtime, easy rollback, thorough testing
**Cons**: Temporary double costs during migration

### Option 2: In-Place Migration (Risky)

Update existing infrastructure gradually.

**Pros**: No duplicate resources
**Cons**: Risk of downtime, harder to rollback

## Pre-Migration Checklist

- [ ] Backup current Terraform state
- [ ] Export all current secrets
- [ ] Document current DNS records
- [ ] Note current database endpoint
- [ ] Export environment variables from ECS tasks
- [ ] Review current security groups
- [ ] Create ACM certificates for new domains
- [ ] Test GitHub Actions OIDC locally

## Step-by-Step Migration

### Phase 1: Setup (No Impact)

#### 1.1 Create Terraform Backend

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket event-platform-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket event-platform-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket event-platform-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

#### 1.2 Export Current Secrets

```bash
# Export from current ECS task definitions
aws ecs describe-task-definition \
  --task-definition event-platform-production-api-task \
  --query 'taskDefinition.containerDefinitions[0].environment' \
  > current-secrets.json

# Review and extract sensitive values
cat current-secrets.json
```

#### 1.3 Backup Current State

```bash
cd terraform/
terraform state pull > backup-$(date +%Y%m%d).tfstate
aws s3 cp backup-*.tfstate s3://your-backup-bucket/terraform-backups/
```

### Phase 2: Deploy Staging (No Impact on Production)

#### 2.1 Configure Staging Environment

```bash
cd terraform/environments/staging

# Copy and edit configuration
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Fill in staging-specific values:
- Use different VPC CIDR (10.1.0.0/16)
- Use staging domain names
- Use Stripe test keys
- Generate new JWT secrets (different from production)

#### 2.2 Deploy Staging Infrastructure

```bash
terraform init
terraform plan -out=staging.plan

# Review the plan carefully
terraform show staging.plan

# Apply
terraform apply staging.plan
```

#### 2.3 Verify Staging Deployment

```bash
# Get outputs
terraform output

# Test ECS exec
aws ecs list-tasks --cluster event-platform-staging-cluster
aws ecs execute-command \
  --cluster event-platform-staging-cluster \
  --task <task-id> \
  --container api \
  --interactive \
  --command "/bin/sh"

# Test secrets
aws ecs describe-task-definition \
  --task-definition event-platform-staging-api-task \
  | jq '.taskDefinition.containerDefinitions[0].secrets'
```

#### 2.4 Configure GitHub Actions for Staging

```bash
# Get the role ARN
terraform output github_actions_role_arn
```

Add to GitHub repository:
1. Settings → Environments → New environment "staging"
2. Add secret: `AWS_GITHUB_ACTIONS_ROLE` = (ARN from above)

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    permissions:
      id-token: write
      contents: read
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_GITHUB_ACTIONS_ROLE }}
          aws-region: us-east-1
      
      - name: Deploy
        run: |
          # Your deployment commands
          echo "Deploying to staging..."
```

#### 2.5 Test Staging End-to-End

- [ ] Application loads
- [ ] Database connections work
- [ ] Secrets are loaded correctly
- [ ] Email sending works (Resend)
- [ ] Image uploads work (S3)
- [ ] Payment processing works (Stripe test mode)
- [ ] GitHub Actions deployment works

### Phase 3: Prepare Production Migration

#### 3.1 Database Migration Strategy

**Option A: Restore from Snapshot (Recommended)**

```bash
# Create snapshot of current RDS
aws rds create-db-snapshot \
  --db-instance-identifier current-db-instance \
  --db-snapshot-identifier pre-migration-$(date +%Y%m%d)

# After new RDS is created, restore data
pg_dump -h old-db-endpoint -U postgres eventplatform > backup.sql
psql -h new-db-endpoint -U postgres eventplatform < backup.sql
```

**Option B: Point ECS to Old Database Temporarily**

Modify new ECS tasks to point to old database during transition.

#### 3.2 Plan DNS Cutover

```bash
# Document current DNS records
aws route53 list-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  > dns-backup.json

# Lower TTL 24 hours before migration
# Change from 300s to 60s
```

### Phase 4: Deploy Production

#### 4.1 Configure Production Environment

```bash
cd terraform/environments/production

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

**CRITICAL**: Use production values:
- Production VPC CIDR (10.0.0.0/16)
- Production domain names
- Stripe LIVE keys (not test)
- Strong, unique JWT secrets
- Production database credentials

#### 4.2 Deploy Production Infrastructure

```bash
terraform init
terraform plan -out=production.plan

# Review VERY carefully
terraform show production.plan

# Apply
terraform apply production.plan
```

This creates:
- New VPC with VPC endpoints
- New RDS instance (Multi-AZ)
- New ElastiCache Redis
- New ALB
- New ECS cluster
- Secrets Manager secrets
- GitHub OIDC provider

#### 4.3 Migrate Data

```bash
# Option A: Database restore
pg_dump -h old-db.region.rds.amazonaws.com -U postgres eventplatform \
  | psql -h new-db.region.rds.amazonaws.com -U postgres eventplatform

# Option B: RDS snapshot restore
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier new-instance \
  --db-snapshot-identifier pre-migration-snapshot

# Copy S3 data (if bucket changed)
aws s3 sync s3://old-images-bucket s3://new-images-bucket
```

#### 4.4 Test New Production Infrastructure

```bash
# Get new ALB DNS name
terraform output alb_dns_name

# Test endpoints directly (before DNS switch)
curl -H "Host: api.yourdomain.com" http://<alb-dns-name>/health

# Verify database connection
aws ecs execute-command \
  --cluster event-platform-production-cluster \
  --task <task-id> \
  --container api \
  --interactive \
  --command "node -e 'require(\"./db\").query(\"SELECT 1\")'"
```

### Phase 5: Cutover

#### 5.1 Switch DNS (Staged)

Update Route53 or your DNS provider:

```bash
# Update API domain
api.yourdomain.com → new-alb-dns-name

# Update Web domain
app.yourdomain.com → new-cloudfront-distribution

# Update Vendors domain
vendors.yourdomain.com → new-cloudfront-distribution
```

**Staged Approach**:
1. Switch staging first (validate)
2. Switch one production domain
3. Monitor for 15 minutes
4. Switch remaining domains

#### 5.2 Monitor Closely

```bash
# Watch ECS service health
watch -n 5 'aws ecs describe-services \
  --cluster event-platform-production-cluster \
  --services event-platform-production-api-service \
  --query "services[0].runningCount"'

# Watch CloudWatch logs
aws logs tail /ecs/event-platform-production/api --follow

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw target_group_arn)
```

#### 5.3 Verify Migration Success

- [ ] All services running healthy
- [ ] Database queries working
- [ ] No error spikes in logs
- [ ] Payment processing working
- [ ] Email sending working
- [ ] Image uploads working
- [ ] User authentication working
- [ ] API response times normal

### Phase 6: Cleanup

**Wait 48 hours** before cleanup to ensure stability.

#### 6.1 Document New Infrastructure

```bash
# Export all outputs
cd terraform/environments/production
terraform output > infrastructure-info.txt

# Save important endpoints
echo "Database: $(terraform output -raw database_endpoint)" >> infrastructure-info.txt
echo "ECR API: $(terraform output -raw ecr_api_repository_url)" >> infrastructure-info.txt
```

#### 6.2 Decommission Old Infrastructure

```bash
cd terraform/  # old root directory

# Review what will be destroyed
terraform plan -destroy

# Destroy old infrastructure
terraform destroy

# Or selectively destroy
terraform destroy -target=module.vpc
terraform destroy -target=module.ecs
```

#### 6.3 Remove Old Resources

```bash
# Delete old ECR images (if repository changed)
aws ecr delete-repository \
  --repository-name old-event-platform-api \
  --force

# Delete old load balancers
aws elbv2 delete-load-balancer \
  --load-balancer-arn <old-alb-arn>

# Delete old NAT Gateways (saves money immediately)
aws ec2 delete-nat-gateway --nat-gateway-id <old-nat-id>
```

### Phase 7: Optimize

#### 7.1 Monitor Costs

```bash
# Check Cost Explorer for savings
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

#### 7.2 Tune Performance

- Monitor ECS CPU/Memory usage
- Adjust task definitions if needed
- Enable auto-scaling if traffic increases
- Consider CloudWatch Container Insights

#### 7.3 Security Hardening

- [ ] Rotate all secrets in Secrets Manager
- [ ] Enable AWS Config rules
- [ ] Set up CloudWatch alarms
- [ ] Enable AWS GuardDuty
- [ ] Review VPC Flow Logs
- [ ] Enable RDS encryption at rest (if not already)

## Rollback Plan

If issues occur during migration:

### Immediate Rollback (DNS)

```bash
# Switch DNS back to old infrastructure
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://rollback-dns.json
```

### Partial Rollback (Service by Service)

```bash
# Point specific services back to old infrastructure
# Update Route53 for just the failing service
```

### Full Rollback

```bash
# Restore Terraform state
terraform state push backup-YYYYMMDD.tfstate

# Restore database from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier original-instance \
  --db-snapshot-identifier pre-migration-snapshot
```

## Common Issues

### Issue: ECS tasks can't pull ECR images

**Solution**: Verify VPC endpoints are created and healthy

```bash
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=<vpc-id>" \
  --query 'VpcEndpoints[*].[ServiceName,State]'
```

### Issue: Secrets not loading

**Solution**: Check task execution role has Secrets Manager permissions

```bash
aws iam get-role-policy \
  --role-name event-platform-production-ecs-task-execution-role \
  --policy-name event-platform-production-ecs-execution-secrets-policy
```

### Issue: Database connections failing

**Solution**: Verify security groups allow traffic from ECS to RDS

```bash
aws ec2 describe-security-groups \
  --group-ids <rds-sg-id> \
  --query 'SecurityGroups[0].IpPermissions'
```

## Post-Migration Tasks

- [ ] Update documentation with new endpoints
- [ ] Train team on ECS Exec usage
- [ ] Set up monitoring dashboards
- [ ] Configure backup schedules
- [ ] Document secret rotation process
- [ ] Set up cost alerts
- [ ] Review and adjust auto-scaling policies

## Support

If you encounter issues:

1. Check CloudWatch Logs: `/ecs/event-platform-{env}/{service}`
2. Review VPC endpoint status
3. Verify IAM roles and policies
4. Check security group rules
5. Consult AWS documentation

## Timeline Estimate

- **Staging Setup**: 4-6 hours
- **Staging Testing**: 1-2 days
- **Production Planning**: 2-4 hours
- **Production Migration**: 4-8 hours
- **Monitoring Period**: 48 hours
- **Cleanup**: 2 hours

**Total**: 1-2 weeks for complete migration
