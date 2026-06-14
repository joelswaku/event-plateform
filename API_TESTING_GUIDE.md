# 🧪 LiteEvent API Testing Guide

**Complete guide to test all API endpoints before deploying web and mobile apps.**

---

## 📋 What to Test

### Core Features
- ✅ User signup
- ✅ User login
- ✅ JWT authentication
- ✅ Google OAuth login
- ✅ Event CRUD (Create, Read, Update, Delete)
- ✅ Ticket CRUD
- ✅ Stripe payments
- ✅ Email sending (SES)
- ✅ File uploads (S3)

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install tools
brew install curl jq  # macOS
# OR
apt-get install curl jq  # Linux

# Set API URL
export API_URL="https://api.liteevent.com"
# OR for local testing:
# export API_URL="http://localhost:5000"
```

---

## 1️⃣ User Signup

### Test: Create New User

```bash
curl -X POST $API_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }' | jq
```

### Expected Response (201 Created):

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "createdAt": "2026-06-13T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Verify:

- ✅ Returns 201 status code
- ✅ Returns JWT token
- ✅ User object contains correct data
- ✅ Password is NOT returned
- ✅ **Email sent** (check inbox for welcome email via SES)

### Test Email Sending:

```
Check inbox: test@example.com
Subject: "Welcome to LiteEvent!"
From: noreply@liteevent.com (via SES)
```

---

## 2️⃣ User Login

### Test: Login with Email/Password

```bash
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }' | jq
```

### Expected Response (200 OK):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Save Token for Later Tests:

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Verify:

- ✅ Returns 200 status code
- ✅ Returns valid JWT token
- ✅ User object matches signup data

### Test Invalid Login:

```bash
# Wrong password
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }' | jq
```

### Expected Response (401 Unauthorized):

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 3️⃣ JWT Authentication

### Test: Protected Endpoint

```bash
# Get current user profile (requires JWT)
curl -X GET $API_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Expected Response (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

### Test Unauthorized Access:

```bash
# No token
curl -X GET $API_URL/api/auth/me | jq
```

### Expected Response (401 Unauthorized):

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Test Invalid Token:

```bash
# Invalid token
curl -X GET $API_URL/api/auth/me \
  -H "Authorization: Bearer invalid-token-here" | jq
```

### Expected Response (401 Unauthorized):

```json
{
  "success": false,
  "message": "Invalid token"
}
```

### Verify:

- ✅ Valid token grants access
- ✅ No token returns 401
- ✅ Invalid token returns 401
- ✅ Token contains user ID and role

---

## 4️⃣ Google OAuth Login

### Test: Google Login Flow

**Step 1: Get Google OAuth URL**

```bash
curl -X GET $API_URL/api/auth/google/url | jq
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=..."
  }
}
```

**Step 2: Simulate Google Callback**

```bash
# This happens automatically when user approves in browser
# Google redirects to: /api/auth/google/callback?code=AUTH_CODE

# For testing, you need to:
# 1. Open the Google URL in browser
# 2. Approve access
# 3. Get redirected back with code
# 4. Exchange code for token
```

**Step 3: Verify Google User Created**

```bash
# After Google login, verify user exists
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-google-email@gmail.com",
    "password": "not-needed-for-google"
  }' | jq
```

### Manual Testing Required:

1. Open browser
2. Go to: `https://liteevent.com/login`
3. Click "Sign in with Google"
4. Approve Google access
5. Verify redirect back to app
6. Check JWT token received

### Verify:

- ✅ Google OAuth URL generated
- ✅ User can approve in browser
- ✅ Callback creates/logs in user
- ✅ JWT token returned
- ✅ User profile populated from Google

---

## 5️⃣ Event CRUD

### Test: Create Event

```bash
curl -X POST $API_URL/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Conference 2026",
    "description": "A test event to verify API functionality",
    "location": "San Francisco, CA",
    "startDate": "2026-07-15T09:00:00Z",
    "endDate": "2026-07-15T17:00:00Z",
    "timezone": "America/Los_Angeles",
    "category": "conference",
    "capacity": 100,
    "isPublic": true
  }' | jq
```

### Expected Response (201 Created):

```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "event-uuid-here",
    "title": "Test Conference 2026",
    "description": "A test event to verify API functionality",
    "location": "San Francisco, CA",
    "startDate": "2026-07-15T09:00:00.000Z",
    "endDate": "2026-07-15T17:00:00.000Z",
    "timezone": "America/Los_Angeles",
    "category": "conference",
    "capacity": 100,
    "isPublic": true,
    "organizerId": "uuid-here",
    "createdAt": "2026-06-13T..."
  }
}
```

### Save Event ID:

```bash
export EVENT_ID="event-uuid-here"
```

### Test: Get All Events (Public)

```bash
# No auth required for public events
curl -X GET $API_URL/api/events | jq
```

### Expected Response (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "event-uuid-here",
      "title": "Test Conference 2026",
      "description": "A test event...",
      "location": "San Francisco, CA",
      "startDate": "2026-07-15T09:00:00.000Z",
      "isPublic": true,
      "organizer": {
        "id": "uuid-here",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

### Test: Get Single Event

```bash
curl -X GET $API_URL/api/events/$EVENT_ID | jq
```

### Expected Response (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "event-uuid-here",
    "title": "Test Conference 2026",
    "description": "A test event...",
    "tickets": [
      {
        "id": "ticket-uuid",
        "name": "General Admission",
        "price": 50.00
      }
    ],
    "organizer": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Test: Update Event

```bash
curl -X PUT $API_URL/api/events/$EVENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Conference 2026 - Updated",
    "capacity": 150
  }' | jq
```

### Expected Response (200 OK):

```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "id": "event-uuid-here",
    "title": "Test Conference 2026 - Updated",
    "capacity": 150
  }
}
```

### Test: Delete Event

```bash
curl -X DELETE $API_URL/api/events/$EVENT_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Expected Response (200 OK):

```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

### Verify:

- ✅ Create event returns 201
- ✅ Only authenticated users can create
- ✅ Public events visible without auth
- ✅ Event details returned correctly
- ✅ Update modifies fields
- ✅ Delete removes event
- ✅ Only organizer can update/delete

---

## 6️⃣ Ticket CRUD

### Test: Create Ticket Type

```bash
curl -X POST $API_URL/api/events/$EVENT_ID/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "General Admission",
    "description": "Standard entry ticket",
    "price": 50.00,
    "quantity": 100,
    "salesStart": "2026-06-13T00:00:00Z",
    "salesEnd": "2026-07-14T23:59:59Z"
  }' | jq
```

### Expected Response (201 Created):

```json
{
  "success": true,
  "message": "Ticket type created successfully",
  "data": {
    "id": "ticket-type-uuid",
    "eventId": "event-uuid-here",
    "name": "General Admission",
    "description": "Standard entry ticket",
    "price": 50.00,
    "quantity": 100,
    "quantitySold": 0,
    "salesStart": "2026-06-13T00:00:00.000Z",
    "salesEnd": "2026-07-14T23:59:59.000Z"
  }
}
```

### Save Ticket Type ID:

```bash
export TICKET_TYPE_ID="ticket-type-uuid"
```

### Test: Get Ticket Types for Event

```bash
curl -X GET $API_URL/api/events/$EVENT_ID/tickets | jq
```

### Expected Response (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "ticket-type-uuid",
      "name": "General Admission",
      "price": 50.00,
      "quantity": 100,
      "quantitySold": 0,
      "available": 100
    }
  ]
}
```

### Test: Update Ticket Type

```bash
curl -X PUT $API_URL/api/events/$EVENT_ID/tickets/$TICKET_TYPE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 45.00,
    "quantity": 150
  }' | jq
