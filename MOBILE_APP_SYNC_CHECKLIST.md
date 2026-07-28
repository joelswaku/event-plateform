# Mobile App Sync Checklist

## Changes to Apply from Web to Mobile App

### 1. ✅ Event Reminders System
**Web Changes:**
- Added Event Reminders modal with timing options (instant, 15min, 30min, 1hr, 2hr, 6hr, 12hr, 24hr, 3 days, 7 days, 14 days, 30 days)
- Added to mobile quick actions (Builder, Planner, Guests, **Reminders**, Tickets, Seating, Analytics, Donations, Team, Settings)
- Added to desktop quick actions
- Added to event settings page

**Mobile App Tasks:**
- [ ] Add Reminders modal component
- [ ] Add to event detail quick actions
- [ ] Integrate with API endpoint `/events/:eventId/reminders`

---

### 2. ✅ Guest Management Improvements
**Web Changes:**
- Send QR Code modal: Email-only (removed WhatsApp, Share, Copy Link)
- Send Invitation modal: Email-only (removed WhatsApp, Share, Copy Link)
- Guest list page invitation modal: Email-only

**Mobile App Tasks:**
- [ ] Update QR code sharing to email-only
- [ ] Update invitation sharing to email-only
- [ ] Remove WhatsApp/Share/Copy Link options

---

### 3. ✅ Contact Page Links
**Web Changes:**
- All contact cards link to #contact-form
- Navbar Contact links to /contact#contact-form
- Footer links all clickable
- Support page email cards open contact form

**Mobile App Tasks:**
- [ ] Check if contact page exists in mobile
- [ ] Update support page email links
- [ ] Make footer links clickable

---

### 4. ✅ Landing Page Fixes
**Web Changes:**
- Logo fixed: /lite.png → /logo.png
- Template cards fully clickable on mobile with "Tap to use" indicator
- Footer logo clickable

**Mobile App Tasks:**
- [ ] Check logo path
- [ ] Verify template cards clickable (if applicable)

---

### 5. ✅ Event Date Validation
**Web Changes:**
- Client-side validation before API call
- Professional error: "Event end date/time must be after the start date/time"

**Mobile App Tasks:**
- [ ] Add date validation in event create/edit forms
- [ ] Show user-friendly error message

---

### 6. ✅ Email Template Design
**Web Changes:**
- Brighter text (rgba(255,255,255,0.75))
- Clickable location with Google Maps link
- Larger title (28px)
- Better contrast

**Mobile App Tasks:**
- N/A (email templates are server-side, already applied in API)

---

### 7. ✅ Custom Reminder UX
**Web Changes:**
- Toast notification when adding custom reminder: "Custom reminder added successfully! 🔔"

**Mobile App Tasks:**
- [ ] Add toast/snackbar when custom reminder added
- [ ] Use same success message

---

### 8. ✅ Scanner Module Position
**Web Changes:**
- Removed Scanner from mobile quick actions grid (kept in sticky bar)
- Exactly 10 modules in grid

**Mobile App Tasks:**
- [ ] Check if Scanner is in quick actions
- [ ] Keep only in sticky/bottom bar if present
- [ ] Verify 10 modules max in grid

---

### 9. ✅ Support Page Email Links
**Web Changes:**
- All "Email Support" cards link to /contact#contact-form (not mailto:)
- No external email client opens

**Mobile App Tasks:**
- [ ] Update support page email links
- [ ] Link to in-app contact form instead of mailto:

---

### 10. ✅ Seating/Table Management
**Check if mobile has:**
- [ ] Seating module in quick actions
- [ ] Table assignment features
- [ ] Guest seating management

---

## Priority Order
1. **High Priority** (Core features):
   - Event Reminders system
   - Guest sharing (email-only)
   - Date validation
   - Scanner position

2. **Medium Priority** (UX improvements):
   - Contact page links
   - Custom reminder toast
   - Support page links

3. **Low Priority** (Polish):
   - Logo path
   - Template cards (if applicable)

---

## Testing Checklist
After applying changes:
- [ ] Event detail screen loads
- [ ] Quick actions work (all 10 modules)
- [ ] Reminders modal opens and saves
- [ ] Guest sharing shows email-only options
- [ ] Date validation works
- [ ] Scanner accessible from sticky bar
- [ ] Support page opens contact form
- [ ] All navigation works

---

## API Endpoints Mobile Needs
All these endpoints are already implemented and working:

- `GET /events/:eventId/reminders` - Load reminders
- `POST /events/:eventId/reminders` - Save reminders
- `POST /guests/:guestId/send-qr` - Send QR code email
- `POST /invitations/:token/send` - Send invitation email
- `POST /contact` - Contact form submission

---

## Status: Ready to Start
**Next Step:** Review mobile app structure and start applying changes in priority order.
