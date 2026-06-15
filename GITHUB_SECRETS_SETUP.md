# GitHub Secrets Configuration

## Required Secrets for Production Deployment

Go to: https://github.com/joelswaku/event-plateform/settings/secrets/actions

Click "New repository secret" and add each of the following:

### 1. AWS Account Configuration

```
Name:  AWS_ACCOUNT_ID
Value: 455697799547
```

### 2. Production API URL

```
Name:  PRODUCTION_API_URL
Value: https://api.liteevent.com
```

(Or during initial testing before DNS is configured, use the ALB:)
```
Value: http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com
```

### 3. Stripe Keys (Production)

**Stripe Publishable Key:**
```
Name:  PRODUCTION_STRIPE_PUBLISHABLE_KEY
Value: pk_live_YOURKEY
```

Or for testing:
```
Value: pk_test_51QW05xCPMSjFKKamC8hFLOqhYf8T6XDrCGcw9LIJpBWx...
```

**Stripe Secret Key:**
```
Name:  PRODUCTION_STRIPE_SECRET_KEY  
Value: sk_live_YOURKEY
```

Or for testing:
```
Value: sk_test_51QW05xCPMSjFKKamQZu7Wm4qXy...
```

---

## Optional Secrets (if needed)

### Google OAuth
```
Name:  PRODUCTION_GOOGLE_CLIENT_ID
Value: YOUR_CLIENT_ID.apps.googleusercontent.com
```

### Database URL (if migrations needed)
```
Name:  DATABASE_URL
Value: postgresql://liteevent_admin:PASSWORD@ENDPOINT:5432/liteevent_production
```

(Get the endpoint from Terraform output or AWS RDS console)

---

## GitHub Environment Setup

**CRITICAL**: You must create a production environment with manual approval!

1. Go to: https://github.com/joelswaku/event-plateform/settings/environments

2. Click "New environment"

3. Name: `production`

4. Configure protection rules:
   - ✅ Check "Required reviewers"
   - Add yourself as a reviewer
   - This ensures you manually approve each production deployment

5. Click "Save protection rules"

---

## Verify Configuration

After adding secrets, you can verify by:

1. Go to: https://github.com/joelswaku/event-plateform/settings/secrets/actions

2. You should see:
   - ✅ AWS_ACCOUNT_ID
   - ✅ PRODUCTION_API_URL
   - ✅ PRODUCTION_STRIPE_PUBLISHABLE_KEY

---

## Security Notes

🔒 **Never commit secrets to git!**
- All secrets are stored encrypted in GitHub
- They're only exposed to GitHub Actions during deployment
- Use environment variables in your code, never hardcode

🔑 **Production vs Test Keys:**
- Initially use Stripe test keys (`pk_test_` and `sk_test_`)
- Switch to live keys (`pk_live_` and `sk_live_`) when ready for real transactions

---

## Current Secret Values (from Terraform)

**DO NOT commit these!** They're shown here for your reference only:

### Database Password
```
sbEWVNFyyZZG5Idf3BOJQlMsLRx8UJDyprgFkko+VIc=
```

### JWT Secret
```
VMYMottIFmcNhh+acBjNuQLJuhy03p0D4/JXxQzDXSn1Sotgk1I9W1zZpmKBCoGDQGFX74d9xyfEbX87oAC9RQ==
```

### JWT Refresh Secret
```
MsZa7mISUMswbIIzGlZl+g9J1QhqwbsBYUHfF4v+v3szJoCGtu3oyGhIt2TJYdL/8rnTMeFhA2PVh00E6l8f3w==
```

These are already stored in AWS Secrets Manager and will be injected into your ECS tasks automatically.

---

## After Configuration

Once secrets are added, run:

```powershell
.\deploy-to-production.ps1
```

This will push your code and trigger the GitHub Actions deployment!