```

### Test: Delete Ticket Type

```bash
curl -X DELETE $API_URL/api/events/$EVENT_ID/tickets/$TICKET_TYPE_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Verify:

- ✅ Create ticket type returns 201
- ✅ Price stored as decimal
- ✅ Quantity tracking works
- ✅ Update modifies fields
- ✅ Delete removes ticket type
- ✅ Only event organizer can manage tickets

---

## 7️⃣ Stripe Payments

### Test: Create Payment Intent

```bash
curl -X POST $API_URL/api/payments/create-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "'$EVENT_ID'",
    "ticketTypeId": "'$TICKET_TYPE_ID'",
    "quantity": 2,
    "email": "buyer@example.com"
  }' | jq
```

### Expected Response (200 OK):

```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_yyy",
    "paymentIntentId": "pi_xxx",
    "amount": 10000,
    "currency": "usd",
    "orderId": "order-uuid-here"
  }
}
```

### Test: Confirm Payment (Stripe Test Card)

```bash
# This would typically happen in frontend with Stripe.js
# For testing, use Stripe CLI:

stripe payment_intents confirm pi_xxx \
  --payment-method pm_card_visa
```

### Test: Payment Webhook

```bash
# Stripe sends webhook when payment succeeds
# POST /api/webhooks/stripe
# Event: payment_intent.succeeded

# Use Stripe CLI to test:
stripe listen --forward-to $API_URL/api/webhooks/stripe
```

