import '../global.css';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/auth.store';
import { useScannerStore } from '@/store/scanner.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SideDrawer } from '@/components/navigation/SideDrawer';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Colors } from '@/constants/colors';

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
    if (!isAuthenticated && !inAuth) router.replace('/(auth)/login');
    if (isAuthenticated  &&  inAuth) router.replace('/(tabs)');
  }, [isAuthenticated, isHydrated, segments]);

  return null;
}

export default function RootLayout() {
  const hydrate           = useAuthStore(s => s.hydrate);
  const isAuthenticated   = useAuthStore(s => s.isAuthenticated);
  const fetchSubscription = useSubscriptionStore(s => s.fetchSubscription);
  const appState          = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => { hydrate(); }, []);

  // Refresh subscription state whenever the app comes back to the foreground.
  // This ensures that a payment made in a web browser (or via the in-app
  // Stripe sheet) is reflected in the app without requiring a manual refresh.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        if (isAuthenticated) fetchSubscription();
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
          <SideDrawer />
          <Toast />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
});
