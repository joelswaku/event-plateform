/**
 * Push notification service
 *
 * Responsibilities:
 *  1. Request OS permission (once, non-intrusively after login)
 *  2. Get and register the Expo push token with the backend
 *  3. Configure foreground notification display
 *  4. Schedule local notifications (welcome, event reminders)
 *  5. Handle notification taps → deep-link to the right screen
 */

import * as Notifications from 'expo-notifications';
import Constants           from 'expo-constants';
import { Platform }        from 'react-native';
import AsyncStorage        from '@react-native-async-storage/async-storage';
import api                 from './api';

// True on a physical device; false on a simulator/emulator.
// Push token registration only works on real hardware.
const IS_DEVICE = Constants.isDevice ?? false;

// ─── Expo project ID (must match app.config.ts) ───────────────────────────────
const PROJECT_ID: string =
  Constants.expoConfig?.extra?.eas?.projectId ?? 'd03571a3-0dee-483c-9a4f-0706b2d9e07d';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const KEY_PERMISSION_ASKED = 'push:permission_asked';
const KEY_TOKEN_REGISTERED = 'push:token_registered';
const KEY_WELCOME_SENT     = 'push:welcome_sent';

// ─── Foreground handler ───────────────────────────────────────────────────────
// Must be called at module level (outside components).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ─── Android notification channel ────────────────────────────────────────────
export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name:              'LiteEvent',
    importance:        Notifications.AndroidImportance.MAX,
    vibrationPattern:  [0, 200, 100, 200],
    lightColor:        '#6366f1',
    showBadge:         true,
  });
  await Notifications.setNotificationChannelAsync('reminders', {
    name:        'Event Reminders',
    importance:  Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor:  '#f59e0b',
    showBadge:   true,
  });
}

// ─── Permission request ───────────────────────────────────────────────────────
/**
 * Returns true if notifications are (now) granted.
 * Tracks whether we've already asked so we don't re-prompt on every launch.
 */
export async function requestPushPermission(): Promise<boolean> {
  // Simulators / emulators cannot receive push notifications
  if (!IS_DEVICE) return false;

  await ensureAndroidChannel();

  const { status: current } = await Notifications.getPermissionsAsync();
  if (current === 'granted') return true;
  if (current === 'denied')  return false; // user already denied — don't ask again

  const asked = await AsyncStorage.getItem(KEY_PERMISSION_ASKED);
  if (asked) return false; // already asked and not granted

  await AsyncStorage.setItem(KEY_PERMISSION_ASKED, '1');
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Get + register Expo push token ──────────────────────────────────────────
/**
 * Returns the Expo push token string, or null if unavailable / not permitted.
 * Also persists the token to the backend once per device.
 */
export async function registerPushToken(): Promise<string | null> {
  try {
    // Push tokens only work on physical devices, not simulators/emulators
    if (!IS_DEVICE) return null;

    const granted = await requestPushPermission();
    if (!granted) return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    if (!token) return null;

    // Only register with backend once (or when token changes)
    const saved = await AsyncStorage.getItem(KEY_TOKEN_REGISTERED);
    if (saved !== token) {
      await api.post('/notifications/push-token', {
        token,
        platform: Platform.OS,
      });
      await AsyncStorage.setItem(KEY_TOKEN_REGISTERED, token);
    }

    return token;
  } catch {
    return null; // non-critical — silent
  }
}

// ─── Local notifications ──────────────────────────────────────────────────────

/** Welcome notification — fires 60 s after signup, once only. */
export async function scheduleWelcomeNotification() {
  const sent = await AsyncStorage.getItem(KEY_WELCOME_SENT);
  if (sent) return;

  const granted = await requestPushPermission();
  if (!granted) return;

  await AsyncStorage.setItem(KEY_WELCOME_SENT, '1');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎉 Welcome to LiteEvent!',
      body:  'Discover events near you and never miss a ticket sale.',
      data:  { route: '/(tabs)' },
    },
    trigger: { seconds: 60, repeats: false } as Notifications.TimeIntervalTriggerInput,
  });
}

