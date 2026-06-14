# 🚀 Production Deployment Checklist

## Overview
This document lists all `localhost` references and how to make them production-ready.

---

## 📋 Environment Variables to Update

### 1. API Server (`api/.env`)

**Current (Development):**
```bash
DATABASE_URL=postgres://postgres:Swama2410%40@localhost:5432/event
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000,http://192.168.0.63:3000,http://localhost:8081
FRONTEND_URL=http://192.168.0.63:3000
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

**Production:**
```bash
# Database - Use managed PostgreSQL (AWS RDS, Supabase, etc.)
DATABASE_URL=postgres://user:password@your-db-host.aws.com:5432/liteevent

# Redis - Use managed Redis (AWS ElastiCache, Upstash, etc.)
REDIS_URL=redis://your-redis-host.aws.com:6379

# CORS - Your production domains
CORS_ORIGIN=https://liteevent.com,https://www.liteevent.com,https://vendors.liteevent.com

# Frontend URL - Your main web app
FRONTEND_URL=https://liteevent.com

# Google OAuth - Update redirect URI in Google Console
GOOGLE_REDIRECT_URI=https://api.liteevent.com/auth/google/callback

# Vendor Portal
VENDOR_APP_URL=https://vendors.liteevent.com

# Additional Production Variables
NODE_ENV=production
PORT=5000
```

---

### 2. Web App (`web/.env.local` → `.env.production`)

**Current (Development):**
```bash
NEXT_PUBLIC_API_URL=/api
INTERNAL_API_URL=http://localhost:5000/api
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

**Production:**
```bash
# Public API URL - Uses Next.js proxy in production too
NEXT_PUBLIC_API_URL=/api

# Internal API URL - Server-side calls
INTERNAL_API_URL=https://api.liteevent.com/api

# OR if API is on same domain:
# INTERNAL_API_URL=http://localhost:5000/api  # Container-to-container

# Google OAuth
GOOGLE_REDIRECT_URI=https://api.liteevent.com/auth/google/callback

# Base URL for Open Graph / SEO
NEXT_PUBLIC_APP_URL=https://liteevent.com

# Stripe (Production keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_live_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_live_...
```

---

### 3. Mobile App (`eventapp-mobile/.env.production`)

**Current (Development):**
```bash
EXPO_PUBLIC_API_URL=http://192.168.0.63:5000/api
EXPO_PUBLIC_WEB_URL=http://192.168.0.63:3000
```

**Production:**
```bash
# API URL - Production API endpoint
EXPO_PUBLIC_API_URL=https://api.liteevent.com/api

# Web URL - For event pages
EXPO_PUBLIC_WEB_URL=https://liteevent.com

# Google OAuth - Update client IDs from Google Console
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id

# Stripe (Production)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

### 4. Vendor Portal (`vendors/.env.production`)

**Current (Development):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_VENDOR_APP_URL=http://localhost:3001
```

**Production:**
```bash
NEXT_PUBLIC_API_URL=https://api.liteevent.com/api
NEXT_PUBLIC_VENDOR_APP_URL=https://vendors.liteevent.com
```

---

## 🔧 Code Files That Need Environment Variables

### Already Using Environment Variables ✅

These files correctly use `process.env` and will work in production once env vars are set:

1. **API Files:**
   - `api/app.js` - CORS_ORIGIN ✅
   - `api/config/env.js` - All configs ✅
   - `api/utils/sendEmail.js` - FRONTEND_URL, VENDOR_APP_URL ✅
   - `api/services/*.js` - Use env.frontendUrl ✅
   - `api/routes/google-places.routes.js` - NEXT_PUBLIC_APP_URL ✅

2. **Web Files:**
   - `web/src/lib/api.js` - NEXT_PUBLIC_API_URL ✅
   - `web/src/lib/public-api.js` - INTERNAL_API_URL ✅
   - `web/src/lib/chat-api.js` - NEXT_PUBLIC_API_URL ✅
   - `web/src/components/**/*.jsx` - All using env vars ✅
   - `web/next.config.mjs` - API proxy config ✅

