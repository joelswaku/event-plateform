import * as WebBrowser from 'expo-web-browser';

export const APP_SCHEME = 'eventapp';

// Deep link URLs Stripe will redirect back to after checkout
export const STRIPE_SUCCESS_URL = `${APP_SCHEME}://payment/success?session_id={CHECKOUT_SESSION_ID}`;
export const STRIPE_CANCEL_URL  = `${APP_SCHEME}://payment/cancel`;

// Ticket success URL — passes {ORDER_ID} placeholder; the backend substitutes
// the real order ID at Stripe session creation time.
export const TICKET_SUCCESS_URL = `${APP_SCHEME}://payment/ticket-success?order_id={ORDER_ID}`;
export const TICKET_CANCEL_URL  = `${APP_SCHEME}://payment/cancel`;

export type StripeResult =
  | { type: 'subscription_success'; sessionId: string }
  | { type: 'ticket_success';       orderId: string   }
  | { type: 'cancel' }
  | { type: 'error'; message: string };

/**
 * Opens Stripe's hosted checkout page inside the app (Safari View Controller
 * on iOS / Chrome Custom Tab on Android) using expo-web-browser.
 *
 * Blocks until the user completes payment, cancels, or closes the browser.
 * Parses the deep-link callback URL and returns a typed result.
 */
export async function openStripeCheckout(checkoutUrl: string): Promise<StripeResult> {
  try {
    const result = await WebBrowser.openAuthSessionAsync(
      checkoutUrl,
      `${APP_SCHEME}://payment`,
    );

    if (result.type !== 'success') return { type: 'cancel' };

    const url = new URL(result.url);

    // Subscription success: eventapp://payment/success?session_id=cs_...
    const sessionId = url.searchParams.get('session_id');
    if (sessionId) return { type: 'subscription_success', sessionId };

    // Ticket success: eventapp://payment/ticket-success?order_id=...
    const orderId = url.searchParams.get('order_id');
    if (orderId) return { type: 'ticket_success', orderId };

    return { type: 'cancel' };
  } catch (e: unknown) {
    return { type: 'error', message: (e as Error)?.message ?? 'Unknown error' };
  }
}
