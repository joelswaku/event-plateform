# LiteEvent Mobile - Deployment Checklist

Complete this checklist before submitting to app stores.

---

## 🔧 Pre-Build Configuration

### App Configuration
- [ ] Updated version number in [app.config.ts](app.config.ts:90)
- [ ] App name matches: "LiteEvent"
- [ ] Bundle ID correct: `com.liteevent.mobile`
- [ ] App icon present: `./assets/icon.png` (1024x1024)
- [ ] Splash screen present: `./assets/splash.png`
- [ ] App scheme configured: `liteevent`

### Environment Variables
- [ ] Created `.env.production` from `.env.production.example`
- [ ] Production API URL set: `https://api.liteevent.com/api`
- [ ] Web URL set: `https://liteevent.com`
- [ ] **Never** committed `.env.production` to git

### Google OAuth Setup
- [ ] Created Web client ID in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [ ] Created iOS client ID
- [ ] Created Android client ID
- [ ] Added reverse client ID to [app.config.ts](app.config.ts:114-120) (iOS)
- [ ] Verified OAuth consent screen configured

### Stripe Configuration
- [ ] Using **LIVE** Stripe publishable key (`pk_live_...`)
- [ ] Updated Stripe price IDs to **production** prices
- [ ] Never using test keys in production

### Permissions
- [ ] Camera permission description accurate
- [ ] Contacts permission description accurate
- [ ] All iOS `NSUsageDescription` strings present
- [ ] Android permissions list complete

---

## 🍎 iOS App Store

### Apple Developer Account
- [ ] Active Apple Developer Program membership ($99/year)
- [ ] Team ID retrieved
- [ ] Certificates generated via EAS

