---
name: App Store Release
about: Track a new release to iOS App Store and Google Play Store
title: '[RELEASE] v1.x.x - Release Name'
labels: 'release, deployment'
assignees: ''
---

## Release Information

- **Version**: 1.x.x
- **Release Name**: (e.g., "Winter 2024 Update")
- **Target Date**: YYYY-MM-DD
- **EAS Build IDs**:
  - iOS: `[Build ID from expo.dev/builds]`
  - Android: `[Build ID from expo.dev/builds]`

---

## Pre-Build Checklist

### Code & Configuration
- [ ] Version number updated in `app.config.ts`
- [ ] Changelog updated
- [ ] All features tested on dev builds
- [ ] No blocking bugs
- [ ] Code merged to `main` branch

### Environment Setup
- [ ] `.env.production` created with production values
- [ ] Production API URL verified: `https://api.liteevent.com/api`
- [ ] Using production Stripe keys (`pk_live_...`)
- [ ] All environment variables validated

### Google OAuth
- [ ] Web client ID configured
- [ ] iOS client ID configured
- [ ] Android client ID configured
- [ ] SHA-1 fingerprint added to Firebase (Android)

---

## iOS App Store

### Build
- [ ] Production build submitted: `npm run build:prod:ios`
- [ ] Build succeeded on EAS
- [ ] IPA downloaded and tested

### App Store Connect
- [ ] App metadata updated
- [ ] Screenshots updated (if UI changed)
- [ ] What's New (release notes) written
- [ ] Privacy policy reviewed
- [ ] TestFlight beta completed (optional but recommended)
- [ ] Submitted for review: `npm run submit:ios`

### Review Status
- [ ] Waiting for Review
- [ ] In Review
- [ ] Approved
- [ ] Ready for Sale

---

## Google Play Store

### Build
- [ ] Production build submitted: `npm run build:prod:android`
- [ ] Build succeeded on EAS
- [ ] AAB downloaded and tested

### Google Play Console
- [ ] App metadata updated
- [ ] Screenshots updated (if UI changed)
- [ ] Release notes written
- [ ] Privacy policy reviewed
- [ ] Internal testing completed (optional but recommended)
- [ ] Submitted for review: `npm run submit:android`

### Review Status
- [ ] Review pending
- [ ] In review
- [ ] Approved
- [ ] Published

### Rollout
- [ ] Started at 20% rollout
- [ ] Increased to 50% rollout
- [ ] Increased to 100% rollout

---

## Post-Launch

### Monitoring (First 24 Hours)
- [ ] No critical crashes reported
- [ ] API handling production traffic
- [ ] Google Sign-In working on both platforms
- [ ] Stripe payments working
- [ ] Push notifications working

### Metrics
- **Downloads (Week 1)**:
  - iOS: 
  - Android: 

- **Crash-free rate**:
  - iOS: 
  - Android: 

- **Average rating**:
  - iOS: 
  - Android: 

### User Feedback
- [ ] Monitoring App Store reviews
- [ ] Monitoring Google Play reviews
- [ ] Responding to user issues within 24-48 hours

---

## Release Notes

### What's New in This Version

**New Features**
- 

**Improvements**
- 

**Bug Fixes**
- 

---

## Rollback Plan

If critical issues are discovered:

### OTA Update (for JS-only bugs)
```bash
# Fix bug in code
npm run update:prod
```

### Emergency App Store Update (for native bugs)
1. Increment version to 1.x.y
2. Fix critical issue
3. Submit hotfix build
4. Request expedited review

---

## Team Sign-Off

- [ ] **Developer** - Code ready for release
- [ ] **QA** - Testing complete, no blockers
- [ ] **Product** - Features approved
- [ ] **Design** - UI/UX approved

---

## Notes

<!-- Additional notes, known issues, or special instructions -->

---

## Related Links

- **EAS Build Dashboard**: https://expo.dev/builds
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
- **Deployment Guide**: [DEPLOYMENT.md](../DEPLOYMENT.md)
- **Pre-Deploy Checklist**: [CHECKLIST.md](../CHECKLIST.md)
