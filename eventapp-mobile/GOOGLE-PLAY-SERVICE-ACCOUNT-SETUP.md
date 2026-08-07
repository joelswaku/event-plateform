# Google Play Service Account Setup Guide

This guide will help you create a service account for automatic app submission to Google Play.

---

## Step 1: Create Service Account in Google Cloud Console

1. Go to: https://console.cloud.google.com/iam-admin/servicSwama2410@accounts
2. **Select your project** (or create a new one if needed)
3. Click **"+ CREATE SERVICE ACCOUNT"**
4. Fill in:
   - **Service account name**: `google-play-upload`
   - **Service account ID**: `google-play-upload` (auto-filled)
   - **Description**: "Service account for uploading to Google Play via EAS"
5. Click **"CREATE AND CONTINUE"**
6. **Skip** the "Grant this service account access to project" step (click "CONTINUE")
7. **Skip** the "Grant users access to this service account" step (click "DONE")

---

## Step 2: Create JSON Key

1. In the service accounts list, find the account you just created
2. Click on the service account email (e.g., `google-play-upload@your-project.iam.gserviceaccount.com`)
3. Go to the **"KEYS"** tab
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"CREATE"**
7. A JSON file will download automatically - **save this file securely!**

---

## Step 3: Enable Google Play API Access

1. Go to: https://console.cloud.google.com/apis/library
2. Search for **"Google Play Android Developer API"**
3. Click on it
4. Click **"ENABLE"**
5. Wait for it to be enabled (takes a few seconds)

---

## Step 4: Grant Access in Google Play Console

1. Go to: https://play.google.com/console
2. Select your **LiteEvent** app
3. Go to **"Setup"** → **"API access"** (in left sidebar)
4. Under "Service accounts", click **"Link service account"**
5. Click **"Grant access"** next to your service account
6. On the permissions page, grant these permissions:
   - ✅ **View app information and download bulk reports (read-only)**
   - ✅ **Create and edit draft releases**
   - ✅ **Release to testing tracks**
   - ✅ **Release to production, exclude and recall releases**
7. Click **"Invite user"**
8. Click **"Apply"**

---

## Step 5: Save JSON Key to Mobile Project

1. Copy the downloaded JSON file to your mobile project:
   ```bash
   # Windows
   copy C:\Users\YourName\Downloads\your-project-xxxxx-xxxxxxxxxx.json C:\projects\event-plateform\eventapp-mobile\google-play-service-account.json
   
   # Or manually move it to:
   # C:\projects\event-plateform\eventapp-mobile\google-play-service-account.json
   ```

2. **IMPORTANT**: This file is already in `.gitignore` - never commit it to Git!

---

## Step 6: Verify Setup

Run this command to test:
```bash
cd eventapp-mobile
eas submit --platform android --latest --profile production
```

If everything is set up correctly, EAS will automatically upload your app to Google Play Internal Testing track.

---

## ⚠️ Security Notes

- ✅ The JSON key file is already in `.gitignore`
- ❌ Never commit this file to Git
- ❌ Never share this file publicly
- ✅ Keep it secure on your local machine
- ✅ You can revoke and regenerate keys anytime in Google Cloud Console

---

## Troubleshooting

### "Service account not found"
- Make sure you linked the service account in Google Play Console (Step 4)
- Wait 5-10 minutes after linking for changes to propagate

### "Insufficient permissions"
- Verify you granted all the permissions listed in Step 4
- Make sure you clicked "Apply" after setting permissions

### "API not enabled"
- Make sure Google Play Android Developer API is enabled (Step 3)
- Wait a few minutes after enabling

---

## Quick Reference

**Service Account Email**: `google-play-upload@YOUR-PROJECT.iam.gserviceaccount.com`

**JSON Key Location**: `C:\projects\event-plateform\eventapp-mobile\google-play-service-account.json`

**Submit Command**: 
```bash
cd eventapp-mobile
eas submit --platform android --latest --profile production
```

---

**Once you complete these steps, you'll be able to automatically submit builds to Google Play!** 🚀
