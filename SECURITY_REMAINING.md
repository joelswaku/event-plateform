# Remaining Security Items Before Release

## ✅ COMPLETED

1. **Database credentials removed from Git** - `secret.json` removed and added to `.gitignore`
2. **Cross-organization access fixed** - Membership verification added to organization middleware
3. **Event ownership vulnerability fixed** - No more default-to-OWNER, requires explicit membership
4. **Refresh token race condition fixed** - Transaction with `FOR UPDATE` lock
5. **Password change session revocation** - All sessions revoked on password change
6. **CSRF protection enabled** - `SameSite=lax` on all cookies
7. **Google login account status check** - Disabled accounts blocked
8. **Mobile auth issues fixed** - Token logging removed, API mismatch fixed, refresh token loading fixed
9. **Web/Mobile auth separation** - Web uses httpOnly cookies, mobile uses Bearer tokens + SecureStore

## ✅ NEWLY FIXED

1. **Organization membership checks deleted_at** - [organization.middleware.js:54](api/middleware/organization.middleware.js#L54)
2. **Platform stats uses correct tables** - `issued_tickets` and `ticket_orders` instead of legacy `tickets`
3. **Logout works with expired access token** - New `authenticateForLogout` middleware accepts refresh token
4. **Web/Mobile response separation** - Web gets user only, mobile gets tokens in JSON (detected via `X-Client-Type: mobile` header)
5. **Mobile sends client identifier** - `X-Client-Type: mobile` header added to all requests

## 🚨 CRITICAL - MUST FIX BEFORE RELEASE

### 1. Rotate Database Credentials
**Priority: IMMEDIATE** ⚠️ STILL REQUIRED

The database password `LiteEvent2026Pass` was exposed in `secret.json` that was tracked in Git history.

**Steps:**
1. Log into AWS RDS console
2. Modify database instance `liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com`
3. Change master password for user `liteevent_admin`
4. Update all environment variables with new password:
   - Production API server
   - CI/CD secrets
   - Any developer machines with production access
5. Purge `secret.json` from Git history:
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch secret.json' \
     --prune-empty --tag-name-filter cat -- --all
   git push --force --all
   ```

### 2. ~~Remove Tokens from Web JSON Responses~~ ✅ FIXED
Mobile now sends `X-Client-Type: mobile` header. Backend only returns tokens in JSON for mobile clients.

### 3. ~~Fix Logout When Access Token Expired~~ ✅ FIXED
New `authenticateForLogout` middleware accepts refresh token if access token expired.

### 4. Add Rate Limiting to Auth Endpoints
**File**: `api/routes/auth.routes.js`

**Add strict rate limits:**
```javascript
import rateLimit from 'express-rate-limit';

// 5 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// 3 attempts per hour for password reset
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many reset attempts, please try again later',
});

router.post('/login', authLimiter, loginController);
router.post('/register', authLimiter, registerController);
router.post('/verify-email', authLimiter, verifyEmailController);
router.post('/resend-verification', authLimiter, resendVerificationController);
router.post('/forgot-password', resetLimiter, forgotPasswordController);
router.post('/reset-password', resetLimiter, resetPasswordController);
```

## ⚠️ IMPORTANT - FIX BEFORE PRODUCTION

### 5. ~~Organization Authorization Requires deleted_at IS NULL~~ ✅ FIXED
Added to organization.middleware.js line 54.

### 6. ~~Never Assume Owner Without Explicit Check~~ ✅ FIXED (from earlier)
Event dashboard security fix - requires explicit membership, no default-to-OWNER.

## 📋 RECOMMENDED - BEFORE PRODUCTION

### 7. Add Audit Logging for Sensitive Operations
Track:
- All login attempts (success/failure)
- Password changes
- Password reset requests
- Organization ownership transfers
- Subscription changes
- Cross-organization access attempts

### 8. Add CORS Origin Whitelist
**File**: `api/app.js` line 69

Replace wildcard with explicit whitelist:
```javascript
const allowedOrigins = [
  'https://liteevent.com',
  'https://www.liteevent.com',
  'https://app.liteevent.com',
  // Dev only
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : [])
];
```

### 9. Add Security Headers
**File**: `api/app.js`

Enhance helmet configuration:
```javascript
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

### 10. Set Up Automated Security Scanning
- Enable Dependabot on GitHub
- Set up Snyk or similar for dependency scanning
- Add pre-commit hooks for credential scanning (using git-secrets or similar)

## 📝 TESTING CHECKLIST

Before production deployment, verify:

- [ ] Database password rotated
- [ ] Git history purged of `secret.json`
- [ ] Web login works with httpOnly cookies on `localhost:3000`
- [ ] Mobile login works with Bearer tokens on `192.168.0.63:5000`
- [ ] Web refresh token rotation works
- [ ] Mobile refresh token rotation works
- [ ] Password change revokes all sessions
- [ ] Logout works even with expired access token
- [ ] Cross-org access blocked (try accessing org you're not member of)
- [ ] Event dashboard requires membership (try accessing event without membership)
- [ ] Disabled account cannot login (password)
- [ ] Disabled account cannot login (Google OAuth)
- [ ] Rate limiting blocks brute force (try 6+ login attempts)
- [ ] Concurrent refresh doesn't create duplicate sessions
- [ ] Google login on mobile works
- [ ] CSRF from external site blocked (test with sameSite=lax)

## 🎯 Development Setup

**Web Desktop:**
```bash
# web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Open ONLY http://localhost:3000
# Cookies work on same hostname (localhost)
```

**Expo Mobile:**
```bash
# eventapp-mobile/constants/config.ts
API_URL: 'http://192.168.0.63:5000/api'

# Mobile uses Bearer tokens (no cookies)
# Access on LAN IP for device testing
```

**DO NOT MIX** `localhost` and `192.168.0.63` - cookies won't work cross-hostname.

## 🔒 Architecture Summary

**Web (Desktop/Browser):**
- httpOnly cookies only (secure, can't be accessed by JS)
- `withCredentials: true` on axios
- No Authorization header
- Refresh uses cookie automatically
- More secure against XSS

**Mobile (Expo/React Native):**
- Bearer tokens (cookies don't work reliably on mobile)
- Access token in memory
- Refresh token in SecureStore (encrypted)
- Authorization: Bearer header
- Refresh sends token in request body

**Backend:**
- Supports BOTH methods
- Detects client type by checking for Authorization header
- Sets cookies for web, returns tokens in JSON for mobile
- Rate limits all auth endpoints
- Rotates refresh tokens for security
