export const Config = {
  API_URL:   process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api',
  WEB_URL:   process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000',
  APP_NAME:  'EventApp',
  VERSION:   '1.0.0',

  STRIPE: {
    STARTER_PRICE_ID: process.env.EXPO_PUBLIC_STRIPE_STARTER_PRICE_ID ?? process.env.EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID ?? '',
    PRO_PRICE_ID:     process.env.EXPO_PUBLIC_STRIPE_PRO_PRICE_ID     ?? '',
    // legacy — kept for backward compat
    MONTHLY_PRICE_ID: process.env.EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID ?? '',
    YEARLY_PRICE_ID:  process.env.EXPO_PUBLIC_STRIPE_YEARLY_PRICE_ID  ?? '',
  },

  SECURE_STORE_KEYS: {
    USER:             'eventapp_user',
    IS_AUTHENTICATED: 'eventapp_is_authenticated',
    REFRESH_TOKEN:    'eventapp_refresh_token',
  },

  ASYNC_STORAGE_KEYS: {
    SCANNER_QUEUE:     'scanner_offline_queue',
    DEVICE_ID:         'scanner_device_id',
  },

  SCANNER: {
    DEBOUNCE_MS: 1500,
    MAX_FEED:    50,
  },

  PLAN_LIMITS: {
    free:    { events: 1,        guests: 50 },
    starter: { events: 5,        guests: 500 },
    pro:     { events: Infinity, guests: Infinity },
    enterprise: { events: Infinity, guests: Infinity },
  },
} as const;
