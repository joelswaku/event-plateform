# 🚀 Complete AWS Deployment Guide

## Current Status

✅ **Infrastructure Deployed:**
- VPC ID: `vpc-0d6d301d1487378fe`
- ALB DNS: `liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com`
- ECR Repositories: Ready
- ECS Cluster: `liteevent-production-cluster`
- RDS Database: Ready (endpoint is sensitive)
- S3 Bucket: `liteevent-production-images`

⏳ **Remaining Steps:**
1. Build and push Docker images to ECR
2. Deploy services to ECS
3. Configure DNS records
4. Verify deployment

---

## Option 1: Deploy via GitHub Actions (RECOMMENDED)

This is the easiest method and requires no local AWS CLI installation.

### Step 1: Configure GitHub Secrets

Go to your GitHub repository: https://github.com/joelswaku/event-plateform/settings/secrets/actions

Add these secrets:

```
AWS_ACCOUNT_ID = 455697799547

PRODUCTION_API_URL = https://api.liteevent.com
PRODUCTION_STRIPE_PUBLISHABLE_KEY = pk_test_PLACEHOLDER
PRODUCTION_STRIPE_SECRET_KEY = sk_test_PLACEHOLDER
```

### Step 2: Configure GitHub Environment

1. Go to: https://github.com/joelswaku/event-plateform/settings/environments
2. Create environment named: `production`
3. Add protection rule: "Required reviewers" (add yourself)
4. This ensures manual approval before production deployments

### Step 3: Commit and Push

```bash
# From your project directory
cd C:\projects\event-plateform

# Review changes
git status

# Add changes
git add .

# Commit
git commit -m "chore: configure docker-compose with Redis for deployment"

# Push to main branch (triggers deployment)
git push origin main
```

### Step 4: Approve and Monitor

1. Go to: https://github.com/joelswaku/event-plateform/actions
2. You'll see "Deploy to Production" workflow waiting for approval
3. Click on the workflow run
4. Click "Review deployments" 
5. Select "production" and click "Approve and deploy"
6. Monitor the deployment progress

The workflow will:
- ✅ Build Docker images for API, Web, Vendors
- ✅ Push to ECR with tags (latest, commit SHA, version)
- ✅ Update ECS task definitions
- ✅ Deploy to ECS Fargate
- ✅ Wait for health checks
- ✅ Create GitHub release

---

## Option 2: Deploy Manually (Requires AWS CLI)

### Install AWS CLI

```powershell
# Download and install AWS CLI v2
$installer = "$env:TEMP\AWSCLIV2.msi"
Invoke-WebRequest -Uri "https://awscli.amazonaws.com/AWSCLIV2.msi" -OutFile $installer
Start-Process msiexec.exe -ArgumentList "/i $installer /quiet" -Wait
```

### Configure AWS Credentials

```powershell
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region: us-east-1
# Default output format: json
```

### Authenticate Docker with ECR

```powershell
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 455697799547.dkr.ecr.us-east-1.amazonaws.com
```

### Build and Push Images

```powershell
# Set variables
$ACCOUNT_ID = "455697799547"
$REGION = "us-east-1"
$ECR_API = "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/liteevent-production-api"
$ECR_WEB = "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/liteevent-production-web"
$ECR_VENDORS = "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/liteevent-production-vendors"

# Build and push API
docker build -t $ECR_API`:latest -t $ECR_API`:v1.0.0 ./api --target runner
docker push $ECR_API`:latest
docker push $ECR_API`:v1.0.0

# Build and push Web
docker build -t $ECR_WEB`:latest -t $ECR_WEB`:v1.0.0 ./web --target runner `
  --build-arg NEXT_PUBLIC_API_URL=https://api.liteevent.com `
  --build-arg NODE_ENV=production
docker push $ECR_WEB`:latest
docker push $ECR_WEB`:v1.0.0

# Build and push Vendors
docker build -t $ECR_VENDORS`:latest -t $ECR_VENDORS`:v1.0.0 ./vendors --target runner `
  --build-arg NEXT_PUBLIC_API_URL=https://api.liteevent.com `
  --build-arg NODE_ENV=production
docker push $ECR_VENDORS`:latest
docker push $ECR_VENDORS`:v1.0.0
```

### Deploy to ECS

```powershell
# Force new deployment (uses latest images)
aws ecs update-service --cluster liteevent-production-cluster --service liteevent-production-api --force-new-deployment --region us-east-1

aws ecs update-service --cluster liteevent-production-cluster --service liteevent-production-web --force-new-deployment --region us-east-1

aws ecs update-service --cluster liteevent-production-cluster --service liteevent-production-vendors --force-new-deployment --region us-east-1
```

### Monitor Deployment

```powershell
# Check service status
aws ecs describe-services --cluster liteevent-production-cluster --services liteevent-production-api --region us-east-1 --query 'services[0].deployments'

