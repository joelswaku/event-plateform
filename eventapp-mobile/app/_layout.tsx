import '../global.css';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/CustomToast';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/store/auth.store';
import { useScannerStore } from '@/store/scanner.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SideDrawer }    from '@/components/navigation/SideDrawer';
import { TermsGate }     from '@/components/ui/TermsGate';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Colors } from '@/constants/colors';
import {
  registerPushToken,
  handleNotificationResponse,
  clearBadge,
} from '@/lib/push-notifications';

function AuthGate() {
  const router        = useRouter();
  const segments      = useSegments();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isHydrated    = useAuthStore(s => s.isHydrated);
  const isOnline      = useNetworkStatus();
  const loadQueue     = useScannerStore(s => s.loadQueue);

  useEffect(() => { loadQueue(); }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) router.replace('/(auth)/welcome');
    if (isAuthenticated  &&  inAuth) router.replace('/(tabs)');
  }, [isAuthenticated, isHydrated, segments]);

  return null;
}

export default function RootLayout() {
  const hydrate           = useAuthStore(s => s.hydrate);
  const isAuthenticated   = useAuthStore(s => s.isAuthenticated);
  const isHydrated        = useAuthStore(s => s.isHydrated);
  const fetchSubscription = useSubscriptionStore(s => s.fetchSubscription);
  const appState          = useRef<AppStateStatus>(AppState.currentState);
  const router            = useRouter();

  // Notification listeners — kept in refs so they can be cleaned up
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);
  const receivedListenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => { hydrate(); }, []);

  // Register push token once user is authenticated
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      registerPushToken();
    }
  }, [isHydrated, isAuthenticated]);

  // Notification listeners
  useEffect(() => {
    // Clear badge when app opens
    clearBadge();

    // Handle tapping a notification (foreground or background)
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => handleNotificationResponse(response, router),
    );

    // Clear badge when a notification arrives while app is open
    receivedListenerRef.current = Notifications.addNotificationReceivedListener(
      () => clearBadge(),
    );

    // Handle app opened from a KILLED state via notification tap.
    // addNotificationResponseReceivedListener only fires when the app is already
    // running; getLastNotificationResponseAsync catches the cold-start case.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response, router);
    });

    return () => {
      responseListenerRef.current?.remove();
      receivedListenerRef.current?.remove();
    };
  }, [router]);

  // Refresh subscription state whenever the app comes back to the foreground.
  // This ensures that a payment made in a web browser (or via the in-app
  // Stripe sheet) is reflected in the app without requiring a manual refresh.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        if (isAuthenticated) {
          fetchSubscription();
          clearBadge();
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="light" backgroundColor={Colors.bg.primary} />
          <OfflineBanner />
          <AuthGate />
          <Slot />
          <TermsGate />
          <SideDrawer />
          <Toast config={toastConfig} position="top" topOffset={56} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
});
