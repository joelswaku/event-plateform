# AWS Deployment Checklist

Use this checklist to ensure a smooth deployment of the Event Platform to AWS.

## Pre-Deployment (1-2 hours)

### AWS Account Setup
- [ ] AWS account created with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] AWS account has sufficient limits:
  - [ ] VPC limit: ≥1 VPC available
  - [ ] Elastic IP limit: ≥2 available
  - [ ] ECS limit: ≥3 services per cluster

### Domain & SSL
- [ ] Domain name registered (e.g., yourdomain.com)
- [ ] Access to DNS management (Route 53, Cloudflare, etc.)
- [ ] SSL certificate requested in ACM (us-east-1)
  - [ ] Certificate for `*.yourdomain.com`
  - [ ] DNS validation records added
  - [ ] Certificate status: **Issued**
  - [ ] Certificate ARN saved

### Local Tools
- [ ] Terraform ≥1.0 installed (`terraform --version`)
- [ ] Docker installed and running (`docker --version`)
- [ ] Git installed
- [ ] Node.js ≥18 installed (for local testing)

### Repository Setup
- [ ] Code pushed to GitHub repository
- [ ] Repository is private (if contains secrets)

---

## Infrastructure Deployment (20-30 minutes)

### Terraform Configuration
- [ ] Navigate to `terraform/` directory
- [ ] Copy example variables: `cp terraform.tfvars.example terraform.tfvars`
- [ ] Edit `terraform.tfvars` with:
  - [ ] `aws_region` (default: us-east-1)
  - [ ] `project_name` (default: event-platform)
  - [ ] `environment` (production/staging)
  - [ ] `db_username` (strong username)
  - [ ] `db_password` (16+ char strong password)
  - [ ] `acm_certificate_arn` (from ACM)
  - [ ] `acm_certificate_arn_cloudfront` (from ACM, us-east-1)
  - [ ] `domain_name` (yourdomain.com)
  - [ ] `web_domain_name` (app.yourdomain.com)
  - [ ] `vendors_domain_name` (vendors.yourdomain.com)
  - [ ] `jwt_secret` (64+ char random string)
  - [ ] `jwt_refresh_secret` (64+ char random string)
  - [ ] `stripe_secret_key` (sk_live_... or sk_test_...)
  - [ ] `google_client_secret` (GOCSPX-...)
  - [ ] `resend_api_key` (re_...)
  - [ ] Cloudinary credentials (or leave blank to use S3)

### Generate Secure Secrets
```bash
# Generate JWT secrets
openssl rand -base64 64

# Or with Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

- [ ] JWT secret generated and saved
- [ ] JWT refresh secret generated and saved

### Terraform Backend (Optional but Recommended)
- [ ] S3 bucket created for Terraform state
- [ ] Bucket versioning enabled
- [ ] DynamoDB table created for state locking
- [ ] Backend config uncommented in `main.tf`

### Deploy Infrastructure
- [ ] Run `terraform init`
- [ ] Run `terraform plan -out=tfplan`
- [ ] Review plan (should create ~80-100 resources)
- [ ] Run `terraform apply tfplan`
- [ ] Wait 15-20 minutes for completion ⏱️
- [ ] No errors in output
- [ ] Run `terraform output > outputs.txt`
- [ ] Save outputs for later use

---

## DNS Configuration (10 minutes)

### Get DNS Values from Terraform Outputs
- [ ] ALB DNS name: `terraform output alb_dns_name`
- [ ] CloudFront Web domain: `terraform output cloudfront_web_domain_name`
- [ ] CloudFront Vendors domain: `terraform output cloudfront_vendors_domain_name`

### Add DNS Records
Using your DNS provider (Route 53, Cloudflare, etc.):

- [ ] **Web App:**
  - Type: CNAME
  - Name: `app.yourdomain.com`
  - Value: `<cloudfront_web_domain_name>`
  - TTL: 300

- [ ] **Vendors App:**
  - Type: CNAME
  - Name: `vendors.yourdomain.com`
  - Value: `<cloudfront_vendors_domain_name>`
  - TTL: 300

- [ ] **API:**
  - Type: CNAME
  - Name: `api.yourdomain.com`
  - Value: `<alb_dns_name>`
  - TTL: 300

- [ ] Wait for DNS propagation (5-30 minutes)
- [ ] Test DNS: `nslookup app.yourdomain.com`

---

## SES Email Configuration (15 minutes)

### Get SES Values from Terraform
- [ ] Verification token: `terraform output -json | jq -r '.ses_identity_arn.value'`
- [ ] DKIM tokens: `terraform output -json | jq -r '.dkim_tokens'`

### Add DNS Records for SES
- [ ] **Domain Verification:**
  - Type: TXT
  - Name: `_amazonses.yourdomain.com`
  - Value: `<verification_token>`

- [ ] **DKIM Records (3 total):**
  - Type: CNAME
  - Name: `<dkim_token_1>._domainkey.yourdomain.com`
  - Value: `<dkim_token_1>.dkim.amazonses.com`
  - (Repeat for all 3 DKIM tokens)

- [ ] **MX Record:**
  - Type: MX
  - Name: `mail.yourdomain.com`
  - Value: `10 feedback-smtp.us-east-1.amazonses.com`

- [ ] **SPF Record:**
  - Type: TXT
  - Name: `mail.yourdomain.com`
  - Value: `v=spf1 include:amazonses.com ~all`

### Request Production Access
- [ ] Go to AWS Console → SES → Account Dashboard
- [ ] Click "Request production access"
- [ ] Fill out form:
  - Mail type: Transactional
  - Website: yourdomain.com
  - Use case: Event management platform
- [ ] Submit request
- [ ] Wait for approval (usually within 24 hours)

---

## Docker Images (20 minutes)

### Authenticate to ECR
```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

