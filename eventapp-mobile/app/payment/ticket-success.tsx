import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { toast } from '@/lib/toast';

/**
 * Ticket Purchase Success Route
 *
 * Deep link: liteevent://payment/ticket-success?order_id={ORDER_ID}
 *
 * This route handles successful ticket purchases.
 * It shows a success message and redirects to My Tickets.
 */
export default function TicketSuccessScreen() {
  const router = useRouter();
  const { order_id } = useLocalSearchParams<{ order_id?: string }>();

  useEffect(() => {
    async function handleSuccess() {
      if (!order_id) {
        toast.error('Invalid order', 'No order ID provided.');
        router.replace('/my-tickets');
        return;
      }

      try {
        // Show success message
        toast.success('Ticket purchased!', 'Your ticket has been confirmed.');

        // Redirect to My Tickets after a brief delay
        setTimeout(() => {
          router.replace('/my-tickets');
        }, 1500);
      } catch (error) {
        console.error('Ticket success error:', error);
        toast.error('Something went wrong', 'Please check My Tickets for your order.');
        router.replace('/my-tickets');
      }
    }

    handleSuccess();
  }, [order_id, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent.gold} />
      <Text style={styles.text}>Processing your ticket...</Text>
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
