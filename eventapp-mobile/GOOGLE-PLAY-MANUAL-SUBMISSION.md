# Google Play Manual Submission Guide - LiteEvent

Complete step-by-step guide to manually submit your Android app to Google Play Internal Testing.

---

## 📦 Step 1: Download Your AAB File

**Your Production Android App Bundle:**
```
https://expo.dev/artifacts/eas/YDa8x61KvrTbT3EyI3VVOJ3eYTsznXlUW_weLH3mj1g.aab
```

1. Click the link above
2. Save the file to your Downloads folder
3. The file will be named something like: `YDa8x61KvrTbT3EyI3VVOJ3eYTsznXlUW_weLH3mj1g.aab`

---

## 🎯 Step 2: Access Google Play Console

1. Go to: **https://play.google.com/console**
2. Sign in with your Google account
3. You should see your **LiteEvent** app
4. Click on the **LiteEvent** app card

---

## 📋 Step 3: Complete Required Information (If Not Done)

### Main Store Listing

Go to **"Grow"** → **"Store presence"** → **"Main store listing"**

#### App Details
- **App name**: LiteEvent
- **Short description** (80 characters max):
  ```
  Create, manage and track events with QR code check-in and guest management
  ```

- **Full description** (4000 characters max):
  ```
  LiteEvent - Simple Event Management
  
  Organize amazing events with ease! LiteEvent is your all-in-one event management platform.
  
  KEY FEATURES:
  
  📅 Event Creation & Management
  • Create unlimited events
  • Set date, time, and location
  • Add event descriptions and details
  • Upload event photos
  
  👥 Guest Management
  • Import contacts directly from your phone
  • Send invitations via email
  • Track RSVPs and attendance
  • Manage guest lists effortlessly
  
  📱 QR Code Check-In
  • Generate unique QR codes for each event
  • Fast check-in with QR code scanning
  • Real-time attendance tracking
  • Contactless guest verification
  
  💳 Payment Integration
  • Accept payments via Stripe
  • Manage ticket sales
  • Track revenue
  • Secure payment processing
  
  🔐 Secure & Private
  • Google Sign-In for easy access
  • Your data is encrypted
  • Privacy-first approach
  
  WHY CHOOSE LITEEVENT?
  
  ✓ Easy to use - No learning curve
  ✓ Professional - Impress your guests
  ✓ Time-saving - Automate check-ins
  ✓ Reliable - Built with modern technology
  
  Perfect for:
  • Corporate events
  • Weddings & parties
  • Conferences & meetups
  • Community gatherings
  • Workshops & seminars
  
  Download LiteEvent today and make your next event unforgettable!
  
  Website: https://liteevent.com
  Support: support@liteevent.com
  ```

#### Graphics
- **App icon**: 512 x 512 PNG (your icon from `assets/icon.png`)
- **Feature graphic**: 1024 x 500 PNG
  - Create a banner with your app name and tagline
  - Use Canva or Figma to design

#### Screenshots (Phone)
You need **at least 2** screenshots, max 8. Recommended size: **1080 x 1920** (or higher)

**Suggested Screenshots:**
1. Events list screen
2. Event details screen
3. QR code check-in screen
4. Guest list screen
5. Event creation screen

---

### Privacy Policy

Go to **"Grow"** → **"Store presence"** → **"App content"**

1. Click **"Privacy policy"**
2. Enter: `https://liteevent.com/privacy`
3. Save

---

### App Category

Go to **"Grow"** → **"Store presence"** → **"Store settings"**

1. **Category**: Choose **"Productivity"** or **"Events"**
2. **Tags**: Add relevant tags like "event management", "events", "qr code"

---

### Content Rating

Go to **"Grow"** → **"Store presence"** → **"App content"** → **"Content ratings"**

1. Click **"Start questionnaire"**
2. Enter your email: `support@liteevent.com`
3. Select category: **"Utility, Productivity, Communication, or Other"**
4. Answer questions (all should be "No" for LiteEvent):
   - Violence? → No
   - Sexual content? → No
   - Profanity? → No
   - Controlled substances? → No
   - etc.
5. Submit questionnaire
6. You'll get a rating (likely: "Everyone" or "Teen")

---

### Target Audience

Go to **"Grow"** → **"Store presence"** → **"App content"** → **"Target audience"**

1. **Target age groups**: Select **"18 and over"** (or 13+ if appropriate)
2. **Appeal to children**: **No**
3. Save

---

### Data Safety

Go to **"Grow"** → **"Store presence"** → **"App content"** → **"Data safety"**

Answer questions about data collection:

**Data collected:**
- ✅ Personal info (Name, Email address)
- ✅ Photos and videos (if users upload)
- ✅ App activity (Events created, attendance)

