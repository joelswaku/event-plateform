# Payment System Deployment Checklist

## Pre-Deployment Verification

### Environment Variables
- [ ] `STRIPE_SECRET_KEY` is set (production key)
- [ ] `STRIPE_WEBHOOK_SECRET` is set (production webhook secret)
- [ ] `STRIPE_STARTER_PRICE_ID` is set (e.g., `price_xxx`)
- [ ] `STRIPE_PRO_PRICE_ID` is set (e.g., `price_yyy`)
- [ ] `FRONTEND_URL` is set (e.g., `https://yourdomain.com`)

### Database Check
```sql
-- Verify webhook_events table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'webhook_events';

-- Required columns: id, provider, event_type, external_event_id, payload, processed, processed_at, error_message, created_at
-- Optional: updated_at
```

---

## Deployment Steps

### 1. Database Migration (Optional)
```bash
# Add updated_at column for better audit trail
psql $DATABASE_URL -f api/migrations/add_webhook_events_updated_at.sql
```

### 2. Backend Deployment
Deploy these files in order:

**Services** (core logic):
- [ ] `api/services/subscription.service.js`
- [ ] `api/services/planLimits.service.js`

**Controllers** (endpoints):
- [ ] `api/controllers/subscription.controller.js`
- [ ] `api/controllers/stripe.webhook.controller.js`

**Routes** (API routing):
- [ ] `api/routes/subscription.routes.js`

### 3. Frontend Deployment
Deploy these files:
- [ ] `web/src/store/subscription.store.js`
- [ ] `web/src/components/ui/UpgradeModal.jsx`
- [ ] `web/src/components/layout/BillingModal.js`

### 4. Restart Services
```bash
# Backend
pm2 restart api
# or
systemctl restart your-api-service

# Frontend (if SSR)
pm2 restart web
# or rebuild static assets
npm run build
```

---

## Post-Deployment Verification

### Test New Endpoint
```bash
# Test plan change endpoint (requires auth token)
curl -X POST https://your-api.com/api/subscription/change-plan \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"priceId": "price_test_xxx"}'

# Expected: 400 with "No active subscription" (if user has no subscription)
# Expected: 200 with success (if user has subscription and different plan)
# Expected: 400 with "SAME_PLAN" (if already on that plan)
```

### Verify Webhook Processing
```sql
-- Check recent webhooks
SELECT
  external_event_id,
  event_type,
  processed,
  error_message,
  created_at
FROM webhook_events
WHERE provider = 'stripe'
ORDER BY created_at DESC
LIMIT 20;

-- Count unprocessed webhooks (should be 0 or very low)
SELECT COUNT(*) as unprocessed_count
FROM webhook_events
WHERE processed = false AND provider = 'stripe';
```

### Test Subscription Flow

#### New Subscription Test
1. [ ] Log in as test user with no subscription
2. [ ] Click "Upgrade to Starter"
3. [ ] Verify redirect to Stripe checkout
4. [ ] Complete test payment
5. [ ] Verify redirect back to app
6. [ ] Verify plan shows as "Starter" in UI
7. [ ] Verify database updated correctly

#### Plan Change Test
1. [ ] Log in as test user with active Starter subscription
2. [ ] Click "Upgrade to Pro"
3. [ ] **Should NOT redirect** - plan changes instantly
4. [ ] Verify plan shows as "Pro" in UI
5. [ ] Verify no duplicate subscription in Stripe dashboard
6. [ ] Verify proration invoice created in Stripe

#### Duplicate Prevention Test
1. [ ] Log in as test user with active subscription
2. [ ] Open billing modal
3. [ ] Click "Subscribe to Starter" multiple times quickly
4. [ ] Verify: no duplicate subscriptions created
5. [ ] Verify: plan change happens (not new subscription)

---

## Monitoring Setup

### Alert Thresholds

**Critical** (page immediately):
```
webhook_processing_errors > 20/hour
invalid_price_id_attempts > 10/hour
database_subscription_errors > 50/hour
```

