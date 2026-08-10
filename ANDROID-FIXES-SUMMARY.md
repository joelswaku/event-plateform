# Android Fixes Summary - Ready for Build #10

## ✅ COMPLETED FIXES

### 1. Cold-Start Connection Error
- **Status**: ✅ **FIXED** (Commits: 87310f8, 100254d)
- **Files**: 
  - `eventapp-mobile/store/auth.store.ts` - Fixed hydration timing
  - `eventapp-mobile/app/(tabs)/index.tsx` - Wait for isHydrated
  - `eventapp-mobile/app/(tabs)/scanner.tsx` - Wait for isHydrated  
  - `eventapp-mobile/app/(tabs)/tickets.tsx` - Wait for isHydrated
  - `eventapp-mobile/lib/toast.ts` - Distinguish 401/403 from network errors
- **Solution**: Set `isHydrated = true` only AFTER token refresh completes
- **Testing**: Needs Build #10 to fully test (EAS Update didn't work)

---

## 🔧 ISSUES IDENTIFIED FROM SCREENSHOTS

### 2. Seating Chart - Colors Too Dark ❌
**Screenshot Evidence**: Seating chart shows dark green (#10b981) seats on dark background
- **Location**: `eventapp-mobile/app/events/[id]/seating.tsx:146`
- **Issue**: Hard to see empty seats in daytime
- **Current Colors**:
  - Empty seat: `rgba(255,255,255,0.08)` - too dark
  - Available seat (when guest selected): `rgba(16,185,129,0.3)` - #10b981 at 30% opacity
  - Stroke: `rgba(191,219,254,0.34)` - barely visible
- **Fix Needed**: Brighten to:
  - Empty seat: `rgba(255,255,255,0.18)` 
  - Available seat: `rgba(16,185,129,0.50)` - brighter green
  - Stroke: `rgba(191,219,254,0.60)` - more visible

### 3. Guest List Cut Off by Android Nav Bar ❌  
**Screenshot Evidence**: "TAP TO SELECT GUEST" section at bottom appears cut off
- **Location**: `eventapp-mobile/app/events/[id]/seating.tsx:360-362`
- **Issue**: Guest list hidden by Android system navigation bar
- **Current**: `paddingBottom: selectedGuest ? insets.bottom + 96 : insets.bottom + 28`
- **Fix Needed**: Increase padding to `insets.bottom + 120` when guest selected

### 4. No Floating Guest Selection Indicator ❌
**Screenshot Evidence**: No visible floating message when Joel is selected
- **Location**: `eventapp-mobile/app/events/[id]/seating.tsx:540-550`
- **Issue**: "Selected guest indicator" not visible above Android nav bar
- **Current**: `bottom: Math.max(insets.bottom, 16) + 10`
- **Fix Needed**: Change to `bottom: Math.max(insets.bottom + 20, 36)`

### 5. Seat Visual Feedback Delay ❌
**Screenshot Evidence**: Seat shows green BEFORE guest assigned (screenshot #5)
- **Location**: `eventapp-mobile/app/events/[id]/seating.tsx:146-148`
- **Issue**: Seat doesn't change color until AFTER tap
- **Current**: Color changes only after `handleTapEmpty` completes
- **Fix Needed**: Add visual feedback state that shows immediately on press

### 6. Guest List Not Scrollable ❌
**Screenshot Evidence**: Only 2-3 guests visible, no scroll indicator
- **Issue**: If more than 3 unassigned guests, can't scroll to see them
- **Fix Needed**: Make guest list scrollable with `maxHeight` and scroll indicator

---

## 📱 OTHER ISSUES (NOT YET SCREENSHOTTED)

### 7. Edit Event Date - Page Freezes ⏳
- **Location**: `eventapp-mobile/app/events/[id]/settings.tsx`
- **Issue**: Page goes blank when editing start/end date
- **Status**: Need to test and identify exact cause

### 8. Event Reminders - Save Button Hidden ⏳
- **Location**: Unknown (need to find reminders screen)
- **Issue**: Save button hidden by Android nav bar
- **Status**: Need to locate screen first

### 9. Project Tab - Navbar Not Transparent ⏳
**Screenshot Evidence**: Screenshot #1 shows Event Planner screen
- **Location**: `eventapp-mobile/app/(tabs)/builder.tsx`
- **Issue**: Hard to see which navbar item is active
- **Status**: Need to check navbar styling

---

## 🎯 ACTION PLAN

### Phase 1: Quick Seating Chart Fixes (15 min)
1. Brighten seat colors
2. Fix guest list padding for Android nav bar
3. Fix floating indicator position
4. Add scroll to guest list
5. Add immediate visual feedback when seat tapped

### Phase 2: Test & Fix Other Issues (30 min)
6. Test date picker freeze issue
7. Locate and fix reminders save button
8. Fix project navbar transparency

### Phase 3: Build #10 (25 min)
9. Commit all fixes
10. Run `eas build --profile production --platform android`
11. Test on device using checklist

---

## 📋 FILES TO MODIFY

### High Priority (Seating Chart)
- `eventapp-mobile/app/events/[id]/seating.tsx`

### Medium Priority
- `eventapp-mobile/app/events/[id]/settings.tsx` (date freeze)
- `eventapp-mobile/app/(tabs)/builder.tsx` (navbar)
- Find reminders screen

### Low Priority  
- Documentation updates

---

## 💾 COMMITS READY

**Commit 1**: `87310f8` - Fix Android cold-start connection error (tabs)  
**Commit 2**: `100254d` - Fix hydration timing (auth store)  
**Commit 3**: Pending - Seating chart UX improvements  
**Commit 4**: Pending - Settings date picker fix  
**Commit 5**: Pending - Reminders & project navbar fixes  

---

## 🚀 Build #10 Checklist

- [x] Cold-start connection error fix
- [ ] Seating chart color improvements
- [ ] Seating chart Android nav bar fixes
- [ ] Guest list scrollable
- [ ] Seat visual feedback
- [ ] Date picker freeze fix
- [ ] Reminders save button fix
- [ ] Project navbar transparency

**Estimated Time to Complete**: 1 hour  
**Ready for Build**: After Phase 1 + Phase 2 complete

---

**Last Updated**: 2026-08-09 21:40  
**Status**: Ready to start fixes 🔧
