# Google Sign In Setup Guide

This guide will help you set up Google Sign In for both iOS and Android in the Expo mobile app.

---

## 📋 Prerequisites

1. A Google Cloud Console account
2. Your app's Android package name: `com.liteevent.mobile`
3. Your app's iOS bundle ID: `com.liteevent.mobile`

---

## 🔧 Step 1: Google Cloud Console Setup

### 1.1 Create a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing: **"LiteEvent"**
3. Enable the **Google+ API** and **Google Sign-In API**

### 1.2 Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the app information:
   - **App name**: LiteEvent
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `profile`
   - `email`
5. Save and continue

---

## 🔑 Step 2: Create OAuth 2.0 Credentials

You need to create **3 separate credentials**:

### 2.1 Web Client ID (Required for both platforms)

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Application type: **Web application**
4. Name: `LiteEvent Web Client`
5. **Authorized redirect URIs**: Leave empty (not needed for mobile)
6. Click **Create**
7. **Copy the Client ID** → This is your `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

### 2.2 iOS Client ID

1. Click **Create Credentials** > **OAuth client ID**
2. Application type: **iOS**
3. Name: `LiteEvent iOS`
4. **Bundle ID**: `com.liteevent.mobile`
5. Click **Create**
6. **Copy the Client ID** → This is your `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
7. **Copy the iOS URL scheme** (looks like `com.googleusercontent.apps.XXXXXX`)

### 2.3 Android Client ID

1. Click **Create Credentials** > **OAuth client ID**
2. Application type: **Android**
3. Name: `LiteEvent Android`
4. **Package name**: `com.liteevent.mobile`
5. **SHA-1 certificate fingerprint**: See below how to get it

---

## 🔐 Step 3: Get Android SHA-1 Fingerprint

### For Development Build:

```bash
cd eventapp-mobile
eas credentials
```

Choose:
- Android
- Development
- View credentials
- Copy the SHA-1 fingerprint

### For Production Build:

```bash
cd eventapp-mobile
eas credentials
```

Choose:
- Android
- Production
- View credentials
- Copy the SHA-1 fingerprint

**Important**: Create **two Android OAuth clients** - one for development and one for production, each with its respective SHA-1 fingerprint.

---

## 📝 Step 4: Update Environment Variables

Edit `eventapp-mobile/.env`:

```env
# Google OAuth - Get from Google Cloud Console
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-xxxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-xxxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-xxxxxxxxx.apps.googleusercontent.com
```

---

## 🍎 Step 5: Update iOS Configuration

The iOS URL scheme is already configured in `app.config.ts` at line 128. 

**Update it** with your iOS URL scheme from step 2.2:

```typescript
CFBundleURLSchemes: [
  "com.googleusercontent.apps.YOUR-IOS-CLIENT-ID-NUMBER",
],
```

**Example**:
```typescript
CFBundleURLSchemes: [
  "com.googleusercontent.apps.728056596746-44c4q2vgaiojan8imrs50ikkjmg3e8d0",
],
```

---

## 🤖 Step 6: Android Configuration

Android configuration is **automatic** via `@react-native-google-signin/google-signin` package.

No additional native code changes needed! ✅

---

## 🚀 Step 7: Build and Test

### Development Build:

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### Install and test:

1. Install the development build on your device
2. Tap "Continue with Google"
3. Select your Google account
4. Should redirect back to app and log you in

---

## 🐛 Troubleshooting

### iOS Issues:

**Error: "Invalid client ID"**
- Make sure `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set correctly
- Verify iOS URL scheme matches your iOS client ID

**Error: "Redirect URI mismatch"**
- Update the iOS URL scheme in `app.config.ts`

### Android Issues:

**Error: "Sign in failed"**
- Make sure SHA-1 fingerprint is added to Android OAuth client
- Verify package name is `com.liteevent.mobile`
- Check `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set

**Error: "Play Services not available"**
- Test on a real device with Google Play Services
- Emulator needs Play Store image

### General Issues:

**Error: "Google Sign In not configured"**
- Check that `.env` file is loaded
- Restart Expo dev server after changing `.env`
- Rebuild the app with EAS

---

## 📚 Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [React Native Google Sign In Docs](https://github.com/react-native-google-signin/google-signin)
- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)

---

## ✅ Checklist

- [ ] Created Google Cloud project
- [ ] Configured OAuth consent screen
- [ ] Created Web Client ID
- [ ] Created iOS Client ID
- [ ] Created Android Client ID (dev + prod)
- [ ] Got SHA-1 fingerprints from EAS
- [ ] Updated `.env` with all client IDs
- [ ] Updated iOS URL scheme in `app.config.ts`
- [ ] Built development builds
- [ ] Tested on iOS device
- [ ] Tested on Android device

---

## 🎉 You're Done!

Users can now sign in with Google on both iOS and Android! 🚀