**Warning** (investigate within 1 hour):
```
duplicate_subscription_blocks > 50/hour (UX issue)
subscription_validation_warnings > 100/hour
webhook_retry_rate > 30%
```

### Grafana/CloudWatch Queries

**Webhook Health**:
```sql
SELECT
  COUNT(*) FILTER (WHERE processed = false AND created_at < NOW() - INTERVAL '1 hour') as stuck_webhooks,
  COUNT(*) FILTER (WHERE error_message IS NOT NULL) as failed_webhooks,
  COUNT(*) FILTER (WHERE processed = true) as successful_webhooks
FROM webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours';
```

**Subscription Health**:
```sql
SELECT
  COUNT(*) FILTER (WHERE is_subscribed = true AND subscription_status = 'active') as active_subscriptions,
  COUNT(*) FILTER (WHERE is_subscribed = true AND subscription_current_period_end < NOW()) as expired_subscriptions,
  COUNT(*) FILTER (WHERE is_subscribed = true AND subscription_id IS NULL) as broken_subscriptions
FROM users;
```

---

## Rollback Instructions

### If Critical Issue Detected

**Quick Fix** - Disable plan changes:
```javascript
// In api/routes/subscription.routes.js
// Comment out:
// router.post("/change-plan", changeSubscriptionPlan);

// Restart API
pm2 restart api
```

**Frontend Revert** - Route to Stripe Portal:
```javascript
// In UpgradeModal.jsx and BillingModal.js
const handleCheckout = async (priceId, tier) => {
  if (isSubscribed) {
    // Send to Stripe Portal instead
    await openCustomerPortal();
  } else {
    await createCheckoutSession(priceId);
  }
};
```

**Full Rollback** (emergency only):
```bash
# Revert to previous deployment
git revert HEAD
git push origin main

# Redeploy
npm run deploy
```

---

## Success Criteria

### Before Marking Deployment Complete

- [ ] No errors in application logs for 1 hour
- [ ] Test new subscription completed successfully
- [ ] Test plan change completed successfully
- [ ] No duplicate subscriptions in Stripe dashboard
- [ ] Webhook processing rate > 95%
- [ ] All unprocessed webhooks < 10
- [ ] No broken subscription records (missing required fields)

---

## Common Post-Deployment Issues

### Issue: High "duplicate subscription blocks"
**Cause**: Users clicking upgrade button while already subscribed  
**Expected**: This is NORMAL behavior - the fix is working  
**Action**: Update UI to show "Change Plan" instead of "Upgrade" for existing subscribers

### Issue: Webhooks stuck in unprocessed state
**Cause**: Database connection issue or Stripe misconfiguration  
**Check**:
```sql
SELECT error_message FROM webhook_events WHERE processed = false LIMIT 5;
```
**Action**: Check error messages, fix root cause, clear processed=false for affected events

### Issue: Users show "free" despite payment
**Cause**: Missing subscription fields in database  
**Check**:
```sql
SELECT subscription_id, subscription_status, subscription_current_period_end
FROM users WHERE is_subscribed = true AND subscription_plan != 'free';
```
**Action**: Manually sync from Stripe dashboard or trigger webhook replay

---

## Support Contact

**Engineering**:
- Backend issues: Check API logs at `/var/log/api/`
- Database issues: Check PostgreSQL logs
- Webhook issues: Check Stripe dashboard → Developers → Events

**Stripe Support**:
- Webhook replay: Stripe Dashboard → Developers → Events → Click event → Send test webhook
- Subscription details: Stripe Dashboard → Customers → Search by email

---

## Next Steps After Deployment

1. **Monitor for 24 hours** before announcing plan change feature
2. **Update user documentation** about instant plan changes
3. **Add toast notifications** for successful plan changes (UI enhancement)
4. **Set up automated tests** for subscription flows
5. **Review and tune alert thresholds** based on actual traffic

---

**Document Version**: 1.0  
**Last Updated**: 2026-07-28  
**Status**: Ready for Use
