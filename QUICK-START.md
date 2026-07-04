# 🚀 LiteEvent Deployment Quick Start

## Current Deployment: Railway (< 20K users)

### Prerequisites
- [x] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Railway account ([railway.app](https://railway.app))

## 🏃 Quick Deploy to Railway

### Step 1: Login
```bash
railway login
```

### Step 2: Initialize Project
```bash
cd c:\projects\event-plateform
railway init
```

### Step 3: Add Services
```bash
# Add PostgreSQL
railway add
# Select: PostgreSQL

# Add Redis
railway add
# Select: Redis
```

### Step 4: Configure Environment Variables
```bash
cd api

# Set all variables (see RAILWAY-ENV-SETUP.md for complete list)
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set JWT_SECRET=$(openssl rand -base64 64)
railway variables set JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# ... (see RAILWAY-ENV-SETUP.md for all variables)
```

### Step 5: Deploy
```bash
# Deploy API
cd api
railway up --service api

# Deploy Web
cd ../web
railway up --service web

# Deploy Vendors
cd ../vendors
railway up --service vendors
```

### Step 6: Get URLs
```bash
railway domain
```

## 📚 Detailed Guides

- **[Railway Migration Guide](RAILWAY-MIGRATION-GUIDE.md)** - Complete Railway setup
- **[Railway Environment Setup](RAILWAY-ENV-SETUP.md)** - All environment variables
- **[AWS Preservation Guide](AWS-PRESERVATION-GUIDE.md)** - Keeping AWS ready for 20K+ users
- **[AWS Deployment Guide](AWS_DEPLOYMENT_GUIDE.md)** - Future AWS deployment

## 🔄 Quick Commands

```bash
# Deploy all services using switcher
.\deploy-switcher.ps1 -Platform railway

# Check Railway status
railway status

# View logs
railway logs --service api

# Run migrations
railway run --service api npm run migrate
```

## 📊 When to Switch to AWS

Monitor user count and switch to AWS when:
- Total users > 15,000 (start planning)
- Total users > 20,000 (execute switch)
- Performance degradation
- Need geographic distribution

## ⚡ Using the Deployment Switcher

```powershell
# Railway (current - < 20K users)
.\deploy-switcher.ps1 -Platform railway

# AWS (future - > 20K users)  
.\deploy-switcher.ps1 -Platform aws
```

## 📞 Support

- **Railway**: [docs.railway.app](https://docs.railway.app)
- **AWS**: Keep infrastructure in `terraform/` directory
- **Issues**: Check logs with `railway logs --service api`

---

**Next Steps:**
1. Follow [RAILWAY-MIGRATION-GUIDE.md](RAILWAY-MIGRATION-GUIDE.md) for detailed setup
2. Configure all environment variables from [RAILWAY-ENV-SETUP.md](RAILWAY-ENV-SETUP.md)
3. Monitor user growth
4. Plan AWS migration when approaching 15K users
