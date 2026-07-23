# 🚀 Production Deployment Guide

## ✅ **All Features Working in Development**
- ✅ Email verification with secure tokens
- ✅ Cross-tab authentication sync
- ✅ Automatic logout (30 min inactivity)
- ✅ Session monitoring
- ✅ Google OAuth
- ✅ Token refresh
- ✅ Secure token storage

---

## 📋 **Pre-Deployment Checklist**

### **1. Environment Variables**

#### **Backend (.env.production)**
```env
# Database
DATABASE_URL=your_production_database_url

# JWT Secrets (MUST be different from dev!)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars

# CORS Origins (your production domains)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Redis (if using)
REDIS_URL=your_production_redis_url

# Email Service (Resend or Brevo)
EMAIL_SERVICE=resend
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# Node Environment
NODE_ENV=production

# API Port
PORT=5000
```

#### **Web Frontend (.env.production)**
```env
# API URL (your production backend)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# Google OAuth (Production Client ID)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_production_google_client_id

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### **Mobile App (.env.production)**
```env
# API URL (your production backend)
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api

# Web URL (for opening browsers)
EXPO_PUBLIC_WEB_URL=https://yourdomain.com

# Stripe
EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID=your_stripe_price_id
EXPO_PUBLIC_STRIPE_YEARLY_PRICE_ID=your_stripe_yearly_price_id
```

---

## 🔒 **Security Configuration**

### **1. Cookie Settings for Production**

Update your JWT utility to use secure cookies in production:

**File: `api/utils/jwt.js`** (or wherever you set cookies)

```javascript
export function setRefreshTokenCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,              // true in production (requires HTTPS)
    sameSite: isProduction ? 'none' : 'lax',  // 'none' for cross-origin
    maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days
    path: '/',
  });
}
```

**IMPORTANT:**
- `secure: true` requires HTTPS
- `sameSite: 'none'` requires `secure: true`
- Only use these in production

### **2. CORS Configuration**

Update CORS to allow your production domains:

**File: `api/server.js`** (or middleware)

```javascript
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',           // Development
  process.env.CORS_ORIGIN,           // Production from env
  'https://yourdomain.com',          // Production
  'https://www.yourdomain.com',      // Production www
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID', 'X-Device-Name'],
}));
```

### **3. Database Migration**

Run all migrations on production database:

```bash
# Connect to production database
psql $PRODUCTION_DATABASE_URL

# Run migrations
\i api/add-verification-token.sql
\i api/complete-schema.sql

# Verify tables
\dt
\d users
```

### **4. SSL/HTTPS Certificate**

**Required for production!**

Most platforms provide free SSL:
- **Vercel:** Automatic HTTPS
- **Railway:** Automatic HTTPS  
- **Netlify:** Automatic HTTPS
- **Custom Server:** Use Let's Encrypt (certbot)

---

## 🌐 **Google OAuth Production Setup**

### **Step 1: Google Cloud Console**

1. Go to https://console.cloud.google.com/apis/credentials
2. Select your project
3. Click "CREATE CREDENTIALS" → "OAuth client ID"

### **Step 2: Configure OAuth Client**

**Application Type:** Web application

**Name:** LiteEvent Production (or your app name)

**Authorized JavaScript origins:**
```
https://yourdomain.com
https://www.yourdomain.com
```

**Authorized redirect URIs:**
```
https://yourdomain.com
https://yourdomain.com/login
https://yourdomain.com/register
https://api.yourdomain.com/auth/google/callback
```

### **Step 3: Copy Production Client ID**

You'll get a Client ID like:
```
123456789-abcdefghijklmnop.apps.googleusercontent.com
```

Add this to your production environment:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_production_client_id
```

---

## 🚀 **Deployment Platforms**

### **Option 1: Vercel (Frontend) + Railway (Backend)**

#### **Deploy Backend to Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables in Railway dashboard
# Then deploy
railway up
```

#### **Deploy Frontend to Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd web
vercel --prod
```

### **Option 2: Docker (All in one)**

