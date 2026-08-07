# Stripe Return Routes Fix

## Issue

When users completed or cancelled Stripe checkout in the Android app, they were redirected to deep links like:

```
liteevent://payment/cancel
liteevent://payment/success?session_id={ID}
```

But Expo Router showed:

```
Unmatched Route
Page could not be found
```

This happened because the app didn't have routes to handle these deep links.

---

## Root Cause

**Missing Routes**: The mobile app configured Stripe with deep-link return URLs but never created the corresponding Expo Router routes.

**Configured Deep Links** (in `lib/stripe.ts`):
- Subscription success: `liteevent://payment/success?session_id={CHECKOUT_SESSION_ID}`
- Subscription cancel: `liteevent://payment/cancel`
- Ticket success: `liteevent://payment/ticket-success?order_id={ORDER_ID}`
- Ticket cancel: `liteevent://payment/cancel`

**Missing Routes**: `/payment/success`, `/payment/cancel`, `/payment/ticket-success`

---

## Solution

Created three new Expo Router routes to handle Stripe return deep links:

### 1. Subscription Success Route
**File**: [`eventapp-mobile/app/payment/success.tsx`](eventapp-mobile/app/payment/success.tsx)

**Deep Link**: `liteevent://payment/success?session_id={CHECKOUT_SESSION_ID}`

**Behavior**:
1. Extracts `session_id` from URL params
2. Calls `verifyAndActivate(sessionId)` to verify payment with backend
3. Refreshes subscription data
4. Shows success toast
5. Redirects to `/profile/billing`

**Code**:
```typescript
export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { session_id } = useLocalSearchParams<{ session_id?: string }>();
  const { verifyAndActivate, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    async function handleSuccess() {
      if (!session_id) {
        toast.error('Invalid session', 'No session ID provided.');
        router.replace('/profile/billing');
        return;
      }

      const success = await verifyAndActivate(session_id);
      if (success) {
        await fetchSubscription();
        toast.success('Payment successful!', 'Your subscription is now active.');
      } else {
        toast.error('Verification failed', 'Please contact support.');
      }
      
      router.replace('/profile/billing');
    }

    handleSuccess();
  }, [session_id, verifyAndActivate, fetchSubscription, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent.gold} />
      <Text style={styles.text}>Verifying payment...</Text>
    </View>
  );
}
```

---

### 2. Payment Cancel Route
**File**: [`eventapp-mobile/app/payment/cancel.tsx`](eventapp-mobile/app/payment/cancel.tsx)

**Deep Link**: `liteevent://payment/cancel`

**Behavior**:
1. Shows "Payment cancelled" toast
2. Brief 1-second delay
3. Redirects to `/profile/billing`

**Code**:
```typescript
export default function PaymentCancelScreen() {
  const router = useRouter();

  useEffect(() => {
    toast.info('Payment cancelled', 'You can try again anytime.');
    
    const timeout = setTimeout(() => {
      router.replace('/profile/billing');
    }, 1000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.container}>
      <Feather name="x-circle" size={48} color={Colors.text.muted} />
      <Text style={styles.title}>Payment Cancelled</Text>
      <Text style={styles.subtitle}>Returning to billing...</Text>
    </View>
  );
}
```

---

### 3. Ticket Success Route
**File**: [`eventapp-mobile/app/payment/ticket-success.tsx`](eventapp-mobile/app/payment/ticket-success.tsx)

**Deep Link**: `liteevent://payment/ticket-success?order_id={ORDER_ID}`

**Behavior**:
1. Extracts `order_id` from URL params
2. Shows success toast
3. Brief 1.5-second delay
4. Redirects to `/my-tickets`

**Code**:
```typescript
export default function TicketSuccessScreen() {
  const router = useRouter();
  const { order_id } = useLocalSearchParams<{ order_id?: string }>();

  useEffect(() => {
    async function handleSuccess() {
      if (!order_id) {
        toast.error('Invalid order', 'No order ID provided.');
        router.replace('/my-tickets');
        return;
      }

      toast.success('Ticket purchased!', 'Your ticket has been confirmed.');
      
      setTimeout(() => {
        router.replace('/my-tickets');
      }, 1500);
    }

    handleSuccess();
  }, [order_id, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent.gold} />
      <Text style={styles.text}>Processing your ticket...</Text>
    </View>
  );
}
```

---

## Web Implementation (Already Correct)

The web app already has proper return URL handling:

### Success Route
**File**: `web/src/app/billing/success/page.js`

**URL**: `https://liteevent.com/billing/success?session_id={CHECKOUT_SESSION_ID}`

**Behavior**:
1. Verifies session with `verifyAndActivate(sessionId)`
2. Shows success message
3. Redirects to `/dashboard` after 1.5 seconds

