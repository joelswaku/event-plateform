# LiteEvent Terraform Infrastructure

Modern, cost-optimized AWS infrastructure for the LiteEvent platform with enhanced security and operational excellence.

## Overview

This Terraform configuration manages the complete AWS infrastructure for LiteEvent, including:

- **VPC** with VPC endpoints (cost-optimized networking)
- **RDS PostgreSQL** (managed database)
- **ElastiCache Redis** (session and cache storage)
- **ECS Fargate** (containerized application hosting)
- **Application Load Balancer** (traffic distribution)
- **CloudFront** (CDN for web apps)
- **S3** (object storage for images and assets)
- **Secrets Manager** (centralized secret management)
- **GitHub OIDC** (keyless CI/CD authentication)
- **CloudWatch** (logging and monitoring)
- **SES** (transactional email)

## Key Features

### Cost Optimizations
- **Single NAT Gateway**: Reduced from 2 to 1 (~$45/month savings)
- **VPC Endpoints**: AWS traffic routed privately (reduces NAT data transfer costs)
- **Environment-Specific Sizing**: Smaller instances for staging
- **Auto-Scaling**: Scale down during low traffic
- **Lifecycle Policies**: Automatic cleanup of old ECR images

**Total Savings**: ~28% reduction (~$70/month)

### Security Enhancements
- **No Hardcoded Secrets**: All secrets in AWS Secrets Manager
- **GitHub OIDC**: No AWS access keys in CI/CD
- **VPC Endpoints**: Traffic stays within AWS network
- **Multi-AZ**: Production database with automatic failover
- **Encryption**: At-rest encryption for RDS, S3, and secrets

### Operational Excellence
- **ECS Exec**: Shell access to running containers
- **Separate Environments**: Isolated staging and production
- **Infrastructure as Code**: Versioned, reviewable infrastructure changes
- **Automated Backups**: RDS automated backups and snapshots
- **CloudWatch Logs**: Centralized logging for all services

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                          │
│                    (Web + Vendors Frontend)                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                  Application Load Balancer                      │
│                     (HTTPS Termination)                         │
└─────────────────┬────────────┬──────────────┬───────────────────┘
                  │            │              │
         ┌────────▼─────┐ ┌───▼──────┐ ┌────▼─────────┐
         │  ECS API     │ │ ECS Web  │ │ ECS Vendors  │
         │  (Fargate)   │ │ (Fargate)│ │  (Fargate)   │
         └──┬────────┬──┘ └──────────┘ └──────────────┘
            │        │
    ┌───────▼──┐  ┌─▼────────────┐
    │    RDS   │  │ ElastiCache  │
    │PostgreSQL│  │    Redis     │
    └──────────┘  └──────────────┘

VPC Endpoints (Private AWS Service Access):
├── ECR (Docker images)
├── CloudWatch Logs
├── Secrets Manager
├── S3
├── SSM (ECS Exec)
└── SES (Email)
```

## Directory Structure

```
terraform/
├── environments/
│   ├── staging/
│   │   ├── main.tf                    # Staging infrastructure
│   │   ├── variables.tf               # Staging variables
│   │   ├── outputs.tf                 # Staging outputs
│   │   └── terraform.tfvars.example   # Example configuration
│   └── production/
│       ├── main.tf                    # Production infrastructure
│       ├── variables.tf               # Production variables
│       ├── outputs.tf                 # Production outputs
│       └── terraform.tfvars.example   # Example configuration
│
├── modules/
│   ├── vpc/                           # VPC with endpoints
│   ├── rds/                           # PostgreSQL database
│   ├── elasticache/                   # Redis cache
│   ├── ecs/                           # ECS cluster and services
│   ├── alb/                           # Application Load Balancer
│   ├── s3/                            # S3 buckets
│   ├── cloudfront/                    # CloudFront distributions
│   ├── ses/                           # Email service
│   ├── secrets/                       # Secrets Manager
│   └── github-oidc/                   # GitHub Actions authentication
│
├── MIGRATION_GUIDE.md                 # Migration from legacy setup
└── README.md                          # This file
```

## Quick Start

### Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- AWS account with appropriate permissions
- Domain name with DNS hosted in Route53 (or external DNS provider)
- ACM certificates created for your domains

### 1. Setup Terraform Backend

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket event-platform-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket event-platform-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Deploy Staging Environment

```bash
cd environments/staging

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply configuration
terraform apply
```

### 3. Deploy Production Environment

```bash
cd environments/production

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit with your values (use production secrets!)
nano terraform.tfvars

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply configuration
terraform apply
```

### 4. Configure GitHub Actions

Get the GitHub Actions role ARN:

```bash
terraform output github_actions_role_arn
```

Add to your GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Create new secret: `AWS_GITHUB_ACTIONS_ROLE`
3. Value: The ARN from above

See [modules/github-oidc/README.md](modules/github-oidc/README.md) for complete workflow examples.

## Cost Breakdown

### Staging Environment (~$130/month)
| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| RDS | db.t4g.micro, Single-AZ | ~$15 |
| NAT Gateway | 1 gateway | ~$32 |
| VPC Endpoints | 7 interface endpoints | ~$50 |
| ECS Fargate | 1 task per service | ~$10 |
| ALB | Standard | ~$18 |
| S3/CloudFront | Low traffic | ~$5 |
| **Total** | | **~$130** |

### Production Environment (~$245/month)
| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| RDS | db.t4g.small, Multi-AZ | ~$60 |
| NAT Gateway | 1 gateway | ~$32 |
| VPC Endpoints | 7 interface endpoints | ~$50 |
| ElastiCache | cache.t4g.small, 2 nodes | ~$30 |
| ECS Fargate | 2 tasks per service | ~$40 |
| ALB | Standard | ~$18 |
| S3/CloudFront | Moderate traffic | ~$15 |
| **Total** | | **~$245** |

### Old vs New
- **Old Setup**: ~$250/month (2 NAT Gateways, no staging)
- **New Setup**: ~$245/month production + ~$130/month staging
- **Benefit**: Dedicated staging environment + ~$5/month savings on production

## Common Operations

### Deploy New Application Version

```bash
# Via GitHub Actions (recommended)
git push origin main