### App Store Connect
- [ ] App created in [App Store Connect](https://appstoreconnect.apple.com)
- [ ] App name reserved: "LiteEvent"
- [ ] Bundle ID matches: `com.liteevent.mobile`
- [ ] SKU set: `liteevent-mobile`
- [ ] App category selected
- [ ] Age rating completed

### App Store Listing
- [ ] **App Name**: LiteEvent (30 chars max)
- [ ] **Subtitle**: Event management made simple (30 chars max)
- [ ] **Description**: Compelling app description (4000 chars max)
- [ ] **Keywords**: Relevant search keywords (100 chars max, comma-separated)
- [ ] **Support URL**: https://liteevent.com/support
- [ ] **Marketing URL**: https://liteevent.com
- [ ] **Privacy Policy URL**: https://liteevent.com/privacy

### Screenshots (Required Sizes)
- [ ] **6.7" Display** (1290 x 2796) - iPhone 15 Pro Max
- [ ] **6.5" Display** (1284 x 2778) - iPhone 11 Pro Max
- [ ] **5.5" Display** (1242 x 2208) - iPhone 8 Plus
- [ ] **iPad Pro (12.9")** (2048 x 2732) - Optional but recommended

### App Privacy
- [ ] Completed **App Privacy** questionnaire in App Store Connect
- [ ] Listed data collection practices:
  - [ ] Contact info (email)
  - [ ] User content (events, photos)
  - [ ] Location (if applicable)
  - [ ] Analytics (if using)

### Build & Submit
- [ ] Built production iOS app: `npm run build:prod:ios`
- [ ] Downloaded IPA from [EAS Dashboard](https://expo.dev/builds)
- [ ] Submitted to App Store: `npm run submit:ios`
- [ ] TestFlight beta testing completed (recommended)
- [ ] App submitted for review
- [ ] Responded to any review feedback

---

## 🤖 Google Play Store

### Google Play Developer Account
- [ ] Active Google Play Developer account ($25 one-time)
- [ ] Identity verification completed

### Google Play Console
- [ ] App created in [Google Play Console](https://play.google.com/console)
- [ ] App name: "LiteEvent"
- [ ] Package name matches: `com.liteevent.mobile`
- [ ] App category selected

### Store Listing
- [ ] **App name**: LiteEvent (50 chars max)
- [ ] **Short description**: Quick summary (80 chars max)
- [ ] **Full description**: Detailed description (4000 chars max)
- [ ] **App icon**: 512 x 512 PNG
- [ ] **Feature graphic**: 1024 x 500 PNG
- [ ] **Privacy policy URL**: https://liteevent.com/privacy

### Screenshots
- [ ] **Phone screenshots** (min 2, recommended 8)
  - [ ] 1080 x 1920 or higher (16:9 ratio)
- [ ] **7" Tablet screenshots** (optional)
  - [ ] 1024 x 1920 or higher
- [ ] **10" Tablet screenshots** (optional)
  - [ ] 1280 x 1920 or higher

### Content Rating
- [ ] Completed content rating questionnaire
- [ ] Received content rating (likely: E for Everyone)

### App Content
- [ ] **Privacy policy** linked
- [ ] **Target audience** selected
- [ ] **App access** (all features accessible or requires login?)
- [ ] **Ads** (does app contain ads? → No)
- [ ] **Data safety** section completed

### Data Safety (Required)
- [ ] Listed data collection:
  - [ ] Personal info (name, email)
  - [ ] Photos and videos
  - [ ] App activity
- [ ] Listed data sharing practices
- [ ] Listed security practices (encryption, etc.)

### Build & Submit
- [ ] Built production Android app: `npm run build:prod:android`
- [ ] Downloaded AAB from [EAS Dashboard](https://expo.dev/builds)
- [ ] Created **Internal testing** track (optional but recommended)
- [ ] Submitted to **Production**: `npm run submit:android`
- [ ] Set rollout percentage (start with 20%, then 50%, then 100%)
- [ ] App submitted for review

### Google Cloud Configuration
- [ ] Added SHA-1 fingerprint to Firebase Console
- [ ] Enabled Google Sign-In API
- [ ] Configured OAuth consent screen

---

## 🔐 Security & Compliance

### HTTPS & Security
- [ ] Production API uses HTTPS only
- [ ] Disabled cleartext traffic in production ([app.config.ts](app.config.ts:172))
- [ ] Using secure WebSocket (wss://) if applicable
- [ ] No hardcoded secrets in code

### Legal Documents
- [ ] **Privacy Policy** published: https://liteevent.com/privacy
- [ ] **Terms of Service** published: https://liteevent.com/terms
- [ ] **GDPR compliance** (if applicable)
- [ ] **CCPA compliance** (if applicable)

### Data Handling
- [ ] User data encrypted in transit (HTTPS)
- [ ] Sensitive data encrypted at rest
- [ ] User deletion flow implemented
- [ ] Data export functionality (if required)

---

## 🧪 Testing

### Manual Testing
- [ ] Tested on iOS device (physical)
- [ ] Tested on Android device (physical)
- [ ] Tested signup flow
- [ ] Tested login flow (email + password)
- [ ] Tested Google Sign-In (iOS)
- [ ] Tested Google Sign-In (Android)
- [ ] Tested event creation
- [ ] Tested event editing
- [ ] Tested event deletion
- [ ] Tested QR code scanning
- [ ] Tested contact import
- [ ] Tested image upload
- [ ] Tested push notifications
- [ ] Tested offline mode (if applicable)
- [ ] Tested deep linking

### Edge Cases
- [ ] Tested with slow network
- [ ] Tested with no network (offline)
- [ ] Tested with expired token
- [ ] Tested with invalid inputs
- [ ] Tested with long text inputs
- [ ] Tested with multiple accounts
- [ ] Tested logout flow

### Device Testing
- [ ] Tested on iPhone (latest iOS)
- [ ] Tested on older iPhone (iOS 13+)
- [ ] Tested on Android (latest)
- [ ] Tested on older Android (API 21+)
- [ ] Tested on tablet (optional)

---

## 📊 Monitoring & Analytics

### Crash Reporting (Optional but Recommended)
- [ ] Set up Sentry for crash tracking
- [ ] Configured source maps upload
- [ ] Tested crash reporting

### Analytics (Optional)
- [ ] Configured Google Analytics / Firebase
- [ ] Tracking key events:
  - [ ] User signup
  - [ ] Event created
  - [ ] QR code scanned
  - [ ] Subscription purchased

### Performance Monitoring
- [ ] Configured Firebase Performance Monitoring (optional)
- [ ] Set up alerts for critical errors

---

## 🚀 Launch Day

### Final Checks
- [ ] Production API is live and stable
- [ ] Production database backed up
- [ ] Stripe webhook configured on production API
- [ ] Email service (Resend) configured for production
- [ ] Support email monitored: support@liteevent.com

### Communication
- [ ] App Store listing live (iOS)
- [ ] Google Play listing live (Android)
- [ ] Website updated with app store badges
- [ ] Social media announcement prepared
- [ ] Email announcement to beta testers

### Post-Launch Monitoring
- [ ] Monitor app store reviews daily
- [ ] Monitor crash reports
- [ ] Monitor API errors
- [ ] Track user signups
- [ ] Track retention metrics

---

## 📱 OTA Updates

### Setting Up OTA Updates
- [ ] Understand what can be updated OTA (JS changes only)
- [ ] Understand what requires new build (native changes)
- [ ] Tested preview channel updates
- [ ] Tested production channel updates

### Update Strategy
- [ ] Minor bug fixes → OTA update
- [ ] New features (JS only) → OTA update
- [ ] Native changes → New build submission

---

## 🔄 Version Management

### Version Numbering
- [ ] Using semantic versioning: `MAJOR.MINOR.PATCH`
- [ ] Current version documented
- [ ] Change log maintained

### Release Notes
- [ ] Prepared release notes for App Store
- [ ] Prepared release notes for Google Play
- [ ] Release notes translated (if supporting multiple languages)

---

## 📞 Support

### User Support Channels
- [ ] Support email active: support@liteevent.com
- [ ] FAQ page created: https://liteevent.com/faq
- [ ] In-app support link working
- [ ] Response time target set (24-48 hours)

### Developer Resources
- [ ] API documentation up to date
- [ ] Deployment guide complete ([DEPLOYMENT.md](DEPLOYMENT.md))
- [ ] Team trained on OTA updates
- [ ] Emergency rollback procedure documented

---

## ✅ Final Sign-Off

### Team Approvals
- [ ] Developer approval
- [ ] Designer approval (UI/UX)
- [ ] Product owner approval
- [ ] QA approval

### Launch Decision
- [ ] All critical issues resolved
- [ ] No known blockers
- [ ] Support team ready
- [ ] Monitoring in place
- [ ] **Ready to launch!** 🚀

---

## 📚 Resources

- **EAS Dashboard**: https://expo.dev/accounts/YOUR_ACCOUNT/projects/liteevent
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Project Memory**: [C:\Users\joels\.claude\projects\c--projects\memory\project_event_plateform.md](file:///C:/Users/joels/.claude/projects/c--projects/memory/project_event_plateform.md)

---

**Last Updated**: 2026-08-05
**Project**: LiteEvent Event Management Platform
**EAS Project ID**: `d03571a3-0dee-483c-9a4f-0706b2d9e07d`
