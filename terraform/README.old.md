# Terraform Infrastructure for Event Platform

This directory contains Infrastructure as Code (IaC) for deploying the Event Platform to AWS.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   CloudFront (CDN)    │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Application LB (ALB) │
            └───────────┬───────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌─────┐         ┌─────┐         ┌─────┐
    │ API │         │ Web │         │Vend.│
    │ ECS │         │ ECS │         │ ECS │
    └──┬──┘         └─────┘         └─────┘
       │
       ▼
  ┌─────────┐       ┌─────────┐
  │   RDS   │       │   S3    │
  │Postgres │       │ Buckets │
  └─────────┘       └─────────┘
```

## Modules

### `vpc/` - Virtual Private Cloud
- 2 public subnets (for ALB)
- 2 private subnets (for ECS, RDS)
- 2 NAT Gateways (high availability)
- Internet Gateway
- VPC Endpoints (S3)

### `rds/` - PostgreSQL Database
- PostgreSQL 16.4
- Automated backups (3-7 days retention)
- Multi-AZ support (production)
- Performance Insights enabled
- Encrypted at rest

### `elasticache/` - Redis (Optional)
- Redis 7.1
- Disabled by default (set `enable_redis = true`)
- For BullMQ job queues
- Single or multi-node

### `ecs/` - Fargate Services
- ECS Cluster with Container Insights
- 3 services: API, Web, Vendors
- Auto-scaling for API (2-10 tasks)
- IAM roles for S3 and SES access
- CloudWatch Logs integration

### `alb/` - Application Load Balancer
- HTTPS listener (443) with SSL
- HTTP→HTTPS redirect (80→443)
- Target groups for each service
- Health checks

### `s3/` - Storage Buckets
- **Images bucket** - public read, user uploads
- **Assets bucket** - private, static files
- Versioning enabled
- Lifecycle policies

### `cloudfront/` - CDN
- Distributions for Web and Vendors apps
- HTTPS only
- Caching for static assets
- Custom domain support

### `ses/` - Email Service
- Domain identity verification
- DKIM authentication
- Mail-from domain configuration
- Production access (requires request)

## Quick Start

### 1. Prerequisites
```bash
# Install Terraform
brew install terraform  # macOS
# or
choco install terraform  # Windows

# Configure AWS CLI
aws configure
```

### 2. Copy and Edit Variables
```bash
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Required variables:
- `db_username` / `db_password`
- `acm_certificate_arn`
- `domain_name`
- `jwt_secret` / `jwt_refresh_secret`
- All other secrets

### 3. Initialize Terraform
```bash
terraform init
```

This downloads required providers:
- AWS Provider ~> 5.0

### 4. Plan Infrastructure
```bash
terraform plan -out=tfplan
```

Review what will be created (~80-100 resources).

### 5. Apply Configuration
```bash
terraform apply tfplan
```

⏱️ Takes 15-20 minutes (RDS and NAT Gateways are slow).

### 6. Save Outputs
```bash
terraform output > outputs.txt
terraform output -json > outputs.json
```

## Variables

### Required
- `db_username` - Database master username
- `db_password` - Database master password
- `acm_certificate_arn` - SSL certificate ARN (us-east-1)
- `domain_name` - Your domain for SES
- `jwt_secret` - JWT signing key
- `jwt_refresh_secret` - JWT refresh signing key

### Optional
- `enable_redis` (default: `false`) - Enable ElastiCache Redis
- `db_instance_class` (default: `db.t4g.micro`) - RDS instance type
- `redis_node_type` (default: `cache.t4g.micro`) - Redis instance type
- `environment` (default: `production`) - Environment name
- `vpc_cidr` (default: `10.0.0.0/16`) - VPC CIDR block

See `variables.tf` for full list.

## Outputs

After `terraform apply`, you'll get:
- `alb_dns_name` - Load balancer URL
- `rds_endpoint` - Database connection string
- `ecr_*_repository_url` - Docker registry URLs
- `cloudfront_*_domain_name` - CDN URLs
- `s3_*_bucket_name` - S3 bucket names

Use these for:
- DNS configuration
- GitHub Actions secrets
- Application configuration

## Cost Optimization

### Development/Testing
```hcl
environment       = "staging"
db_instance_class = "db.t4g.micro"
enable_redis      = false
```
**Cost: ~$50-70/month**

### Production (Small)
```hcl
environment       = "production"
db_instance_class = "db.t4g.micro"
enable_redis      = false
```
**Cost: ~$100-120/month**

### Production (Medium)
```hcl
environment       = "production"
db_instance_class = "db.t4g.small"
enable_redis      = true
```
**Cost: ~$180-220/month**

### Cost Reduction Tips
1. **Single NAT Gateway** (loses HA): Edit `modules/vpc/main.tf`, change `count = 2` to `count = 1`
   - **Saves: $16/month**
