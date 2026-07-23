# ✅ Pre-Deployment Checklist

## 🎯 **Before You Deploy**

Run through this checklist to ensure smooth production deployment.

---

## 1️⃣ **Environment Variables**

### **Backend** ✅
- [ ] `DATABASE_URL` - Production database connection
- [ ] `JWT_SECRET` - Strong random secret (32+ chars)
- [ ] `JWT_REFRESH_SECRET` - Different from JWT_SECRET
- [ ] `CORS_ORIGIN` - Your production domain
- [ ] `EMAIL_SERVICE` - resend or brevo
- [ ] `RESEND_API_KEY` or `BREVO_API_KEY`
- [ ] `EMAIL_FROM` - your@domain.com
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000` (or your port)

### **Web Frontend** ✅
- [ ] `NEXT_PUBLIC_API_URL` - https://api.yourdomain.com/api
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Production Client ID
- [ ] `NEXT_PUBLIC_APP_URL` - https://yourdomain.com

### **Mobile App** ✅
- [ ] `EXPO_PUBLIC_API_URL` - https://api.yourdomain.com/api
- [ ] `EXPO_PUBLIC_WEB_URL` - https://yourdomain.com
- [ ] `EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID`
- [ ] `EXPO_PUBLIC_STRIPE_YEARLY_PRICE_ID`

---

## 2️⃣ **Database Setup**

### **Run Migrations** ✅
```bash
psql $PRODUCTION_DATABASE_URL -f api/add-verification-token.sql
psql $PRODUCTION_DATABASE_URL -f api/complete-schema.sql
```

### **Verify Schema** ✅
- [ ] `users` table exists
- [ ] `verification_token` column exists (UUID type)
- [ ] `email_verified` column exists (boolean)
- [ ] `auth_sessions` table exists
- [ ] All indexes created

---

## 3️⃣ **Google OAuth Setup**

### **Google Cloud Console** ✅
- [ ] Production OAuth client created
- [ ] Authorized JavaScript origins added:
  - `https://yourdomain.com`
  - `https://www.yourdomain.com`
- [ ] Authorized redirect URIs added:
  - `https://yourdomain.com`
  - `https://yourdomain.com/login`
  - `https://yourdomain.com/register`
- [ ] Production Client ID copied
- [ ] Client ID added to frontend env vars

---

## 4️⃣ **Security Configuration**

### **Cookie Settings** ✅
- [ ] `httpOnly: true` in production
- [ ] `secure: true` in production (requires HTTPS)
- [ ] `sameSite: 'none'` in production
- [ ] Cookie utility created (`api/utils/cookies.js`)

### **CORS Settings** ✅
- [ ] Production domains added to allowed origins
- [ ] `credentials: true` enabled
- [ ] Preflight requests handled

### **JWT Tokens** ✅
- [ ] Access token: 15 minutes
- [ ] Refresh token: 7 days
- [ ] Strong secrets (32+ characters)
- [ ] Different secrets for dev and prod

---

## 5️⃣ **Email Configuration**

### **Resend Setup** ✅
- [ ] Domain verified in Resend
- [ ] SPF/DKIM records added to DNS
- [ ] API key generated
- [ ] Email templates working
- [ ] Test email received

**OR**

### **Brevo Setup** ✅
- [ ] Sender emails verified
- [ ] SMTP credentials copied
- [ ] API key generated
- [ ] Test email received

---

## 6️⃣ **SSL/HTTPS**

### **Certificate Setup** ✅
- [ ] SSL certificate installed
- [ ] HTTPS enabled
- [ ] HTTP redirects to HTTPS
- [ ] Mixed content warnings fixed

**Platforms with Auto-SSL:**
- Vercel ✅ (automatic)
- Railway ✅ (automatic)
- Netlify ✅ (automatic)

**Custom Server:**
- [ ] Let's Encrypt configured
- [ ] Auto-renewal set up

---

## 7️⃣ **Code Changes**

