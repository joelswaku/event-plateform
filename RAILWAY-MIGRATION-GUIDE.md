# Railway Migration Guide

## 🚂 Overview

This guide helps you migrate from AWS to Railway for deployments under 20,000 users, while keeping AWS infrastructure ready for scaling when you exceed that threshold.

## 📋 Prerequisites

- [x] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Railway account created ([railway.app](https://railway.app))
- [ ] Domain name configured (optional, can use Railway subdomain)

## 🎯 Migration Strategy

### Current Setup
- **AWS ECS**: Container orchestration
- **AWS RDS**: PostgreSQL database
- **AWS ElastiCache**: Redis
- **AWS ALB**: Load balancer
- **CloudFront**: CDN

### Railway Setup (< 20K users)
- **Railway Services**: Container deployment
- **Railway PostgreSQL**: Managed database
- **Railway Redis**: Managed cache
- **Railway Load Balancer**: Built-in
- **Railway CDN**: Built-in edge network

### AWS (Reserved for > 20K users)
- Keep Terraform configurations intact
- Maintain GitHub Actions workflows
- Document switch-back process

## 🚀 Quick Start

### Step 1: Login to Railway

```bash
railway login
```

This opens your browser for authentication.

### Step 2: Create New Project

```bash
# Navigate to project root
cd c:\projects\event-plateform

# Initialize Railway project
railway init
```

Choose:
- **Create new project**: liteevent-platform
- **Environment**: production

### Step 3: Add Database Services

#### PostgreSQL Database
```bash
# Add PostgreSQL plugin
railway add postgresql

# Get connection string
railway variables
```

Copy the `DATABASE_URL` variable.

#### Redis Cache
```bash
# Add Redis plugin
railway add redis

# Get connection string
railway variables
```

Copy the `REDIS_URL` variable.

### Step 4: Configure Environment Variables

```bash
# Set environment variables for API service
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set JWT_SECRET=your_jwt_secret_here
railway variables set JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
railway variables set CORS_ORIGIN=https://yourdomain.com

# Cloudinary
railway variables set CLOUDINARY_CLOUD_NAME=your_cloud_name
railway variables set CLOUDINARY_API_KEY=your_api_key
railway variables set CLOUDINARY_API_SECRET=your_api_secret

# Stripe
railway variables set STRIPE_SECRET_KEY=sk_live_xxx
railway variables set STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email (Resend)
railway variables set RESEND_API_KEY=re_xxx
railway variables set EMAIL_FROM="LiteEvent <noreply@liteevent.com>"

# Google OAuth
railway variables set GOOGLE_CLIENT_ID=your_client_id
railway variables set GOOGLE_CLIENT_SECRET=your_client_secret

# Google Maps
railway variables set GOOGLE_MAPS_API_KEY=your_maps_api_key

# AWS Bedrock (for AI features)
railway variables set AWS_REGION=us-east-1
railway variables set AWS_ACCESS_KEY_ID=your_access_key
railway variables set AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Step 5: Deploy Services

#### Deploy API
```bash
cd api
railway up --service api
```

#### Deploy Web Frontend
```bash
cd ../web
railway up --service web
```

#### Deploy Vendors Portal
```bash
cd ../vendors
railway up --service vendors
```

### Step 6: Configure Custom Domains (Optional)

```bash
# Add custom domain
railway domain

# Follow prompts to add:
# - api.liteevent.com → API service
# - liteevent.com → Web service
# - vendors.liteevent.com → Vendors service
```

Update DNS records as shown by Railway.

## 🔄 Using the Deployment Switcher

We've created a PowerShell script to switch between Railway and AWS:

```powershell
# Deploy to Railway (default for < 20K users)
.\deploy-switcher.ps1 -Platform railway

# Deploy to AWS (for > 20K users)
.\deploy-switcher.ps1 -Platform aws

# Specify environment
.\deploy-switcher.ps1 -Platform railway -Environment staging
```

## 📊 Monitoring User Count

Create a simple monitoring check:

```sql
-- Run this query periodically
SELECT COUNT(*) as total_users FROM users;
```

When approaching 20,000 users:
1. Plan AWS migration (1-2 weeks ahead)
2. Test AWS infrastructure in staging
3. Execute switch using deployment script
4. Update DNS to point to AWS

## 💰 Cost Comparison

### Railway (< 20K users)
- **Hobby Plan**: $5/month
- **Developer Plan**: $20/month (recommended)
- **Team Plan**: $50/month
- Includes: Compute, Database, Redis, Bandwidth

**Estimated Monthly Cost**: ~$50-100

### AWS (> 20K users)
- **ECS Fargate**: ~$50-200/month
- **RDS PostgreSQL**: ~$100-300/month
- **ElastiCache Redis**: ~$50-100/month
- **ALB**: ~$20-40/month
- **Data Transfer**: ~$50-200/month

**Estimated Monthly Cost**: ~$270-840

## 🔐 Security Checklist

- [ ] All environment variables set in Railway dashboard
- [ ] Database has strong password
- [ ] SSL/TLS enabled (automatic on Railway)
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Secrets not committed to Git

## 🧪 Testing Deployment

After deployment, test all services:

```bash
# Check API health
curl https://your-api-domain.railway.app/health

# Check API endpoints
curl https://your-api-domain.railway.app/api/health

# Visit web app
open https://your-web-domain.railway.app

# Visit vendors portal
open https://your-vendors-domain.railway.app
```

## 📝 Migration Checklist

### Pre-Migration
- [ ] Railway account created
- [ ] Railway CLI installed
- [ ] Database backup created
- [ ] Environment variables documented
- [ ] Custom domains prepared (if using)

### Migration
- [ ] Railway project initialized
- [ ] PostgreSQL plugin added
- [ ] Redis plugin added
- [ ] Environment variables configured
- [ ] API service deployed
- [ ] Web service deployed
- [ ] Vendors service deployed
- [ ] Database migrations run
- [ ] Custom domains configured

### Post-Migration
- [ ] All services health checks passing
- [ ] Authentication working
- [ ] Payment processing tested
- [ ] Email sending verified
- [ ] File uploads working
- [ ] Mobile app API connection updated
- [ ] DNS propagation complete
- [ ] Monitoring setup
- [ ] Backup strategy configured

## 🆘 Troubleshooting

### Build Failures
```bash
# Check build logs
railway logs --service api

# Rebuild
railway up --service api
```

### Database Connection Issues
```bash
# Verify DATABASE_URL
railway variables --service api | grep DATABASE_URL

# Test connection
railway run --service api psql $DATABASE_URL -c "SELECT 1;"
```

### Service Crashes
```bash
# View crash logs
railway logs --service api --tail 100

# Restart service
railway restart --service api
```

## 🔄 Switching Back to AWS

When you exceed 20,000 users:

1. **Prepare AWS Infrastructure**
   ```bash
   cd terraform/environments/production
   terraform plan
   terraform apply
   ```

2. **Export Railway Database**
   ```bash
   railway run pg_dump $DATABASE_URL > railway_backup.sql
   ```

3. **Import to AWS RDS**
   ```bash
   psql $AWS_DATABASE_URL < railway_backup.sql
   ```

4. **Switch DNS**
   - Update DNS records to point to AWS ALB
   - Monitor both environments during transition

5. **Deploy via GitHub Actions**
   ```bash
   git push origin main
   ```

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

## 🎯 Next Steps

1. Complete Railway migration
2. Monitor performance and costs
3. Track user growth
4. Plan AWS transition when approaching 20K users
5. Keep AWS infrastructure code updated