3. **Mobile Files:**
   - `eventapp-mobile/constants/config.ts` - Env vars ✅
   - `eventapp-mobile/app.config.ts` - Env vars ✅

---

## 🏗️ Infrastructure Setup

### Recommended Architecture

```
┌─────────────────────────────────────────────────┐
│                  CloudFlare / CDN                │
│         (SSL, DDoS protection, caching)          │
└──────────────┬──────────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐  ┌──────────────┐
│  liteevent   │  │ vendors.lite │
│    .com      │  │  event.com   │
│              │  │              │
│  Next.js     │  │  Next.js     │
│  (Vercel)    │  │  (Vercel)    │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
    ┌────────────────────────┐
    │  api.liteevent.com     │
    │                        │
    │  Node.js API           │
    │  (AWS ECS/Fargate or   │
    │   Railway/Render)      │
    └───────┬────────────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │
│ (AWS RDS)│  │(Upstash) │
└──────────┘  └──────────┘
```

---

## 🌐 Domain Configuration

### DNS Records

```dns
# Main website
liteevent.com           A/CNAME  → Vercel IP / CNAME
www.liteevent.com       CNAME    → liteevent.com

# API
api.liteevent.com       A/CNAME  → API server IP

# Vendor portal
vendors.liteevent.com   CNAME    → Vercel

# Mobile deep links
app.liteevent.com       CNAME    → liteevent.com
```

### SSL Certificates

- Use **Let's Encrypt** (free) or **CloudFlare** (automatic)
- All domains need HTTPS
- Mobile apps require valid SSL certificates

---

## 📱 Mobile App Configuration

### 1. Update `app.json` / `app.config.ts`

```typescript
export default {
  expo: {
    scheme: "liteevent",
    web: {
      bundler: "metro"
    },
    android: {
      package: "com.liteevent.app",
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "https",
              host: "liteevent.com",
              pathPrefix: "/e"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    ios: {
      bundleIdentifier: "com.liteevent.app",
      associatedDomains: [
        "applinks:liteevent.com",
        "applinks:app.liteevent.com"
      ]
    }
  }
};
```

### 2. Apple App Site Association

Create `web/public/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.liteevent.app",
        "paths": ["/e/*", "/event/*"]
      }
    ]
  }
}
```

### 3. Android Deep Links

Create `web/public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.liteevent.app",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

---

## 🔐 Security Checklist

### API Server

- [ ] Change `JWT_SECRET` to strong random value (64+ characters)
- [ ] Change `JWT_REFRESH_SECRET` to different strong value
- [ ] Set `NODE_ENV=production`
- [ ] Enable CORS only for your domains
- [ ] Use HTTPS everywhere
- [ ] Enable rate limiting (already configured)
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure log retention
- [ ] Rotate database credentials
- [ ] Use secrets manager (AWS Secrets Manager, Vault)

### Web App

- [ ] Set `NODE_ENV=production`
- [ ] Use production Stripe keys
- [ ] Enable CSP headers
- [ ] Configure analytics (Google Analytics)
- [ ] Set up error tracking (Sentry)
- [ ] Enable security headers (next.config.mjs)

### Database

- [ ] Use managed database service
- [ ] Enable encryption at rest
- [ ] Enable encryption in transit (SSL)
- [ ] Regular automated backups
- [ ] Set up read replicas (optional)
- [ ] Restrict IP access
- [ ] Use strong passwords

---

## 🐳 Docker Production Configuration

### Update `docker-compose.yml` for production:

```yaml
version: '3.8'

services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - FRONTEND_URL=https://liteevent.com
      - JWT_SECRET=${JWT_SECRET}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    ports:
      - "5000:5000"
    restart: always

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=/api
      - INTERNAL_API_URL=http://api:5000/api
    ports:
      - "3000:3000"
    restart: always
    depends_on:
      - api

  vendors:
    build:
      context: ./vendors
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.liteevent.com/api
    ports:
      - "3001:3000"
    restart: always