# Check task status
aws ecs list-tasks --cluster liteevent-production-cluster --service-name liteevent-production-api --region us-east-1

# View logs
aws logs tail /ecs/liteevent-production-api --follow --region us-east-1
```

---

## Post-Deployment Steps

### 1. Configure DNS Records

Add these records to your domain registrar (e.g., Namecheap, GoDaddy, Route53):

**For SSL Certificate Validation:**
```
Type: CNAME
Name: _465cfda4f0770e4ab7d25a996681c6e8.liteevent.com
Value: _dc4028464374f12d3e2f60ebce528e76.jkddzztszm.acm-validations.aws.
```

**For Application Access:**
```
Type: CNAME
Name: liteevent.com (or @)
Value: liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com

Type: CNAME
Name: www.liteevent.com
Value: liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com

Type: CNAME
Name: api.liteevent.com
Value: liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com

Type: CNAME
Name: vendors.liteevent.com
Value: liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com
```

### 2. Verify SSL Certificate

```powershell
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:455697799547:certificate/a51e0057-3e58-49bb-958d-eb319d026c68 --region us-east-1
```

Look for `Status: ISSUED` (may take 5-30 minutes after DNS records are added).

### 3. Test the Application

Once DNS propagates (5-60 minutes):

```
Web App:     https://liteevent.com
Vendors:     https://vendors.liteevent.com
API Health:  https://api.liteevent.com/health
```

### 4. Run Database Migrations

If your API needs database schema setup:

```powershell
# Option 1: Via ECS Exec (if enabled)
aws ecs execute-command --cluster liteevent-production-cluster --task TASK_ID --container api --command "/bin/sh" --interactive --region us-east-1

# Then inside the container:
npm run migrate

# Option 2: Via GitHub Actions
# Add [migrate] to your commit message:
git commit -m "feat: add new feature [migrate]"
git push origin main
```

---

## Troubleshooting

### Images fail to build
- Check Dockerfile syntax
- Ensure all dependencies are in package.json
- Check Docker is running: `docker ps`

### ECS tasks fail to start
- Check CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups
- Verify environment variables in task definition
- Check security group rules allow ALB → ECS communication

### Health checks failing
- Verify API has `/health` endpoint
- Check ALB target group health check settings
- View ECS task logs for errors

### DNS not resolving
- DNS propagation takes time (5-60 minutes)
- Use `nslookup liteevent.com` to check
- Verify records are correct in your DNS provider

---

## Cost Monitoring

Current infrastructure cost: **~$120-150/month**

Monitor costs:
```powershell
# View current month's costs
aws ce get-cost-and-usage --time-period Start=2026-06-01,End=2026-06-30 --granularity MONTHLY --metrics UnblendedCost --region us-east-1
```

Or visit: https://console.aws.amazon.com/cost-management/home

---

## Rollback Plan

If deployment fails:

### Quick Rollback via ECS
```powershell
# Rollback to previous task definition version
aws ecs update-service --cluster liteevent-production-cluster --service liteevent-production-api --task-definition liteevent-production-api:PREVIOUS_VERSION --region us-east-1
```

### Via GitHub Actions
1. Find previous successful deployment
2. Re-run that workflow
3. Or revert commit and push

---

## Next Steps After Deployment

1. ✅ Set up monitoring and alerts (CloudWatch)
2. ✅ Configure auto-scaling policies
3. ✅ Set up database backups (automated via RDS)
4. ✅ Configure CloudFront CDN for static assets
5. ✅ Set up CI/CD for staging environment
6. ✅ Add custom domain email (SES)
7. ✅ Configure rate limiting
8. ✅ Set up log aggregation

---

## Support Resources

- **Terraform Outputs**: `cd terraform/environments/production && terraform output`
- **AWS Console**: https://console.aws.amazon.com/
- **GitHub Actions**: https://github.com/joelswaku/event-plateform/actions
- **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch/
- **ECS Console**: https://console.aws.amazon.com/ecs/

---

## Quick Reference: ECR Repository URLs

```
API:     455697799547.dkr.ecr.us-east-1.amazonaws.com/liteevent-production-api
Web:     455697799547.dkr.ecr.us-east-1.amazonaws.com/liteevent-production-web
Vendors: 455697799547.dkr.ecr.us-east-1.amazonaws.com/liteevent-production-vendors
```

## GitHub OIDC Role ARN

```
arn:aws:iam::455697799547:role/liteevent-production-github-actions-role
```

---

**Recommended**: Use **Option 1 (GitHub Actions)** for automated, reliable deployments! ✨