- [ ] ECR login successful

### Get ECR Repository URLs
- [ ] API: `terraform output ecr_api_repository_url`
- [ ] Web: `terraform output ecr_web_repository_url`
- [ ] Vendors: `terraform output ecr_vendors_repository_url`

### Build and Push API
```bash
cd api
docker build -t event-platform-api .
docker tag event-platform-api:latest <ECR_API_URL>:latest
docker push <ECR_API_URL>:latest
```

- [ ] API image built successfully
- [ ] API image pushed to ECR

### Build and Push Web
```bash
cd web
docker build -t event-platform-web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_... \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=... \
  .
docker tag event-platform-web:latest <ECR_WEB_URL>:latest
docker push <ECR_WEB_URL>:latest
```

- [ ] Web image built successfully
- [ ] Web image pushed to ECR

### Build and Push Vendors
```bash
cd vendors
docker build -t event-platform-vendors \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  .
docker tag event-platform-vendors:latest <ECR_VENDORS_URL>:latest
docker push <ECR_VENDORS_URL>:latest
```

- [ ] Vendors image built successfully
- [ ] Vendors image pushed to ECR

### Deploy to ECS
```bash
# Force new deployments
aws ecs update-service --cluster event-platform-production-cluster \
  --service event-platform-production-api-service --force-new-deployment

aws ecs update-service --cluster event-platform-production-cluster \
  --service event-platform-production-web-service --force-new-deployment

aws ecs update-service --cluster event-platform-production-cluster \
  --service event-platform-production-vendors-service --force-new-deployment
```

- [ ] ECS services updated
- [ ] Wait 5-10 minutes for deployment ⏱️

### Run Database Migrations
```bash
# Get task ARN
TASK_ARN=$(aws ecs list-tasks --cluster event-platform-production-cluster \
  --service-name event-platform-production-api-service \
  --query 'taskArns[0]' --output text)

# Run migrations
aws ecs execute-command \
  --cluster event-platform-production-cluster \
  --task $TASK_ARN \
  --container api \
  --interactive \
  --command "npm run migrate"
```

- [ ] Migrations completed successfully

---

## GitHub Actions CI/CD (10 minutes)

### Create IAM User for GitHub Actions
```bash
aws iam create-user --user-name github-actions-deploy
aws iam attach-user-policy --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
aws iam attach-user-policy --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess
aws iam create-access-key --user-name github-actions-deploy
```

- [ ] IAM user created
- [ ] Access key ID saved
- [ ] Secret access key saved

### Add GitHub Secrets
Go to **GitHub → Settings → Secrets and variables → Actions → New repository secret**

- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] `CLOUDFRONT_DISTRIBUTION_ID_WEB`
- [ ] `CLOUDFRONT_DISTRIBUTION_ID_VENDORS`

### Test CI/CD
- [ ] Push code to `main` branch
- [ ] GitHub Actions workflow triggered
- [ ] All workflows passed
- [ ] Services redeployed successfully

