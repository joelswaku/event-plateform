# Android UI Fixes - Pre-Build #10

## 🐛 Issues Found During Testing

### 1. ❌ Edit Event Date - Page Freezes
- **Location**: `eventapp-mobile/app/events/[id]/settings.tsx`
- **Issue**: Page goes blank/white when editing event date
- **Status**: Investigating

### 2. ❌ Seating Chart - Colors Too Dark  
- **Location**: `eventapp-mobile/app/events/[id]/seating.tsx`
- **Issue**: Hard to see seats in daytime
- **Status**: Need to fix

### 3. ❌ Seating Chart - Messages Hidden Below Nav Bar
- **Location**: `eventapp-mobile/app/events/[id]/seating.tsx`
- **Issue**: "Click on available seat" message hidden by Android system bar
- **Status**: Need to fix

### 4. ❌ Seating Chart - Guest Selection Hidden
- **Location**: `eventapp-mobile/app/events/[id]/seating.tsx`
- **Issue**: After assigning one guest, hard to select others (list is hidden, no scroll)
- **Status**: Need to fix

### 5. ❌ Seating Chart - No Visual Feedback
- **Location**: `eventapp-mobile/app/events/[id]/seating.tsx`
- **Issue**: Seat doesn't change color until after guest modal appears  
- **Status**: Need to fix

### 6. ❌ Event Reminders - Save Button Hidden
- **Location**: TBD (find reminders screen)
- **Issue**: Save button hidden by Android navigation bar
- **Status**: Need to locate screen

### 7. ❌ Project Tab - Navbar Not Transparent
- **Location**: `eventapp-mobile/app/(tabs)/builder.tsx`
- **Issue**: Hard to see which item to click
- **Status**: Need to fix

### 8. ✅ CRITICAL: Cold-Start Connection Error
- **Location**: `eventapp-mobile/store/auth.store.ts`
- **Status**: **FIXED** - Needs Build #10 to test properly
- **Fix**: Proper hydration timing (set isHydrated after token refresh)

---

## 📋 Fix Order

1. Start with seating chart issues (2-5) - most critical for UX
2. Fix event date freeze (1) - blocking issue
3. Fix reminders button (6) - find screen first
4. Fix project navbar (7) - low priority
5. Build #10 with all fixes + cold-start fix

---

**Last Updated**: 2026-08-09
