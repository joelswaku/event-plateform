# ⚡ Railway Quick Fix - Builder Setting

## ❌ Current Error
```
couldn't locate the dockerfile at path Dockerfile in code archive
```

## 🎯 The Problem
Railway is using **Railpack** builder, but you need **Dockerfile** builder for the API service.

## ✅ The Fix (30 seconds)

### In Railway Service Settings:

1. **Scroll down to "Build" section**
   
2. **Find "Builder" field** (currently shows: "Railpack")

3. **Click the dropdown**

4. **Select: "Dockerfile"**
   (There should be options like: Railpack, Dockerfile, Nixpacks, etc.)

5. **It auto-saves**

6. **Go to "Deployments" tab**

7. **Click "Redeploy"** on the failed deployment

## 📋 All Settings for API Service

### Source:
- ✅ Root Directory: `/api`
- ✅ Branch: `main`
- ✅ Repo: `joelswaku/event-plateform`

### Build:
- ❌ Builder: ~~Railpack~~ (wrong!)
- ✅ Builder: **Dockerfile** (correct!)

### Deploy:
- Leave Start Command empty (Dockerfile handles it)

### Variables:
Add these after deployment succeeds:
```
NODE_ENV=production
PORT=5000
JWT_SECRET=i2MmBxA1lwRYr8s7F0LCahU3tONX5GEegZdVKfoIpvjQybuzSq4k69HPcnDJTW
JWT_REFRESH_SECRET=87kCB6uiHmQabyMlzUYrILAnsJ19Gx2WEKqNfXDh3R0PgTStw4eojdvZc5VpFO
```

Link databases:
- DATABASE_URL → Postgres
- REDIS_URL → Redis

## 🚀 After Changing to Dockerfile Builder

Railway will:
1. ✅ Find Dockerfile in `/api` folder
2. ✅ Build Docker image
3. ✅ Deploy container
4. ✅ Provide deployment URL

## ⏱️ Expected Build Time
- 2-5 minutes for Docker build
- Container starts on port 5000
- Health check at `/health`

## ✅ Success Looks Like

### Build Logs:
```
✓ Using Dockerfile builder
✓ Found Dockerfile at /api/Dockerfile
✓ Building Docker image...
✓ Successfully built
✓ Pushing to registry...
✓ Build complete
```

### Deploy Logs:
```
✓ Container started
✓ Server listening on port 5000
✓ Health check passed
✓ Deployment successful
```

---

## 🎯 DO THIS NOW

1. In Railway settings, find **"Builder"** dropdown
2. Change from **"Railpack"** → **"Dockerfile"**
3. Redeploy
4. Success! 🚀

**Service Settings:** https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c/service/63c1c0e2/settings