---

## Verification (15 minutes)

### Check Service Health
```bash
# API health check
curl https://api.yourdomain.com/health

# Web app (should return HTML)
curl https://app.yourdomain.com

# Vendors app (should return HTML)
curl https://vendors.yourdomain.com
```

- [ ] API health check returns 200 OK
- [ ] Web app loads successfully
- [ ] Vendors app loads successfully

### Check ECS Status
```bash
aws ecs describe-services \
  --cluster event-platform-production-cluster \
  --services event-platform-production-api-service \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

- [ ] API service: ACTIVE, running count matches desired
- [ ] Web service: ACTIVE, running count matches desired
- [ ] Vendors service: ACTIVE, running count matches desired

### Check CloudWatch Logs
```bash
# API logs
aws logs tail /ecs/event-platform-production/api --follow

# Web logs
aws logs tail /ecs/event-platform-production/web --follow
```

- [ ] No critical errors in API logs
- [ ] No critical errors in Web logs
- [ ] No critical errors in Vendors logs

### Functional Testing
- [ ] Open https://app.yourdomain.com in browser
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Can create an event
- [ ] Images upload successfully
- [ ] Email notifications sent (check spam folder)
- [ ] Stripe payment flow works (test mode)

---

## Post-Deployment (30 minutes)

### Monitoring Setup
- [ ] CloudWatch dashboard created
- [ ] CPU utilization alarm configured
- [ ] Memory utilization alarm configured
- [ ] Database connection alarm configured
- [ ] Error rate alarm configured
- [ ] Notification email/SNS configured

### Backup Configuration
- [ ] RDS automated backups enabled (already enabled by Terraform)
- [ ] Manual RDS snapshot created
- [ ] S3 bucket versioning verified
- [ ] Backup retention policy confirmed (7 days production, 3 days staging)

### Security Hardening
- [ ] Review security groups (least privilege)
- [ ] Enable AWS CloudTrail (audit logs)
- [ ] Enable AWS Config (compliance)
- [ ] Enable GuardDuty (threat detection)
- [ ] Consider AWS WAF for DDoS protection

### Documentation
- [ ] Update internal documentation with:
  - AWS account details
  - Domain configuration
  - Deployment process
  - Rollback procedure
  - Contact information
- [ ] Share access with team members
- [ ] Document any environment-specific configurations

### Cost Optimization
- [ ] Set up AWS Budgets alert (e.g., $200/month)
- [ ] Review Cost Explorer
- [ ] Consider reserved instances (if usage is predictable)
- [ ] Enable S3 lifecycle policies
- [ ] Review CloudWatch log retention

---

## Ongoing Maintenance

### Weekly
- [ ] Review CloudWatch metrics
- [ ] Check for security updates
- [ ] Review error logs
- [ ] Check AWS billing

### Monthly
- [ ] Review and optimize costs
- [ ] Update dependencies
- [ ] Test backup restoration
- [ ] Review access logs

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Capacity planning
- [ ] Update documentation

---

## Rollback Procedure

If something goes wrong:

### Rollback ECS Deployment
```bash
# List task definitions
aws ecs list-task-definitions --family-prefix event-platform-production-api-task

# Rollback to previous version
aws ecs update-service \
  --cluster event-platform-production-cluster \
  --service event-platform-production-api-service \
  --task-definition event-platform-production-api-task:PREVIOUS_VERSION
```

### Rollback Database Migration
```bash
# SSH into ECS task
aws ecs execute-command --cluster ... --task ... --command sh

# Run down migration
npm run migrate:down
```

### Rollback Infrastructure (Nuclear Option)
```bash
# This destroys everything - use with extreme caution
terraform destroy
```

---

## Emergency Contacts

- **AWS Support:** [AWS Support Center](https://console.aws.amazon.com/support/)
- **Domain Registrar:** [Your DNS provider support]
- **Team Lead:** [Name, email, phone]
- **DevOps Engineer:** [Name, email, phone]

---

## Success Criteria

✅ All services running in ECS
✅ Database accessible and migrated
✅ DNS resolving correctly
✅ SSL certificates valid
✅ Email sending (SES out of sandbox)
✅ No errors in CloudWatch logs
✅ Application accessible via custom domains
✅ CI/CD pipeline working
✅ Monitoring and alerts configured

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Notes:** _________________