### Verify Payment Webhook Handling:

```bash
# Trigger test webhook
stripe trigger payment_intent.succeeded
```

### Check Order Created:

```bash
curl -X GET $API_URL/api/orders \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Expected Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "order-uuid",
      "eventId": "event-uuid",
      "userId": "user-uuid",
      "status": "completed",
      "totalAmount": 100.00,
      "paymentIntentId": "pi_xxx",
      "tickets": [
        {
          "id": "ticket-uuid-1",
          "qrCode": "https://...",
          "status": "valid"
        },
        {
          "id": "ticket-uuid-2",
          "qrCode": "https://...",
          "status": "valid"
        }
      ]
    }
  ]
}
```

### Test Stripe Test Cards:

```bash
# Success
Card: 4242 4242 4242 4242
CVV: 123
Expiry: 12/28

# Decline
Card: 4000 0000 0000 0002

# Requires authentication (3D Secure)
Card: 4000 0025 0000 3155
```

### Verify:

- ✅ Payment intent created
- ✅ Amount calculated correctly (price × quantity)
- ✅ Stripe client secret returned
- ✅ Webhook received and processed
- ✅ Order created after payment
- ✅ Tickets generated with QR codes
- ✅ **Email sent** with ticket confirmation (SES)

---

## 8️⃣ Email Sending (SES)

### Test: Welcome Email (Already tested in signup)

```
Trigger: POST /api/auth/signup
Expected: Welcome email sent via SES
```

### Test: Ticket Confirmation Email

```
Trigger: Successful payment
Expected: Email with QR code tickets
```

### Test: Event Update Email

```bash
curl -X POST $API_URL/api/events/$EVENT_ID/notify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Event Update: Venue Changed",
    "message": "The venue has been changed to a larger location."
  }' | jq
```

### Expected: Email sent to all ticket holders

### Verify SES Sending:

```bash
# Check SES sending stats
aws ses get-send-statistics

# Check if domain verified
aws ses get-identity-verification-attributes \
  --identities liteevent.com
```

### Test Email Types:

| Email Type | Trigger | Template |
|------------|---------|----------|
| Welcome | User signup | welcome.html |
| Email verification | Signup (if enabled) | verify-email.html |
| Password reset | Forgot password | reset-password.html |
| Ticket confirmation | Payment success | ticket-confirmation.html |
| Event reminder | 24h before event | event-reminder.html |
| Event update | Organizer notification | event-update.html |

### Verify:

- ✅ All emails sent via SES (not SMTP)
- ✅ From address: noreply@liteevent.com
- ✅ SPF/DKIM configured (check email headers)
- ✅ Emails not landing in spam
- ✅ Unsubscribe link included
- ✅ HTML templates render correctly

---

## 9️⃣ File Uploads (S3)

### Test: Upload Event Image

```bash
# Upload event cover image
curl -X POST $API_URL/api/events/$EVENT_ID/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/event-image.jpg" | jq
```

### Expected Response (200 OK):

```json
{
  "success": true,
  "data": {
    "url": "https://liteevent-production-assets.s3.us-east-1.amazonaws.com/events/event-uuid/cover.jpg",
    "key": "events/event-uuid/cover.jpg"
  }
}
```

### Test: Upload Profile Picture

```bash
curl -X POST $API_URL/api/users/profile/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/profile.jpg" | jq
```

### Expected Response (200 OK):

```json
{
  "success": true,
  "data": {
    "url": "https://liteevent-production-assets.s3.us-east-1.amazonaws.com/users/user-uuid/profile.jpg",
    "key": "users/user-uuid/profile.jpg"
  }
}
```

### Test: File Validation

```bash
# Test file size limit (should reject > 5MB)
curl -X POST $API_URL/api/events/$EVENT_ID/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/large-file.jpg" | jq
```

### Expected Response (400 Bad Request):

```json
{
  "success": false,
  "message": "File size exceeds 5MB limit"
}
```

### Test: Invalid File Type

