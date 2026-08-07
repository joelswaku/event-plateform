# LiteEvent Mobile - Quick Start Guide

Get your development environment running in 5 minutes.

---

## 1️⃣ Install Dependencies (2 min)

```bash
cd eventapp-mobile
npm install
```

---

## 2️⃣ Start Development Server (1 min)

```bash
npm start
```

This opens Expo Dev Tools. You'll see a QR code.

---

## 3️⃣ Run on Device (2 min)

### Option A: Expo Go (Easiest)
1. Install **Expo Go** on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Scan the QR code from the terminal
3. App loads on your phone! 🎉

### Option B: Emulator
```bash
# iOS Simulator (macOS only)
npm run ios

# Android Emulator
npm run android

# Web browser
npm run web
```

---

## ✅ You're Ready!

The app is now running in development mode with:
- ✅ Hot reload (changes appear instantly)
- ✅ Local API: `http://localhost:5000/api`
- ✅ Debug logs enabled

---

## 🔧 Common Tasks

### Switch to Tunnel Mode (Test on Remote Device)
```bash
npm run start:tunnel
```
Now you can test on any device, anywhere!

### Test Google Sign-In
1. Make sure backend is running: `cd ../api && npm start`
2. Google OAuth should work with development credentials

### View Logs
```bash
# In the terminal running "npm start"
Press 'j' to open debugger
```

---

## 📁 Project Structure Quick Reference

```
app/
├── (auth)/          # Login, Signup screens
├── (tabs)/          # Main app (Events, Profile, etc.)
└── _layout.tsx      # Root layout

src/
├── components/      # Reusable UI components
├── services/        # API calls
└── stores/          # App state (Zustand)
```

---

## 🐛 Troubleshooting

### "Cannot connect to Metro"
```bash
# Clear cache and restart
npx expo start --clear
```

### "Module not found"
```bash
rm -rf node_modules
npm install
```

### "Can't connect to API"
1. Make sure backend is running: `cd ../api && npm start`
2. Check `.env.development` has correct API URL
3. On physical device, use tunnel: `npm run start:tunnel`

---

## 📚 Next Steps

### Learn the Codebase
- Read [README.md](README.md) for full documentation
- Explore [app/](app/) for screen components
- Check [src/services/](src/services/) for API integration

### Build for Production
- Read [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide
- Review [CHECKLIST.md](CHECKLIST.md) before releasing

### Make Changes
1. Edit files in `app/` or `src/`
2. Save (Cmd+S / Ctrl+S)
3. App reloads automatically ✨

---

## 🚀 Deploy Preview Build

When ready to test on real devices without Expo Go:

```bash
npm run build:preview:ios      # iOS
npm run build:preview:android  # Android
```

Download from [expo.dev/builds](https://expo.dev/builds) and install!

---

## 📞 Need Help?

- **Documentation**: See [README.md](README.md)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Support**: joelswaku@gmail.com

---

**Happy coding!** 🎉
