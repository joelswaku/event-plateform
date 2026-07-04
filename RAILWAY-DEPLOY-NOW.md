# 🚂 Railway Deployment - Complete Guide

## ✅ What's Already Done

- [x] Railway CLI installed
- [x] Authenticated to Railway
- [x] Railway MCP server configured
- [x] Project created: **strong-art**
- [x] PostgreSQL database added (Online)
- [x] Redis cache added (Online)

**Project URL:** https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c

## 🎯 Next Steps - Deploy Your Services

You have 2 options for deployment:

### Option 1: Railway Dashboard (Recommended - Easiest)

1. **Open your Railway project:**
   ```
   https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c
   ```

2. **Connect GitHub Repository:**
   - Click **"New Service"**
   - Select **"GitHub Repo"**
   - Authorize Railway to access your GitHub
   - Select repository: `event-plateform`
   - Railway will detect your Dockerfile and deploy automatically

3. **Create 3 Services:**
   
   **API Service:**
   - Root directory: `/api`
   - Dockerfile: Detected automatically
   - Port: 5000
   
   **Web Service:**
   - Root directory: `/web`
   - Build command: Auto-detected (Next.js)
   - Port: 3000
   
   **Vendors Service:**
   - Root directory: `/vendors`
   - Build command: Auto-detected (Next.js)
   - Port: 3001

4. **Configure Environment Variables:**
   - Click on each service
   - Go to **"Variables"** tab
   - Add variables from `RAILWAY-ENV-SETUP.md`
   - PostgreSQL and Redis URLs are auto-injected

5. **Deploy:**
   - Railway auto-deploys on every push to main branch
   - Or click **"Deploy"** manually

### Option 2: GitHub Actions (Automated CI/CD)

#### Step 1: Get Railway Token

1. Go to: https://railway.com/account/tokens
2. Click **"Create Token"**
3. Name: `GitHub Actions - LiteEvent`
4. Copy the token

#### Step 2: Add GitHub Secret

1. Go to your GitHub repo settings:
   ```
   https://github.com/YOUR_USERNAME/event-plateform/settings/secrets/actions
   ```

2. Click **"New repository secret"**
3. Name: `RAILWAY_TOKEN`
4. Value: Paste the token from Step 1
5. Click **"Add secret"**

#### Step 3: Create Railway Services via Dashboard

You **must** create empty services in Railway dashboard first:

1. Open: https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c
2. Click **"New Service"** → **"Empty Service"**
3. Name it: `api`
4. Repeat for `web` and `vendors`

#### Step 4: Get Service IDs

```bash
railway service list
```

Copy the service IDs for each service.

#### Step 5: Deploy via GitHub Actions

```bash
# Commit and push to trigger deployment
git add .
git commit -m "Deploy to Railway"
git push origin main
```

## 🔧 Environment Variables Setup

### Auto-injected by Railway:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection

### You need to add manually:

#### API Service Variables:
```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=<generate with: openssl rand -base64 64>
JWT_REFRESH_SECRET=<generate with: openssl rand -base64 64>
CORS_ORIGIN=https://yourdomain.com
RESEND_API_KEY=re_xxx
STRIPE_SECRET_KEY=sk_live_xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

See full list in: [RAILWAY-ENV-SETUP.md](RAILWAY-ENV-SETUP.md)

## 📦 Current Project Status

```bash
# Check project status
railway status

# View all services
railway service list

# Get database connection string
railway variables --service Postgres

# View deployment logs
railway logs
```

## 🌐 Custom Domains

After deployment, add custom domains:

1. In Railway dashboard, click on a service
2. Go to **"Settings"** → **"Domains"**
3. Click **"Generate Domain"** (gets Railway subdomain)
4. Or **"Custom Domain"** and add your own:
   - `api.liteevent.com` → API service
   - `liteevent.com` → Web service
   - `vendors.liteevent.com` → Vendors service

5. Update DNS records as shown by Railway

## 🐛 Troubleshooting

### Build fails with "no service found"
**Solution:** Create the service in Railway dashboard first, then deploy via CLI/GitHub Actions.

### Environment variables not found
**Solution:** 
- Check service is linked to Postgres/Redis in Railway dashboard
- Manually add variables in service settings

### Deployment stuck
**Solution:**
```bash
railway status
railway logs
```

Check for build errors in logs.

### Database connection fails
**Solution:**
- Verify Postgres is online: `railway service list`
- Check `DATABASE_URL` is injected: `railway variables`

## 🚀 Quick Deploy Commands

```bash
# From project root
cd c:\projects\event-plateform

# Check status
railway status

# Deploy API (if service exists)
cd api
railway up --detach

# Deploy Web
cd ../web
railway up --detach

# Deploy Vendors
cd ../vendors
railway up --detach

# View logs
railway logs --service api
```

## 📊 Monitoring

```bash
# View deployment status
railway status

# Stream logs
railway logs --follow

# Check resource usage
railway service
```

## ✅ Deployment Checklist

- [ ] Railway project created ✅
- [ ] PostgreSQL added ✅
- [ ] Redis added ✅
- [ ] GitHub repo connected
- [ ] API service created
- [ ] Web service created
- [ ] Vendors service created
- [ ] Environment variables configured
- [ ] Services deployed successfully
- [ ] Custom domains configured
- [ ] Database migrations run
- [ ] Health checks passing

## 📞 Next Actions

1. **Connect GitHub Repository** (if not already):
   - Go to Railway project
   - Connect your `event-plateform` repo

2. **Create Services** in Railway dashboard:
   - Create 3 empty services: api, web, vendors

3. **Configure Variables**:
   - Use Railway dashboard UI to add env vars
   - Reference: `RAILWAY-ENV-SETUP.md`

4. **Deploy**:
   - Railway auto-deploys from GitHub
   - Or use `railway up` command

## 🔗 Important Links

- **Project:** https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c
- **Create Token:** https://railway.com/account/tokens
- **Railway Docs:** https://docs.railway.app
- **Railway CLI Docs:** https://docs.railway.app/guides/cli

---

**Ready to deploy!** 🚀
Start with Option 1 (Railway Dashboard) - it's the easiest and most reliable method.
