# 🚨 FIX LOGIN ERROR - DO THIS NOW

## Problem: Network Error when logging in

## ⚡ QUICK FIX (5 minutes)

### Step 1: Create web/.env.local file

```bash
# Create the file
echo NEXT_PUBLIC_API_URL=http://localhost:5000 > web/.env.local
```

**OR manually create:** `web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

### Step 2: Restart Docker

```bash
docker-compose restart web
```

---

### Step 3: Test in Browser

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Go to:** http://localhost:3000
3. **Try login again**

---

## 🔍 If Still Not Working

### Check Browser Console

1. **Press F12** in browser
2. **Click "Console" tab**
3. **Try to login**
4. **Tell me what error you see**

---

## 🎯 Most Common Errors:

### Error 1: "Failed to fetch"
**Cause:** API not running  
**Fix:** 
```bash
docker-compose up -d
```

### Error 2: "CORS error"
**Cause:** API blocking requests from localhost:3000  
**Fix:** Check api/.env has:
```env
CORS_ORIGIN=http://localhost:3000
```

### Error 3: "404 Not Found"
**Cause:** Wrong API path  
**Fix:** API should be at `/api/auth/login`

---

## ✅ Quick Test

**Open new terminal and run:**

```bash
# Test API directly
curl http://localhost:5000/health

# Should return:
# {"success":true,"message":"API is healthy"}
```

**If that works, test login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 🎯 DO THIS NOW:

1. ✅ Create `web/.env.local` with API URL
2. ✅ Run `docker-compose restart web`
3. ✅ Clear browser cache
4. ✅ Try login again

**If still broken, press F12 and tell me the error!**
