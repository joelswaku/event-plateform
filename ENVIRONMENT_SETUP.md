# Environment Configuration Guide

This guide explains how to set up environment variables for development and production.

## 📁 Environment Files Structure

```
eventapp-mobile/
├── .env                    # Development (localhost)
├── .env.local             # Local network (create from .env.local.example)
├── .env.local.example     # Template for local network testing
└── .env.production        # Production (liteevent.com)

web/
├── .env.local             # Development (localhost) - git ignored
└── .env.production.example # Production template - git ignored

api/
├── .env                   # Development config
└── .env.production        # Production config (Railway)
```

## 🔧 Setup Instructions

### Mobile Development (eventapp-mobile)

**1. Local Development (Simulator/Emulator)**
```bash
# .env is already configured for localhost
npm start
```

**2. Local Network Testing (Physical Device)**
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and update IP to your machine's local IP
# Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
EXPO_PUBLIC_WEB_URL=http://YOUR_LOCAL_IP:3000

# Start Expo
npm start
```

**3. Production Build**
```bash
# .env.production is automatically used for production builds
eas build --platform android --profile production
# or
eas build --platform ios --profile production
```

### Web Development (web)

**1. Local Development**
```bash
# .env.local already configured for localhost:5000
npm run dev
```

**2. Production (Railway)**
Environment variables are set in **Railway Dashboard** → **web service** → **Variables**:
- `NEXT_PUBLIC_API_URL=https://api.liteevent.com`
- Other variables from `.env.production.example`

### API Development (api)

**1. Local Development**
```bash
# .env configured for local Postgres
npm run dev
```

**2. Production (Railway)**
Environment variables set in **Railway Dashboard** → **api service** → **Variables**

## 🌍 Environment Priority

Expo (Mobile):
1. `.env.local` (if exists)
2. `.env.production` (production builds)
3. `.env` (default)
4. Fallback in `constants/config.ts`

Next.js (Web):
1. `.env.production` (production builds)
2. `.env.local` (local override)
3. `.env`
4. Railway environment variables (production)

## 📝 Quick Reference

| Environment | Mobile API URL | Web API URL |
|-------------|---------------|-------------|
| **Development** | `http://localhost:5000/api` | `http://localhost:5000/api` |
| **Local Network** | `http://192.168.x.x:5000/api` | `http://192.168.x.x:5000/api` |
| **Production** | `https://api.liteevent.com/api` | `https://api.liteevent.com` |

## 🚨 Important Notes

1. **Never commit** `.env.local` or `.env.production` to git
2. **Production keys** should only be in Railway dashboard, not in files
3. **Restart dev servers** after changing environment variables
4. **Mobile requires restart**: Stop Expo → Start again
5. **Web auto-reloads**: Next.js picks up changes automatically

## 🔄 Switching Environments

### During Development

**Test against production API** (from local machine):
```bash
# Mobile: Create .env.local
EXPO_PUBLIC_API_URL=https://api.liteevent.com/api

# Web: Update .env.local
NEXT_PUBLIC_API_URL=https://api.liteevent.com
```

**Back to local API**:
```bash
# Mobile: Delete .env.local
rm .env.local

# Web: .env.local already has localhost
# Just restart server
```

## 🐛 Troubleshooting

**Mobile showing "Network Error"**
- Check `.env` or `.env.local` has correct API URL
- Restart Expo dev server: `npm start`
- Clear cache: `npx expo start -c`

**Web showing "Network Error"**
- Check Railway environment variables
- Verify `NEXT_PUBLIC_API_URL` is set
- Rebuild: `railway service redeploy --service web`

**API not connecting to database**
- Check `DATABASE_URL` in Railway
- Verify Postgres service is online
- Check API logs: `railway logs --service api`
