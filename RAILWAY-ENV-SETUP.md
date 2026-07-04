# Railway Environment Variables Setup

This guide provides the exact commands to configure all environment variables in Railway.

## 🚀 Quick Setup Script

Save and run this PowerShell script to set all variables at once:

### Option 1: Interactive Setup

```powershell
# Navigate to your project
cd c:\projects\event-plateform\api

# Login to Railway
railway login

# Link to your project (if not already linked)
railway link

# Set all environment variables
railway variables set NODE_ENV=production
railway variables set PORT=5000

# Database (automatically set by Railway PostgreSQL plugin)
# DATABASE_URL is set automatically when you add the PostgreSQL plugin

# Redis (automatically set by Railway Redis plugin)
# REDIS_URL is set automatically when you add the Redis plugin

# Generate and set JWT secrets
railway variables set JWT_SECRET=$(openssl rand -base64 64)
railway variables set JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# CORS and URLs (update with your actual domains)
railway variables set CORS_ORIGIN="https://liteevent.com,https://www.liteevent.com,https://vendors.liteevent.com"
railway variables set FRONTEND_URL="https://liteevent.com"
railway variables set VENDOR_APP_URL="https://vendors.liteevent.com"

# Email (Resend)
railway variables set RESEND_API_KEY="YOUR_RESEND_API_KEY"
railway variables set MAIL_FROM_EMAIL="notifications@liteevent.com"
railway variables set MAIL_FROM_NAME="LiteEvent"

# Google OAuth
railway variables set GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
railway variables set GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
railway variables set GOOGLE_REDIRECT_URI="https://api.liteevent.com/auth/google/callback"

# Google Maps
railway variables set VENDOR_GOOGLE_KEY="YOUR_GOOGLE_MAPS_API_KEY"

# Stripe
railway variables set STRIPE_SECRET_KEY="sk_live_YOUR_SECRET_KEY"
railway variables set STRIPE_STARTER_PRICE_ID="price_live_YOUR_STARTER_PRICE"
railway variables set STRIPE_PRO_PRICE_ID="price_live_YOUR_PRO_PRICE"
railway variables set STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"

# Anthropic AI
railway variables set ANTHROPIC_API_KEY="sk-ant-api03-YOUR_KEY"

# Cloudinary
railway variables set CLOUDINARY_CLOUD_NAME="your_cloud_name"
railway variables set CLOUDINARY_API_KEY="your_api_key"
railway variables set CLOUDINARY_API_SECRET="your_api_secret"

# AWS (for Bedrock AI features)
railway variables set AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY"
railway variables set AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_KEY"
railway variables set AWS_REGION="us-east-1"

# Optional: SMS/WhatsApp
railway variables set BREVO_SMS_SENDER="LiteEvent"
railway variables set BREVO_WHATSAPP_TEMPLATE_INVITE="0"
railway variables set BREVO_WHATSAPP_TEMPLATE_RSVP="0"

# Security & Rate Limiting
railway variables set RATE_LIMIT_MAX="100"
railway variables set SESSION_EXPIRY="604800000"
railway variables set LOG_LEVEL="info"
```

### Option 2: Use Railway Dashboard

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on the **API service**
4. Go to **Variables** tab
5. Add variables one by one using the table below

## 📋 Environment Variables Reference