```bash
# Test non-image file
curl -X POST $API_URL/api/events/$EVENT_ID/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/document.pdf" | jq
```

### Expected Response (400 Bad Request):

```json
{
  "success": false,
  "message": "Only image files are allowed (jpg, png, webp)"
}
```

### Verify S3 Storage:

```bash
# List uploaded files
aws s3 ls s3://liteevent-production-assets/events/

# Check file accessibility
curl -I https://liteevent-production-assets.s3.us-east-1.amazonaws.com/events/event-uuid/cover.jpg
```

### Verify:

- ✅ Files uploaded to S3
- ✅ Public URLs returned
- ✅ Images accessible via CloudFront (if configured)
- ✅ File size validation (max 5MB)
- ✅ File type validation (jpg, png, webp only)
- ✅ Unique filenames (no overwrites)
- ✅ S3 bucket permissions correct (public read)

---

## 🔟 Additional Tests

### Test: QR Code Check-In

```bash
# Get ticket details by QR code
curl -X GET $API_URL/api/tickets/scan/$TICKET_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid",
    "eventId": "event-uuid",
    "userId": "user-uuid",
    "status": "valid",
    "checkedIn": false,
    "attendee": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "test@example.com"
    }
  }
}
```

### Test: Check-In Ticket

```bash
curl -X POST $API_URL/api/tickets/$TICKET_ID/check-in \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Expected Response:

```json
{
  "success": true,
  "message": "Ticket checked in successfully",
  "data": {
    "checkedIn": true,
    "checkedInAt": "2026-06-13T10:30:00.000Z"
  }
}
```

### Test: Prevent Double Check-In

```bash
# Try checking in same ticket again
curl -X POST $API_URL/api/tickets/$TICKET_ID/check-in \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Expected Response (400 Bad Request):

```json
{
  "success": false,
  "message": "Ticket already checked in"
}
```

---

## 📊 Complete Test Script

**Create `test-api.sh`:**

```bash
#!/bin/bash

# LiteEvent API Test Script
# Tests all core functionality

set -e  # Exit on error

API_URL="${API_URL:-https://api.liteevent.com}"
EMAIL="test-$(date +%s)@example.com"
PASSWORD="SecurePassword123!"

echo "🧪 Testing LiteEvent API"
echo "API URL: $API_URL"
echo "======================="
echo ""

# 1. Test Signup
echo "1️⃣ Testing user signup..."
SIGNUP_RESPONSE=$(curl -s -X POST $API_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\"
  }")

TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.data.token')
if [ "$TOKEN" != "null" ]; then
  echo "✅ Signup successful"
else
  echo "❌ Signup failed"
  echo $SIGNUP_RESPONSE | jq
  exit 1
fi

# 2. Test Login
echo "2️⃣ Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
if [ "$TOKEN" != "null" ]; then
  echo "✅ Login successful"
else
  echo "❌ Login failed"
  exit 1
fi

# 3. Test JWT Auth
echo "3️⃣ Testing JWT authentication..."
ME_RESPONSE=$(curl -s -X GET $API_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN")

USER_ID=$(echo $ME_RESPONSE | jq -r '.data.id')
if [ "$USER_ID" != "null" ]; then
  echo "✅ JWT authentication working"
else
  echo "❌ JWT authentication failed"
  exit 1
fi

# 4. Test Create Event
echo "4️⃣ Testing event creation..."
EVENT_RESPONSE=$(curl -s -X POST $API_URL/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "description": "API test event",
    "location": "Test Location",
    "startDate": "2026-07-15T09:00:00Z",
    "endDate": "2026-07-15T17:00:00Z",
    "category": "conference",
    "capacity": 100,
    "isPublic": true
  }')

EVENT_ID=$(echo $EVENT_RESPONSE | jq -r '.data.id')
if [ "$EVENT_ID" != "null" ]; then
  echo "✅ Event created: $EVENT_ID"
else
  echo "❌ Event creation failed"
  exit 1
fi

# 5. Test Get Events
echo "5️⃣ Testing get events..."
EVENTS_RESPONSE=$(curl -s -X GET $API_URL/api/events)
EVENT_COUNT=$(echo $EVENTS_RESPONSE | jq '.data | length')
if [ "$EVENT_COUNT" -gt 0 ]; then
  echo "✅ Events retrieved: $EVENT_COUNT events"
else
  echo "❌ Get events failed"
  exit 1
fi

# 6. Test Create Ticket Type
echo "6️⃣ Testing ticket creation..."
TICKET_RESPONSE=$(curl -s -X POST $API_URL/api/events/$EVENT_ID/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "General Admission",
    "price": 50.00,
    "quantity": 100
  }')

TICKET_TYPE_ID=$(echo $TICKET_RESPONSE | jq -r '.data.id')
if [ "$TICKET_TYPE_ID" != "null" ]; then
  echo "✅ Ticket type created: $TICKET_TYPE_ID"
else
  echo "❌ Ticket creation failed"
  exit 1
fi

# 7. Test Payment Intent
echo "7️⃣ Testing Stripe payment intent..."
PAYMENT_RESPONSE=$(curl -s -X POST $API_URL/api/payments/create-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"ticketTypeId\": \"$TICKET_TYPE_ID\",
    \"quantity\": 2,
    \"email\": \"$EMAIL\"
  }")

CLIENT_SECRET=$(echo $PAYMENT_RESPONSE | jq -r '.data.clientSecret')
if [ "$CLIENT_SECRET" != "null" ]; then
  echo "✅ Payment intent created"
else
  echo "❌ Payment intent failed"
  exit 1
fi

# 8. Test Health Check
echo "8️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -X GET $API_URL/health)
STATUS=$(echo $HEALTH_RESPONSE | jq -r '.status')
if [ "$STATUS" = "ok" ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  exit 1
fi

echo ""
echo "======================="
echo "✅ All tests passed!"
echo "======================="
echo ""
echo "Summary:"
echo "- User signup: ✅"
echo "- User login: ✅"
echo "- JWT auth: ✅"
echo "- Event CRUD: ✅"
echo "- Ticket CRUD: ✅"
echo "- Stripe payments: ✅"
echo ""
echo "Manual tests needed:"
echo "- Google OAuth (browser)"
echo "- Email sending (check inbox)"
echo "- File uploads (requires file)"
echo ""
```

