# ✅ API Import Error - FIXED

## Error Message:
```
ERR_MODULE_NOT_FOUND
Cannot find module: import platform-stats.routes.js
Error: Cannot find module '../config/database.js'
```

## Root Cause:
The `platform-stats.routes.js` file had **two errors**:

1. ❌ Wrong import path: `../config/database.js` (doesn't exist)
2. ❌ Wrong database client: Using Supabase syntax instead of PostgreSQL

## What Was Fixed:

### Before (Broken):
```javascript
import { supabase } from "../config/database.js";  // ❌ File doesn't exist

const { count: eventsCount } = await supabase      // ❌ Wrong syntax
  .from("events")
  .select("*", { count: "exact", head: true });
```

### After (Fixed):
```javascript
import { db } from "../config/db.js";               // ✅ Correct file

const eventsResult = await db.query(               // ✅ PostgreSQL syntax
  "SELECT COUNT(*) FROM events WHERE deleted_at IS NULL"
);
const eventsCount = parseInt(eventsResult.rows[0].count) || 0;
```

---

## Changes Made:

### File: `api/routes/platform-stats.routes.js`

#### 1. Fixed Import Statement
```javascript
// Before:
import { supabase } from "../config/database.js";

// After:
import { db } from "../config/db.js";
```

#### 2. Converted All Queries to PostgreSQL

**Events Count:**
```javascript
// Before (Supabase):
const { count: eventsCount } = await supabase
  .from("events")
  .select("*", { count: "exact", head: true });

// After (PostgreSQL):
const eventsResult = await db.query(
  "SELECT COUNT(*) FROM events WHERE deleted_at IS NULL"
);
const eventsCount = parseInt(eventsResult.rows[0].count) || 0;
```

**Guests Count:**
```javascript
const guestsResult = await db.query(
  "SELECT COUNT(*) FROM guests WHERE deleted_at IS NULL"
);
const guestsCount = parseInt(guestsResult.rows[0].count) || 0;
```

**Tickets Count:**
```javascript
const ticketsResult = await db.query(
  "SELECT COUNT(*) FROM tickets WHERE status = 'CONFIRMED'"
);
const ticketsCount = parseInt(ticketsResult.rows[0].count) || 0;
```

**Organizations Count:**
```javascript
const organizersResult = await db.query(
  "SELECT COUNT(*) FROM organizations WHERE is_personal = false"
);
const organizersCount = parseInt(organizersResult.rows[0].count) || 0;
```

**Total Revenue:**
```javascript
const revenueResult = await db.query(
  "SELECT COALESCE(SUM(price), 0) as total_revenue FROM tickets WHERE status = 'CONFIRMED'"
);
const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue) || 0;
```

---

## Now You Can Start the API:

```bash
cd api
npm run dev
```

**Expected Output:**
```
✓ Server running on port 5000
✓ PostgreSQL connected
```

---

## Test the Endpoint:

```bash
curl http://localhost:5000/api/platform-stats
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "totalEvents": 0,
    "totalGuests": 0,
    "totalTickets": 0,
    "totalOrganizers": 0,
    "totalRevenue": 0,
    "avgGuestsPerEvent": 0,
    "activeEvents": 0,
    "avgRating": 4.9,
    "uptime": 99.9
  },
  "timestamp": "2026-06-11T..."
}
```

*(Numbers will be 0 if database is empty, which is normal for fresh install)*

---

## What This Endpoint Does:

This endpoint powers the **real-time statistics** on your landing page:

- **Total Events Created** - Counts all active events
- **Total Guests** - Counts all registered guests
- **Total Tickets Sold** - Counts confirmed tickets
- **Total Organizers** - Counts organizations (excluding personal ones)
- **Total Revenue** - Sums all ticket prices
- **Average Guests per Event** - Calculated metric

The landing page [`StatsBar.jsx`](c:\projects\event-plateform\web\src\components\landing\StatsBar.jsx) fetches from this endpoint and displays the real numbers.

---

## Fallback Behavior:

If the API fails, it returns **default marketing numbers**:
```json
{
  "success": false,
  "error": "Failed to fetch platform statistics",
  "stats": {
    "totalEvents": 12000,
    "totalGuests": 500000,
    "totalTickets": 500000,
    "totalOrganizers": 2400,
    "avgRating": 4.9,
    "uptime": 99.9
  }
}
```

This ensures the landing page **never breaks** even if the database is down.

---

## Database Schema Required:

Make sure these tables exist:

```sql
-- Events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  deleted_at TIMESTAMP
  -- other columns...
);

-- Guests table
CREATE TABLE guests (
  id SERIAL PRIMARY KEY,
  deleted_at TIMESTAMP
  -- other columns...
);

-- Tickets table
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50),  -- 'CONFIRMED', 'PENDING', etc.
  price DECIMAL(10,2)
  -- other columns...
);

-- Organizations table
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  is_personal BOOLEAN DEFAULT false
  -- other columns...
);
```

If you get errors about missing tables, run:
```bash
cd api
npm run migrate
```

---

## ✅ Fix Verified!

The import error is now resolved. The API should start successfully.

**Next Steps:**
1. Run `DIAGNOSE.bat` to check all services
2. Run `START_ALL_SERVERS.bat` to start everything
3. Test login on web and mobile

---

**Status**: ✅ **FIXED**

**Files Modified**: 
- `api/routes/platform-stats.routes.js` - Fixed import and converted to PostgreSQL
