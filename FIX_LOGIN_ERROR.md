# 🔧 Fix Login Errors (500 Error on Web, Connection Issues on Mobile)

## Problem
- **Web**: Request failed with status code 500 when logging in
- **Mobile**: Connection issues / "Check your internet" error

## Root Causes & Solutions

### 1. ✅ API Server Not Running

**Check if API is running:**
```bash
# Test if API is responding
curl http://localhost:5000/api/auth/me

# Or from mobile IP
curl http://192.168.0.63:5000/api/auth/me
```

**Start the API server:**
```bash
cd api
npm run dev
```

**Expected output:**
```
Server running on port 5000
Connected to PostgreSQL
Redis connected
```

---

### 2. ✅ Database Connection Issue

**Check PostgreSQL is running:**
```bash
# Windows (if using PostgreSQL service)
Get-Service -Name postgresql*

# Or check connection
psql -U postgres -d event
```

**Fix database connection:**

1. Make sure PostgreSQL is running
2. Check database exists:
   ```sql
   psql -U postgres
   \l  -- list databases
   -- Should see "event" database
   ```

3. If database doesn't exist:
   ```bash
   cd api
   npm run migrate
   ```

---

### 3. ✅ CORS Configuration

**Current CORS settings** in `api/.env`:
```bash
CORS_ORIGIN=http://localhost:3000,http://192.168.0.63:3000,http://localhost:8081,http://localhost:19006,exp://localhost:8081,exp://192.168.0.63:8081
```

**If your IP changed:**

1. Find your current IP:
   ```bash
   # Windows
   ipconfig | findstr IPv4
   
   # Look for: "192.168.X.X"
   ```

2. Update both files:
   - `api/.env` - Update `CORS_ORIGIN` with new IP
   - `eventapp-mobile/.env.local` - Update `EXPO_PUBLIC_API_URL` with new IP
   - `api/.env` - Update `FRONTEND_URL` with new IP

3. Restart API server

---

### 4. ✅ Redis Connection Issue

**Check Redis is running:**
```bash
# Windows (if using Redis)
redis-cli ping
# Should return: PONG
```

**If Redis is not installed/running:**

**Option A: Skip Redis** (for development)

Comment out Redis in `api/config/redis.js`:
```javascript
// Temporary fix - disable Redis
export const redis = {
  get: async () => null,
  set: async () => true,
  del: async () => true,
  quit: async () => true
};
```

**Option B: Install Redis**
1. Download Redis for Windows: https://github.com/microsoftarchive/redis/releases
2. Install and start Redis service
3. Test: `redis-cli ping`

---

### 5. ✅ Port Already in Use

**Check if port 5000 is in use:**
```bash
# Windows
netstat -ano | findstr :5000
```

**Kill process on port 5000:**
```powershell
# Find process ID (PID) from netstat output
# Then kill it:
taskkill /PID <process-id> /F
```

---

### 6. ✅ Environment Variables Not Loaded

**Check environment variables are loaded:**

Add to `api/server.js` (temporarily for debugging):
```javascript
console.log('Environment check:');
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');
```

**Make sure `.env` file exists:**
```bash
cd api
ls .env  # Should exist
```

---

## 🚀 Quick Fix Steps

### Step 1: Start PostgreSQL
```bash
# Windows - Start PostgreSQL service
net start postgresql-x64-14

# Or start manually if installed locally
```

### Step 2: Start Redis (Optional)
```bash
# If you have Redis installed:
redis-server

# Or skip Redis by using Option A above
```

### Step 3: Start API Server
```bash
cd api
npm run dev
```

**Look for these messages:**
```
✓ Server running on port 5000
✓ Connected to PostgreSQL
✓ Redis connected (or skip if disabled)
```

### Step 4: Test API Endpoint
```bash
# From web machine
curl http://localhost:5000/api/auth/me

# From mobile (or another device on network)
curl http://192.168.0.63:5000/api/auth/me
```

**Expected response:**
```json
{
  "success": false,
  "message": "No token provided"
}
```
This is GOOD - means API is running!