# Or manually
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-url>
docker build -t event-platform-production-api:latest ./api
docker push <ecr-url>/event-platform-production-api:latest
aws ecs update-service --cluster event-platform-production-cluster --service event-platform-production-api-service --force-new-deployment
```

### Access Running Container

```bash
# List tasks
aws ecs list-tasks --cluster event-platform-production-cluster

# Connect to container
aws ecs execute-command \
  --cluster event-platform-production-cluster \
  --task <task-arn> \
  --container api \
  --interactive \
  --command "/bin/bash"
```

### Run Database Migration

```bash
# Via ECS task
aws ecs run-task \
  --cluster event-platform-production-cluster \
  --task-definition event-platform-production-api-task \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"api","command":["npm","run","migrate"]}]}'
```

### View Logs

```bash
# Tail logs
aws logs tail /ecs/event-platform-production/api --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /ecs/event-platform-production/api \
  --filter-pattern "ERROR"
```

### Rotate Secrets

```bash
# Update secret in Secrets Manager
aws secretsmanager update-secret \
  --secret-id event-platform/production/jwt \
  --secret-string '{"jwt_secret":"new-value","jwt_refresh_secret":"new-value"}'

# Force ECS to restart with new secrets
aws ecs update-service \
  --cluster event-platform-production-cluster \
  --service event-platform-production-api-service \
  --force-new-deployment
```

## Troubleshooting

### Common Issues

**Issue**: ECS tasks won't start
- Check CloudWatch logs for errors
- Verify ECR image exists
- Check task execution role permissions
- Verify VPC endpoints are healthy

**Issue**: Can't access database
- Check security groups
- Verify RDS endpoint
- Check secrets in Secrets Manager
- Verify task role has database access

**Issue**: High costs
- Review NAT Gateway data transfer
- Check for unused resources
- Review CloudWatch Logs retention
- Optimize ECS task sizing

**Issue**: GitHub Actions deployment fails
- Verify OIDC role ARN is correct
- Check IAM permissions
- Verify ECR repository exists
- Check GitHub workflow syntax

## Documentation

- [Environment Setup Guide](environments/README.md) - Detailed environment configuration
- [GitHub OIDC Setup](modules/github-oidc/README.md) - CI/CD authentication
- [Migration Guide](MIGRATION_GUIDE.md) - Migrate from legacy setup

## Security Best Practices

- [ ] Rotate secrets regularly (every 90 days)
- [ ] Review IAM policies quarterly
- [ ] Enable AWS Config for compliance
- [ ] Use AWS GuardDuty for threat detection
- [ ] Enable VPC Flow Logs
- [ ] Review security groups regularly
- [ ] Keep Terraform modules updated
- [ ] Use AWS Secrets Manager for all secrets
- [ ] Enable MFA for AWS root account

## Support

For issues or questions:
- Check CloudWatch Logs: `/ecs/event-platform-{env}/{service}`
- Review AWS documentation
- Check [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for migration help
- Review module READMEs for specific features
