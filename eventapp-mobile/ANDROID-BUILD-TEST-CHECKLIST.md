# Android Production Build Testing Checklist

**Build Date**: 2026-08-07  
**Version**: 1.0.0 (Build will auto-increment)  
**Platform**: Android (AAB for Google Play)

---

## 🎯 New Features & Fixes to Test

### 1. ✅ Stripe Payment Return Routes
**What Changed**: Added deep link handlers for payment success/cancel

**Test Steps**:
1. Open app on Android device
2. Go to Profile → Billing
3. Tap "Upgrade to Starter" or "Upgrade to Pro"
4. Complete or cancel Stripe payment
5. **Expected**: 
   - ✅ Success → "Verifying payment..." → Success toast → Billing page
   - ✅ Cancel → "Payment Cancelled" → Brief delay → Billing page
   - ❌ NO "Unmatched Route" error

**Deep Links**:
- `liteevent://payment/success?session_id={ID}`
- `liteevent://payment/cancel`
- `liteevent://payment/ticket-success?order_id={ID}`

---

### 2. ✅ Seating Assignment Touch Fix
**What Changed**: Fixed touch events on seat circles (moved from SvgG to SvgCircle)

**Test Steps**:
1. Open event with seating enabled
2. Tap on a table to open detail view
3. Tap "Add Guest" and select a guest
4. Tap on an empty seat (green circle with +)
5. **Expected**: 
   - ✅ Green flash on tap (visual feedback)
   - ✅ Guest assigned on **first tap** (no double-click needed)
   - ✅ Seat shows guest initials immediately

**Test Remove Guest**:
1. Tap the red X button on a seated guest
2. **Expected**: 
   - ✅ Guest removed on **first tap**
   - ✅ Seat becomes empty immediately

---

### 3. ✅ Hero Scroll Prevention (Tickets Section)
**What Changed**: Aggressive scroll prevention for Android WebView

**Test Steps**:
1. Navigate to event with **tickets enabled**
2. Tap "See Your Website"
3. Wait for page to fully load
4. **Expected**: 
   - ✅ Hero section visible at top
   - ❌ NO auto-scroll to ticket section
   - ✅ Hero does NOT disappear

**Test with Donations Only**:
1. Navigate to event with **donations enabled** (no tickets)
2. Tap "See Your Website"
3. **Expected**: ✅ Hero visible (already worked)

**Test Manual Scroll**:
1. After page loads, scroll down manually
2. **Expected**: ✅ Scrolling works normally (no jump back to top)

---

### 4. ✅ Bottom Navigation Safe Area
**What Changed**: Added safe area insets to prevent Android navigation bar overlap

**Test Steps**:
1. Open app on Android device with navigation bar (buttons or gesture bar)
2. Navigate to different tabs: Home, Events, Scan, Planner, Profile
3. **Expected**: 
   - ✅ All 5 tab icons fully visible
   - ✅ All tab labels fully visible
   - ✅ Tab icons stay above Android navigation bar
   - ✅ No overlap with system buttons

**Before**: System navigation covered bottom icons  
**After**: Bottom padding reserves space for navigation bar

---

### 5. ✅ Android Navigation Bar Color
**What Changed**: Set navigation bar background to dark navy `#07070f`

**Test Steps**:
1. Open app and observe the Android navigation bar at the bottom
2. **Expected**: 
   - ✅ Navigation bar is dark navy (matches app background)
   - ✅ System icons are white/light colored
   - ❌ NOT white navigation bar

**Before**: White navigation bar (default Android)  
**After**: Dark navy `#07070f` (seamless with app theme)

---

### 6. ✅ No Terms Checkbox on Signup
**What Changed**: Removed terms/privacy policy acceptance checkbox

**Test Steps**:
1. Tap "Sign Up" / "Create Account"
2. Fill in name, email, password
3. **Expected**: 
   - ❌ NO terms checkbox
   - ❌ NO "I agree to Terms..." text
   - ✅ Can submit form immediately
   - ✅ Account created without checking terms

**Before**: Required checkbox to accept terms  
**After**: No checkbox, direct signup

---

### 7. ✅ Tablet Navbar (WebView)
**What Changed**: Changed breakpoint from `sm:` (640px) to `lg:` (1024px)