### **Files to Update** ✅
- [ ] `api/utils/cookies.js` - Use production cookie settings
- [ ] `api/server.js` - CORS with production domains
- [ ] `api/services/auth.service.js` - Import cookie utility
- [ ] `web/.env.production` - All variables set
- [ ] `eventapp-mobile/.env.production` - All variables set

### **Remove Debug Code** ✅
- [ ] Remove `console.log` for sensitive data
- [ ] Remove test/dummy accounts
- [ ] Remove development comments
- [ ] Update error messages (no sensitive info)

---

## 8️⃣ **Testing**

### **Local Production Build** ✅

**Backend:**
```bash
cd api
NODE_ENV=production npm start
```

**Frontend:**
```bash
cd web
npm run build
npm start
```

**Test:**
- [ ] Register works
- [ ] Email verification works
- [ ] Login works
- [ ] Google OAuth works
- [ ] Cross-tab sync works
- [ ] Logout works

---

## 9️⃣ **Deployment**

### **Choose Platform** ✅

**Option A: Vercel + Railway**
```bash
# Backend to Railway
cd api
railway up

# Frontend to Vercel
cd web
vercel --prod
```

**Option B: Docker**
```bash
# Build and push
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml push

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

**Option C: VPS**
```bash
# PM2 deployment
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🔟 **Post-Deployment Verification**

### **Health Checks** ✅
- [ ] API responds: `https://api.yourdomain.com/health`
- [ ] Frontend loads: `https://yourdomain.com`
- [ ] SSL certificate valid
- [ ] No mixed content warnings

### **Feature Testing** ✅
- [ ] Register new account
- [ ] Receive verification email (< 1 minute)
- [ ] Verify email with code
- [ ] Login successfully
- [ ] See dashboard
- [ ] Open new tab → auto-redirect to dashboard ✅
- [ ] Logout → all tabs redirect to homepage ✅
- [ ] Google OAuth works ✅

### **Security Testing** ✅
- [ ] Cookies are httpOnly (check DevTools)
- [ ] Tokens not in localStorage
- [ ] HTTPS enforced
- [ ] CORS working correctly
- [ ] No sensitive data in errors

### **Mobile Testing** ✅
- [ ] Connect to production API
- [ ] Login works
- [ ] Session persists
- [ ] Token refresh works
- [ ] Logout clears session

---

## ⚠️ **Common Issues**

### **Issue: CORS Error**
```bash
# Check CORS_ORIGIN in backend .env
# Add production domain to allowed origins
```

### **Issue: Cookie Not Set**
```bash
# Ensure HTTPS is enabled
# Check secure: true and sameSite: 'none' in production
```

### **Issue: Google OAuth Fails**
```bash
# Check NEXT_PUBLIC_GOOGLE_CLIENT_ID
# Verify redirect URIs in Google Console
```

### **Issue: Email Not Delivered**
```bash
# Check EMAIL_SERVICE and API keys
# Verify domain SPF/DKIM records
# Check spam folder
```

---

## 🎯 **Ready to Deploy?**

### **Final Checks:**
- [ ] All environment variables set
- [ ] Database migrated
- [ ] Google OAuth configured
- [ ] Cookies secure in production
- [ ] CORS properly configured
- [ ] SSL/HTTPS enabled
- [ ] Local production build tested
- [ ] Deployment platform chosen

### **Deploy Commands:**
```bash
# Commit all changes
git add .
git commit -m "Production ready - all security features implemented"
git push

# Deploy backend
cd api && railway up

# Deploy frontend
cd web && vercel --prod

# Build mobile app
cd eventapp-mobile && eas build --platform all
```

---

## ✅ **You're Ready!**

All features working in development:
- ✅ Email verification
- ✅ Cross-tab sync
- ✅ Auto-logout
- ✅ Session monitoring
- ✅ Google OAuth
- ✅ Secure tokens

Follow the deployment guide: **PRODUCTION-DEPLOYMENT.md**

Good luck! 🚀
