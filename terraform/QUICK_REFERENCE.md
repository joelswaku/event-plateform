# Quick Reference Guide

Essential commands for managing the LiteEvent infrastructure.

## Terraform Commands

### Initial Setup
```bash
# Create backend
aws s3api create-bucket --bucket event-platform-terraform-state --region us-east-1
aws dynamodb create-table --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Initialize environment
cd terraform/environments/staging  # or production
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
terraform init
terraform plan
terraform apply
```

### Day-to-Day Operations
```bash
# Check what will change
terraform plan

# Apply changes
terraform apply

# View outputs
terraform output
terraform output -raw github_actions_role_arn

# Refresh outputs
terraform refresh

# Show current state
terraform show

# List resources
terraform state list

# Destroy specific resource
terraform destroy -target=module.ecs.aws_ecs_service.api
```

## AWS CLI Commands

### ECS Operations
```bash
# List clusters
aws ecs list-clusters

# List services
aws ecs list-services --cluster event-platform-production-cluster

# List tasks
aws ecs list-tasks --cluster event-platform-production-cluster

# Describe service
aws ecs describe-services \
  --cluster event-platform-production-cluster \
  --services event-platform-production-api-service

# Update service (force redeploy)
aws ecs update-service \
  --cluster event-platform-production-cluster \
  --service event-platform-production-api-service \
  --force-new-deployment

# Scale service
aws ecs update-service \
  --cluster event-platform-production-cluster \
  --service event-platform-production-api-service \
  --desired-count 5

# Stop task (for emergency)
aws ecs stop-task --cluster event-platform-production-cluster --task <task-id>
```

### ECS Exec (Shell Access)
```bash
# List running tasks
aws ecs list-tasks --cluster event-platform-production-cluster

# Get task details
aws ecs describe-tasks \
  --cluster event-platform-production-cluster \
  --tasks <task-id>

# Connect to container
aws ecs execute-command \
  --cluster event-platform-production-cluster \
  --task <task-id> \
  --container api \
  --interactive \
  --command "/bin/bash"

# Run one-off command
aws ecs execute-command \
  --cluster event-platform-production-cluster \
  --task <task-id> \
  --container api \
  --command "npm run migrate"
```

### Database Migrations
```bash
# Run migration as ECS task
aws ecs run-task \
  --cluster event-platform-production-cluster \
  --task-definition event-platform-production-api-task \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"api","command":["npm","run","migrate"]}]}'

# Wait for task to complete
aws ecs wait tasks-stopped \
  --cluster event-platform-production-cluster \
  --tasks <task-arn>

# Check task exit code
aws ecs describe-tasks \
  --cluster event-platform-production-cluster \
  --tasks <task-arn> \
  --query 'tasks[0].containers[0].exitCode'
```

### ECR Operations
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# List repositories
aws ecr describe-repositories

# List images in repository
aws ecr list-images --repository-name event-platform-production-api

# Tag and push image
docker tag my-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/event-platform-production-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/event-platform-production-api:latest

# Delete old images
aws ecr batch-delete-image \
  --repository-name event-platform-production-api \
  --image-ids imageTag=old-tag
```

### CloudWatch Logs
```bash
# Tail logs (live)
aws logs tail /ecs/event-platform-production/api --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /ecs/event-platform-production/api \
  --filter-pattern "ERROR"

# Search with time range
aws logs filter-log-events \
  --log-group-name /ecs/event-platform-production/api \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --filter-pattern "ERROR"

# Get log streams
aws logs describe-log-streams \
  --log-group-name /ecs/event-platform-production/api \
  --order-by LastEventTime \
  --descending \
  --max-items 5
```

### Secrets Manager
```bash
# List secrets
aws secretsmanager list-secrets

# Get secret value
aws secretsmanager get-secret-value \
  --secret-id event-platform/production/jwt

# Update secret
aws secretsmanager update-secret \
  --secret-id event-platform/production/jwt \
  --secret-string '{"jwt_secret":"new-value","jwt_refresh_secret":"new-value"}'

# Rotate secret
aws secretsmanager rotate-secret \
  --secret-id event-platform/production/database

# Delete secret (with recovery window)
aws secretsmanager delete-secret \
  --secret-id event-platform/production/old-secret \
  --recovery-window-in-days 30
```

### RDS Operations
```bash
# Describe database
aws rds describe-db-instances \
  --db-instance-identifier event-platform-production-db

# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier event-platform-production-db \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier event-platform-production-db

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier event-platform-recovery \
  --db-snapshot-identifier <snapshot-id>