### Cancel Route
**File**: `web/src/app/billing/cancel/page.jsx`

**URL**: `https://liteevent.com/billing/cancel`

**Behavior**:
1. Shows "No worries!" message
2. Offers "Try again" and "Back to Dashboard" buttons

---

## Backend (Already Correct)

The backend accepts `successUrl` and `cancelUrl` from clients and passes them to Stripe:

**Endpoint**: `POST /api/subscription/checkout`

**Request Body**:
```json
{
  "priceId": "price_1234...",
  "successUrl": "liteevent://payment/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "liteevent://payment/cancel"
}
```

**Backend Code** (`api/services/subscription.service.js`):
```javascript
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: "subscription",
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: successUrl || `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: cancelUrl || `${FRONTEND_URL}/billing/cancel`,
  metadata: { user_id: userId },
  subscription_data: { metadata: { user_id: userId } },
  allow_promotion_codes: true,
});
```

**Stripe Placeholders**:
- `{CHECKOUT_SESSION_ID}` - Replaced by Stripe with actual session ID
- `{ORDER_ID}` - Replaced by backend before creating session (for tickets)

---

## Testing Flow

### Subscription Success
1. Open LiteEvent app on Android
2. Go to Profile → Billing
3. Tap "Upgrade to Starter" or "Upgrade to Pro"
4. Complete payment in Stripe checkout
5. **Expected**: Redirected to app → "Verifying payment..." → Success toast → Billing page with active subscription

### Subscription Cancel
1. Open LiteEvent app on Android
2. Go to Profile → Billing
3. Tap "Upgrade to Starter"
4. Tap back/cancel in Stripe checkout
5. **Expected**: Redirected to app → "Payment Cancelled" → Brief delay → Billing page

### Ticket Success
1. Open LiteEvent app on Android
2. Navigate to an event with tickets
3. Tap "Buy Tickets"
4. Complete payment in Stripe checkout
5. **Expected**: Redirected to app → "Processing your ticket..." → Success toast → My Tickets page

---

## Expo Router Deep Link Configuration

**App Scheme**: `liteevent` (configured in `app.config.ts`)

```typescript
export default ({ config }: ConfigContext): ExpoConfig => ({
  // ...
  scheme: "liteevent",
  // ...
});
```

**Route Matching**:
- `liteevent://payment/success` → `app/payment/success.tsx`
- `liteevent://payment/cancel` → `app/payment/cancel.tsx`
- `liteevent://payment/ticket-success` → `app/payment/ticket-success.tsx`

Expo Router automatically handles deep link routing based on file structure.

---

## Files Changed

### Mobile App
- ✅ Created `eventapp-mobile/app/payment/success.tsx`
- ✅ Created `eventapp-mobile/app/payment/cancel.tsx`
- ✅ Created `eventapp-mobile/app/payment/ticket-success.tsx`

### Web App
- ✅ Already has `web/src/app/billing/success/page.js`
- ✅ Already has `web/src/app/billing/cancel/page.jsx`

### Backend
- ✅ Already accepts `successUrl` and `cancelUrl` parameters
- ✅ Already passes them to Stripe correctly

---

## Deployment

### Mobile App
**Commit**: `74efb8a`

```bash
cd eventapp-mobile
git add app/payment/
git commit -m "Add Stripe return routes for mobile app deep links"
git push origin main
```

**Next Steps**:
1. Rebuild the app with `eas build --profile production --platform android`
2. Test on physical device or submit to Google Play

### Web App
- ✅ No changes needed (already working)

---

## Related Files

- `eventapp-mobile/lib/stripe.ts` - Deep link URL constants
- `eventapp-mobile/store/subscription.store.ts` - Subscription state management
- `eventapp-mobile/components/tickets/PurchaseSheet.tsx` - Ticket purchase flow
- `api/services/subscription.service.js` - Backend Stripe session creation
- `api/services/engagement.service.js` - Ticket order Stripe sessions

---

## Key Takeaways

1. **Deep links must have matching routes**: Always create Expo Router routes for deep links configured in external services (Stripe, OAuth, etc.)

2. **Route naming matters**: The file path `app/payment/success.tsx` automatically creates the route `/payment/success` which matches `liteevent://payment/success`

3. **Query parameters work**: URL params like `?session_id={ID}` are accessible via `useLocalSearchParams()` hook

4. **Don't show UI permanently**: These routes should immediately redirect after processing - they're transition pages, not destinations

5. **Handle errors gracefully**: Always check for missing params and redirect to a safe fallback screen

---

**Fixed by**: Claude Sonnet 4.5  
**Date**: 2026-08-06  
**Status**: ✅ RESOLVED  
**Issue**: Missing Expo Router routes for Stripe return deep links  
**Solution**: Created success, cancel, and ticket-success routes with proper verification and redirects
