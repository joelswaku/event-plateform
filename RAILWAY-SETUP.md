# Railway Deployment Guide

## ✅ Service Configured

**Project:** strong-art  
**Service:** zucchini-delight  
**Root Directory:** `/api`  
**Builder:** Dockerfile  

## 🚀 Deploy

Railway auto-deploys from GitHub when you push to `main` branch.

Or manually:
```bash
# In Railway dashboard
Deployments → Click "Redeploy"
```

## 🔧 Essential Settings

### 1. Service Already Configured
- ✅ Root Directory: `/api`
- ✅ Dockerfile: Detected automatically
- ✅ Branch: `main`

### 2. Add Environment Variables

In Railway dashboard → Variables tab:

**Required:**
```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=<generate: openssl rand -base64 64>
JWT_REFRESH_SECRET=<generate different>
```

**Link Databases:**
- DATABASE_URL → Reference Postgres.DATABASE_URL
- REDIS_URL → Reference Redis.REDIS_URL

**External Services** (get from your accounts):
```bash
RESEND_API_KEY=re_xxx
STRIPE_SECRET_KEY=sk_live_xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

### 3. Generate Domain

In Railway dashboard:
- Settings → Networking → Generate Domain
- Get URL: `https://xxx.up.railway.app`

## 📊 Monitor

- **Logs:** Deployments tab → Click deployment → View logs
- **Status:** Service should show "Online" with green dot
- **Health:** `curl https://your-url/health`

## 🔗 Links

- **Project:** https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c
- **Postgres & Redis:** Already running
