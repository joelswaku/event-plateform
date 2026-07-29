# Local Development Setup for Expo Mobile Testing

## Overview

To test the mobile app (Expo) with the web app preview feature, you need to configure your local network properly so the phone/emulator can reach your computer's development servers.

---

## Quick Setup

### 1. Find Your Computer's LAN IP Address

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.0.63
```

**Mac/Linux:**
```bash
ifconfig
# Look for "inet" under en0 or wlan0
# Example: 192.168.0.63
```

### 2. Update Mobile App `.env`

**File:** `eventapp-mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:5000/api
EXPO_PUBLIC_WEB_URL=http://YOUR_LAN_IP:3000
```

Example:
```env
EXPO_PUBLIC_API_URL=http://192.168.0.63:5000/api
EXPO_PUBLIC_WEB_URL=http://192.168.0.63:3000
```

### 3. Update Web App `.env.local`

**File:** `web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://YOUR_LAN_IP:5000/api
```

Example:
```env
NEXT_PUBLIC_API_URL=http://192.168.0.63:5000/api
```

⚠️ **Important:** The IP addresses in steps 2 and 3 **must match**!

### 4. Configure Firewall

Allow incoming connections on ports:
- **3000** (Next.js web app)
- **5000** (API server)

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Advanced Settings → Inbound Rules
3. New Rule → Port → TCP → Specific ports: 3000, 5000
4. Allow the connection
5. Apply to all profiles (Domain, Private, Public)

**Mac Firewall:**
```bash
# System Preferences → Security & Privacy → Firewall → Firewall Options
# Uncheck "Block all incoming connections"
# Add node to allowed apps
```

### 5. Restart Servers

After changing `.env` files, restart all dev servers:

```bash
# Terminal 1 - API
cd api
npm start

# Terminal 2 - Web
cd web
npm run dev

# Terminal 3 - Mobile
cd eventapp-mobile
npx expo start
```

### 6. Connect Phone

1. **Ensure phone and computer are on the same Wi-Fi network**
2. Open Expo Go app on phone
3. Scan QR code from `npx expo start`
4. App should load

---

## Testing Builder Preview

1. Open mobile app
2. Navigate to an event
3. Tap "Builder"
4. Preview should load the event page from `http://YOUR_LAN_IP:3000`

If preview shows "Preview not available":
- ✅ Check phone is on same Wi-Fi as computer
- ✅ Verify IP addresses match in both `.env` files
- ✅ Confirm web server is running on port 3000
- ✅ Confirm API server is running on port 5000
- ✅ Check firewall allows ports 3000 and 5000

---

## Common Issues

### Issue: "Preview not available"

**Cause:** API URL is `localhost` instead of LAN IP  
**Fix:** Update `web/.env.local` to use your LAN IP, then restart web server

### Issue: Expo app shows "Network Error"

**Cause:** Phone can't reach computer  
**Fix:** 
- Verify phone and computer on same Wi-Fi
- Check firewall settings
- Try accessing `http://YOUR_LAN_IP:3000` in phone browser

### Issue: Stripe HTTPS Error in Console

**Cause:** Using live Stripe keys over HTTP  
**Fix:** Already handled in code with Stripe error suppression (no action needed)

---

## Production vs Development

### Development (Local Testing)
```env
# Mobile
EXPO_PUBLIC_API_URL=http://192.168.0.63:5000/api
EXPO_PUBLIC_WEB_URL=http://192.168.0.63:3000

# Web
NEXT_PUBLIC_API_URL=http://192.168.0.63:5000/api
```

### Production (Deployed)
```env
# Mobile
EXPO_PUBLIC_API_URL=https://api.liteevent.com/api
EXPO_PUBLIC_WEB_URL=https://liteevent.com

# Web
NEXT_PUBLIC_API_URL=https://api.liteevent.com/api
```

Production uses HTTPS, so no special configuration needed.

---

## File Locations

```
event-plateform/
├── api/                          # Backend API
├── web/
│   └── .env.local               # ⚠️ Update this with LAN IP
├── eventapp-mobile/
│   └── .env                     # ⚠️ Update this with LAN IP
└── LOCAL_DEVELOPMENT_SETUP.md   # This file
```

---

## Summary Checklist

- [ ] Find your computer's LAN IP address
- [ ] Update `eventapp-mobile/.env` with LAN IP
- [ ] Update `web/.env.local` with same LAN IP
- [ ] Configure firewall to allow ports 3000 and 5000
- [ ] Restart all dev servers (API, web, mobile)
- [ ] Ensure phone and computer on same Wi-Fi
- [ ] Test builder preview in mobile app

---

**Last Updated:** 2026-07-27  
**Status:** Production-ready guide for local development
