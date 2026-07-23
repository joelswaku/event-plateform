#!/bin/bash
# Set Stripe variables for web service in Railway

railway variables --set \
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51QMjXKGaoI7icxS6KjU3NqyqJFzWFywaobOdpdewqosV4QxMenOwwPif9hw9wZN2lDOjttwtnerSJPsH3q5B2j0L00iGJysKlv \
  NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_1TYpYyGaoI7icxS612poHHfo \
  NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_1TYpb6GaoI7icxS6KMEprJnQ \
  NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_1TYpb6GaoI7icxS6KMEprJnQ \
  --service web

echo "✅ Stripe variables set for web service"
