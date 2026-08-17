# 🚀 Deployment Guide - Version 1.1.0

## 📦 What's New in v1.1.0

### ✨ Features & Improvements
- ✅ **Donations Module Support** - Full stats support across mobile & web
- ✅ **Pro Plan Reminder Limit** - Limited to 5 reminders (was unlimited)
- ✅ **Responsive Stats Cards** - Fixed card sizing on all screen sizes
- ✅ **Module-Based Stat Filtering** - Shows relevant stats per active module
- ✅ **Enhanced Plan Limits** - Backend validation for all plan features
- ✅ **UI/UX Improvements** - Better responsive design and user feedback

### 🐛 Bug Fixes
- Fixed overflow issues on mobile stats cards
- Fixed donation stats not showing on mobile home page
- Fixed reminder count validation on backend
- Updated all plan feature descriptions

---

## 📱 Mobile App Deployment

### Prerequisites
```bash
cd C:\projects\event-plateform\eventapp-mobile
```

### 1️⃣ Build Android (Google Play)

**Production Build:**
```bash
eas build --platform android --profile production-android
```

**Submit to Google Play (Internal Testing):**
```bash
eas submit --platform android --latest
```

### 2️⃣ Build iOS (App Store)

**Production Build:**
```bash
eas build --platform ios --profile production-ios
```

**Submit to App Store (TestFlight):**
```bash
eas submit --platform ios --latest
```

### 3️⃣ Monitor Builds
```bash
# Check build status
eas build:list

# View specific build
eas build:view <build-id>
```

---

## 🌐 API Deployment (Railway)

### Prerequisites
```bash
cd C:\projects\event-plateform\api
```

### Deploy to Production

**Option 1: Push to GitHub (Auto-Deploy)**
```bash
git add .
git commit -m "Release v1.1.0 - Pro reminder limits & donation stats"
git push origin main
```

**Option 2: Railway CLI**
```bash
# Install Railway CLI if not installed
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Verify Deployment
```bash
# Check API health
curl https://api.liteevent.com/health

# Check version
curl https://api.liteevent.com/api/version
```

---

## 🖥️ Web Deployment (Vercel)

### Prerequisites
```bash
cd C:\projects\event-plateform\web
```

### Deploy to Production

**Option 1: Push to GitHub (Auto-Deploy)**
```bash
git add .
git commit -m "Release v1.1.0 - Responsive fixes & donation stats"
git push origin main
```

**Option 2: Vercel CLI**
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy to production
vercel --prod
```

### Verify Deployment
- Visit: https://liteevent.com
- Check: Dashboard stats show correct module-based data
- Test: Reminder modal shows 5-reminder limit for Pro users

---

## ✅ Post-Deployment Checklist

### API
- [ ] Health check passes (`/health` endpoint)
- [ ] Database migrations applied
- [ ] Environment variables updated
- [ ] Pro plan shows `guestEmailReminders: 5` in limits

### Web
- [ ] Build succeeds without errors
- [ ] All pages load correctly
- [ ] Stats cards responsive on mobile
- [ ] Reminder modal enforces 5-limit
- [ ] Pricing page shows "5 email reminders" for Pro

### Mobile (Android)
- [ ] Build succeeds (check EAS dashboard)
- [ ] Submit to Google Play Internal Testing
- [ ] APK signed correctly
- [ ] Test on physical device
- [ ] Offline banner works
- [ ] Donation stats show on home page
- [ ] Reminder limit enforced (5 max)

### Mobile (iOS)
- [ ] Build succeeds (check EAS dashboard)
- [ ] Submit to TestFlight
- [ ] IPA signed correctly
- [ ] Test on physical device
- [ ] Offline banner works
- [ ] Donation stats show on home page
- [ ] Reminder limit enforced (5 max)

---

## 🧪 Testing Commands

### Test Reminder Limit (API)
```bash
# Pro user trying to add 6th reminder
curl -X POST https://api.liteevent.com/api/events/{eventId}/reminders \
  -H "Authorization: Bearer {pro-user-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reminders": [
      {"timing": "instant", "message": "...", "enabled": true},
      {"timing": "1_hour", "message": "...", "enabled": true},
      {"timing": "2_hours", "message": "...", "enabled": true},
      {"timing": "6_hours", "message": "...", "enabled": true},
      {"timing": "12_hours", "message": "...", "enabled": true},
      {"timing": "24_hours", "message": "...", "enabled": true}
    ]
  }'

# Expected: 403 error with message about 5-reminder limit
```

---

## 📊 Rollback Plan

### If Issues Occur:

**Mobile Apps:**
```bash
# Previous version will remain available
# Users on v1.0.0 can continue using app
# New builds won't auto-update until approved
```

**API:**
```bash
# Railway: Rollback to previous deployment
railway rollback

# Or revert Git commit
git revert HEAD
git push origin main
```

**Web:**
```bash
# Vercel: Rollback via dashboard
vercel rollback

# Or revert Git commit
git revert HEAD
git push origin main
```

---

## 🎯 Expected Timeline

| Platform | Build Time | Review Time | Total |
|----------|-----------|-------------|-------|
| **API** | Instant | N/A | ~5 min |
| **Web** | 2-5 min | N/A | ~5 min |
| **Android** | 15-20 min | 1-3 days | ~1-3 days |
| **iOS** | 20-30 min | 1-2 days | ~1-2 days |

---

## 📝 Release Notes Template

### For App Stores:

**What's New in v1.1.0:**

✨ **New Features**
- Added donation tracking statistics
- Enhanced offline mode detection
- Improved responsive design for all screen sizes

🔧 **Improvements**
- Pro plan now includes up to 5 email reminders
- Better module-based statistics filtering
- Faster page load times

🐛 **Bug Fixes**
- Fixed stats card overflow on small screens
- Fixed donation stats not appearing
- Improved error handling

---

## 🆘 Support

If deployment issues occur:
- Check Railway logs: https://railway.app/project/{project-id}
- Check Vercel logs: https://vercel.com/{project}/deployments
- Check EAS builds: https://expo.dev/accounts/okapiapp/projects/event-app/builds

**Contact:** joelswaku@gmail.com

---

**Deployment Started:** {date}
**Deployed By:** Joel Makila
**Version:** 1.1.0
