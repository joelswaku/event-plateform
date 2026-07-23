# Google OAuth Production Setup

## 🚨 **Why Google Login Fails in Production**

Google OAuth requires proper configuration for each domain. Development and production need separate setups.

---

## ✅ **Step 1: Configure Google Cloud Console**

### **1. Go to Google Cloud Console**
https://console.cloud.google.com/apis/credentials

### **2. Select Your Project** (or create new one)

### **3. Configure OAuth Consent Screen**
- **User Type:** External (for public apps)
- **App Name:** LiteEvent (or your app name)
- **User Support Email:** Your email
- **Developer Contact:** Your email
- **Scopes:** Add these scopes:
  - `openid`
  - `email`
  - `profile`

### **4. Create OAuth 2.0 Client ID**

**Application Type:** Web application

**Authorized JavaScript Origins:**
```
# Development
http://localhost:3000
http://127.0.0.1:3000

# Production (add YOUR domain)
https://yourdomain.com
https://www.yourdomain.com
```

**Authorized Redirect URIs:**
```
# Development
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/register

# Production (add YOUR domain)
https://yourdomain.com
https://yourdomain.com/login
https://yourdomain.com/register
```

### **5. Copy Client ID**
You'll get a Client ID like:
```
123456789-abcdefghijklmnop.apps.googleusercontent.com
```

---

## ✅ **Step 2: Configure Production Environment**

### **Create `.env.production` file:**

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_PRODUCTION_CLIENT_ID_HERE

# API URL (your production backend)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# Other production settings...
```

### **For Vercel/Netlify/Railway:**

Add environment variables in dashboard:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID = your-production-client-id
```

---

## ✅ **Step 3: Backend Configuration**

Your backend needs to accept Google tokens from your production domain.

### **Update CORS settings:**

```javascript
// api/server.js or middleware
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',           // Development
    'https://yourdomain.com',          // Production
    'https://www.yourdomain.com',      // Production www
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
```

### **Update Cookie Settings:**

```javascript
// api/utils/jwt.js or wherever you set cookies
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true in production
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});
```

**IMPORTANT:** 
- `secure: true` requires HTTPS
- `sameSite: 'none'` requires `secure: true`
- Use these settings ONLY in production

---

## ✅ **Step 4: Test Production Setup**

### **1. Deploy to production**

### **2. Open your production URL**
```
https://yourdomain.com/login
```

### **3. Click "Continue with Google"**

### **4. Expected Flow:**
- Google popup opens
- User selects account
- User grants permissions
- Popup closes
- User is logged in
- Redirected to dashboard

### **5. If it fails, check:**
- Browser console for errors
- Network tab for API calls
- Backend logs for Google token validation

---

## 🔧 **Common Production Issues**

### **Issue 1: "redirect_uri_mismatch"**
**Fix:** Add production domain to Authorized Redirect URIs in Google Console

### **Issue 2: "Popup blocked"**
**Fix:** User must allow popups for your domain

### **Issue 3: "Invalid client"**
**Fix:** Check NEXT_PUBLIC_GOOGLE_CLIENT_ID is correct in production

### **Issue 4: "CORS error"**
**Fix:** Update backend CORS to allow production domain

### **Issue 5: "Cookie not set"**
**Fix:** Ensure backend uses `secure: true` and `sameSite: 'none'` in production

---

## 📋 **Checklist**

- [ ] Google Cloud Console configured
- [ ] Production domain added to Authorized Origins
- [ ] Production domain added to Redirect URIs
- [ ] Client ID copied
- [ ] `.env.production` created with Client ID
- [ ] Backend CORS updated for production domain
- [ ] Backend cookie settings use `secure: true` in production
- [ ] Production deployment complete
- [ ] Google login tested on production

---

## 🎯 **Development vs Production**

| Feature | Development | Production |
|---------|-------------|------------|
| Domain | localhost:3000 | yourdomain.com |
| Client ID | Dev Client ID | Prod Client ID |
| HTTPS | Not required | Required |
| Cookie secure flag | false | true |
| Cookie sameSite | lax | none |
| CORS | localhost | production domain |

---

## ✅ **Status**

- ✅ Development: Working
- ⏳ Production: Needs configuration (follow steps above)
