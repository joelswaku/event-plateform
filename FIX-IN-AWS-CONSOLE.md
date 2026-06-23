# 🔥 FIX IN AWS CONSOLE (No AWS CLI needed)

**You have 1,445 failed tasks. Let's stop the chaos and fix it.**

---

## ⚡ STEP 1: STOP THE SERVICE (Stop the failing tasks)

**Go to:** https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service?region=us-east-1

1. Click **"Update"** (top right)
2. Set **"Desired tasks"** to **0**
3. Click **"Update"**
4. ✅ This stops all failing tasks

---

## ⚡ STEP 2: UPDATE SECRETS MANAGER

**Go to:** https://console.aws.amazon.com/secretsmanager/secret?name=liteevent%2Fproduction%2Fdatabase&region=us-east-1

1. Click **"Retrieve secret value"**
2. Click **"Edit"**
3. **Replace everything** with this:

```json
{
  "username": "liteevent_admin",
  "password": "LiteEvent2026Pass",
  "host": "liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "liteevent_production",
  "url": "postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"
}
```

4. Click **"Save"**
5. ✅ Secret updated

---

## ⚡ STEP 3: VERIFY RDS PASSWORD

**Go to:** https://console.aws.amazon.com/rds/home?region=us-east-1#database:id=liteevent-production-postgres;is-cluster=false

1. Click **"Modify"**
2. Scroll to **"Master password"**
3. Enter: `LiteEvent2026Pass`
4. Scroll to bottom
5. Select **"Apply immediately"** ✅
6. Click **"Modify DB instance"**
7. **Wait 2-3 minutes** for password to apply
8. ✅ RDS password set

---

## ⚡ STEP 4: CHECK IF DATABASE NAME EXISTS

**Still on the RDS page:**

1. Go to **"Configuration"** tab
2. Look for **"DB name"** field

**If it says:** `liteevent_production` ✅ - Good!

**If it's EMPTY or different:**
- Note the actual name (or remember it's empty)
- We'll fix it in Step 5

---

## ⚡ STEP 5: RUN MIGRATIONS (Create Database Tables)

**Two options:**

### **Option A: Run from your computer** (if you have Node.js)

```powershell
cd C:\projects\event-plateform\api
$env:DATABASE_URL="postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"
npm run migrate
```

**If you get "connection timeout":**
- Your RDS security group blocks your IP
- Use Option B instead

### **Option B: Skip migrations for now**
- The API can create tables on first startup
- Just proceed to Step 6

---

## ⚡ STEP 6: START THE SERVICE (with 1 task only)

**Go back to:** https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service?region=us-east-1

1. Click **"Update"**
2. Set **"Desired tasks"** to **1** (NOT 2!)
3. Check **"Force new deployment"** ✅
4. Click **"Update"**
5. ✅ Service will start 1 task

---

## ⚡ STEP 7: MONITOR THE TASK

**Stay on the same page:**

1. Click **"Tasks"** tab
2. Watch the task - it should go from **PENDING** → **RUNNING**
3. Click on the task ID when it appears
4. Click **"Logs"** tab
5. **Look for:**
   - ✅ `Database connected successfully`
   - ✅ `Server running on port 5000`

**If you see:**
- ❌ `Database connection failed` → Check Step 2 and Step 3 again
- ❌ `ECONNREFUSED` → RDS password not applied yet (wait 2 more minutes)

---

## ⚡ STEP 8: SCALE TO 2 TASKS (Once 1 task is healthy)

**Once the first task is RUNNING and logs show success:**

1. Go back to service page
2. Click **"Update"**
3. Set **"Desired tasks"** to **2**
4. Click **"Update"**
5. ✅ Now you have 2 healthy tasks

---

## ✅ SUCCESS CHECKLIST

- [ ] Service stopped (desired count = 0)
- [ ] Secrets Manager updated
- [ ] RDS password set to `LiteEvent2026Pass`
- [ ] Waited 2-3 minutes for password to apply
- [ ] (Optional) Migrations ran successfully
- [ ] Service started with 1 task
- [ ] Task is RUNNING (not PENDING)
- [ ] Logs show "Database connected successfully"
- [ ] Scaled to 2 tasks

---

## 🎯 IF STILL FAILING AFTER ALL STEPS

**The issue is probably the database NAME mismatch.**

If RDS "DB name" field is **empty** or **different** from `liteevent_production`:

1. The database needs to be created
2. Connect with psql or pgAdmin:
   - Host: `liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com`
   - Port: `5432`
   - Username: `liteevent_admin`
   - Password: `LiteEvent2026Pass`
3. Run: `CREATE DATABASE liteevent_production;`
4. Then run migrations (Step 5)
5. Then restart service

---

## 🆘 NEED HELP?

**Send me a screenshot of:**
1. RDS → Configuration tab → "DB name" field
2. ECS task → Logs tab → Last 10 lines

I'll tell you exactly what to do next.

---

**START NOW: Do Step 1 to stop the chaos!** 🚀
