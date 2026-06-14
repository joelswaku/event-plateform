# 📱 LiteEvent Mobile App Deployment Guide

**Complete guide to deploy LiteEvent mobile app to iOS App Store and Google Play Store.**

---

## 📋 Overview

### What You're Deploying

```
LiteEvent Mobile App (Expo/React Native)
├── iOS App → App Store
├── Android App → Google Play Store
├── Deep linking → liteevent://
├── Push notifications → Expo Push
└── API integration → https://api.liteevent.com
```

### Prerequisites

- [ ] Expo account created
- [ ] Apple Developer account ($99/year)
- [ ] Google Play Developer account ($25 one-time)
- [ ] Production API deployed and working
- [ ] App icons and splash screens ready

---

## ⚡ Quick Start (4 hours)

### Step 1: Install Expo CLI (5 min)

```bash
# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Login to Expo
expo login
eas login

# Verify installation
eas --version
```

### Step 2: Configure app.json (15 min)

**Edit `eventapp-mobile/app.json`:**

```json
{
  "expo": {
    "name": "LiteEvent",
    "slug": "liteevent",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.liteevent.app",
      "buildNumber": "1",
      "config": {
        "googleSignIn": {
          "reservedClientId": "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com"
        }
      },
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["liteevent"]
          }
        ],
        "NSCameraUsageDescription": "LiteEvent needs camera access to scan QR codes for event check-in.",
        "NSPhotoLibraryUsageDescription": "LiteEvent needs photo library access to upload event images."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.liteevent.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      "googleServicesFile": "./google-services.json",
      "config": {
        "googleSignIn": {
          "apiKey": "YOUR_ANDROID_API_KEY",
          "certificateHash": "YOUR_SHA1_HASH"
        }
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "scheme": "liteevent",
    "extra": {
      "apiUrl": "https://api.liteevent.com",
      "stripePublishableKey": "pk_live_...",
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

### Step 3: Configure EAS Build (10 min)

**Create `eventapp-mobile/eas.json`:**

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "env": {
        "API_URL": "https://api.liteevent.com",
        "STRIPE_PUBLISHABLE_KEY": "pk_live_..."
      },
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production-aab": {
      "extends": "production",
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### Step 4: Create App Assets (30 min)

**Required assets:**

1. **App Icon** (`assets/icon.png`): 1024×1024px
2. **Splash Screen** (`assets/splash.png`): 1284×2778px
3. **Adaptive Icon** (Android) (`assets/adaptive-icon.png`): 1024×1024px
4. **Notification Icon** (`assets/notification-icon.png`): 96×96px

**Generate with Figma/Canva or use:**
```bash
# Install icon generator
npm install -g @expo/app-icon-generator

# Generate all sizes from source
npx @expo/app-icon-generator generate ./assets/icon-source.png
```

### Step 5: Configure Environment Variables (10 min)

**Create `eventapp-mobile/.env.production`:**

```bash
# API Configuration
API_URL=https://api.liteevent.com

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE

# Google OAuth
GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com

# Expo
EXPO_PROJECT_ID=YOUR_EAS_PROJECT_ID

# Deep Linking
DEEP_LINK_SCHEME=liteevent
```

**Update your app code to use these:**

```javascript
// config/environment.js
import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig.extra.apiUrl || 'http://localhost:5000';
export const STRIPE_KEY = Constants.expoConfig.extra.stripePublishableKey;
export const DEEP_LINK_SCHEME = Constants.expoConfig.scheme || 'liteevent';
```

---

## 🍎 iOS Deployment

### Step 1: Apple Developer Setup (20 min)

1. **Go to https://developer.apple.com**
2. **Enroll in Apple Developer Program** ($99/year)
3. **Create App ID:**
   - Identifier: `com.liteevent.app`
   - Name: LiteEvent
   - Enable capabilities: Push Notifications, Sign in with Apple, Associated Domains

4. **Create App in App Store Connect:**
   - Go to https://appstoreconnect.apple.com
   - Click **"+"** → **"New App"**
   - Platform: iOS
   - Name: LiteEvent
   - Primary Language: English (U.S.)
   - Bundle ID: com.liteevent.app
   - SKU: liteevent-ios-001

### Step 2: Build iOS App (30 min)

```bash
cd eventapp-mobile

# Configure iOS bundle identifier
eas build:configure

# Build for iOS (production)
eas build --platform ios --profile production

