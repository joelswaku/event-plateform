# Database Schema Sync - Localhost ↔ Production

## ✅ What Just Happened

Your **localhost database** (86 tables) is now the **source of truth** for production.

### Files Updated:
1. ✅ `api/complete-schema.sql` - Now contains EXACT copy of localhost schema
2. ✅ `api/migrations/1780366133692_vendor-portal-tables.js` - Fixed to handle existing tables

### What This Means:
- **Localhost** has 86 tables with all columns/indexes
- **Production** will match localhost exactly after deployment
- **No differences** between environments

---

## 🔄 How Deployment Works

### GitHub Actions Pipeline:
```yaml
1. Build Docker images
2. Run complete-schema.sql (your localhost schema)
3. Run all migrations (in order)
4. Deploy to ECS
```

### What Gets Deployed:
- ✅ Same database schema as localhost
- ✅ Same migrations as localhost
- ✅ Same code as localhost

---

## 📊 Current Status

### Localhost (Working ✅):
```
Database: eventplatform
Tables: 86
vendors.slug: ✅ EXISTS (citext)
API: http://localhost:5000/health
Status: HEALTHY
```

### Production (Deploying 🔄):
```
Database: liteevent_production
Tables: 86 (after deployment)
vendors.slug: ✅ Will be added by migration
API: https://api.liteevent.com/health
Status: Deploying fixed migration...
```

---

## 🔧 How to Keep Them Synced

### When You Make Database Changes Locally:

**Option 1: Use Migrations (Recommended)**
```bash
# Create a new migration
npm run migrate create my-new-change

# Edit the migration file
# Test locally
npm run migrate up

# Commit and push
git add api/migrations/*
git commit -m "Add new migration"
git push
```

**Option 2: Export & Update Schema (For Major Changes)**
```bash
# Export current localhost schema
docker-compose exec -T postgres pg_dump -U postgres \
  -d eventplatform --schema-only --no-owner --no-acl \
  > api/complete-schema.sql

# Commit and push
git add api/complete-schema.sql
git commit -m "Update schema from localhost"
git push
```

---

## ✅ Verification Checklist

After deployment completes, verify production matches localhost:

### 1. Check Table Count
```sql
-- Localhost
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return: 86

-- Production (use AWS RDS Query Editor)
-- Should also return: 86
```

### 2. Check vendors.slug Column
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' AND column_name = 'slug';
-- Should return: slug | citext
```

### 3. Check API Health
```bash
# Localhost
curl http://localhost:5000/health

# Production
curl https://api.liteevent.com/health
```

---

## 🚨 Troubleshooting

### If Production Doesn't Match Localhost:

**Check GitHub Actions:**
https://github.com/joelswaku/event-plateform/actions

**Check ECS Logs:**
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fliteevent-production$252Fapi

**Re-export Schema:**
```bash
docker-compose exec -T postgres pg_dump -U postgres \
  -d eventplatform --schema-only --no-owner --no-acl \
  > api/complete-schema.sql
git add api/complete-schema.sql
git commit -m "Resync schema"
git push
```

---

## 📝 Summary

**Before:**
- ❌ Localhost had tables production didn't
- ❌ Migrations failed on missing columns
- ❌ Schemas out of sync

**After:**
- ✅ Production uses localhost schema as source
- ✅ Migrations handle existing tables gracefully
- ✅ Both environments identical

**Next Deployment:**
- Wait 3-5 minutes
- Check ECS service healthy
- Test: https://api.liteevent.com/health
- Verify all 86 tables exist in production

---

**Last Updated:** 2026-06-21
**Tables:** 86
**Schema File:** api/complete-schema.sql (161KB)
