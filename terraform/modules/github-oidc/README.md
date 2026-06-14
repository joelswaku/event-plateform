# GitHub OIDC Module

This module configures AWS IAM to trust GitHub Actions via OIDC (OpenID Connect), eliminating the need for long-lived AWS access keys in your CI/CD pipeline.

## Features

- **No AWS Access Keys**: GitHub Actions authenticates via OIDC tokens
- **ECR Push**: Push Docker images to ECR repositories
- **ECS Deploy**: Update ECS services with new task definitions
- **Run Migrations**: Execute one-off ECS tasks for database migrations
- **Optional Secrets Access**: Read-only access to Secrets Manager (for migrations)

## How It Works

1. GitHub Actions requests a short-lived OIDC token from GitHub
2. AWS STS exchanges the GitHub token for temporary AWS credentials
3. The workflow uses these credentials to interact with AWS services
4. Credentials expire automatically after the job completes

## Security Benefits

- No static credentials stored in GitHub Secrets
- Fine-grained IAM permissions per repository
- Automatic credential rotation
- Audit trail via CloudTrail
- Can restrict by branch, tag, or environment

## Required GitHub Actions Permissions

Your workflow must request `id-token: write` permission:

```yaml
permissions:
  id-token: write   # Required for OIDC
  contents: read    # Required for checkout
```

## Example GitHub Actions Workflow

### Full CI/CD Pipeline

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ENVIRONMENT: production # or staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_GITHUB_ACTIONS_ROLE }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-${{ github.run_id }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build and push API image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: event-platform-${{ env.ENVIRONMENT }}-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./api
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Build and push Web image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: event-platform-${{ env.ENVIRONMENT }}-web
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./web
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Build and push Vendors image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: event-platform-${{ env.ENVIRONMENT }}-vendors
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./vendors
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Run database migrations
        run: |
          CLUSTER_NAME=event-platform-${{ env.ENVIRONMENT }}-cluster
          TASK_DEFINITION=event-platform-${{ env.ENVIRONMENT }}-api-task
          SUBNET_IDS=$(aws ec2 describe-subnets \
            --filters "Name=tag:Environment,Values=${{ env.ENVIRONMENT }}" "Name=tag:Type,Values=private" \
            --query 'Subnets[*].SubnetId' \
            --output text | tr '\t' ',')
          
          SECURITY_GROUP=$(aws ec2 describe-security-groups \
            --filters "Name=tag:Name,Values=event-platform-${{ env.ENVIRONMENT }}-ecs-tasks-sg" \
            --query 'SecurityGroups[0].GroupId' \
            --output text)
          
          aws ecs run-task \
            --cluster $CLUSTER_NAME \
            --task-definition $TASK_DEFINITION \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP],assignPublicIp=DISABLED}" \
            --overrides '{"containerOverrides":[{"name":"api","command":["npm","run","migrate"]}]}' \
            --wait
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster event-platform-${{ env.ENVIRONMENT }}-cluster \
            --service event-platform-${{ env.ENVIRONMENT }}-api-service \
            --force-new-deployment
          
          aws ecs update-service \
            --cluster event-platform-${{ env.ENVIRONMENT }}-cluster \
            --service event-platform-${{ env.ENVIRONMENT }}-web-service \
            --force-new-deployment
          
          aws ecs update-service \
            --cluster event-platform-${{ env.ENVIRONMENT }}-cluster \
            --service event-platform-${{ env.ENVIRONMENT }}-vendors-service \
            --force-new-deployment
      
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster event-platform-${{ env.ENVIRONMENT }}-cluster \
            --services \
              event-platform-${{ env.ENVIRONMENT }}-api-service \
              event-platform-${{ env.ENVIRONMENT }}-web-service \
              event-platform-${{ env.ENVIRONMENT }}-vendors-service
```

### Staging vs Production

Use GitHub Environments to separate staging and production:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
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
      # ... deploy steps

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production
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
      # ... deploy steps
```

## Setup Instructions

### 1. Deploy Terraform

