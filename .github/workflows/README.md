# GitHub Actions CI/CD Workflows

This directory contains automated deployment workflows for the Event Platform.

## Workflows

### 1. `deploy-api.yml` - API Deployment
Triggers on:
- Push to `main` or `production` branches
- Changes in `api/` directory
- Manual workflow dispatch

Steps:
1. Build Docker image
2. Push to ECR
3. Update ECS task definition
4. Deploy to Fargate
5. Run database migrations

### 2. `deploy-web.yml` - Web App Deployment
Triggers on:
- Push to `main` or `production` branches
- Changes in `web/` directory
- Manual workflow dispatch

Steps:
1. Build Next.js Docker image with build-time env vars
2. Push to ECR
3. Update ECS task definition
4. Deploy to Fargate
5. Invalidate CloudFront cache

### 3. `deploy-vendors.yml` - Vendors App Deployment
Same as web, but for the vendors application.

## Required GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:

### AWS Credentials
- `AWS_ACCESS_KEY_ID` - IAM user access key
- `AWS_SECRET_ACCESS_KEY` - IAM user secret key

### Database
- `DATABASE_URL` - PostgreSQL connection string

### Next.js Public Variables
- `NEXT_PUBLIC_API_URL` - API endpoint (e.g., https://api.yourdomain.com)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID

### CloudFront
- `CLOUDFRONT_DISTRIBUTION_ID_WEB` - Web app distribution ID
- `CLOUDFRONT_DISTRIBUTION_ID_VENDORS` - Vendors app distribution ID

## Manual Deployment

Trigger workflows manually via GitHub UI:
1. Go to **Actions** tab
2. Select workflow
3. Click **Run workflow**
4. Choose branch

Or via CLI:
```bash
gh workflow run deploy-api.yml
```

## Deployment Status

View deployment status:
- GitHub Actions UI shows real-time logs
- AWS ECS Console shows service status
- CloudWatch Logs show application logs

## Troubleshooting

### Workflow fails at "Push to ECR"
- Check AWS credentials are valid
- Verify IAM user has `AmazonEC2ContainerRegistryPowerUser` policy

### Workflow fails at "Deploy to ECS"
- Check task definition is valid
- Verify security groups allow ALB → ECS traffic
- Check CloudWatch logs for container errors

### Database migration fails
- Verify `DATABASE_URL` secret is correct
- Check RDS security group allows ECS access
- Run migration manually to debug

## Monitoring

After deployment, monitor:
- **ECS Service**: https://console.aws.amazon.com/ecs
- **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch/logs
- **Application Load Balancer**: Check target health

## Rollback

If deployment fails:
1. Go to ECS Console
2. Find the service
3. Click **Update**
4. Select previous task definition revision
5. Click **Update Service**