# This will:
# 1. Upload your code to Expo servers
# 2. Build the IPA file
# 3. Sign it with your Apple Developer credentials
# 4. Provide download link

# Monitor build progress
# https://expo.dev/accounts/YOUR_ACCOUNT/projects/liteevent/builds
```

**First time setup:**
```bash
# Expo will ask:
# - Apple ID
# - Password
# - Team ID
# 
# It will automatically:
# - Create provisioning profiles
# - Create distribution certificates
# - Configure signing
```

### Step 3: Submit to App Store (20 min)

**Option A: Automatic (Recommended)**

```bash
# Submit directly from CLI
eas submit --platform ios --latest

# Expo will:
# 1. Download the latest build
# 2. Upload to App Store Connect
# 3. Submit for TestFlight
```

**Option B: Manual**

1. Download IPA from Expo build page
2. Upload with Transporter app
3. Go to App Store Connect
4. Fill in app details

### Step 4: App Store Listing (45 min)

**In App Store Connect, fill in:**

**App Information:**
- Name: LiteEvent
- Subtitle: Event Management Made Easy
- Category: Business / Productivity

**Screenshots** (required sizes):
- 6.5" iPhone: 1284×2778px (3 screenshots minimum)
- 5.5" iPhone: 1242×2208px
- 12.9" iPad Pro: 2048×2732px (if supporting iPad)

**Description:**
```
LiteEvent - Your Complete Event Management Solution

Organize, manage, and monetize your events with ease. LiteEvent provides everything you need to create successful events:

✓ Create and publish events instantly
✓ Sell tickets with secure payment processing
✓ QR code check-in for seamless entry
✓ Real-time attendee tracking
✓ Vendor portal for multi-vendor events
✓ Guest management and communication
✓ Analytics and reporting

Perfect for:
• Conference organizers
• Event planners
• Venue managers
• Festival coordinators
• Meetup hosts

Download LiteEvent today and start creating amazing events!
```

**Keywords:**
```
event management, tickets, event planning, QR check-in, event ticketing, organizer, events, registration, attendees
```

**Privacy Policy URL:**
```
https://liteevent.com/privacy
```

**Support URL:**
```
https://liteevent.com/support
```

### Step 5: Submit for Review (5 min)

1. Add build to version
2. Click **"Submit for Review"**
3. Answer export compliance questions
4. Typically approved in 24-48 hours

---

## 🤖 Android Deployment

### Step 1: Google Play Console Setup (15 min)

1. **Go to https://play.google.com/console**
2. **Pay $25 one-time fee** (if first time)
3. **Create Application:**
   - App name: LiteEvent
   - Default language: English (United States)
   - App or Game: App
   - Free or Paid: Free

### Step 2: Configure Google Sign-In (20 min)

1. **Go to Firebase Console** (https://console.firebase.google.com)
2. **Create project:** LiteEvent
3. **Add Android app:**
   - Package name: `com.liteevent.app`
   - Download `google-services.json`
   - Save to `eventapp-mobile/google-services.json`

4. **Enable Google Sign-In:**
   - Authentication → Sign-in method
   - Enable Google
   - Add SHA-1 certificate fingerprint

**Get SHA-1:**
```bash
# Generate keystore
keytool -genkeypair -v -keystore liteevent.jks -keyalg RSA -keysize 2048 -validity 10000 -alias liteevent

# Get SHA-1
keytool -list -v -keystore liteevent.jks -alias liteevent
```

### Step 3: Build Android App (30 min)

```bash
cd eventapp-mobile

# Build AAB (App Bundle - required for Play Store)
eas build --platform android --profile production-aab

# This creates an AAB file signed with your credentials

# Monitor build
# https://expo.dev/accounts/YOUR_ACCOUNT/projects/liteevent/builds
```

**First time:**
```bash
# Expo will ask if you want to generate a new keystore
# Choose: Yes
# Store the keystore credentials safely - you'll need them for updates!
```

### Step 4: Submit to Google Play (15 min)

**Option A: Automatic**

```bash
# Submit from CLI
eas submit --platform android --latest

# Requires: google-play-service-account.json
# See: https://docs.expo.dev/submit/android/
```

**Option B: Manual**

1. Download AAB from Expo
2. Go to Play Console → Production → Create new release
3. Upload AAB file
4. Click **"Review release"**

### Step 5: Play Store Listing (45 min)

**App details:**
- App name: LiteEvent
- Short description (80 chars):
  ```
  Create, manage, and monetize events. Tickets, check-in, analytics & more.
  ```

**Full description (4000 chars):**
```
LiteEvent - Complete Event Management Platform

