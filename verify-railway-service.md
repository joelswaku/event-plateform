# Railway Service Verification Guide

Service URL: https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c/service/fe40843b-9f02-49c8-9523-683fa8f3c167/settings

## 🔍 Settings to Verify

### 1. General Settings Tab

**Service Name:**
- [ ] Named: `api`, `web`, or `vendors`

**Source:**
- [ ] Connected to GitHub repository
- [ ] Repository: `YOUR_USERNAME/event-plateform`
- [ ] Branch: `main`

### 2. Settings → Build Tab

#### If this is the API Service:
- [ ] **Root Directory**: `/api`
- [ ] **Builder**: `DOCKERFILE`
- [ ] **Dockerfile Path**: `Dockerfile`
- [ ] **Build Command**: (leave empty - Docker handles it)

#### If this is the Web Service:
- [ ] **Root Directory**: `/web`
- [ ] **Builder**: `NIXPACKS` (auto-detected)
- [ ] **Build Command**: `npm run build`
- [ ] **Start Command**: `npm start`

#### If this is the Vendors Service:
- [ ] **Root Directory**: `/vendors`
- [ ] **Builder**: `NIXPACKS` (auto-detected)
- [ ] **Build Command**: `npm run build`
- [ ] **Start Command**: `npm start`

### 3. Settings → Deploy Tab

**Watch Paths:**
- [ ] API: `api/**`
- [ ] Web: `web/**`
- [ ] Vendors: `vendors/**`

**Auto-Deploy:**
- [ ] ✅ Deploy on push to `main` branch

**Deploy Trigger:**
- [ ] ✅ Automatic deployments enabled

### 4. Variables Tab

#### Essential Variables (All Services):
```bash
NODE_ENV=production
```

#### API Service Variables:
```bash
# Core
PORT=5000
NODE_ENV=production

# Database (auto-injected by Railway when you link Postgres)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-injected by Railway when you link Redis)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secrets (generate new ones)
JWT_SECRET=<generate with: openssl rand -base64 64>
JWT_REFRESH_SECRET=<generate with: openssl rand -base64 64>

# CORS
CORS_ORIGIN=https://liteevent.com,https://vendors.liteevent.com

# Email (Resend)
RESEND_API_KEY=re_xxxxx
MAIL_FROM_EMAIL=notifications@liteevent.com
MAIL_FROM_NAME=LiteEvent

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_STARTER_PRICE_ID=price_live_xxxxx
STRIPE_PRO_PRICE_ID=price_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=https://api.liteevent.com/auth/google/callback

# Google Maps
VENDOR_GOOGLE_KEY=xxxxx

# AWS (for AI features)
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=us-east-1

# Anthropic AI (optional)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

#### Web Service Variables:
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.liteevent.com/api
NEXT_PUBLIC_APP_URL=https://liteevent.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_live_xxxxx
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_live_xxxxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxx
```

#### Vendors Service Variables:
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.liteevent.com/api
NEXT_PUBLIC_APP_URL=https://vendors.liteevent.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxx
```

### 5. Settings → Service Connections

**For API Service:**
- [ ] ✅ Linked to Postgres database
- [ ] ✅ Linked to Redis

**How to Link:**
1. Go to Settings → Service Connections
2. Click "New Variable Reference"
3. Select Postgres → DATABASE_URL
4. Select Redis → REDIS_URL

### 6. Settings → Networking

**After First Deployment:**
- [ ] Generate Railway domain (free subdomain)
- [ ] Or add custom domain:
  - API: `api.liteevent.com`
  - Web: `liteevent.com`
  - Vendors: `vendors.liteevent.com`

### 7. Settings → Health Checks

**API Service:**
- [ ] Health Check Path: `/health`
- [ ] Health Check Timeout: `30` seconds

**Web/Vendors Services:**
- [ ] Health Check Path: `/`
- [ ] Health Check Timeout: `30` seconds

## ✅ Quick Verification Checklist

- [ ] Service name is correct (api/web/vendors)
- [ ] GitHub repository connected
- [ ] Root directory set correctly
- [ ] Builder configured (Dockerfile for API, Nixpacks for Web/Vendors)
- [ ] Environment variables added
- [ ] Postgres linked to API (if API service)
- [ ] Redis linked to API (if API service)
- [ ] Watch paths configured
- [ ] Auto-deploy enabled
- [ ] First deployment triggered

## 🚀 Deployment Status

**Check Deployment:**
1. Go to Deployments tab
2. Latest deployment should show:
   - ✅ Building
   - ✅ Deploying
   - ✅ Success

**View Logs:**
- Click on latest deployment
- Check build logs for errors
- Check deploy logs for runtime errors

## 🐛 Common Issues

### Build Fails
**Check:**
- Root directory is correct
- Dockerfile exists (for API)
- package.json exists
- Dependencies can be installed

**Fix:**
- Verify root directory in Settings → Build
- Check build logs for specific errors

### Deployment Fails
**Check:**
- Environment variables are set
- DATABASE_URL is available (API)
- Port is correct (5000 for API, 3000 for Web)

**Fix:**
- Add missing environment variables
- Link database services
- Check start command

### Service Won't Start
**Check:**
- Health check endpoint exists
- Service is listening on PORT variable
- No crashes in deploy logs

**Fix:**
- Verify health check path
- Ensure app binds to `0.0.0.0:${PORT}`
- Check deploy logs for errors

## 📊 Expected Results

### API Service (Docker):
```
✅ Build: Docker image built successfully
✅ Deploy: Container started on port 5000
✅ Health: /health endpoint returns 200
✅ Database: Connected to Postgres
✅ Redis: Connected to Redis
```

### Web Service (Next.js):
```
✅ Build: Next.js production build complete
✅ Deploy: Server started on port 3000
✅ Health: / endpoint accessible
✅ API: Connected to API service
```

### Vendors Service (Next.js):
```
✅ Build: Next.js production build complete
✅ Deploy: Server started on port 3001
✅ Health: / endpoint accessible
✅ API: Connected to API service
```

## 🔗 Useful Links

- **Service Settings**: https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c/service/fe40843b-9f02-49c8-9523-683fa8f3c167/settings
- **Project Dashboard**: https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c
- **Environment Variables Guide**: [RAILWAY-ENV-SETUP.md](RAILWAY-ENV-SETUP.md)

## 💡 Next Steps

1. ✅ Verify all settings above
2. 📝 Add environment variables
3. 🔗 Link database services (API only)
4. 🚀 Trigger deployment (push to GitHub or manual deploy)
5. 🔍 Monitor deployment logs
6. 🌐 Get deployment URL and test

---

**Need Help?**
- Check [RAILWAY-DEPLOY-NOW.md](RAILWAY-DEPLOY-NOW.md) for detailed deployment guide
- View logs: Click on deployment → View Logs
- Railway Docs: https://docs.railway.app
