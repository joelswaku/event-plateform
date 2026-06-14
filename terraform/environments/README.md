# LiteEvent Terraform Environments

This directory contains environment-specific Terraform configurations for the LiteEvent platform.

## Directory Structure

```
environments/
├── staging/
│   ├── main.tf                    # Staging infrastructure
│   ├── variables.tf               # Staging variables
│   ├── outputs.tf                 # Staging outputs
│   └── terraform.tfvars.example   # Example configuration
└── production/
    ├── main.tf                    # Production infrastructure
    ├── variables.tf               # Production variables
    ├── outputs.tf                 # Production outputs
    └── terraform.tfvars.example   # Example configuration
```

## Key Features

### Cost Optimizations
- **Single NAT Gateway**: Reduced from 2 to 1 NAT Gateway (~$45/month savings)
- **VPC Endpoints**: AWS services routed through VPC endpoints instead of NAT Gateway
- **Staging Optimizations**: Smaller instance sizes, single-AZ RDS, Redis disabled by default

### Security Improvements
- **AWS Secrets Manager**: All secrets stored securely, no hardcoded values
- **GitHub OIDC**: CI/CD authentication without AWS access keys
- **VPC Endpoints**: Traffic stays within AWS network

### Operational Excellence
- **ECS Exec Enabled**: Run commands directly in containers for debugging
- **Separate Environments**: Complete isolation between staging and production
- **Multi-AZ**: Production uses Multi-AZ RDS for high availability

## VPC Endpoints Included

### Gateway Endpoints (Free)
- **S3**: Object storage access
- **DynamoDB**: (Optional) NoSQL database access

### Interface Endpoints (~$7/month each)
- **ECR API**: Pull container images
- **ECR DKR**: Docker registry operations
- **CloudWatch Logs**: Send application logs
- **Secrets Manager**: Access application secrets
- **SSM/SSM Messages/EC2 Messages**: Enable ECS Exec
- **SES**: (Optional) Send emails
- **RDS**: (Optional) Database management

## Cost Breakdown

### Staging Environment (~$75/month)
- RDS db.t4g.micro: ~$15
- Single NAT Gateway: ~$32
- VPC Endpoints (7): ~$50
- ECS Fargate (minimal): ~$10
- S3/CloudFront: ~$5
- **Redis disabled by default**

### Production Environment (~$180/month)
- RDS db.t4g.small Multi-AZ: ~$60
- Single NAT Gateway: ~$32
- VPC Endpoints (7): ~$50
- ElastiCache Redis: ~$30
- ECS Fargate (2x tasks): ~$40
- S3/CloudFront/ALB: ~$15

## Quick Start

### 1. Setup Terraform Backend

First, create the S3 bucket and DynamoDB table for state management:

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket event-platform-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket event-platform-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Configure Staging Environment

```bash
cd environments/staging

# Copy example config
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
nano terraform.tfvars

# Initialize Terraform
terraform init

# Review changes
terraform plan

# Apply configuration
terraform apply
```

### 3. Configure Production Environment

```bash
cd environments/production

# Copy example config
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
nano terraform.tfvars

# Initialize Terraform
terraform init

# Review changes
terraform plan

# Apply configuration
terraform apply
```

## GitHub Actions Setup

After deploying, configure GitHub Actions to use OIDC:

1. Get the GitHub Actions role ARN:
```bash
terraform output github_actions_role_arn
```

2. Add to your GitHub Actions workflow:
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_GITHUB_ACTIONS_ROLE }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build and push
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --force-new-deployment
```

## ECS Exec Usage

Connect to running containers for debugging:

```bash
# List running tasks
aws ecs list-tasks --cluster event-platform-staging-cluster

# Connect to a task
aws ecs execute-command \
  --cluster event-platform-staging-cluster \
  --task <task-id> \
  --container api \
  --interactive \
  --command "/bin/bash"
```

## Secrets Management

### Initial Setup
Secrets are stored in AWS Secrets Manager. On first deployment, they're created from `terraform.tfvars`.

### Rotating Secrets
To rotate secrets without Terraform:

```bash
# Update a secret
aws secretsmanager update-secret \
  --secret-id event-platform/production/jwt \
  --secret-string '{"jwt_secret":"new-value","jwt_refresh_secret":"new-value"}'

# Force ECS service to restart with new secrets
aws ecs update-service \
  --cluster event-platform-production-cluster \
  --service event-platform-production-api-service \
  --force-new-deployment
```

## Migration from Old Setup

If migrating from the old Terraform configuration:

1. **Backup existing state**:
```bash
terraform state pull > backup.tfstate
```

2. **Export existing secrets** from old infrastructure

3. **Deploy new infrastructure** in staging first

4. **Test thoroughly** in staging

5. **Plan production migration** with minimal downtime:
   - Deploy new infrastructure
   - Run database migration
   - Update DNS to point to new ALB/CloudFront
   - Monitor for issues
   - Destroy old infrastructure

## Troubleshooting

### NAT Gateway Issues
If services can't reach the internet:
- Check NAT Gateway is running
- Verify route tables point to NAT Gateway
- Ensure VPC endpoints are healthy

### VPC Endpoint Issues
If AWS service calls fail:
- Verify VPC endpoint status is "available"
- Check security group allows port 443
- Ensure DNS resolution is enabled on VPC

### ECS Exec Not Working
- Verify SSM endpoints are created
- Check task role has SSM permissions
- Ensure `enable_execute_command = true` on service
- Install Session Manager plugin locally

### Secrets Not Loading
- Check task execution role has Secrets Manager permissions
- Verify secret ARNs are correct
- Check CloudWatch logs for specific error messages

## Environment Differences

| Feature | Staging | Production |
|---------|---------|------------|
| RDS Instance | db.t4g.micro | db.t4g.small |
| Multi-AZ | No | Yes |
| Redis | Disabled | Enabled |
| Task Count | 1 | 2 |
| Log Retention | 7 days | 30 days |
| ECR Image Retention | 10 images | 30 images |

## Support

For issues or questions:
- Check CloudWatch Logs: `/ecs/event-platform-{env}/{service}`
- Review Terraform plan before applying changes
- Test changes in staging first
- Keep Terraform state backed up
