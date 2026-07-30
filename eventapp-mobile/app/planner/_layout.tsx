import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSubscriptionStore } from '@/store/subscription.store';
import { UpgradeNotificationModal } from '@/components/planner/UpgradeNotificationModal';
import { Colors } from '@/constants/colors';

export default function PlannerLayout() {
  const router = useRouter();
  const { isSubscribed, features, fetchSubscription } = useSubscriptionStore();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const hasPlanner = isSubscribed && Boolean(features?.planner);

  useEffect(() => {
    let active = true;
    void fetchSubscription().finally(() => {
      if (active) setCheckingAccess(false);
    });
    return () => { active = false; };
  }, [fetchSubscription]);

  if (checkingAccess) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accent.indigo} />
      </View>
    );
  }

  if (!hasPlanner) {
    return (
      <View style={styles.loading}>
        <UpgradeNotificationModal
          isOpen
          onDismiss={() => router.replace('/events')}
        />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.primary,
  },
});