**Make executable:**

```bash
chmod +x test-api.sh
```

**Run tests:**

```bash
# Test production
export API_URL="https://api.liteevent.com"
./test-api.sh

# OR test local
export API_URL="http://localhost:5000"
./test-api.sh
```

---

## ✅ Pre-Deployment Checklist

Before deploying web/mobile, verify:

### Core Functionality
- [ ] User signup works
- [ ] User login works
- [ ] JWT authentication works
- [ ] Google OAuth works (manual test)
- [ ] Event CRUD works
- [ ] Ticket CRUD works
- [ ] Stripe payments work (test mode)
- [ ] Stripe webhooks work
- [ ] Email sending works (SES)
- [ ] File uploads work (S3)

### Email Templates
- [ ] Welcome email sent
- [ ] Ticket confirmation email sent
- [ ] Event reminder email sent
- [ ] Password reset email sent
- [ ] All emails render correctly
- [ ] No emails in spam folder

### Payment Flow
- [ ] Payment intent created
- [ ] Test card accepted
- [ ] Webhook received
- [ ] Order created
- [ ] Tickets generated
- [ ] QR codes generated
- [ ] Confirmation email sent

### Security
- [ ] CORS configured for web/mobile
- [ ] JWT expires after 30 days
- [ ] Passwords hashed (bcrypt)
- [ ] Secrets in AWS Secrets Manager
- [ ] HTTPS only (no HTTP)
- [ ] Rate limiting enabled
- [ ] SQL injection prevented (parameterized queries)

### Performance
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] Indexes created
- [ ] Caching configured (if using Redis)

### Monitoring
- [ ] CloudWatch logs working
- [ ] Error tracking enabled
- [ ] Health check endpoint works
- [ ] Database connection pooling
- [ ] ECS Exec enabled (for debugging)

---

## 🎯 Next Steps

Once all tests pass:

1. **Switch to Stripe Live Mode**
   ```bash
   # Update Secrets Manager with live keys
   aws secretsmanager update-secret \
     --secret-id liteevent/production/stripe \
     --secret-string '{"secret_key":"sk_live_REAL_KEY"}'
   ```

2. **Deploy Web App**
   ```bash
   git push origin main
   # Test: https://liteevent.com
   ```

3. **Deploy Mobile App**
   ```bash
   cd eventapp-mobile
   eas build --platform all --profile production
   ```

---

**API tested and ready for web/mobile deployment! 🚀**
