# LiteEvent Mobile - Command Reference Card

Quick reference for all npm commands and workflows.

---

## 🏃 Development (Daily Use)

```bash
npm start                     # Start Expo dev server (scan QR)
npm run start:dev             # Start with dev client
npm run start:tunnel          # Tunnel mode (test on any device)

npm run android               # Run on Android emulator
npm run ios                   # Run on iOS simulator
npm run web                   # Run in web browser
```

---

## 🔨 Building

### Development Builds
```bash
npm run build:dev             # Dev build (both platforms)
npm run build:dev:ios         # Dev build (iOS only)
npm run build:dev:android     # Dev build (Android only)
```

### Preview Builds (QA/Staging)
```bash
npm run build:preview         # Preview build (both platforms)
npm run build:preview:ios     # Preview build (iOS only)
npm run build:preview:android # Preview build (Android only)
```

### Production Builds (App Stores)
```bash
npm run build:prod            # Production (both platforms)
npm run build:prod:ios        # Production (iOS only)
npm run build:prod:android    # Production (Android only)
```

---

## 📤 Deployment

### Submit to App Stores
```bash
npm run submit:ios            # Submit to Apple App Store
npm run submit:android        # Submit to Google Play Store
npm run submit:all            # Submit to both stores
```

### Over-the-Air Updates
```bash
npm run update:preview        # Push OTA update to preview channel
npm run update:prod           # Push OTA update to production channel
```

---

## 🛠️ Utilities

### Prebuild (Generate Native Folders)
```bash
npm run prebuild              # Prebuild (both platforms)
npm run prebuild:android      # Prebuild (Android only)
npm run prebuild:ios          # Prebuild (iOS only)
```

### Quality Checks
```bash
npm run lint                  # Run ESLint
npm run type-check            # TypeScript type checking
```

---

## 🔧 EAS CLI Commands

### Build Management
```bash
eas build:list                # View build history
eas build:view BUILD_ID       # View specific build details
eas build:cancel BUILD_ID     # Cancel a running build
```

### Credentials
```bash
eas credentials               # Manage certificates/keys
```

### Updates
```bash
eas update:list               # View update history
eas update:delete --branch preview  # Delete update
```

### Project Info
```bash
eas whoami                    # Show logged in account
eas project:info              # Show project info
```

---

## 📁 File Structure Quick Reference

```
eventapp-mobile/
├── 📱 app/                   # Expo Router pages
│   ├── (auth)/              # Auth screens
│   ├── (tabs)/              # Main app tabs
│   └── _layout.tsx
│
├── 🎨 src/                   # Source code
│   ├── components/          # UI components
│   ├── services/            # API services
│   ├── stores/              # State management
│   └── types/               # TypeScript types
│
├── 🖼️ assets/                # Images, fonts, etc.
│
├── 🔧 scripts/               # Build automation
│   ├── build.js             # Build helper
│   └── update.js            # Update helper
│
├── 🌍 Environment Files
│   ├── .env.development     # Local dev
│   ├── .env.staging         # Staging
│   └── .env.production      # Production (create this!)
│
├── ⚙️ Configuration
│   ├── app.config.ts        # Expo config
│   ├── eas.json             # Build profiles
│   └── package.json         # Dependencies
│
└── 📚 Documentation
    ├── README.md            # Project overview
    ├── QUICK-START.md       # 5-min setup
    ├── DEPLOYMENT.md        # Full deployment guide
    ├── CHECKLIST.md         # Pre-deployment checklist
    └── COMMANDS.md          # This file
```

---

## 🌍 Environment Variables

### Which `.env` file is used?

| Command | Environment File | API URL |
|---------|-----------------|---------|
| `npm start` | `.env.development` | `http://localhost:5000/api` |
| `npm run build:preview` | `.env.staging` | `https://api-staging.liteevent.com/api` |
| `npm run build:prod` | `.env.production` | `https://api.liteevent.com/api` |

### Create Production Environment
```bash
cp .env.production.example .env.production
# Edit with your production values
```

---

## 🔄 Common Workflows

### 1. Local Development
```bash
# Terminal 1: Backend
cd ../api
npm start

# Terminal 2: Mobile app
cd eventapp-mobile
npm start
# Scan QR with Expo Go
```

### 2. Test on Physical Device (Tunnel)
```bash
npm run start:tunnel
# Scan QR - works from anywhere!
```

### 3. Build Preview for QA
```bash
npm run build:preview:ios
# Download from expo.dev/builds
# Install on device via TestFlight or direct
```

### 4. Deploy to Production
```bash
# Step 1: Update version
# Edit app.config.ts: version: "1.1.0"

# Step 2: Build
npm run build:prod

# Step 3: Submit (when build completes)
npm run submit:all
```

### 5. Push Bug Fix (OTA)
```bash
# Fix bug in code
# Test locally
npm run update:prod
# Users get update on next app launch!
```

---

## 🚨 Emergency Commands

### Clear Cache & Restart
```bash
npx expo start --clear
```

### Reset Everything
```bash
rm -rf node_modules
rm -rf .expo
npm install
npx expo start --clear
```

### Cancel Running Build
```bash
eas build:list                # Get BUILD_ID
eas build:cancel BUILD_ID     # Cancel it
```

### Rollback OTA Update
```bash
eas update:delete --branch production
```

---

## 📊 Monitoring

### View Build Status
```bash
eas build:list
# Or visit: https://expo.dev/builds
```

### View Update History
```bash
eas update:list
```

### Check Project Info
```bash
eas project:info
```

---

## 🎯 Quick Decision Tree

**Want to test locally?**
→ `npm start`

**Want to test on remote device?**
→ `npm run start:tunnel`

**Want to build for internal testing?**
→ `npm run build:preview`

**Want to deploy to app stores?**
→ `npm run build:prod` then `npm run submit:all`

**Fixed a bug, want to update users immediately?**
→ `npm run update:prod`

**Build failed?**
→ `npx expo start --clear` then try again

---

## 📞 Help

- **Can't find a command?** Check [README.md](README.md#scripts-reference)
- **Deployment questions?** See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Build errors?** See [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting)

---

## 🔗 Quick Links

- **EAS Builds**: https://expo.dev/builds
- **EAS Dashboard**: https://expo.dev/accounts/YOUR_ACCOUNT/projects/liteevent
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console

---

**Project**: LiteEvent Mobile  
**EAS Project ID**: `d03571a3-0dee-483c-9a4f-0706b2d9e07d`  
**Version**: 1.0.0