# Modify instance (scale up/down)
aws rds modify-db-instance \
  --db-instance-identifier event-platform-production-db \
  --db-instance-class db.t4g.medium \
  --apply-immediately
```

### VPC Endpoints
```bash
# List VPC endpoints
aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=<vpc-id>"

# Check endpoint status
aws ec2 describe-vpc-endpoints \
  --vpc-endpoint-ids <endpoint-id>

# Modify endpoint (add subnets)
aws ec2 modify-vpc-endpoint \
  --vpc-endpoint-id <endpoint-id> \
  --add-subnet-ids subnet-xxx
```

### Load Balancer
```bash
# List load balancers
aws elbv2 describe-load-balancers

# List target groups
aws elbv2 describe-target-groups

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Deregister target (for maintenance)
aws elbv2 deregister-targets \
  --target-group-arn <target-group-arn> \
  --targets Id=<target-id>
```

## Docker Commands

### Local Development
```bash
# Build image
docker build -t event-platform-api:latest ./api

# Run locally
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://localhost/eventplatform \
  event-platform-api:latest

# View logs
docker logs -f <container-id>

# Shell into container
docker exec -it <container-id> /bin/bash

# Clean up
docker system prune -a
```

### ECR Push Workflow
```bash
# Login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ecr-url>

# Build
docker build -t event-platform-production-api:$GIT_SHA ./api

# Tag
docker tag event-platform-production-api:$GIT_SHA <ecr-url>/event-platform-production-api:latest
docker tag event-platform-production-api:$GIT_SHA <ecr-url>/event-platform-production-api:$GIT_SHA

# Push
docker push <ecr-url>/event-platform-production-api:latest
docker push <ecr-url>/event-platform-production-api:$GIT_SHA
```

## GitHub Actions

### Workflow Triggers
```bash
# Trigger workflow manually
gh workflow run deploy.yml

# View workflow runs
gh run list

# Watch workflow
gh run watch <run-id>

# View logs
gh run view <run-id> --log
```

### Secrets Management
```bash
# Add secret to repository
gh secret set AWS_GITHUB_ACTIONS_ROLE

# List secrets
gh secret list

# Delete secret
gh secret delete OLD_SECRET
```

## Monitoring

### CloudWatch Metrics
```bash
# Get ECS CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=event-platform-production-api-service \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# Get RDS connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=event-platform-production-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Cost Tracking
```bash
# Get current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Get daily costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost
```

## Emergency Procedures

### Rollback Deployment
```bash
# List previous task definition revisions
aws ecs list-task-definitions \
  --family-prefix event-platform-production-api-task

# Update service to previous version
aws ecs update-service \
  --cluster event-platform-production-cluster \
  --service event-platform-production-api-service \
  --task-definition event-platform-production-api-task:PREVIOUS_REVISION
```

### Scale to Zero (Emergency Stop)
```bash
aws ecs update-service \
  --cluster event-platform-production-cluster \
  --service event-platform-production-api-service \
  --desired-count 0
```

### Restore from Backup
```bash
# Database
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier event-platform-emergency-restore \
  --db-snapshot-identifier <snapshot-id>

# Terraform state
terraform state pull > backup.tfstate
terraform state push backup-YYYYMMDD.tfstate
```

## Quick Health Checks

### All Systems
```bash
# ECS services
aws ecs describe-services \
  --cluster event-platform-production-cluster \
  --services event-platform-production-api-service \
  --query 'services[0].runningCount'

# RDS status
aws rds describe-db-instances \
  --db-instance-identifier event-platform-production-db \
  --query 'DBInstances[0].DBInstanceStatus'

# ALB targets
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --query 'TargetHealthDescriptions[*].TargetHealth.State'

# VPC endpoints
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=<vpc-id>" \
  --query 'VpcEndpoints[*].[ServiceName,State]'
```

## Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Terraform
alias tf='terraform'
alias tfi='terraform init'
alias tfp='terraform plan'
alias tfa='terraform apply'
alias tfo='terraform output'

# ECS
alias ecs-services='aws ecs list-services --cluster event-platform-production-cluster'
alias ecs-tasks='aws ecs list-tasks --cluster event-platform-production-cluster'

# Logs
alias logs-api='aws logs tail /ecs/event-platform-production/api --follow'
alias logs-web='aws logs tail /ecs/event-platform-production/web --follow'

# ECR Login
alias ecr-login='aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com'
```

## Reference Links

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/)
- [ECS CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/ecs/)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
