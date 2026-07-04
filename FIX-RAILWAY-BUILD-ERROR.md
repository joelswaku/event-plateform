# 🔧 Fix Railway Build Error - Root Directory

## ❌ Error You Got
```
✖ Railpack could not determine how to build the app.
```

## 🎯 The Problem
Railway is trying to build from the **root directory** (`/`) of your monorepo, but your code is in subdirectories:
- `/api` - Backend API
- `/web` - Main web app  
- `/vendors` - Vendors portal

## ✅ The Solution

### For Each Service You Created:

#### 1. Open Service Settings
Go to: https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c/service/79249455/settings

#### 2. Set Root Directory

**In the Railway dashboard:**

1. Click **"Settings"** tab (left sidebar)
2. Scroll to **"Source"** section
3. Find **"Root Directory"** field
4. Enter the correct path:

| Service Type | Root Directory |
|--------------|----------------|
| API | `/api` |
| Web | `/web` |
| Vendors | `/vendors` |

5. The setting auto-saves

#### 3. Redeploy

1. Click **"Deployments"** tab (left sidebar)
2. Find the failed deployment
3. Click **"Redeploy"** button (three dots → Redeploy)

## 📋 Full Setup for Each Service

### API Service

**Settings → Source:**
- Root Directory: `/api`
- Build Method: `DOCKERFILE` (auto-detected)

**Settings → Deploy:**
- Start Command: (leave empty, Dockerfile handles it)

**Variables:**
```bash
NODE_ENV=production
PORT=5000
# Link Postgres and Redis databases
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
# Add other variables...
```

### Web Service

**Settings → Source:**
- Root Directory: `/web`
- Build Method: `NIXPACKS` (auto-detected)

**Settings → Deploy:**
- Build Command: `npm run build`
- Start Command: `npm start`

**Variables:**
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api-xxx.up.railway.app/api
```

### Vendors Service

**Settings → Source:**
- Root Directory: `/vendors`
- Build Method: `NIXPACKS` (auto-detected)

**Settings → Deploy:**
- Build Command: `npm run build`
- Start Command: `npm start`

**Variables:**
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api-xxx.up.railway.app/api
```

## 🚀 After Setting Root Directory

Railway will automatically:
1. ✅ Detect the correct files (Dockerfile or package.json)
2. ✅ Build your app correctly
3. ✅ Deploy successfully

## ⏱️ Expected Build Times

- **API**: 2-5 minutes (Docker build)
- **Web**: 3-5 minutes (Next.js build)
- **Vendors**: 3-5 minutes (Next.js build)

## 📊 What Success Looks Like

### Build Logs (API):
```
✓ Found Dockerfile at /api/Dockerfile
✓ Building Docker image...
✓ Successfully built image
✓ Pushing to registry...
✓ Build complete
```

### Build Logs (Web/Vendors):
```
✓ Detected Next.js application
✓ Installing dependencies...
✓ Building production bundle...
✓ Build optimized
✓ Build complete
```

### Deploy Logs:
```
✓ Container started
✓ Listening on port 5000 (or 3000)
✓ Health check passed
✓ Deployment successful
```

## 🐛 If Build Still Fails

### Check:
1. Root directory is exactly: `/api` or `/web` or `/vendors` (no trailing slash)
2. Files exist in that directory:
   - API: `Dockerfile`, `package.json`
   - Web/Vendors: `package.json`, `next.config.js`

### View Full Logs:
1. Go to failed deployment
2. Click **"Build Logs"** tab
3. Click **"Deploy Logs"** tab
4. Look for specific error messages

### Common Issues:

**Missing Dependencies:**
- Check `package.json` has all dependencies
- Try: Redeploy from latest commit

**Environment Variables Missing:**
- Add required variables in Variables tab
- Link database references

**Port Issues:**
- API should use `PORT` env variable (Railway sets this)
- Web/Vendors: Usually port 3000

## 📞 Quick Links

- **Your Project**: https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c
- **Service Settings**: https://railway.com/project/3b0af4a1-4bf5-4782-8b4b-383b0b37855c/service/79249455/settings
- **Railway Docs**: https://docs.railway.app/deploy/deployments

---

## ✅ Checklist

- [ ] Root Directory set to `/api`, `/web`, or `/vendors`
- [ ] Redeployed the service
- [ ] Build logs show success
- [ ] Deploy logs show service started
- [ ] Service shows as "Online" in dashboard
- [ ] Can access the deployment URL

---

**DO THIS NOW:**
1. Open service settings (already opened)
2. Set Root Directory
3. Redeploy
4. Watch it build successfully! 🚀