**Data sharing:**
- No (unless you share with third parties)

**Data security:**
- ✅ Data is encrypted in transit
- ✅ Users can request deletion
- ✅ Data handling complies with Play policy

---

## 🚀 Step 4: Create Internal Testing Release

Once all the above is complete:

1. Go to **"Release"** → **"Testing"** → **"Internal testing"**
2. Click **"Create new release"**

### Upload AAB

3. Under "App bundles", click **"Upload"**
4. Select the AAB file you downloaded in Step 1
5. Wait for upload to complete (shows a green checkmark)

### Release Name

6. The release name auto-fills (e.g., "1.0.0 (3)")

### Release Notes

7. Under "Release notes", click **"Add release notes"**
8. Select language: **"en-US - English (United States)"**
9. Enter release notes:
   ```
   Initial release of LiteEvent
   
   Features:
   - Create and manage events
   - QR code check-in
   - Guest management
   - Contact import
   - Stripe payment integration
   - Google Sign-In
   ```

### Review Release

10. Click **"Next"** (bottom right)
11. Review the release summary
12. Click **"Start rollout to Internal testing"**

---

## 👥 Step 5: Add Testers

After creating the release:

1. Go to **"Testing"** → **"Internal testing"** → **"Testers"** tab
2. Click **"Create email list"**
3. Name it: "LiteEvent Beta Testers"
4. Add tester emails (comma-separated):
   ```
   joelswaku@gmail.com
   support@liteevent.com
   (add more testers as needed)
   ```
5. Save

6. Under "How testers join your test", you'll see a **testing link**
7. Copy this link and share with your testers

---

## 📲 Step 6: Test Your App

1. Open the testing link on your Android phone
2. Click **"Download it on Google Play"**
3. Install the app
4. Test all features:
   - ✅ Google Sign-In
   - ✅ Create event
   - ✅ Add guests
   - ✅ QR code check-in
   - ✅ Payment flow
   - ✅ Everything works!

---

## 🎉 Step 7: Promote to Production (After Testing)

Once you've tested and everything works:

1. Go to **"Release"** → **"Testing"** → **"Internal testing"**
2. Click **"Promote release"** → **"Production"**
3. Review and confirm
4. Your app goes live on Google Play! 🚀

**Review time**: Usually 1-7 days for first submission

---

## ⚠️ Common Issues & Solutions

### "Upload failed - Duplicate version"
- The version code already exists
- Increment version in `app.config.ts` and rebuild

### "Missing privacy policy"
- Add privacy policy URL in App content section
- Use: `https://liteevent.com/privacy`

### "Missing content rating"
- Complete content rating questionnaire
- Takes 5-10 minutes

### "Incomplete store listing"
- Make sure you have:
  - App icon
  - At least 2 screenshots
  - Short description
  - Full description
  - Feature graphic

---

## 📊 Build Information

**Your Production Build:**
- **Build ID**: 4cd9fa27-9d55-470b-9458-ae8acb774e4d
- **Version**: 1.0.0
- **Version Code**: 3
- **AAB URL**: https://expo.dev/artifacts/eas/YDa8x61KvrTbT3EyI3VVOJ3eYTsznXlUW_weLH3mj1g.aab
- **Build Logs**: https://expo.dev/accounts/okapiapp/projects/event-app/builds/4cd9fa27-9d55-470b-9458-ae8acb774e4d

**App Configuration:**
- **Package Name**: com.liteevent.mobile
- **API URL**: https://api.liteevent.com/api
- **Stripe**: LIVE keys configured ✅
- **Google OAuth**: Production credentials ✅

---

## 📞 Support

If you need help:
- **Email**: support@liteevent.com
- **Website**: https://liteevent.com
- **Developer**: joelswaku@gmail.com

---

## ✅ Checklist

Use this to track your progress:

### Pre-Submission
- [ ] Downloaded AAB file
- [ ] Completed store listing (name, descriptions)
- [ ] Uploaded app icon (512x512)
- [ ] Uploaded feature graphic (1024x500)
- [ ] Uploaded screenshots (min 2)
- [ ] Added privacy policy URL
- [ ] Selected app category
- [ ] Completed content rating
- [ ] Set target audience
- [ ] Completed data safety

### Internal Testing
- [ ] Created internal testing release
- [ ] Uploaded AAB
- [ ] Added release notes
- [ ] Created tester email list
- [ ] Added testers
- [ ] Shared testing link
- [ ] Tested app on device

### Production Release
- [ ] All features tested and working
- [ ] No critical bugs
- [ ] Ready to promote to production
- [ ] Promoted to production
- [ ] App live on Google Play! 🎉

---

**Good luck with your submission!** 🚀
