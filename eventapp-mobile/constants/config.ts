export const Config = {
  API_URL:   process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api',
  APP_NAME:  'EventApp',
  VERSION:   '1.0.0',

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
    free:    { events: 1, guests: 50 },
    premium: { events: Infinity, guests: Infinity },
  },
} as const;
