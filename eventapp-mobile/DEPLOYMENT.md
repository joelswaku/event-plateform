# LiteEvent Mobile - Deployment Guide

Complete guide for deploying the LiteEvent mobile app to iOS App Store and Google Play Store.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Development Workflow](#development-workflow)
4. [Build Profiles](#build-profiles)
5. [Production Deployment](#production-deployment)
6. [Over-the-Air Updates](#over-the-air-updates)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [x] **Expo Account** - Sign up at [expo.dev](https://expo.dev)
- [ ] **Apple Developer Program** ($99/year) - [developer.apple.com](https://developer.apple.com)
- [ ] **Google Play Developer** ($25 one-time) - [play.google.com/console](https://play.google.com/console)

### Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Project Setup
```bash
cd eventapp-mobile
eas init --id d03571a3-0dee-483c-9a4f-0706b2d9e07d
```

---

## Environment Setup

### Environment Files
- **`.env.development`** - Local development (localhost API)
- **`.env.staging`** - Preview builds (staging API)
- **`.env.production`** - Production builds (live API)

### Create Production Environment
1. Copy the example file:
   ```bash
   cp .env.production.example .env.production
   ```

2. Fill in production values:
   ```env
   EXPO_PUBLIC_API_URL=https://api.liteevent.com/api
   EXPO_PUBLIC_WEB_URL=https://liteevent.com
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

⚠️ **NEVER commit `.env.production` to git!**

---

## Development Workflow

### Local Development
```bash
# Start Expo dev server
npm start

# Start on specific platform
npm run android
npm run ios
npm run web

# Start with tunnel (for testing on any device)
npm run start:tunnel
```

### Development Builds (with dev client)
```bash
# Build dev client for testing
npm run build:dev           # Both platforms
npm run build:dev:ios       # iOS only
npm run build:dev:android   # Android only

# Install and run
# iOS: Download IPA from EAS dashboard, install via Xcode
# Android: Download APK from EAS dashboard, install on device
npm run start:dev
```

---

## Build Profiles

### Development Profile
- **Purpose**: Local testing with hot reload
- **Distribution**: Internal (install on specific devices)
- **API**: `http://localhost:5000/api`
- **Build Type**: APK (Android), Simulator (iOS)

### Preview Profile
- **Purpose**: QA testing, stakeholder demos
- **Distribution**: Internal (TestFlight, Internal Testing)
- **API**: `https://api-staging.liteevent.com/api`
- **Build Type**: APK (Android), IPA (iOS)
- **Channel**: `preview` (for OTA updates)

### Production Profile
- **Purpose**: App Store releases
- **Distribution**: App Store / Google Play
- **API**: `https://api.liteevent.com/api`
- **Build Type**: AAB (Android), IPA (iOS)
- **Channel**: `production` (for OTA updates)
- **Auto-increment**: Version numbers increment automatically

---

## Production Deployment

### 🍎 iOS Deployment

#### 1. Create App in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. **Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: LiteEvent
   - **Primary Language**: English
   - **Bundle ID**: `com.liteevent.mobile`
   - **SKU**: `liteevent-mobile`

#### 2. Configure Credentials
```bash
# EAS will guide you through creating certificates
eas credentials
```

#### 3. Build for Production
```bash
npm run build:prod:ios
```

#### 4. Submit to App Store
```bash
# Option 1: Automatic submission
npm run submit:ios

# Option 2: Manual submission
# 1. Download IPA from EAS dashboard
# 2. Upload via Xcode or Transporter app
# 3. Go to App Store Connect → TestFlight → submit for review
```

#### 5. Update App Store Listing
- **Screenshots** (required sizes)
- **App Description**
- **Keywords**
- **Privacy Policy** URL
- **Support URL**

---

### 🤖 Android Deployment

#### 1. Create App in Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. **All apps** → **Create app**
3. Fill in:
   - **App name**: LiteEvent
   - **Default language**: English
   - **App or game**: App
   - **Free or paid**: Free

#### 2. Generate Upload Keystore
```bash
# EAS will create and manage this automatically
eas credentials
```

#### 3. Create Service Account (for automatic submission)
1. Google Cloud Console → **IAM & Admin** → **Service Accounts**
2. Create service account with **Editor** role
3. Create JSON key
4. Save as `google-play-service-account.json`
5. Update `eas.json` with path

#### 4. Build for Production
```bash
npm run build:prod:android
```

#### 5. Submit to Google Play
```bash
# Option 1: Automatic submission (requires service account)
npm run submit:android

# Option 2: Manual submission
# 1. Download AAB from EAS dashboard
# 2. Upload to Google Play Console → Production → Create release
```

#### 6. Complete Store Listing
- **App icon** (512x512 PNG)
- **Feature graphic** (1024x500 PNG)
- **Screenshots** (phone, tablet)
- **Short description** (80 chars)
- **Full description** (4000 chars)
- **Privacy policy** URL

---

## Over-the-Air Updates

Use EAS Update to push bug fixes and minor updates without resubmitting to stores.

### Publish Update

#### Preview Channel
```bash
npm run update:preview
# or
eas update --branch preview --message "Fix: Resolved login issue"
```

#### Production Channel
```bash
npm run update:prod
# or
eas update --branch production --message "Fix: Improved event loading"
```

### What Can Be Updated OTA?
✅ **JavaScript code changes**
✅ **Assets** (images, fonts)
✅ **Bug fixes**
✅ **UI tweaks**

❌ **Native code changes** (requires new build)
❌ **New permissions**
❌ **Changed app.json config**

### Rollback
```bash
# Rollback to previous update
eas update:delete --branch production
```

---

## CI/CD Setup (Optional)

### GitHub Actions Example

```yaml
name: EAS Build
on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx eas-cli build --platform all --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## App Store Guidelines

### iOS App Store
- **Review time**: 1-3 days
- **Minimum iOS version**: 13.0+
- **App Privacy**: Fill in data usage form
- **TestFlight**: Beta testing (up to 10,000 users)

### Google Play Store
- **Review time**: Hours to 7 days
- **Minimum Android version**: Android 5.0 (API 21)
- **Internal Testing**: Beta testing
- **Staged rollout**: Release to % of users

---

## Version Management

### Semantic Versioning
```
MAJOR.MINOR.PATCH
1.0.0 → Initial release
1.1.0 → New features
1.1.1 → Bug fixes
```

### Update Version
Edit [app.config.ts](app.config.ts:90):
```typescript
version: "1.1.0"
```

EAS auto-increments build numbers in production profile.

---

## Troubleshooting

### Build Fails

#### "Missing credentials"
```bash
eas credentials
# Follow prompts to create/upload credentials
```

#### "Invalid bundle identifier"
Ensure `app.config.ts` matches App Store Connect:
- iOS: `com.liteevent.mobile`
- Android: `com.liteevent.mobile`

### Google Sign-In Not Working

#### iOS
1. Verify `CFBundleURLSchemes` in [app.config.ts](app.config.ts:114-120)
2. Add iOS client ID to Google Cloud Console
3. Ensure reverse client ID matches

#### Android
1. Add SHA-1 fingerprint to Firebase Console
2. Download updated `google-services.json`
3. Rebuild app

### Get SHA-1 Fingerprint
```bash
# Development
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android

# Production
eas credentials
# Select Android → Production → Keystore → View
```

---

## Production Checklist

### Before Building
- [ ] Updated version in `app.config.ts`
- [ ] Created `.env.production` with production values
- [ ] Tested app thoroughly in preview mode
- [ ] All Google OAuth clients created (Web, iOS, Android)
- [ ] Using production Stripe keys (`pk_live_...`)
- [ ] Updated API_URL to production API
- [ ] Prepared app store assets (icons, screenshots, descriptions)

### iOS Specific
- [ ] Apple Developer account active
- [ ] App created in App Store Connect
- [ ] Privacy policy uploaded
- [ ] App Store listing complete
- [ ] TestFlight beta tested (recommended)

### Android Specific
- [ ] Google Play Developer account active
- [ ] App created in Google Play Console
- [ ] Privacy policy uploaded
- [ ] Store listing complete
- [ ] Internal testing completed (recommended)

### Post-Launch
- [ ] Monitor crash reports (Sentry/Firebase Crashlytics)
- [ ] Track analytics
- [ ] Respond to user reviews
- [ ] Plan OTA updates for bug fixes

---

## Quick Reference

### Common Commands

```bash
# Development
npm start                      # Start dev server
npm run start:tunnel          # Test on any device

# Preview Builds
npm run build:preview         # Build preview (both)
npm run update:preview        # Push OTA update to preview

# Production Builds
npm run build:prod            # Build production (both)
npm run build:prod:ios        # Build iOS only
npm run build:prod:android    # Build Android only

# Submission
npm run submit:ios            # Submit to App Store
npm run submit:android        # Submit to Google Play
npm run submit:all            # Submit to both

# OTA Updates
npm run update:prod           # Push update to production

# Utilities
eas build:list                # View build history
eas update:list               # View update history
eas credentials               # Manage certificates/keys
```

---

## Resources

- **EAS Documentation**: [docs.expo.dev/eas](https://docs.expo.dev/eas)
- **App Store Connect**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- **Google Play Console**: [play.google.com/console](https://play.google.com/console)
- **EAS Build Status**: [expo.dev/builds](https://expo.dev/accounts/YOUR_ACCOUNT/projects/liteevent/builds)

---

## Support

For issues specific to this deployment:
- **Email**: joelswaku@gmail.com
- **Project**: LiteEvent Event Management Platform
- **EAS Project ID**: `d03571a3-0dee-483c-9a4f-0706b2d9e07d`
