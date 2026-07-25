/**
 * Google Analytics helper functions
 *
 * Usage:
 * - Import and call trackEvent() for custom events
 * - trackPageView() is called automatically via app layout
 */

// Track custom events
export function trackEvent(eventName, eventParams = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

// Track page views
export function trackPageView(url) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

// Track conversions - Important business events
export const trackConversion = {
  // User signed up
  signup: (method = 'email') => {
    trackEvent('sign_up', { method });
  },

  // User logged in
  login: (method = 'email') => {
    trackEvent('login', { method });
  },

  // Event created
  eventCreated: (eventType = '') => {
    trackEvent('event_created', {
      event_category: 'engagement',
      event_label: eventType,
    });
  },

  // Guest added
  guestAdded: () => {
    trackEvent('guest_added', {
      event_category: 'engagement',
    });
  },

  // Invitation sent
  invitationSent: (channel = 'email') => {
    trackEvent('invitation_sent', {
      event_category: 'engagement',
      event_label: channel,
    });
  },

  // Ticket purchased
  ticketPurchased: (value = 0, currency = 'USD') => {
    trackEvent('purchase', {
      value,
      currency,
      event_category: 'ecommerce',
    });
  },

  // Subscription started
  subscriptionStarted: (plan = '', value = 0) => {
    trackEvent('subscription_started', {
      event_category: 'ecommerce',
      event_label: plan,
      value,
      currency: 'USD',
    });
  },

  // QR code checked in
  qrCheckIn: () => {
    trackEvent('qr_check_in', {
      event_category: 'engagement',
    });
  },
};
