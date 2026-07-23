import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function test() {
  try {
    const prices = await stripe.prices.list({ limit: 1 });
    console.log('✅ Stripe key is valid!');
    console.log(`Found ${prices.data.length} price(s)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Stripe key error:', error.message);
    process.exit(1);
  }
}

test();