Organize professional events with our all-in-one event management solution. From ticket sales to check-in, we've got you covered.

KEY FEATURES

📅 Event Creation
• Create unlimited events
• Customize event pages
• Set ticket prices and limits
• Add event images and descriptions

🎫 Ticket Management
• Secure payment processing with Stripe
• Multiple ticket types
• Early bird pricing
• Promo codes and discounts

✅ QR Code Check-In
• Fast and reliable QR scanning
• Offline check-in support
• Real-time attendee tracking
• Guest list management

👥 Attendee Management
• Guest communication
• Attendance tracking
• Check-in history
• Export attendee lists

📊 Analytics & Insights
• Real-time sales tracking
• Revenue reporting
• Attendee demographics
• Event performance metrics

🏢 Vendor Portal
• Multi-vendor event support
• Vendor-specific analytics
• Individual ticket types
• Revenue split tracking

PERFECT FOR
• Event planners
• Conference organizers
• Venue managers
• Festival coordinators
• Corporate event teams
• Community organizers

WHY LITEEVENT?
✓ User-friendly interface
✓ Secure payment processing
✓ Real-time synchronization
✓ Offline capability
✓ Reliable QR scanning
✓ Professional support

PRICING
Free to download. We charge a small fee per ticket sold.

Download LiteEvent today and create your first event in minutes!

Support: support@liteevent.com
Website: https://liteevent.com
```

**Screenshots:**
- Phone: 1080×1920px (minimum 2, maximum 8)
- 7" Tablet: 1024×1600px
- 10" Tablet: 1280×1920px

**Graphic Assets:**
- Feature Graphic: 1024×500px (required)
- Icon: 512×512px (required)
- Promo Graphic: 180×120px (optional)

**Content Rating:**
1. Start questionnaire
2. Category: Utility, Productivity, or Other
3. Answer questions honestly
4. Get rating (likely Everyone)

**Privacy Policy:**
```
https://liteevent.com/privacy
```

### Step 6: Internal Testing → Production (30 min)

1. **Create Internal Testing Release:**
   - Upload AAB
   - Add testers (your email)
   - Test the app

2. **Move to Production:**
   - Testing → Production
   - Click **"Promote to Production"**
   - Submit for review

3. **Review Process:**
   - Usually approved in 24-72 hours
   - May request clarifications

---

## 🔗 Deep Linking Configuration

### Universal Links (iOS)

**Create `eventapp-mobile/.well-known/apple-app-site-association`:**

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.liteevent.app",
        "paths": [
          "/events/*",
          "/tickets/*",
          "/check-in/*"
        ]
      }
    ]
  }
}
```

**Host at:**
```
https://liteevent.com/.well-known/apple-app-site-association
```

### App Links (Android)

**Create `eventapp-mobile/.well-known/assetlinks.json`:**

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.liteevent.app",
    "sha256_cert_fingerprints": [
      "YOUR_SHA256_FINGERPRINT"
    ]
  }
}]
```

**Host at:**
```
https://liteevent.com/.well-known/assetlinks.json
```

### App Code Configuration

```javascript
// app.json - already configured above
"scheme": "liteevent",
"ios": {
  "associatedDomains": ["applinks:liteevent.com"]
},
"android": {
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": true,
      "data": [
        {
          "scheme": "https",
          "host": "liteevent.com",
          "pathPrefix": "/events"
        }
      ],
      "category": [
        "BROWSABLE",
        "DEFAULT"
      ]
    }
  ]
}
```

---

## 🔔 Push Notifications Setup

### Step 1: Configure Expo Push

**Already configured in app.json:**
```json
"plugins": [
  [
    "expo-notifications",
    {
      "icon": "./assets/notification-icon.png",
      "color": "#ffffff"
    }
  ]
]
```

### Step 2: Get Push Token in App

```javascript
// utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;
  }

  return token;
}
```

### Step 3: Send from Backend

```javascript
// API: Send push notification
const fetch = require('node-fetch');

async function sendPushNotification(expoPushToken, title, body) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
```

---

## 🚀 Build & Deploy Script

**Create `eventapp-mobile/deploy.sh`:**

```bash
#!/bin/bash

echo "🚀 LiteEvent Mobile Deployment"
echo "=============================="