2. **Use VPC Endpoints**: Already included for S3
3. **Right-size instances**: Monitor CPU/memory usage
4. **Enable CloudFront caching**: Reduces data transfer costs

## State Management

### Local State (Development)
By default, state is stored locally in `terraform.tfstate`.

⚠️ **Not recommended for production** (state can be lost).

### Remote State (Production)
Use S3 backend for production:

1. Create S3 bucket:
```bash
aws s3 mb s3://event-platform-terraform-state
aws s3api put-bucket-versioning \
  --bucket event-platform-terraform-state \
  --versioning-configuration Status=Enabled
```

2. Create DynamoDB table:
```bash
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

3. Uncomment backend config in `main.tf`:
```hcl
backend "s3" {
  bucket         = "event-platform-terraform-state"
  key            = "production/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-state-lock"
}
```

4. Migrate state:
```bash
terraform init -migrate-state
```

## Common Operations

### Update Infrastructure
```bash
# Pull latest code
git pull

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan
```

### Scale Services
Edit `modules/ecs/main.tf`:
```hcl
resource "aws_ecs_service" "api" {
  desired_count = 4  # Change from 2 to 4
  ...
}
```

Then apply:
```bash
terraform apply
```

### Add Environment Variables
Edit `modules/ecs/main.tf`, add to `environment` array:
```hcl
environment = [
  # ...existing vars
  { name = "NEW_VAR", value = "value" },
]
```

### Enable Redis
```bash
# Edit terraform.tfvars
enable_redis = true

# Apply
terraform apply
```

### Change Region
```bash
# Edit terraform.tfvars
aws_region = "eu-west-1"

# Destroy old resources (WARNING: data loss)
terraform destroy

# Re-init and apply
terraform init
terraform apply
```

## Troubleshooting

### Error: Certificate not found
```
Error: error reading ACM Certificate: CertificateNotFound
```

**Solution:** Request SSL certificate in ACM first, then copy ARN to `terraform.tfvars`.

### Error: Bucket already exists
```
Error: creating S3 Bucket: BucketAlreadyExists
```

**Solution:** Bucket names must be globally unique. Edit `project_name` in `terraform.tfvars`.

### Error: Database password too short
```
Error: InvalidParameterValue: The parameter MasterUserPassword is not a valid password.
```

**Solution:** Use 12+ character password with letters, numbers, and symbols.

### Error: Task failed to start
After Terraform succeeds but ECS tasks fail:
```bash
# Check logs
aws logs tail /ecs/event-platform-production/api --follow

# Common issues:
# - Missing environment variables
# - Docker image not pushed to ECR
# - Database connection failed
```

### State Lock Error
```
Error: Error locking state: ConditionalCheckFailedException
```

**Solution:**
```bash
# Force unlock (use carefully)
terraform force-unlock <LOCK_ID>
```

## Cleanup

### Destroy All Resources
```bash
terraform destroy
```

⚠️ **WARNING:** This deletes everything including databases and S3 data.

### Destroy Specific Resources
```bash
# Target specific module
terraform destroy -target=module.ecs

# Target specific resource
terraform destroy -target=aws_ecs_service.api
```

### Manual Cleanup Required
Some resources need manual deletion:
- **S3 buckets with objects** - Empty them first
- **ECR repositories with images** - Delete images first
- **CloudWatch log groups** - Set retention or delete

## Development Workflow

### Local Testing
```bash
# Validate syntax
terraform fmt -check
terraform validate

# Plan without applying
terraform plan
```

### Module Development
Test modules in isolation:
```bash
cd modules/vpc
terraform init
terraform plan
```

### Import Existing Resources
```bash
# Import existing VPC
terraform import aws_vpc.main vpc-12345678
```

## Best Practices

✅ **Do:**
- Store state in S3 with versioning
- Use variables for all configurable values
- Tag all resources
- Enable encryption at rest
- Use least-privilege IAM roles
- Review plans before applying

❌ **Don't:**
- Commit `terraform.tfvars` (contains secrets)
- Manually edit AWS resources managed by Terraform
- Run `terraform apply` without review
- Share Terraform state files (contain secrets)

## Security

### Secrets Management
Current: Environment variables in ECS task definitions
Better: AWS Secrets Manager

To migrate:
1. Create secrets in Secrets Manager
2. Update ECS task definition to reference secrets
3. Grant ECS task role access to secrets

### Network Security
- RDS and Redis in private subnets only
- ECS tasks in private subnets
- ALB in public subnets
- Security groups with minimal access

### Compliance
Enable:
- AWS Config for compliance monitoring
- CloudTrail for audit logs
- GuardDuty for threat detection
- AWS WAF for DDoS protection

## Further Reading

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