```

---

## 📊 Monitoring & Logging

### Set up monitoring for:

1. **Application Performance:**
   - New Relic / DataDog
   - Response times
   - Error rates
   - Database query performance

2. **Error Tracking:**
   - Sentry (backend + frontend)
   - Stack traces
   - User context

3. **Infrastructure:**
   - AWS CloudWatch / Vercel Analytics
   - CPU/Memory usage
   - Disk space
   - Network traffic

4. **Logs:**
   - Centralized logging (LogDNA, Papertrail)
   - Log retention policy
   - Alert on critical errors

---

## 🚀 Deployment Steps

### 1. Update All Environment Variables

```bash
# Create production env files:
cp api/.env api/.env.production
cp web/.env.local web/.env.production
cp eventapp-mobile/.env.local eventapp-mobile/.env.production

# Update with production values
# NEVER commit .env.production files!
```

### 2. Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Update **Authorized redirect URIs**:
   - Add: `https://api.liteevent.com/auth/google/callback`
   - Remove development URIs in production
3. Update **Authorized JavaScript origins**:
   - Add: `https://liteevent.com`
   - Add: `https://vendors.liteevent.com`

### 3. Update Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Create production webhook:
   - URL: `https://api.liteevent.com/api/subscription/webhook`
   - Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 4. Database Migration

```bash
# Run migrations on production database
DATABASE_URL="postgres://user:pass@prod-db.com:5432/liteevent" npm run migrate
```

### 5. Deploy Services

**Option A: Vercel (Recommended for Next.js apps)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy web app
cd web
vercel --prod

# Deploy vendor portal
cd vendors
vercel --prod
```

**Option B: Docker / AWS ECS**

```bash
# Build and push images
docker build -t liteevent-api:latest ./api
docker push your-registry/liteevent-api:latest

docker build -t liteevent-web:latest ./web
docker push your-registry/liteevent-web:latest

# Deploy to ECS/Fargate
# (Use terraform or AWS Console)
```

**Option C: Railway / Render**

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### 6. Deploy Mobile App

```bash
cd eventapp-mobile

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## ✅ Post-Deployment Verification

### API Health Check

```bash
curl https://api.liteevent.com/api/platform-stats
# Should return: {"success":true,"stats":{...}}

curl https://api.liteevent.com/api/auth/me
# Should return: {"success":false,"message":"No token provided"}
```

### Web App Check

```bash
curl -I https://liteevent.com
# Should return: 200 OK

curl -I https://liteevent.com/api/platform-stats
# Should return: 200 OK (proxied through Next.js)
```

### SSL Certificate Check

```bash
curl -vI https://liteevent.com 2>&1 | grep -i "SSL"
# Should show valid certificate
```

### DNS Check

```bash
nslookup liteevent.com
nslookup api.liteevent.com
nslookup vendors.liteevent.com
```

---

## 📋 Final Checklist

### Before Going Live:

- [ ] All environment variables updated
- [ ] Database migrated
- [ ] SSL certificates configured
- [ ] DNS records configured
- [ ] Google OAuth updated
- [ ] Stripe webhooks configured
- [ ] Error tracking set up
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Load testing completed
- [ ] Security audit completed

### After Going Live:

- [ ] Monitor error rates
- [ ] Check API response times
- [ ] Verify email sending works
- [ ] Test payment flow
- [ ] Test mobile app
- [ ] Check analytics tracking
- [ ] Set up uptime monitoring
- [ ] Create runbook for common issues

---

## 🆘 Rollback Plan

If something goes wrong:

1. **Keep old environment running** during deployment
2. **Use feature flags** for new features
3. **Database migrations** - always write backward-compatible migrations
4. **DNS** - Keep short TTL (300s) during migration
5. **Quick rollback** - Redeploy previous version

---

## 📞 Support

**Production Issues:**
- Check CloudWatch / Vercel logs first
- Check Sentry for errors
- Review deployment logs
- Roll back if critical

**Emergency Contacts:**
- DevOps: [Your email]
- Database: [DBA email]
- Security: [Security team]

---

**Last Updated**: 2026-06-12
**Version**: Production Ready v1.0