#### **Build and Deploy:**
```bash
# Build backend
cd api
docker build -t event-platform-api .
docker push your-registry/event-platform-api

# Build frontend
cd ../web
docker build -t event-platform-web .
docker push your-registry/event-platform-web

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### **Option 3: VPS (DigitalOcean, AWS, etc.)**

#### **Setup Script:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone repo
git clone your-repo
cd event-platform

# Install dependencies
cd api && npm install
cd ../web && npm install

# Build frontend
cd web && npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## ✅ **Post-Deployment Checklist**

### **1. Test Authentication**
- [ ] Register new account
- [ ] Receive verification email
- [ ] Verify email with code
- [ ] Login successfully
- [ ] See dashboard
- [ ] Open new tab → auto-redirect to dashboard
- [ ] Logout → all tabs logout

### **2. Test Google OAuth**
- [ ] Click "Continue with Google"
- [ ] Select Google account
- [ ] Grant permissions
- [ ] Redirected to dashboard
- [ ] User data saved correctly

### **3. Test Cross-Tab Sync**
- [ ] Open 3 tabs
- [ ] Login in Tab 1
- [ ] Tabs 2 & 3 redirect to dashboard
- [ ] Logout in Tab 2
- [ ] All tabs redirect to homepage

### **4. Test Session Security**
- [ ] Tokens stored in memory only (check DevTools)
- [ ] httpOnly cookie set (check Application tab)
- [ ] 30 min inactivity → auto-logout
- [ ] Token refresh works transparently
- [ ] Expired tokens → auto-logout

### **5. Test Mobile App**
- [ ] Connect to production API
- [ ] Login works
- [ ] Session persists after app restart
- [ ] Token refresh works
- [ ] Logout clears session

### **6. Test Email Delivery**
- [ ] Verification emails arrive (< 1 minute)
- [ ] Password reset emails work
- [ ] Not in spam folder
- [ ] Links work correctly

---

## 🔧 **Common Production Issues**

### **Issue 1: CORS Error**
```
Access to XMLHttpRequest at 'https://api.yourdomain.com' from origin 'https://yourdomain.com' has been blocked by CORS policy
```
**Fix:** Add production domain to CORS allowed origins

### **Issue 2: Cookie Not Set**
```
Set-Cookie header ignored
```
**Fix:** Ensure `secure: true` and `sameSite: 'none'` in production + HTTPS

### **Issue 3: Google OAuth Redirect Error**
```
redirect_uri_mismatch
```
**Fix:** Add production URL to Google Console Authorized Redirect URIs

### **Issue 4: 502 Bad Gateway**
```
502 Bad Gateway
```
**Fix:** Backend not running or wrong API URL in frontend env

### **Issue 5: Database Connection Failed**
```
ECONNREFUSED
```
**Fix:** Check DATABASE_URL and database is accessible from server

---

## 📊 **Monitoring & Logs**

### **Setup Logging:**
```bash
# PM2 logs
pm2 logs

# Railway logs
railway logs

# Vercel logs
vercel logs
```

### **Monitor Key Metrics:**
- Failed login attempts
- Token refresh frequency
- Session duration
- API response times
- Error rates
- Email delivery rates

---

## 🎯 **Production vs Development**

| Feature | Development | Production |
|---------|-------------|------------|
| API URL | localhost:5000 | api.yourdomain.com |
| Web URL | localhost:3000 | yourdomain.com |
| HTTPS | Optional | Required |
| Cookie secure | false | true |
| Cookie sameSite | lax | none |
| CORS | localhost | production domains |
| JWT Secret | dev_secret | strong_random_secret |
| Google Client ID | dev_id | production_id |
| Email | test mode | production mode |
| Error reporting | console | logging service |

---

## ✅ **Ready for Production?**

### **Security Checklist:**
- [ ] All secrets are different from development
- [ ] JWT secrets are 32+ random characters
- [ ] Database has secure password
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Cookie security flags set correctly
- [ ] Email verification required
- [ ] Session timeout configured
- [ ] Cross-tab sync working
- [ ] All environment variables set

### **Performance Checklist:**
- [ ] Database indexes created
- [ ] Redis cache configured (optional)
- [ ] CDN for static assets (optional)
- [ ] Gzip compression enabled
- [ ] Rate limiting configured

### **Monitoring Checklist:**
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Database backups automated
- [ ] Uptime monitoring
- [ ] Log aggregation

---

## 🚀 **Deploy Command Summary**

```bash
# Backend (Railway)
cd api
railway up

# Frontend (Vercel)  
cd web
vercel --prod

# Mobile (EAS Build)
cd eventapp-mobile
eas build --platform all
```

---

## 📞 **Need Help?**

Common issues and their solutions are documented above.

For deployment-specific help:
- **Vercel:** https://vercel.com/docs
- **Railway:** https://docs.railway.app
- **Google OAuth:** See GOOGLE-OAUTH-PRODUCTION.md

---

## ✅ **Status: PRODUCTION READY**

All features tested and working in development.
Follow this guide for smooth production deployment.

Good luck! 🚀
