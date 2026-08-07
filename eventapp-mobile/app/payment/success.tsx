import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSubscriptionStore } from '@/store/subscription.store';
import { Colors } from '@/constants/colors';
import { toast } from '@/lib/toast';

/**
 * Payment Success Route
 *
 * Deep link: liteevent://payment/success?session_id={CHECKOUT_SESSION_ID}
 *
 * This route handles Stripe checkout success redirects.
 * It verifies the session, activates the subscription, and redirects to billing.
 */
export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { session_id } = useLocalSearchParams<{ session_id?: string }>();
  const { verifyAndActivate, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    async function handleSuccess() {
      if (!session_id) {
        toast.error('Invalid session', 'No session ID provided.');
        router.replace('/profile/billing');
        return;
      }

      try {
        // Verify and activate the subscription
        const success = await verifyAndActivate(session_id);

        if (success) {
          // Refresh subscription data
          await fetchSubscription();

          toast.success('Payment successful!', 'Your subscription is now active.');
        } else {
          toast.error('Verification failed', 'Please contact support if payment was charged.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Something went wrong', 'Please check your subscription status.');
      } finally {
        // Always redirect back to billing
        router.replace('/profile/billing');
      }
    }

    handleSuccess();
  }, [session_id, verifyAndActivate, fetchSubscription, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent.gold} />
      <Text style={styles.text}>Verifying payment...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg.primary,
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});
