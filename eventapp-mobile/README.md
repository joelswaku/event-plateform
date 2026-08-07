# LiteEvent Mobile App

Full-stack event management mobile application built with React Native, Expo, and TypeScript.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ and npm
- **Expo CLI**: `npm install -g expo-cli eas-cli`
- **iOS**: Xcode (macOS only)
- **Android**: Android Studio

### Installation
```bash
cd eventapp-mobile
npm install
```

### Development
```bash
# Start Expo dev server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

---

## 📱 Build Profiles

### Development
Local development with hot reload:
```bash
npm run start
# Scan QR code with Expo Go app
```

### Preview (Staging)
Test builds for internal QA:
```bash
npm run build:preview        # Both platforms
npm run build:preview:ios    # iOS only
npm run build:preview:android # Android only
```

### Production
Production builds for app stores:
```bash
npm run build:prod           # Both platforms
npm run build:prod:ios       # iOS only
npm run build:prod:android   # Android only
```

---

## 🌍 Environment Setup

### Environment Files
- **`.env.development`** → Local dev (localhost API)
- **`.env.staging`** → Preview builds (staging API)
- **`.env.production`** → Production builds (**create from example**)

### Create Production Environment
```bash
cp .env.production.example .env.production
# Edit .env.production with your production values
```

⚠️ **Never commit `.env.production` to git!**

---

## 📦 Scripts Reference

### Development
```bash
npm start                    # Start dev server
npm run start:dev            # Start with dev client
npm run start:tunnel         # Tunnel mode (test on any device)
npm run android              # Run on Android
npm run ios                  # Run on iOS
npm run web                  # Run web version
```

### Building
```bash
npm run prebuild             # Generate native folders
npm run build:dev            # Dev build (all platforms)
npm run build:preview        # Preview build (all platforms)
npm run build:prod           # Production build (all platforms)
```

### Deployment
```bash
npm run submit:ios           # Submit to App Store
npm run submit:android       # Submit to Google Play
npm run submit:all           # Submit to both stores
```

### OTA Updates
```bash
npm run update:preview       # Push update to preview
npm run update:prod          # Push update to production
```

### Quality
```bash
npm run lint                 # Run ESLint
npm run type-check           # TypeScript type checking
```

---

## 📂 Project Structure

```
eventapp-mobile/
├── app/                      # Expo Router pages
│   ├── (auth)/              # Auth flow (login, signup)
│   ├── (tabs)/              # Main app tabs
│   └── _layout.tsx          # Root layout
├── src/
│   ├── components/          # Reusable UI components
│   ├── services/            # API services
│   ├── stores/              # Zustand state management
│   ├── utils/               # Helper functions
│   └── types/               # TypeScript types
├── assets/                  # Images, fonts, etc.
├── scripts/                 # Build automation scripts
├── .env.development         # Dev environment vars
├── .env.staging            # Staging environment vars
├── .env.production.example # Production template
├── app.config.ts           # Expo configuration
├── eas.json                # EAS Build configuration
├── package.json            # Dependencies & scripts
├── DEPLOYMENT.md           # Full deployment guide
└── CHECKLIST.md            # Pre-deployment checklist
```

---

## 🔧 Configuration

### App Configuration
Edit [app.config.ts](app.config.ts) for:
- App name, version, bundle IDs
- Permissions
- Plugins
- Platform-specific settings

### Build Configuration
Edit [eas.json](eas.json) for:
- Build profiles (dev, preview, production)
- Environment variables per profile
- Platform-specific build settings

---

## 🎨 Tech Stack

- **Framework**: React Native 0.81 + Expo 54
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind for RN)
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Auth**: Google Sign-In, Email/Password
- **Payments**: Stripe (in-app subscriptions)
- **Storage**: AsyncStorage, SecureStore
- **Notifications**: Expo Notifications

---

## 📖 Documentation

### Comprehensive Guides
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide (App Store, Google Play, OTA updates)
- **[CHECKLIST.md](CHECKLIST.md)** - Pre-deployment checklist (100+ items)

### Key Topics
- [Environment setup](#environment-setup)
- [Build profiles](#build-profiles)
- [OTA updates](#ota-updates)
- [CI/CD setup](.github/workflows/)

---

## 🔐 Security

### Production Mode
- ✅ HTTPS only (no cleartext traffic)
- ✅ Environment variables via `.env` files
- ✅ Secrets stored in Expo Secure Store
- ✅ OAuth with Google Sign-In
- ✅ Stripe payment integration

### Development Mode
- ⚠️ Cleartext traffic allowed (for localhost API)
- ⚠️ Debug logs enabled

---

## 🚢 Deployment Workflow

### Step-by-step

1. **Update version** in [app.config.ts](app.config.ts:90)
   ```typescript
   version: "1.1.0"  // Increment this
   ```

2. **Create production environment**
   ```bash
   cp .env.production.example .env.production
   # Fill in production values
   ```

3. **Build for production**
   ```bash
   npm run build:prod
   # Or platform-specific:
   npm run build:prod:ios
   npm run build:prod:android
   ```

4. **Track build progress**
   Visit [expo.dev/builds](https://expo.dev/builds)

5. **Submit to stores**
   ```bash
   npm run submit:all
   # Or:
   npm run submit:ios
   npm run submit:android
   ```

6. **Push OTA updates** (for bug fixes)
   ```bash
   npm run update:prod
   ```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full details.

---

## 🧪 Testing

### Manual Testing
```bash
# Preview build for testing
npm run build:preview:ios

# Install on device from EAS dashboard
# Test all critical flows
```

### Platforms
- **iOS**: iPhone 13+, iOS 13+
- **Android**: Android 5.0+ (API 21+)
- **Web**: Modern browsers (Chrome, Safari, Firefox)

---

## 🐛 Troubleshooting

### Build Issues

**"Metro bundler failed"**
```bash
# Clear cache
npx expo start --clear
```

**"Missing credentials"**
```bash
eas credentials
# Follow prompts
```

**"Google Sign-In not working"**
- Check OAuth client IDs in `.env.production`
- Verify reverse client ID in [app.config.ts](app.config.ts:114-120)
- Add SHA-1 fingerprint to Firebase Console (Android)

### Development Issues

**"Cannot connect to Metro"**
```bash
# Try tunnel mode
npm run start:tunnel
```

**"Module not found"**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

See [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting) for more.

---

## 📞 Support

- **Email**: joelswaku@gmail.com
- **Project**: LiteEvent Event Management Platform
- **EAS Project**: `d03571a3-0dee-483c-9a4f-0706b2d9e07d`

---

## 📚 Resources

- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev)
- **EAS Build**: [docs.expo.dev/eas](https://docs.expo.dev/eas)
- **React Native**: [reactnative.dev](https://reactnative.dev)
- **NativeWind**: [nativewind.dev](https://nativewind.dev)

---

## 📄 License

Proprietary - LiteEvent Platform

---

**Version**: 1.0.0  
**Last Updated**: 2026-08-05  
**Built with**: ❤️ using React Native + Expo