```bash
cd terraform/environments/staging
terraform apply

cd ../production
terraform apply
```

### 2. Get the Role ARN

```bash
terraform output github_actions_role_arn
```

### 3. Add to GitHub Secrets

1. Go to your repository Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Name: `AWS_GITHUB_ACTIONS_ROLE`
4. Value: The ARN from step 2 (e.g., `arn:aws:iam::123456789012:role/event-platform-staging-github-actions-role`)

For separate environments, use environment-specific secrets:
- Staging environment: `AWS_GITHUB_ACTIONS_ROLE`
- Production environment: `AWS_GITHUB_ACTIONS_ROLE`

### 4. Test the Integration

Create a simple workflow to test:

```yaml
name: Test AWS OIDC

on: [workflow_dispatch]

jobs:
  test:
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
      
      - name: Verify AWS identity
        run: aws sts get-caller-identity
```

## Permissions Granted

### ECR Permissions
- `ecr:GetAuthorizationToken` - Login to ECR
- `ecr:BatchCheckLayerAvailability` - Check if layers exist
- `ecr:GetDownloadUrlForLayer` - Pull images
- `ecr:BatchGetImage` - Pull images
- `ecr:PutImage` - Push images
- `ecr:InitiateLayerUpload` - Start upload
- `ecr:UploadLayerPart` - Upload chunks
- `ecr:CompleteLayerUpload` - Finish upload

### ECS Permissions
- `ecs:UpdateService` - Deploy new versions
- `ecs:DescribeServices` - Check service status
- `ecs:DescribeTaskDefinition` - View task configs
- `ecs:RegisterTaskDefinition` - Create new task definitions
- `ecs:ListTaskDefinitions` - List available definitions
- `ecs:DescribeClusters` - View cluster info
- `ecs:RunTask` - Run migrations
- `ecs:StopTask` - Stop tasks
- `ecs:DescribeTasks` - Check task status
- `iam:PassRole` - Pass roles to ECS tasks

### CloudWatch Logs
- `logs:GetLogEvents` - View logs
- `logs:FilterLogEvents` - Search logs

### Secrets Manager (Optional)
- `secretsmanager:GetSecretValue` - Read secrets
- `secretsmanager:DescribeSecret` - View secret metadata

## Security Considerations

### Repository Restrictions

The OIDC provider is configured to only trust your specific repository:

```hcl
"token.actions.githubusercontent.com:sub" = "repo:your-org/event-platform:*"
```

### Further Restrictions

You can restrict to specific branches:

```hcl
# Only main branch
"token.actions.githubusercontent.com:sub" = "repo:your-org/event-platform:ref:refs/heads/main"

# Only tags
"token.actions.githubusercontent.com:sub" = "repo:your-org/event-platform:ref:refs/tags/*"

# Only specific environment
"token.actions.githubusercontent.com:sub" = "repo:your-org/event-platform:environment:production"
```

### Least Privilege

The role has minimal permissions needed for CI/CD. To add more permissions, update the module.

## Troubleshooting

### "Not authorized to perform sts:AssumeRoleWithWebIdentity"

- Verify the repository name in Terraform matches your GitHub repo
- Check the workflow has `id-token: write` permission
- Ensure you're using `aws-actions/configure-aws-credentials@v4` (v4 or later)

### "Access Denied" when pushing to ECR

- Verify the ECR repository ARN is in the module's `ecr_repository_arns` list
- Check the repository exists in AWS
- Ensure you've run `aws ecr login` step before pushing

### "Unable to assume role"

- Check the role ARN in GitHub Secrets is correct
- Verify the OIDC provider exists in IAM
- Check CloudTrail logs for detailed error messages

## Migration from Access Keys

If you currently use AWS access keys:

1. Deploy this module
2. Add the role ARN to GitHub Secrets
3. Update your workflow to use OIDC (see examples above)
4. Test thoroughly
5. Once confirmed working, delete the old IAM user and access keys

## Cost

OIDC authentication is **free**. There are no additional AWS charges for using this feature.

## References

- [GitHub Actions OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS IAM OIDC Provider Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)
