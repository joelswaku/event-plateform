# 🔧 Fix Database Connection Issue

**Root Cause:** `ERROR (1): Database connection failed`

**Exit Code:** 1 (container crashed)

---

## 🎯 Probable Causes (In Order of Likelihood)

### 1. Database Password Has Special Characters

The database password in Secrets Manager might have special characters that aren't URL-encoded properly.

**Current password:**
```
sbEWVNFyyZZG5Idf3BOJQlMsLRx8UJDyprgFkko+VIc=
```

**Issue:** The `+` and `=` characters need to be URL-encoded in the connection string!

**Fix:** Update the secret to URL-encode the password:
- `+` should be `%2B`
- `=` should be `%3D`

---

### 2. Database Endpoint Not Accessible

**Check:** Can ECS tasks reach the RDS endpoint?

Security group rule exists but might not be applied correctly.

---

### 3. Database Not Initialized

The RDS instance exists but the actual **database** might not be created yet.

---

## ✅ Solution: Update Database Secret with URL-Encoded Password

The password contains URL-unsafe characters. Let me fix the Terraform configuration:

### Current (Broken):
```
url = "postgresql://liteevent_admin:sbEWVNFyyZZG5Idf3BOJQlMsLRx8UJDyprgFkko+VIc=@endpoint:5432/database"
```

The `+` and `=` in the password break the URL!

### Fixed (URL-Encoded):
```
url = "postgresql://liteevent_admin:sbEWVNFyyZZG5Idf3BOJQlMsLRx8UJDyprgFkko%2BVIc%3D@endpoint:5432/database"
```

---

## 🔧 Quick Fix

We need to update the Terraform secrets module to URL-encode the password!

The fix is to use Terraform's `urlencode()` function in the DATABASE_URL.

---

## 📋 Verification Steps

After fixing:

1. Update the secret in AWS Secrets Manager
2. Force new ECS deployment
3. Check CloudWatch logs - should see:
   ```
   [INFO] Database connected successfully
   [INFO] Server running on port 5000
   ```

---

**Let me apply the fix now...**