**Test Steps** (if testing on tablet):
1. Open event page in "See Your Website"
2. Observe navigation bar at top
3. **Expected**: 
   - ✅ Burger menu icon shown (not inline nav items)
   - ❌ NO wrapped navigation items in multiple lines
   - ✅ Tap burger → full navigation menu opens

**Before**: Nav items wrapped into multiple lines on tablets  
**After**: Clean burger menu on tablets (640px-1024px)

---

## 📱 Regression Testing (Make Sure Nothing Broke)

### Authentication
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Logout
- [ ] Forgot password flow

### Events
- [ ] View events list
- [ ] Create new event
- [ ] Edit event details
- [ ] Delete event
- [ ] Share event

### Guests
- [ ] View guest list
- [ ] Add guest manually
- [ ] Import from contacts
- [ ] Send invitation
- [ ] Check-in with QR scanner

### Seating (Already testing above)
- [ ] Create seating table
- [ ] Assign guest to seat
- [ ] Remove guest from seat
- [ ] Auto-assign guests

### Tickets
- [ ] View available tickets
- [ ] Purchase ticket (Stripe flow)
- [ ] View My Tickets
- [ ] Ticket QR code display

### Profile
- [ ] View profile
- [ ] Edit profile
- [ ] View billing
- [ ] Upgrade subscription (Stripe flow)
- [ ] View notifications

### Offline Mode
- [ ] Check-in guests offline
- [ ] View offline queue count badge
- [ ] Sync when back online

---

## 🔍 Known Issues to Watch For

### Potential Issues
1. **Stripe webhooks**: Test that webhooks still fire correctly after payment
2. **Deep link timing**: Ensure app is ready when deep link arrives
3. **Scroll prevention**: Make sure it doesn't prevent manual scrolling
4. **Safe area on different devices**: Test on devices with/without home button

### Not Fixed in This Build
- [ ] None - all known issues addressed

---

## 📊 Build Information

**Command**:
```bash
cd eventapp-mobile
eas build --profile production --platform android
```

**Profile**: `production`
- API URL: `https://api.liteevent.com/api`
- Build Type: `app-bundle` (AAB for Google Play)
- Auto-increment: Enabled
- Channel: `production`

**Expected Output**:
- Android App Bundle (`.aab` file)
- Download link from Expo
- Build ID for tracking

---

## 🚀 Installation Instructions

### Option 1: Internal Testing (Recommended)
1. EAS build completes → Download AAB
2. Upload to Google Play Internal Testing
3. Add your email as tester
4. Install via Google Play Internal Testing link
5. Test all features above

### Option 2: Local Testing (Manual Install)
1. Build APK for testing:
   ```bash
   eas build --profile preview --platform android
   ```
2. Download APK file
3. Enable "Install from unknown sources" on device
4. Install APK manually
5. Test all features

---

## ✅ Sign-Off Checklist

After testing, verify:

**Critical Features**:
- [ ] Login/Signup works
- [ ] Events CRUD works
- [ ] QR Scanner works
- [ ] Stripe payments work (success + cancel)
- [ ] Seating assignment works (one tap)
- [ ] No Hero scroll issue (tickets enabled)

**UI/UX**:
- [ ] Bottom navigation visible (safe area)
- [ ] Navigation bar is dark (not white)
- [ ] No terms checkbox on signup
- [ ] Tablet navbar shows burger menu (if applicable)

**Performance**:
- [ ] App launches quickly
- [ ] No crashes
- [ ] Smooth scrolling
- [ ] Animations work

**Ready for Production**:
- [ ] All critical features work
- [ ] No regressions found
- [ ] UI looks correct
- [ ] Performance acceptable

---

## 📝 Bug Report Template

If you find issues, report with:

```
**Issue**: [Brief description]
**Screen**: [Which screen/feature]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happened]

**Device**: [Android version, device model]
**Build**: [Build ID from EAS]
```

---

## 🎉 Success Criteria

Build is **READY FOR PRODUCTION** when:
- ✅ All 7 new features work as expected
- ✅ No critical bugs in regression tests
- ✅ Stripe payment flow works end-to-end
- ✅ Seating works without double-tapping
- ✅ Hero stays visible on event pages
- ✅ UI looks polished (safe areas, colors correct)

---

**Built with**: Expo EAS Build  
**Testing by**: Joel  
**Deploy to**: Google Play Internal Testing → Production
