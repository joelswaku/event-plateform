# 🔐 Complete GitHub Secrets Configuration

## Step-by-Step Instructions

### 1. Open GitHub Secrets Settings

Go to: **https://github.com/joelswaku/event-plateform/settings/secrets/actions**

Click the green **"New repository secret"** button for each secret below.

---

## 📋 REQUIRED SECRETS (Copy-Paste Ready)

### Secret #1: AWS Account ID
```
Name:  AWS_ACCOUNT_ID
Value: 455697799547
```

**Purpose:** Allows GitHub Actions to authenticate with your AWS account via OIDC

---

### Secret #2: Production API URL
```
Name:  PRODUCTION_API_URL
Value: https://api.liteevent.com
```

**Purpose:** Used by Web and Vendors frontends to connect to the API

**Alternative for testing before DNS:** Use the ALB URL temporarily
```
Value: http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com
```
(You can update this secret later once DNS is configured)

---

### Secret #3: Stripe Publishable Key (Public - Safe to expose)
```
Name:  PRODUCTION_STRIPE_PUBLISHABLE_KEY
Value: pk_test_51QMjXKGaoI7icxS6YOUR_PUBLISHABLE_KEY
```

**Purpose:** Used in Web/Vendors frontends for Stripe checkout

**Current Test Key from your .env:**
```
Value: pk_test_51QMjXKGaoI7icxS6WoXJzyRowWPiixobRqT9OYdDmGRuSm5l3Zu7nqHbrZ17KkyK3g6fiZtiYFJC1q5JIeXWWd6n00C7zVKory
```

**Note:** This is a TEST key (pk_test_). For production with real payments, replace with your LIVE key (pk_live_) from:
https://dashboard.stripe.com/apikeys

---

## 🎯 That's It! (Only 3 Secrets Required)

The production deployment workflow uses **GitHub OIDC** for AWS authentication, so you don't need AWS access keys!

All other secrets (database credentials, JWT secrets, Stripe secret key, etc.) are already stored in **AWS Secrets Manager** and will be automatically injected into your ECS containers.

---

## 🌍 IMPORTANT: Create Production Environment

**This is CRITICAL for manual approval before deployments!**

### 1. Go to Environments Settings
**https://github.com/joelswaku/event-plateform/settings/environments**

### 2. Click "New environment"

### 3. Configure:
```
Name: production
```

### 4. Add Protection Rules:
- ✅ Check "Required reviewers"
- Add your GitHub username as a reviewer
- (Optional) Add deployment branch rule: only `main` branch can deploy

### 5. Click "Save protection rules"

**Why this matters:** Without this environment, the workflow will fail because it expects manual approval before deploying to production.

---

## ✅ Verification Checklist

After adding secrets, verify in GitHub:

**Secrets (should show 3):**
- [ ] AWS_ACCOUNT_ID
- [ ] PRODUCTION_API_URL
- [ ] PRODUCTION_STRIPE_PUBLISHABLE_KEY

**Environment:**
- [ ] "production" environment exists
- [ ] You are listed as a required reviewer

---

## 🔒 Security Notes

### Already Secured in AWS Secrets Manager

These secrets are **already stored in AWS** and will be automatically injected:

✅ **Database Credentials**
```
Username: liteevent_admin
Password: sbEWVNFyyZZG5Idf3BOJQlMsLRx8UJDyprgFkko+VIc=
Endpoint: [Retrieved from RDS automatically]
```

✅ **JWT Secrets**
```
JWT_SECRET: VMYMottIFmcNhh+acBjNuQLJuhy03p0D4/JXxQzDXSn1Sotgk1I9W1zZpmKBCoGDQGFX74d9xyfEbX87oAC9RQ==
JWT_REFRESH_SECRET: MsZa7mISUMswbIIzGlZl+g9J1QhqwbsBYUHfF4v+v3szJoCGtu3oyGhIt2TJYdL/8rnTMeFhA2PVh00E6l8f3w==
```

✅ **Stripe Secret Key** (server-side, never exposed)
```
STRIPE_SECRET_KEY: sk_test_XXXXXXXXXX (stored in AWS Secrets Manager)
```

✅ **Google OAuth**
```
GOOGLE_CLIENT_ID: XXXXXX.apps.googleusercontent.com (stored in AWS Secrets Manager)
GOOGLE_CLIENT_SECRET: GOCSPX-XXXXXXXXXX (stored in AWS Secrets Manager)
```

✅ **Email Service (Resend)**
```
RESEND_API_KEY: re_XXXXXXXXXX (stored in AWS Secrets Manager)
```

✅ **Anthropic AI**
```
ANTHROPIC_API_KEY: sk-ant-XXXXXXXXXX (stored in AWS Secrets Manager)
```

These are configured in Terraform and stored in AWS Secrets Manager. Your ECS tasks will automatically have access to them.

---

## 🚀 After Adding Secrets - Deploy!

Once you've added the 3 required secrets and created the production environment:

```powershell
# From project root
.\deploy-to-production.ps1
```

This will:
1. ✅ Commit your changes
2. ✅ Push to GitHub main branch
3. ✅ Trigger GitHub Actions workflow
4. ✅ Wait for your approval
5. ✅ Build and deploy to AWS

---

## 📊 How GitHub Actions Uses These Secrets

### During Build Phase:
```yaml
# Web & Vendors Docker builds use:
NEXT_PUBLIC_API_URL: ${{ secrets.PRODUCTION_API_URL }}
NEXT_PUBLIC_STRIPE_KEY: ${{ secrets.PRODUCTION_STRIPE_PUBLISHABLE_KEY }}
```

### During Deployment:
```yaml
# AWS OIDC authentication:
role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/liteevent-production-github-actions
```

### At Runtime (ECS):
AWS Secrets Manager automatically injects all other secrets into your containers as environment variables.

---

## 🔄 Updating Secrets Later

To update a secret:
1. Go to: https://github.com/joelswaku/event-plateform/settings/secrets/actions
2. Click on the secret name
3. Click "Update secret"
4. Enter new value and save

**Common updates:**
- Switch from Stripe test keys to live keys before production launch
- Update API URL after configuring custom domain DNS

---

## 📞 Troubleshooting

### "Secret not found" error during deployment:
- Double-check secret names match exactly (case-sensitive)
- Verify you're adding them as **repository secrets**, not environment secrets

### "Environment protection rules not configured":
- Make sure you created the `production` environment (not `Production` or `prod`)
- Environment name must match exactly what's in the workflow file

### Deployment waiting forever:
- Check if you need to approve it manually in GitHub Actions
- Go to: https://github.com/joelswaku/event-plateform/actions
- Click the running workflow → "Review deployments" → Approve

---

## ✅ Quick Verification

After adding all secrets, this command should show all 3:

**GitHub UI:** https://github.com/joelswaku/event-plateform/settings/secrets/actions

You should see:
```
Repository secrets (3)
├── AWS_ACCOUNT_ID
├── PRODUCTION_API_URL
└── PRODUCTION_STRIPE_PUBLISHABLE_KEY
```

**Environment:** https://github.com/joelswaku/event-plateform/settings/environments

You should see:
```
Environments
└── production (Protected)
    └── Required reviewers: [your-username]
```

---

## 🎉 Ready to Deploy!

Once secrets are configured:

```powershell
.\deploy-to-production.ps1
```

The script will push your code and open GitHub Actions where you'll approve the deployment!

---

**Last Updated:** June 14, 2026  
**Status:** Configuration Ready ✅
