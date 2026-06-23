# 🔍 Debug Network Error - Step by Step

## Issue: Login shows "Network Error"

### Current Status:
✅ Docker containers running
✅ API is healthy (http://localhost:5000/health)
❌ Login returns 302 redirect (should be 200)

---

## 🔧 Debugging Steps:

### Step 1: Check Browser Console

1. **Open http://localhost:3000 in Chrome/Edge**
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Try to login**
5. **Look for errors** (red text)

**What to look for:**
```
❌ CORS error
❌ Failed to fetch
❌ Network request failed
❌ 404 Not Found
❌ 500 Internal Server Error
```

---

### Step 2: Check Network Tab

1. **In Developer Tools, click "Network" tab**
2. **Try to login again**
3. **Look for the login request**

**What to check:**
- **Request URL:** Should be `http://localhost:5000/api/auth/login` or similar
- **Status Code:** Should be 200, not 302
- **Response:** Should contain user data and token

**Example of what you should see:**
```
Request URL: http://localhost:5000/api/auth/login
Method: POST
Status: 200 OK
```

**If you see:**
```
Status: 302 Found
Location: /some/other/path
```
This is the problem!

---

### Step 3: Test API Directly

**Open a new browser tab and test:**

```
http://localhost:5000/health
```

**Should return:**
```json
{
  "success": true,
  "message": "API is healthy"
}
```

**Then test login endpoint with Postman or curl:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

### Step 4: Check What URL Web App is Using

**In browser console, type:**
```javascript
localStorage.getItem('API_URL')
// or
console.log(process.env.NEXT_PUBLIC_API_URL)
```

**Should show:**
```
http://localhost:5000
```

**If it shows something else, that's the problem!**

---

## 🔍 Common Issues & Fixes:

### Issue 1: Wrong API URL
**Web app calling:** `http://api.liteevent.com`
**Should be:** `http://localhost:5000`

**Fix:** Check web/.env.local

### Issue 2: CORS Error
**Error:** "Access-Control-Allow-Origin"

**Fix:** API needs to allow localhost:3000

### Issue 3: API Route Not Found
**Error:** 404 Not Found

**Fix:** Check API route path

### Issue 4: Database Connection Error
**Error:** "failed with status code 500"

**Fix:** Check API can connect to database

---

## 🎯 Quick Fix to Try:

### 1. Restart Docker Containers

```bash
# Stop all
docker-compose down

# Start fresh
docker-compose up -d

# Check logs
docker logs event-platform-api -f
```

### 2. Check Web App API URL

**Create/edit:** `web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Then restart web:**
```bash
docker-compose restart web
```

### 3. Test Login from Command Line

```bash
# Test if API accepts login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 📊 What to Send Me:

If still not working, send me:

1. **Browser Console Error** (screenshot or copy text)
2. **Network Tab** - the failed request details
3. **This command output:**
   ```bash
   curl -v http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test"}'
   ```

---

## 🔍 Most Likely Causes:

Based on the 302 redirects in the API logs:

1. **API route middleware is redirecting** - possibly checking for authentication
2. **Wrong API endpoint path** - web calling wrong URL
3. **CORS blocking the request** - browser blocks cross-origin
4. **Database not connected** - API can't process login

---

**Next Step:** Open browser Developer Tools (F12) and try login. Tell me what you see in Console and Network tabs!
