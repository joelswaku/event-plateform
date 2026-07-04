# 🚀 DEPLOY TO RAILWAY NOW - ACTUAL STEPS

## Current Status
- ✅ Railway project created: **strong-art**
- ✅ PostgreSQL Online
- ✅ Redis Online
- ⏳ Services need to be created

## 🎯 ACTUAL DEPLOYMENT (2 Methods)

### Method 1: Railway Dashboard (FASTEST - 5 minutes)

#### Step 1: Create API Service
1. Open: https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c
2. Click **"New Service"** button
3. Select **"GitHub Repo"**
4. **Connect GitHub** (if not connected):
   - Click "Configure GitHub App"
   - Select your account: `joelswaku`
   - Give Railway access to `event-plateform` repo
5. Select repository: **joelswaku/event-plateform**
6. Railway will ask what to deploy:
   - Service name: **api**
   - Root directory: **/api**
   - Click **"Add Service"**

Railway will automatically:
- ✅ Detect Dockerfile in `/api`
- ✅ Build Docker image
- ✅ Deploy container
- ✅ Provide a URL

#### Step 2: Configure API Service

1. Click on the **api** service you just created
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Add these variables:

```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=i2MmBxA1lwRYr8s7F0LCahU3tONX5GEegZdVKfoIpvjQybuzSq4k69HPcnDJTW
JWT_REFRESH_SECRET=87kCB6uiHmQabyMlzUYrILAnsJ19Gx2WEKqNfXDh3R0PgTStw4eojdvZc5VpFO
```

5. Click **"Add Reference"** to link databases:
   - Add `DATABASE_URL` → Select **Postgres** → `DATABASE_URL`
   - Add `REDIS_URL` → Select **Redis** → `REDIS_URL`

6. Add remaining variables (get from your .env file):
```bash
CORS_ORIGIN=https://yourdomain.com
RESEND_API_KEY=re_xxx
STRIPE_SECRET_KEY=sk_live_xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
VENDOR_GOOGLE_KEY=xxx
```

#### Step 3: Create Web Service

1. Back to project: https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c
2. Click **"New Service"** → **"GitHub Repo"**
3. Select: **joelswaku/event-plateform**
4. Service name: **web**
5. Root directory: **/web**
6. Click **"Add Service"**

Add variables:
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api-xxx.up.railway.app/api
NEXT_PUBLIC_APP_URL=https://web-xxx.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
```

#### Step 4: Create Vendors Service

1. Click **"New Service"** → **"GitHub Repo"**
2. Select: **joelswaku/event-plateform**
3. Service name: **vendors**
4. Root directory: **/vendors**
5. Click **"Add Service"**

Add variables:
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api-xxx.up.railway.app/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
```

#### Step 5: Deploy!

Railway auto-deploys when you:
- Add the GitHub repo
- Every push to `main` branch

Check deployment status:
- Go to each service
- Click **"Deployments"** tab
- Watch logs in real-time

---

### Method 2: GitHub Actions (AUTOMATED)

#### Prerequisites
1. Services must be created in Railway dashboard first (use Method 1 above)
2. Get Railway API token

#### Step 1: Get Railway Token

1. Go to: https://railway.com/account/tokens
2. Click **"Create Token"**
3. Name: `GitHub Actions`
4. Click **"Create"**
5. **Copy the token** (you'll only see it once!)

#### Step 2: Add GitHub Secret

1. Go to: https://github.com/joelswaku/event-plateform/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `RAILWAY_TOKEN`
4. Value: Paste the token
5. Click **"Add secret"**

#### Step 3: Push to GitHub

```bash
cd c:\projects\event-plateform

# Commit Railway configs
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

This triggers `.github/workflows/deploy-railway.yml` automatically!

---

## ✅ What Happens After Deployment

### API Service
```
✅ Building Docker image (2-5 min)
✅ Running migrations
✅ Starting server on port 5000
✅ Health check at /health
✅ Deployed at: https://api-xxx.up.railway.app
```

### Web Service
```
✅ Installing dependencies (1-2 min)
✅ Building Next.js app (2-3 min)
✅ Starting production server
✅ Deployed at: https://web-xxx.up.railway.app
```

### Vendors Service
```
✅ Installing dependencies (1-2 min)
✅ Building Next.js app (2-3 min)
✅ Starting production server
✅ Deployed at: https://vendors-xxx.up.railway.app
```

---

## 🔍 Monitor Deployment

### View Logs
1. Go to service in Railway dashboard
2. Click **"Deployments"**
3. Click on latest deployment
4. View **Build Logs** and **Deploy Logs**

### Check Health
```bash
# API
curl https://api-xxx.up.railway.app/health

# Web
curl https://web-xxx.up.railway.app

# Vendors
curl https://vendors-xxx.up.railway.app
```

---

## 🌐 Get Deployment URLs

After deployment completes:

1. Click on each service
2. Go to **"Settings"** → **"Domains"**
3. Click **"Generate Domain"**
4. Copy the URL (format: `xxx.up.railway.app`)

Or add custom domains:
- api.liteevent.com
- liteevent.com
- vendors.liteevent.com

---

## 🐛 Common Issues

### Build Fails
**Check:**
- Root directory is correct in service settings
- Dockerfile exists (for API)
- package.json exists (for Web/Vendors)

**Fix:**
- Service settings → Build → Root Directory: `/api`, `/web`, or `/vendors`

### Deployment Fails
**Check:**
- Environment variables are set
- DATABASE_URL is linked (API only)
- REDIS_URL is linked (API only)

**Fix:**
- Go to Variables tab
- Add missing variables
- Link database references

### Service Crashes
**Check Logs:**
1. Service → Deployments
2. Click failed deployment
3. Read deploy logs for errors

**Common fixes:**
- Missing environment variables
- Database connection failed
- Port mismatch (should be `PORT` env var)

---

## 🎯 RECOMMENDED: Use Method 1 (Dashboard)

It's the fastest and most reliable:
1. Create services via GitHub integration (5 minutes)
2. Add environment variables
3. Done! Railway handles everything else

**Start here:** https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c

Click **"New Service"** → **"GitHub Repo"** → **joelswaku/event-plateform**

---

## ✨ After Deployment

1. ✅ Get deployment URLs
2. ✅ Update CORS_ORIGIN with actual URLs
3. ✅ Update NEXT_PUBLIC_API_URL in Web/Vendors
4. ✅ Test all endpoints
5. ✅ Add custom domains (optional)
6. ✅ Set up monitoring

---

**You're deploying NOW, not later!** 🚀

Open Railway dashboard and follow Method 1 above.