/** Schedule 24 h and 1 h reminders for an event. */
export async function scheduleEventReminders(
  eventId: string,
  eventTitle: string,
  startsAt: Date,
) {
  const now = Date.now();
  const t   = startsAt.getTime();

  const reminders: Array<{ offsetMs: number; title: string; body: string }> = [
    {
      offsetMs: 24 * 60 * 60 * 1000,
      title:    `⏰ Tomorrow: ${eventTitle}`,
      body:     'Your event starts in 24 hours. Make sure everything is ready!',
    },
    {
      offsetMs: 60 * 60 * 1000,
      title:    `🚀 Starting soon: ${eventTitle}`,
      body:     'Your event kicks off in 1 hour. Time to get excited!',
    },
  ];

  for (const { offsetMs, title, body } of reminders) {
    const fireAt = new Date(t - offsetMs);
    if (fireAt.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data:            { route: `/events/${eventId}` },
          categoryIdentifier: 'reminder',
        },
        trigger: { date: fireAt } as Notifications.DateTriggerInput,
      }).catch(() => {}); // silent
    }
  }
}

/** Cancel all scheduled reminders for a specific event. */
export async function cancelEventReminders(_eventId: string) {
  // Cancel all scheduled — simple approach since we don't store identifiers
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Notification tap handler (deep linking) ─────────────────────────────────

type RouterType = { push: (route: string) => void; replace: (route: string) => void };

/**
 * Derive the in-app route from notification data.
 *
 * Notification data conventions:
 *   { route: '/events/abc' }           → direct route
 *   { type: 'ticket_sale', eventId }   → /events/:id
 *   { type: 'new_rsvp', eventId }      → /events/:id/guests
 *   { type: 'checkin', eventId }       → /events/:id/scanner
 */
function resolveRoute(data: Record<string, unknown>): string | null {
  if (typeof data.route === 'string') return data.route;

  const { type, eventId, ticketId } = data as {
    type?: string; eventId?: string; ticketId?: string;
  };

  if (!type) return null;

  if (type === 'ticket_sold'  && eventId) return `/events/${eventId}/tickets`;
  if (type === 'new_rsvp'     && eventId) return `/events/${eventId}/guests`;
  if (type === 'checkin'      && eventId) return `/events/${eventId}/scanner`;
  if (type === 'new_donation' && eventId) return `/events/${eventId}`;
  if (type === 'event_reminder'&& eventId)return `/events/${eventId}`;
  if (type === 'invitation')              return `/notifications`;

  return null;
}

/**
 * Handle a notification tap.
 * Call this in the notification response listener.
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  router: RouterType,
) {
  const data  = response.notification.request.content.data as Record<string, unknown>;
  const route = resolveRoute(data);
  if (route) {
    // Small delay so navigation is ready (especially on cold start)
    setTimeout(() => {
      try { router.push(route); } catch { /* ignore invalid routes */ }
    }, 300);
  }
}

// ─── Clear badge ─────────────────────────────────────────────────────────────
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}

// ─── Test notification (dev / QA only) ───────────────────────────────────────
/**
 * Schedules a local test notification after `delaySeconds` (default 300 = 5 min).
 * Returns the scheduled notification identifier so it can be cancelled.
 */
export async function scheduleTestNotification(delaySeconds = 300): Promise<string | null> {
  try {
    await ensureAndroidChannel();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 LiteEvent test notification',
        body:  `This is a test — push notifications are working! (fired after ${delaySeconds}s)`,
        data:  { route: '/(tabs)', test: true },
        sound: 'default',
        badge: 1,
      },
      trigger: { seconds: delaySeconds, repeats: false } as Notifications.TimeIntervalTriggerInput,
    });
    return id;
  } catch {
    return null;
  }
}

/** Cancel a previously scheduled test notification by its identifier. */
export async function cancelTestNotification(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

/** List all pending scheduled notifications (useful for debugging). */
export async function getPendingNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}
