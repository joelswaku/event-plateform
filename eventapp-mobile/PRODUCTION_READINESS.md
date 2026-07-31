# LiteEvent Mobile - Production Readiness Checklist

**Generated**: 2026-07-31  
**App Version**: 1.0.0  
**Status**: ⚠️ **NEEDS ATTENTION** - See critical items below

---

## ✅ READY

### 1. App Configuration
- ✅ App name set to "LiteEvent"
- ✅ Bundle IDs configured:
  - iOS: `com.liteevent.mobile`
  - Android: `com.liteevent.mobile`
- ✅ App scheme: `liteevent://`
- ✅ Dark mode UI configured
- ✅ Orientation locked to portrait
- ✅ EAS project ID configured

### 2. Permissions & Privacy
- ✅ Camera permission (for QR scanning) with proper description
- ✅ Contacts permission (for guest management) with proper description
- ✅ Privacy descriptions configured for iOS

### 3. Core Features
- ✅ Event management (create, edit, delete)
- ✅ QR code scanning for check-in
- ✅ Offline check-in support
- ✅ Guest management
- ✅ Ticket sales
- ✅ Event planner (Pro feature)
- ✅ Live chat support
- ✅ Enhanced FAQ system (27 questions, 6 categories)

### 4. Authentication
- ✅ Email/password login
- ✅ Google Sign-In configured
- ✅ OAuth redirect URLs configured
- ✅ Secure token storage (expo-secure-store)

### 5. Build Configuration
- ✅ EAS build profiles:
  - Development
  - Preview
  - Production
- ✅ Auto-increment version enabled for production
- ✅ Production API URL: `https://api.liteevent.com/api`

---

## ⚠️ NEEDS ATTENTION

### 1. Environment Variables
**Priority**: 🔴 **CRITICAL**

- ⚠️ Create `.env.production` file with real credentials
- ⚠️ Set production Google OAuth client IDs (Web, iOS, Android)
- ⚠️ Set production Stripe publishable key (`pk_live_...`)
- ⚠️ Set production Stripe price IDs
- ⚠️ Configure Google Maps API key (if using venue search)

**Action**: Copy `.env.production.example` to `.env.production` and fill in real values

### 2. App Icons & Branding
**Priority**: 🟡 **HIGH**

Current icons are placeholder images:
- ⚠️ `assets/icon.png` (5.3KB) - Needs high-res production icon (1024x1024)
- ⚠️ `assets/adaptive-icon.png` (5.3KB) - Android adaptive icon
- ⚠️ `assets/splash.png` (1.9KB) - Splash screen

**Required**:
- iOS App Icon: 1024x1024px PNG (no transparency)
- Android Adaptive Icon: 1024x1024px PNG foreground + background color
- Splash Screen: 2732x2732px PNG (supports all screen sizes)

**Action**: Replace placeholder assets with branded LiteEvent icons

### 3. Security
**Priority**: 🔴 **CRITICAL**