# Check if production
read -p "Deploy to production? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Cancelled."
  exit 0
fi

echo ""
echo "📱 Building iOS..."
eas build --platform ios --profile production --non-interactive

echo ""
echo "🤖 Building Android..."
eas build --platform android --profile production-aab --non-interactive

echo ""
echo "⏳ Waiting for builds to complete..."
echo "Monitor at: https://expo.dev"
echo ""

read -p "Submit to stores when builds complete? (yes/no): " submit
if [ "$submit" == "yes" ]; then
  echo "📤 Submitting iOS..."
  eas submit --platform ios --latest
  
  echo "📤 Submitting Android..."
  eas submit --platform android --latest
fi

echo ""
echo "✅ Deployment initiated!"
echo "Check status: https://expo.dev"
```

**Make executable:**
```bash
chmod +x deploy.sh
```

---

## 📋 Pre-Launch Checklist

### App Configuration
- [ ] app.json configured with correct bundle IDs
- [ ] eas.json configured for production builds
- [ ] Environment variables set
- [ ] API URLs point to production
- [ ] Stripe publishable key (LIVE, not test)
- [ ] Google OAuth client IDs configured

### Assets
- [ ] App icon (1024×1024)
- [ ] Splash screen (1284×2778)
- [ ] Adaptive icon Android (1024×1024)
- [ ] Notification icon (96×96)

### iOS
- [ ] Apple Developer account active
- [ ] Bundle ID created (com.liteevent.app)
- [ ] App created in App Store Connect
- [ ] Screenshots prepared (3 sizes minimum)
- [ ] App description written
- [ ] Privacy policy URL ready
- [ ] Support URL ready

### Android
- [ ] Google Play Console account created
- [ ] App created in Play Console
- [ ] google-services.json added
- [ ] Keystore generated and backed up
- [ ] Screenshots prepared
- [ ] Feature graphic ready
- [ ] Content rating completed

### Testing
- [ ] Tested on iPhone
- [ ] Tested on Android
- [ ] Deep linking works
- [ ] Push notifications work
- [ ] Google Sign-In works
- [ ] Stripe payments work
- [ ] QR scanning works
- [ ] Offline mode works

### Backend
- [ ] Production API deployed
- [ ] Database migrations run
- [ ] CORS configured for mobile
- [ ] Rate limiting configured
- [ ] Error tracking enabled

---

## 🔄 Update Strategy

### Version Numbering

**Semantic Versioning:**
```
1.0.0 - Initial release
1.0.1 - Bug fixes
1.1.0 - New features
2.0.0 - Major changes
```

**Update app.json:**
```json
{
  "version": "1.0.1",
  "ios": {
    "buildNumber": "2"
  },
  "android": {
    "versionCode": 2
  }
}
```

### Publishing Updates

**For code changes:**
```bash
# Build new version
eas build --platform all --profile production

# Submit
eas submit --platform all --latest
```

**For OTA updates (Expo Updates):**
```bash
# Publish update without rebuild
eas update --branch production --message "Bug fixes"

# Users get update automatically
```

---

## 💰 Cost Summary

### One-Time Costs
```
Apple Developer: $99/year
Google Play: $25 one-time
App assets (Figma/designer): $0-500
```

### Monthly Costs
```
Expo EAS Build: $0 (free tier: 30 builds/month)
# OR
Expo EAS Pro: $29/month (unlimited builds)

Push notifications: $0 (Expo Push is free)
```

---

## 🆘 Troubleshooting

### Build Failed

```bash
# Check build logs
eas build:list

# View specific build
eas build:view BUILD_ID

# Common issues:
# - Missing credentials
# - Invalid bundle ID
# - Missing dependencies
```

### Google Sign-In Not Working

```bash
# Verify SHA-1 is correct
keytool -list -v -keystore ~/.eas/credentials/production.jks

# Update in Firebase Console
# Authentication → Sign-in method → Google → Add SHA-1
```

### Deep Links Not Working

```bash
# Test iOS universal links
npx uri-scheme open liteevent://events/123 --ios

# Test Android app links
npx uri-scheme open liteevent://events/123 --android

# Verify association files are accessible:
curl https://liteevent.com/.well-known/apple-app-site-association
curl https://liteevent.com/.well-known/assetlinks.json
```

---

## 📖 Additional Resources

- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo EAS Submit](https://docs.expo.dev/submit/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)

---

**Ready to launch your mobile app! 🚀**

Build, test, and submit to both stores today!
