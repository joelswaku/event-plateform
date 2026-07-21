# Environment Variables

## API Service

### Core
```bash
NODE_ENV=production
PORT=5000
```

### Database (Auto-linked by Railway)
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### Security
```bash
# Generate with: openssl rand -base64 64
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<different-64-char-string>

CORS_ORIGIN=https://yourdomain.com,https://vendors.yourdomain.com
```

### Email (Resend)
```bash
RESEND_API_KEY=re_xxxxx
MAIL_FROM_EMAIL=notifications@yourdomain.com
MAIL_FROM_NAME=LiteEvent
```

### Payments (Stripe)
```bash
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_STARTER_PRICE_ID=price_live_xxxxx
STRIPE_PRO_PRICE_ID=price_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### File Storage (Cloudinary)
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### OAuth (Google)
```bash
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/google/callback
```

### Maps
```bash
VENDOR_GOOGLE_KEY=xxxxx
```

### AI (Optional)
```bash
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=us-east-1
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

## Web Service

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxx
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxx
```

## Vendors Service

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxx
```

## How to Add in Railway

1. Go to service → Variables tab
2. Click "New Variable"
3. Add name and value
4. For database URLs: Click "Add Reference" → Select Postgres/Redis
5. Save (auto-saves)
6. Redeploy for changes to take effect
