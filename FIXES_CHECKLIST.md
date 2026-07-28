# Pre-Deployment Fixes Checklist

## 1. Event Date Validation ❌
**Issue**: Error "ends_at must be after or equal to starts_at" appears when user edits start date to be after end date
**Fix**: Add professional validation message/modal before submit
**Files**: `web/src/app/(dashboard)/events/[eventId]/page.js`

## 2. Email Reminder Template Design ❌
**Issue**: 
- Name not visible
- Wedding location not visible  
- Address not a link
- Too dark
- Not professional design
**Fix**: Redesign email template with professional styling
**Files**: `api/services/reminder.service.js`

## 3. Home Page Logo/Image ❌
**Issue**: Topbar image or logo not showing
**Fix**: Fix logo display in home page header
**Files**: `web/src/app/page.js` or header component

## 4. Mobile Landing Page Template Click ❌
**Issue**: When clicking template in home landing page on mobile, doesn't open login/signup
**Fix**: Make template cards clickable and redirect to auth
**Files**: Landing page template section

## 5. Landing Page Contact Links ❌
**Issue**: Contact section cards should link to contact input
- "Email Support" card
- "Response Time" card  
- "Documentation" card
- Contact button in navbar
- Footer links not clickable
**Fix**: Make all contact references scroll/link to contact form
**Files**: Landing page components

## 6. Custom Reminder UX ❌
**Issue**: No feedback when adding custom reminder
**Fix**: Add spinner + toast notification when reminder added
**Files**: `web/src/app/(dashboard)/events/[eventId]/page.js`

---

## Progress
- [ ] Event date validation
- [ ] Email template design
- [ ] Home page logo
- [ ] Mobile template click
- [ ] Contact links
- [ ] Custom reminder UX

**Status**: 0/6 Complete
