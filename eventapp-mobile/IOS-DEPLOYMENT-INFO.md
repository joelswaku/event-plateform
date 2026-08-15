# iOS Deployment Information

## App Store Configuration

**App Name:** LiteEvent
**Bundle Identifier:** com.liteevent.mobile
**App Store Connect App ID:** 6801724090
**Apple Team ID:** 853YU44W52
**Apple Team Name:** joel makila (Individual)

## Credentials (Valid until August 14, 2027)

### Distribution Certificate
- **Serial Number:** 630F2AD44616A3707C8824A54ED46860
- **Expiration:** August 14, 2027
- **Status:** ✅ Active

### Provisioning Profile
- **Developer Portal ID:** KN9SJ7K57W
- **Status:** ✅ Active
- **Expiration:** August 14, 2027

### Push Notifications
- **Apple Push Notifications Key:** ✅ Configured
- **Status:** Active

## Current Build

**Build URL:** https://expo.dev/accounts/okapiapp/projects/event-app/builds/15556473-6698-4b17-abf7-485bd20660bc

**Build Number:** 4
**Status:** In Progress
**Started:** August 14, 2026

## Next Steps After Build Completes

1. Download the IPA file from the build URL
2. Submit to App Store using command:
   ```bash
   eas submit --platform ios --latest
   ```
3. Wait for Apple review (typically 1-3 days)
4. Once approved, app will be live on App Store!

## Useful Commands

```bash
# Check build status
eas build:list --platform ios

# Submit to App Store
eas submit --platform ios --latest

# View build logs
eas build:view [BUILD_ID]
```

## App Store Connect

**URL:** https://appstoreconnect.apple.com/apps/6801724090

**Login:** joelswaku@gmail.com

---

**Note:** Credentials are managed by Expo and automatically renewed.
