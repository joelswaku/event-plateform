# 🚀 LiteEvent - Quick Start Guide

## ✅ Errors Fixed

1. ✅ **Import Error** - `platform-stats.routes.js` now uses correct PostgreSQL syntax
2. ✅ **Login Error** - API server startup issues resolved
3. ✅ **Mobile Connection** - Configuration documented

---

## 🎯 Start Everything in 3 Steps

### Step 1: Check Prerequisites
```bash
# Run diagnostic:
DIAGNOSE.bat
```

This checks:
- PostgreSQL (required)
- Redis (optional)
- Configuration files
- Your IP address

### Step 2: Start All Servers
```bash
# Double-click or run:
START_ALL_SERVERS.bat
```

This starts:
- API Server (port 5000)
- Web Server (port 3000)

### Step 3: Verify Everything Works
```bash
# Test API:
curl http://localhost:5000/api/platform-stats

# Open web:
# http://localhost:3000

# For mobile:
# Use your IP from DIAGNOSE.bat
# Example: http://192.168.0.63:3000
```

---

## 📱 Mobile App Setup

### Update IP Address (if needed):

1. **Find your IP:**
   ```bash
   ipconfig | findstr IPv4
   # Example output: 192.168.0.63
   ```

2. **Update mobile config:**
   ```bash
   # Edit: eventapp-mobile\.env.local
   EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api
   EXPO_PUBLIC_WEB_URL=http://YOUR_IP:3000
   ```

3. **Restart Expo:**
   ```bash
   cd eventapp-mobile
   npm start
   ```

---

## 🔧 Common Issues

### "API Server Not Running"

**Fix:**
```bash
cd api
npm run dev
```

**Should see:**
```
✓ Server running on port 5000
✓ PostgreSQL connected
```

### "PostgreSQL Not Running"

**Fix (Windows):**
```bash
net start postgresql-x64-14

# Or find your service:
services.msc
# Look for "postgresql" and start it
```

### "Port 5000 Already in Use"

**Fix:**
```bash
# Find what's using port 5000:
netstat -ano | findstr :5000

# Kill the process (replace PID):
taskkill /PID <process-id> /F

# Then restart API
cd api
npm run dev
```

### "Database Migration Needed"

**Fix:**
```bash
cd api
npm run migrate
```

### "Redis Connection Failed"

**Option 1 - Install Redis:**
- Download: https://github.com/microsoftarchive/redis/releases
- Install and start

**Option 2 - Skip Redis (Dev Mode):**
Edit `api/config/redis.js`:
```javascript
export const redis = {
  get: async () => null,
  set: async () => true,
  del: async () => true,
  quit: async () => true
};
```

---

## 📖 Full Documentation

- **[FIX_LOGIN_ERROR.md](FIX_LOGIN_ERROR.md)** - Complete login troubleshooting
- **[API_IMPORT_ERROR_FIXED.md](API_IMPORT_ERROR_FIXED.md)** - Import error details
- **[COMPLETE_LANDING_PAGE_V4.md](COMPLETE_LANDING_PAGE_V4.md)** - Landing page features

---

## 🎨 What's New in LiteEvent

### Branding
- ✅ Full rebrand from "WedSite" to "LiteEvent"
- ✅ New logo (L with indigo/violet gradient)
- ✅ Consistent colors throughout

### Landing Page
- ✅ **61 Real Templates** (6 free, 55 premium)
- ✅ **Real-time Stats** from API (live event counts)
- ✅ **Dynamic Pricing** from database
- ✅ **AI Planner Section** with features
- ✅ **Mobile App Downloads** in hero
- ✅ **Professional Dashboard** mockup

### Technical
- ✅ Light/Dark mode support
- ✅ Fully responsive design
- ✅ API-driven content
- ✅ Production ready

---

## 🎯 Default Credentials

If you need test credentials:

**Create a user:**
1. Go to http://localhost:3000/register
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!
3. Submit

**Or use SQL:**
```sql
-- Check if user exists:
SELECT email, full_name FROM users;
```

---

## 🚀 Deployment Checklist

Before deploying to production:

### API:
- [ ] Update `DATABASE_URL` to production database
- [ ] Set `NODE_ENV=production`
- [ ] Update `CORS_ORIGIN` with production domains
- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configure `STRIPE_SECRET_KEY` (production key)
- [ ] Set up monitoring (Sentry, LogRocket, etc.)

### Web:
- [ ] Update `NEXT_PUBLIC_API_URL` to production API
- [ ] Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (production)
- [ ] Configure analytics (Google Analytics, etc.)
- [ ] Set up error tracking

### Mobile:
- [ ] Update `EXPO_PUBLIC_API_URL` to production API
- [ ] Update `EXPO_PUBLIC_WEB_URL` to production web
- [ ] Configure push notifications
- [ ] Submit to App Store / Google Play

---

## 📊 Project Structure

```
event-plateform/
├── api/                    # Backend API (Node.js + Express + PostgreSQL)
│   ├── config/            # Database, Redis config
│   ├── controllers/       # Business logic
│   ├── routes/            # API endpoints
│   ├── services/          # Auth, email, etc.
│   └── .env               # Environment variables
│
├── web/                   # Frontend Web App (Next.js 14)
│   ├── src/
│   │   ├── app/          # Pages (App Router)
│   │   ├── components/   # React components
│   │   ├── lib/          # Templates, utilities
│   │   └── store/        # Zustand state
│   └── .env.local        # Environment variables
│
├── eventapp-mobile/      # Mobile App (React Native + Expo)
│   ├── app/              # Screens
│   ├── components/       # Mobile components
│   └── .env.local        # Environment variables
│
└── Scripts:
    ├── START_ALL_SERVERS.bat    # Start everything
    ├── DIAGNOSE.bat             # Check system
    └── FIX_LOGIN_ERROR.md       # Troubleshooting
```

---

## ✅ Success Checklist

Your setup is complete when you can:

- [ ] Run `DIAGNOSE.bat` - all checks pass
- [ ] Access web at http://localhost:3000
- [ ] Login to web app
- [ ] See dashboard after login
- [ ] API responds at http://localhost:5000/api/platform-stats
- [ ] Mobile app connects (on same WiFi)
- [ ] Login from mobile app
- [ ] Create an event

---

## 🆘 Need Help?

1. **First**: Run `DIAGNOSE.bat`
2. **Second**: Check error message in terminal
3. **Third**: Look in relevant troubleshooting doc:
   - Login issues → `FIX_LOGIN_ERROR.md`
   - Import errors → `API_IMPORT_ERROR_FIXED.md`
   - Landing page → `COMPLETE_LANDING_PAGE_V4.md`

---

## 🎉 You're Ready!

Everything is configured and ready to go. Just:

1. Run `START_ALL_SERVERS.bat`
2. Wait 10 seconds for servers to start
3. Open http://localhost:3000
4. Start building! 🚀

---

**LiteEvent** - Professional Event Management Platform
**Version**: 4.0 (Real Data Edition)
**Last Updated**: 2026-06-11
