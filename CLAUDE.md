# LiteEvent - Project Instructions

## 🎯 About This Project

Full-stack event management platform with:
- **Backend:** Node.js + Express + PostgreSQL
- **Web:** Next.js 14 + React  
- **Mobile:** Expo + React Native
- **Deployment:** Railway (production)

---

## 🔧 Development Workflow

### **Starting Development**
```bash
# API (Terminal 1)
cd api
npm run dev

# Web (Terminal 2)  
cd web
npm run dev

# Mobile (Terminal 3)
cd eventapp-mobile
npm start
```

### **URLs**
- API: http://localhost:5000
- Web: http://192.168.0.63:3000
- Production: https://liteevent.com

---

## 📊 Database

### **Development**
- Local PostgreSQL: `localhost:5432/event`
- User: postgres
- Port: 5432

### **Production**
- Railway PostgreSQL
- Access via Railway dashboard

### **Running Migrations**
```bash
cd api
psql $DATABASE_URL -f migration-file.sql
```

---

## 🚀 Deployment

### **Production Deployment**
```bash
# Backend
cd api
railway up --detach

# Frontend
cd web
railway up --detach
```

### **Check Deployment Status**
```bash
railway logs
railway status
```

---

## 🔒 Security Features

- ✅ Email verification (optional for login)
- ✅ Google OAuth enabled
- ✅ Cross-tab authentication sync
- ✅ Auto-logout after 30 min inactivity
- ✅ JWT tokens (access + refresh)
- ✅ httpOnly cookies in production

---

## ⚙️ Important Configuration

### **Environment Variables**

**API (.env):**
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing key
- `RESEND_API_KEY` - Email service
- `NODE_ENV` - development/production

**Web (.env):**
- `NEXT_PUBLIC_API_URL` - API endpoint
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - OAuth

**Mobile (.env):**
- `EXPO_PUBLIC_API_URL` - API endpoint
- `EXPO_PUBLIC_WEB_URL` - Web URL

---

## 🎨 Code Style

### **Always Follow:**
- Test in development first
- Use same database logic for dev/prod
- Deploy after testing
- Check Railway logs after deployment

### **Never:**
- Skip testing in dev
- Deploy without testing
- Change database schema without migration
- Hardcode secrets in code

---

## 📱 Design Consistency Rule (CRITICAL)

### **Mobile & Web Must Match Exactly**

**IMPORTANT:** Any feature built for mobile viewport (small screens) in the **web** app MUST have the EXACT same design, appearance, and behavior in the **mobile app**.

- ✅ Same colors, spacing, fonts, layouts
- ✅ Same button styles and positions
- ✅ Same navigation patterns
- ✅ Same animations and interactions
- ✅ Identical user experience

**When implementing:**
1. Build the mobile app version first
2. Match the web mobile viewport to the mobile app exactly
3. Test both side-by-side on a real device
4. Verify they look identical

**Never:**
- ❌ Create different designs for web mobile vs native mobile
- ❌ Use different components for the same feature
- ❌ Skip testing on actual mobile device
- ❌ Deploy without verifying design parity

---

## 🐛 Common Issues

### **"Too many requests"**
- Check `api/utils/rateLimite.js`
- Limits are higher in production now

### **Google OAuth fails**
- Verify domains in Google Console
- Check `password_hash` allows NULL

### **Cross-tab sync not working**
- Check `web/src/lib/auth-sync.js`
- Verify latest code is deployed

---

## 📚 Documentation

- Security: `SECURITY-AUDIT.md`
- Deployment: `PRODUCTION-DEPLOYMENT.md`
- Google OAuth: `web/GOOGLE-OAUTH-PRODUCTION.md`

---

## ✅ Before Every Deployment

1. Test in development
2. Verify database changes
3. Check environment variables
4. Deploy backend first, then frontend
5. Test in production
6. Monitor Railway logs

---

## 🎯 Production URLs

- **Web:** https://liteevent.com
- **API:** https://api.liteevent.com
- **Railway:** https://railway.com/project/4bbc96a8-25e0-4e46-8194-579788d89501
