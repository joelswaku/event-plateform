# Deployment Issues & Fixes

## Issues Found:

### 1. ❌ SSL Certificate Not Validated
**Error:** Certificate must be fully validated before use
**Fix:** Add DNS CNAME record and wait for validation

### 2. ❌ CloudFront Account Not Verified  
**Error:** Account must be verified before adding CloudFront
**Fix:** Contact AWS Support OR skip CloudFront for now

### 3. ❌ RDS Backup Retention (Free Tier)
**Error:** Backup retention exceeds free tier limit
**Fix:** Reduce backup_retention_period to 0 or 1

### 4. ❌ Empty RESEND_API_KEY Secret
**Error:** Invalid secret name for RESEND_API_KEY
**Fix:** Remove RESEND_API_KEY from task definition (using SES)

## ✅ What Was Successfully Created:
- VPC & Networking
- S3 Buckets
- ECR Repositories  
- Secrets Manager
- ECS Cluster
- Application Load Balancer (partial)
- IAM Roles & Policies

## Quick Fixes Applied:

1. **Disable CloudFront temporarily** (account verification takes 24-48hrs)
2. **Fix RDS backup retention** (set to 1 day for free tier)
3. **Remove RESEND_API_KEY** from ECS task definitions
4. **Wait for SSL validation** before deploying

## Next Steps:

### Option A: Deploy Without CloudFront (Recommended Now)
- Skip CloudFront
- Use ALB directly
- Can add CloudFront later after account verification

### Option B: Wait for SSL + Account Verification
- Add DNS record
- Wait for SSL validation (~10 min)
- Contact AWS Support for CloudFront verification (~24-48 hrs)
- Deploy everything together

**Recommended: Option A - Deploy without CloudFront now**