- ✅ HTTPS enforced for production (`usesCleartextTraffic: false`)
- ⚠️ Remove any hardcoded API keys or secrets
- ⚠️ Verify all API calls use HTTPS (https://api.liteevent.com)
- ⚠️ Enable certificate pinning (optional but recommended)

**Action**: Audit codebase for hardcoded credentials

### 4. Error Tracking & Analytics
**Priority**: 🟡 **HIGH**

- ❌ No error tracking configured (Sentry recommended)
- ❌ No analytics configured (Firebase Analytics or Amplitude recommended)
- ❌ No crash reporting

**Action**: 
```bash
# Add Sentry for error tracking
npx expo install sentry-expo

# Add Firebase for analytics
npx expo install @react-native-firebase/app @react-native-firebase/analytics
```

### 5. Push Notifications
**Priority**: 🟡 **HIGH**

- ✅ `expo-notifications` plugin installed
- ⚠️ Push notification credentials not configured
- ⚠️ No push notification service integrated

**Action**: Configure push notifications via EAS or OneSignal

### 6. App Store Requirements

#### iOS App Store
**Priority**: 🔴 **CRITICAL**

- ⚠️ Privacy Policy URL not configured
- ⚠️ Terms of Service URL not configured
- ⚠️ App Store screenshots (6.5" and 5.5" required)
- ⚠️ App Store description and keywords
- ⚠️ App Store preview video (optional but recommended)

**Required URLs**:
- Privacy Policy: https://liteevent.com/privacy-policy
- Terms of Service: https://liteevent.com/terms

#### Google Play Store
**Priority**: 🔴 **CRITICAL**

- ⚠️ Feature graphic (1024x500px)
- ⚠️ Screenshots (phone and tablet)
- ⚠️ Store listing description
- ⚠️ Privacy policy URL
- ⚠️ Content rating questionnaire

### 7. Deep Linking
**Priority**: 🟡 **HIGH**

- ✅ App scheme configured (`liteevent://`)
- ⚠️ Universal links not configured (iOS)
- ⚠️ App links not configured (Android)

**Action**: Set up Apple App Site Association (AASA) file at:
```
https://liteevent.com/.well-known/apple-app-site-association
```

### 8. Performance
**Priority**: 🟢 **MEDIUM**

- ⚠️ No performance monitoring configured
- ⚠️ Image optimization not verified
- ⚠️ Bundle size not analyzed

**Action**:
```bash
# Analyze bundle size
npx expo-doctor

# Check for large dependencies
npm run analyze
```

### 9. Testing
**Priority**: 🔴 **CRITICAL**

- ⚠️ No unit tests found
- ⚠️ No integration tests
- ⚠️ No E2E tests
- ⚠️ Manual testing checklist needed

**Critical User Flows to Test**:
1. ✅ Sign up / Login
2. ✅ Create event
3. ✅ Sell tickets
4. ✅ QR code scanning
5. ✅ Offline check-in
6. ⚠️ Payment processing (Stripe)
7. ⚠️ Google Sign-In flow
8. ⚠️ Push notifications
9. ✅ Support chat

### 10. Code Quality
**Priority**: 🟢 **MEDIUM**

- ⚠️ 13 TODO/FIXME comments found in code
- ✅ TypeScript configured
- ✅ Minimal `@ts-ignore` usage

**Files with TODOs**:
- `app/planner/[projectId].tsx` (11 occurrences)
- `components/builder/config/fields/VenueConfigFields.tsx` (1 occurrence)

**Action**: Review and resolve TODOs before production release

---

## 📋 PRE-LAUNCH CHECKLIST

### Critical (Must Complete)

- [ ] **Create `.env.production`** with real credentials
- [ ] **Replace app icons** (icon.png, adaptive-icon.png, splash.png)
- [ ] **Configure Google OAuth** (3 client IDs: Web, iOS, Android)
- [ ] **Set up Stripe production keys** and price IDs
- [ ] **Add Privacy Policy & Terms URLs** to app stores
- [ ] **Test all payment flows** with real Stripe transactions
- [ ] **Set up error tracking** (Sentry recommended)
- [ ] **Configure push notifications**
- [ ] **Create App Store screenshots** (iOS: 6.5", 5.5"; Android: phone, tablet)
- [ ] **Write store descriptions** and keywords
- [ ] **Test on physical devices** (iOS and Android)
- [ ] **Verify deep linking** works correctly
- [ ] **Test Google Sign-In** on real devices
- [ ] **Test offline mode** thoroughly
- [ ] **Verify HTTPS** for all API calls

### High Priority (Recommended)

- [ ] Set up Firebase Analytics
- [ ] Configure universal links (iOS AASA file)
- [ ] Set up app links (Android)
- [ ] Add feature graphic for Google Play (1024x500)
- [ ] Create app preview video
- [ ] Optimize images and reduce bundle size
- [ ] Resolve all TODO comments
- [ ] Set up beta testing (TestFlight & Google Play Beta)
- [ ] Create support documentation
- [ ] Set up crash reporting

### Medium Priority (Nice to Have)

- [ ] Add unit tests for critical flows
- [ ] Set up performance monitoring
- [ ] Add certificate pinning
- [ ] Configure app rating prompt
- [ ] Set up feature flags
- [ ] Add onboarding tutorial
- [ ] Implement app update prompts

---

## 🚀 BUILD & SUBMIT COMMANDS

### Build for Production

```bash
# Build for both platforms
eas build --profile production --platform all

# Build for iOS only
eas build --profile production --platform ios

# Build for Android only
eas build --profile production --platform android
```

### Submit to Stores

```bash
# Submit to both stores
eas submit --platform all

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

### Testing Builds

```bash
# Preview build (internal distribution)
eas build --profile preview --platform all

# Development build
eas build --profile development --platform all
```

---

## ⚠️ BLOCKERS

These items **MUST** be resolved before production release:

1. **Environment Variables**: Missing production credentials
2. **App Icons**: Using placeholder icons (unprofessional)
3. **Store Listings**: No screenshots, descriptions, or metadata
4. **Payment Testing**: Stripe production flow not verified
5. **Google OAuth**: Production client IDs not configured
6. **Error Tracking**: No way to monitor production crashes

---

## 📊 PRODUCTION READINESS SCORE

**Overall**: 6/10 ⚠️

- Configuration: 8/10 ✅
- Security: 7/10 ⚠️
- Features: 9/10 ✅
- App Store Assets: 2/10 🔴
- Testing: 4/10 🔴
- Monitoring: 2/10 🔴

**Estimated Time to Production**: 2-3 weeks

---

## 📞 SUPPORT

For questions about production deployment:
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Console: https://play.google.com/console/
