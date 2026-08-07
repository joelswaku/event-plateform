import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { toast } from '@/lib/toast';
import { Feather } from '@expo/vector-icons';

/**
 * Payment Cancel Route
 *
 * Deep link: liteevent://payment/cancel
 *
 * This route handles Stripe checkout cancellations.
 * It shows a brief message and redirects back to billing.
 */
export default function PaymentCancelScreen() {
  const router = useRouter();

  useEffect(() => {
    // Show cancellation toast
    toast.info('Payment cancelled', 'You can try again anytime.');

    // Redirect to billing after a brief delay
    const timeout = setTimeout(() => {
      router.replace('/profile/billing');
    }, 1000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="x-circle" size={48} color={Colors.text.muted} />
      </View>
      <Text style={styles.title}>Payment Cancelled</Text>
      <Text style={styles.subtitle}>Returning to billing...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg.primary,
    gap: 12,
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.muted,
    fontWeight: '500',
  },
});