| Variable | Value | Source | Required |
|----------|-------|--------|----------|
| `NODE_ENV` | `production` | Manual | ✅ |
| `PORT` | `5000` | Manual | ✅ |
| `DATABASE_URL` | Auto-set by Railway | PostgreSQL Plugin | ✅ |
| `REDIS_URL` | Auto-set by Railway | Redis Plugin | ✅ |
| `JWT_SECRET` | 64-char random string | Generate with `openssl rand -base64 64` | ✅ |
| `JWT_REFRESH_SECRET` | 64-char random string (different) | Generate with `openssl rand -base64 64` | ✅ |
| `CORS_ORIGIN` | Your frontend domains | Your DNS | ✅ |
| `FRONTEND_URL` | `https://liteevent.com` | Your DNS | ✅ |
| `VENDOR_APP_URL` | `https://vendors.liteevent.com` | Your DNS | ✅ |
| `RESEND_API_KEY` | `re_xxxxx` | [resend.com/api-keys](https://resend.com/api-keys) | ✅ |
| `MAIL_FROM_EMAIL` | `notifications@liteevent.com` | Verified in Resend | ✅ |
| `MAIL_FROM_NAME` | `LiteEvent` | Manual | ✅ |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | [Google Console](https://console.cloud.google.com/apis/credentials) | ✅ |
| `GOOGLE_CLIENT_SECRET` | OAuth Secret | [Google Console](https://console.cloud.google.com/apis/credentials) | ✅ |
| `GOOGLE_REDIRECT_URI` | `https://api.liteevent.com/auth/google/callback` | Manual | ✅ |
| `VENDOR_GOOGLE_KEY` | Maps API Key | [Google Console](https://console.cloud.google.com/apis/credentials) | ✅ |
| `STRIPE_SECRET_KEY` | `sk_live_xxxxx` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) | ✅ |
| `STRIPE_STARTER_PRICE_ID` | `price_live_xxxxx` | [Stripe Products](https://dashboard.stripe.com/products) | ✅ |
| `STRIPE_PRO_PRICE_ID` | `price_live_xxxxx` | [Stripe Products](https://dashboard.stripe.com/products) | ✅ |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxxxx` | [Stripe Webhooks](https://dashboard.stripe.com/webhooks) | ✅ |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-xxxxx` | [Anthropic Console](https://console.anthropic.com/settings/keys) | ⚠️ |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | [Cloudinary Console](https://cloudinary.com/console) | ✅ |
| `CLOUDINARY_API_KEY` | Your API key | [Cloudinary Console](https://cloudinary.com/console) | ✅ |
| `CLOUDINARY_API_SECRET` | Your API secret | [Cloudinary Console](https://cloudinary.com/console) | ✅ |
| `AWS_ACCESS_KEY_ID` | Your access key | [AWS IAM](https://console.aws.amazon.com/iam/) | ⚠️ |
| `AWS_SECRET_ACCESS_KEY` | Your secret key | [AWS IAM](https://console.aws.amazon.com/iam/) | ⚠️ |
| `AWS_REGION` | `us-east-1` | Manual | ⚠️ |
| `RATE_LIMIT_MAX` | `100` | Manual | Optional |
| `SESSION_EXPIRY` | `604800000` | Manual | Optional |
| `LOG_LEVEL` | `info` | Manual | Optional |

**Legend:**
- ✅ Required for core functionality
- ⚠️ Required only if using AI features

## 🔐 Generating Secure Secrets

### JWT Secrets (Required)

```bash
# Generate JWT_SECRET
openssl rand -base64 64

# Generate JWT_REFRESH_SECRET (run again for different value)
openssl rand -base64 64
```

### Alternative (PowerShell)

```powershell
# Generate random secret
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

## 🔗 Service-Specific Variables

### API Service
All variables listed above apply to the API service.

### Web Service

```bash
cd ../web
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_API_URL="https://api.liteevent.com/api"
railway variables set NEXT_PUBLIC_APP_URL="https://liteevent.com"
railway variables set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxxxx"
railway variables set NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID="price_live_xxxxx"
railway variables set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_live_xxxxx"
railway variables set NEXT_PUBLIC_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
railway variables set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
```

### Vendors Service

```bash
cd ../vendors
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_API_URL="https://api.liteevent.com/api"
railway variables set NEXT_PUBLIC_APP_URL="https://vendors.liteevent.com"
railway variables set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
```

## 📦 Database & Redis Setup

### Add PostgreSQL

```bash
# Navigate to API directory
cd c:\projects\event-plateform\api

# Add PostgreSQL plugin
railway add

# Select: PostgreSQL
```

This automatically sets the `DATABASE_URL` variable.

### Add Redis

```bash
# Add Redis plugin
railway add

# Select: Redis
```

This automatically sets the `REDIS_URL` variable.

### Verify Variables

```bash
# View all variables
railway variables

# Verify specific variable
railway variables --service api | grep DATABASE_URL
```

## 🔄 Update Variables

```bash
# Update a single variable
railway variables set STRIPE_SECRET_KEY="new_key_value"

# Delete a variable
railway variables delete OLD_VARIABLE_NAME

# Copy variables from one service to another
railway variables --service api > api-vars.txt
# Manually copy and set to other service
```

## 🧪 Testing Configuration

After setting variables, verify your deployment:

```bash
# View deployment logs
railway logs --service api

# Test health endpoint
curl https://your-api-domain.railway.app/health

# Run a command in the deployed environment
railway run --service api node -e "console.log(process.env.NODE_ENV)"
```

## 🚨 Common Issues

### Missing DATABASE_URL
**Solution:** Ensure PostgreSQL plugin is added and linked to your service.

### CORS Errors
**Solution:** Ensure `CORS_ORIGIN` includes all your frontend domains with proper protocol (`https://`).

### Authentication Fails
**Solution:** 
- Check `JWT_SECRET` is set
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Ensure `GOOGLE_REDIRECT_URI` matches your actual API domain

### Email Not Sending
**Solution:**
- Verify `RESEND_API_KEY` is correct
- Ensure `MAIL_FROM_EMAIL` is verified in Resend dashboard

### Stripe Webhook Fails
**Solution:**
- Create webhook endpoint: `https://api.liteevent.com/api/subscription/webhook`
- Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## 📝 Migration from AWS

If you have variables in AWS (GitHub Secrets), use this mapping:

| AWS/GitHub Secret | Railway Variable |
|-------------------|------------------|
| `DATABASE_URL` | Same (set by PostgreSQL plugin) |
| `REDIS_URL` | Same (set by Redis plugin) |
| All other vars | Same names |

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong secrets** - Minimum 64 characters for JWT
3. **Rotate secrets** - Change JWT secrets periodically
4. **Use live keys** - Ensure Stripe uses `sk_live_` not `sk_test_`
5. **Verify domains** - Ensure all email domains verified
6. **Enable 2FA** - On Railway, Stripe, Google, AWS accounts

## 📞 Need Help?

- **Railway CLI**: `railway help`
- **Railway Docs**: https://docs.railway.app/develop/variables
- **List variables**: `railway variables`
- **Service logs**: `railway logs --service api`