### Step 5: Start Web App
```bash
cd web
npm run dev
```

### Step 6: Start Mobile App
```bash
cd eventapp-mobile
npm start
```

---

## 🔍 Debug Login Errors

### Check API Logs

When login fails, check the API console for errors:

**Common errors:**

1. **"relation 'users' does not exist"**
   - Database not migrated
   - Fix: `npm run migrate` in api folder

2. **"ECONNREFUSED"**
   - PostgreSQL not running
   - Fix: Start PostgreSQL service

3. **"JWT_SECRET is not defined"**
   - Environment variables not loaded
   - Fix: Check `.env` file exists in api folder

4. **"Redis connection failed"**
   - Redis not running
   - Fix: Start Redis or disable it (see Option A above)

---

## 🧪 Test Login Flow

### Web Login Test:
```bash
# In browser console (http://localhost:3000):
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### Mobile Login Test:
```javascript
// In mobile app, add console.log to auth service:
console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('Login request:', { email });

// Check Expo logs for output
```

---

## 🔑 API URL Configuration

### Web App (`web/.env.local`):
```bash
NEXT_PUBLIC_API_URL=/api          # Uses Next.js proxy
INTERNAL_API_URL=http://localhost:5000/api  # Server-side calls
```

### Mobile App (`eventapp-mobile/.env.local`):
```bash
EXPO_PUBLIC_API_URL=http://192.168.0.63:5000/api  # Direct to API
```

### API Server (`api/.env`):
```bash
PORT=5000
CORS_ORIGIN=http://localhost:3000,http://192.168.0.63:3000,...
```

**IMPORTANT:** Mobile app needs the actual network IP, not `localhost`!

---

## 🎯 Common Solutions Checklist

- [ ] PostgreSQL is running
- [ ] Redis is running (or disabled)
- [ ] API server is running on port 5000
- [ ] Database migrations are complete
- [ ] `.env` file exists in `api/` folder
- [ ] CORS includes mobile app IP
- [ ] Mobile app has correct IP in `.env.local`
- [ ] No other service using port 5000
- [ ] Firewall allows port 5000 (if testing on network)

---

## 🔥 Nuclear Option (Full Reset)

If nothing works, try a full reset:

```bash
# 1. Stop all servers
# Press Ctrl+C in all terminal windows

# 2. Clean install API
cd api
rm -rf node_modules package-lock.json
npm install

# 3. Reset database
psql -U postgres -c "DROP DATABASE IF EXISTS event;"
psql -U postgres -c "CREATE DATABASE event;"
npm run migrate

# 4. Clean install Web
cd ../web
rm -rf .next node_modules package-lock.json
npm install

# 5. Clean install Mobile
cd ../eventapp-mobile
rm -rf node_modules package-lock.json
npm install

# 6. Start everything
# Terminal 1:
cd api && npm run dev

# Terminal 2:
cd web && npm run dev

# Terminal 3:
cd eventapp-mobile && npm start
```

---

## 📞 Still Having Issues?

### Check Logs:

**API logs:**
- Located in: `api/logs/` (if file logging enabled)
- Or check terminal output

**Web logs:**
- Browser console (F12)
- Next.js terminal output

**Mobile logs:**
- Expo logs in terminal
- React Native debugger

### Enable Debug Mode:

Add to `api/.env`:
```bash
NODE_ENV=development
DEBUG=express:*
```

This will show detailed request/response logs.

---

## ✅ Success Indicators

You know it's working when:

1. **API server shows:**
   ```
   Server running on port 5000
   Connected to PostgreSQL
   ```

2. **Web login:**
   - Redirects to `/dashboard`
   - Shows user profile

3. **Mobile login:**
   - Shows "Login successful"
   - Navigates to home screen

---

## 🚑 Emergency Contact

If you're still stuck:

1. Check API server terminal for error messages
2. Check browser console for error details
3. Check mobile Expo logs
4. Share the **exact error message** for specific help

**Most common fix:** Just restart the API server! 🔄
