import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button }      from '@/components/ui/Button';
import { Colors }      from '@/constants/colors';
import { getTierConfig } from '@/lib/tier';
import { fmtCurrency }   from '@/lib/format';
import { useTicketStore } from '@/store/ticket.store';
import { TicketType }     from '@/types';

interface PurchaseSheetProps {
  open:    boolean;
  onClose: () => void;
  ticket:  TicketType | null;
  eventId: string;
}

interface Form { name: string; email: string; phone: string; }

export function PurchaseSheet({ open, onClose, ticket, eventId }: PurchaseSheetProps) {
  const purchaseTicket = useTicketStore(s => s.purchaseTicket);
  const [qty,       setQty]       = useState(1);
  const [form,      setForm]      = useState<Form>({ name: '', email: '', phone: '' });
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);

  if (!ticket) return null;

  const tier      = getTierConfig(ticket);
  const available = ticket.quantity_total != null ? ticket.quantity_total - ticket.quantity_sold : 99;
  const maxQty    = Math.min(available, 10);
  const priceEach = ticket.kind === 'FREE' ? 0 : ticket.price;
  const total     = priceEach * qty;

  const reset = () => {
    setQty(1); setForm({ name: '', email: '', phone: '' });
    setError(''); setSuccess(false); onClose();
  };

  const submit = async () => {
    if (!form.name.trim())             return setError('Full name is required');
    if (!form.email.includes('@'))     return setError('Enter a valid email address');
    setError('');
    setLoading(true);
    const result = await purchaseTicket(eventId, {
      buyer_name:  form.name.trim(),
      buyer_email: form.email.trim().toLowerCase(),
      buyer_phone: form.phone.trim() || undefined,
      items:       [{ ticket_type_id: ticket.id, quantity: qty }],
    });
    setLoading(false);
    if (!result.success) { setError(result.message ?? 'Purchase failed'); return; }
    if (result.data?.payment_required && result.data.checkout_url) {
      Linking.openURL(result.data.checkout_url);
      onClose();
    } else {
      setSuccess(true);
    }
  };

  return (
    <BottomSheet open={open} onClose={reset} title="Get Tickets" maxHeight={680}>
      {success ? (
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: `${Colors.accent.emerald}20` }]}>
            <Feather name="check-circle" size={36} color={Colors.accent.emerald} />
          </View>
          <Text style={styles.successTitle}>You're in! 🎉</Text>
          <Text style={styles.successSub}>Your ticket has been emailed to {form.email}</Text>
          <Button label="Done" onPress={reset} accent={Colors.accent.emerald} size="lg" />
        </View>
      ) : (
        <View style={styles.form}>
          {/* Ticket header */}
          <View style={[styles.ticketHead, { borderColor: `${tier.accent}30`, backgroundColor: `${tier.accent}10` }]}>
            <LinearGradient colors={[tier.dark, `${tier.dark}99`]} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
            <View>
              <Text style={[styles.ticketName, { color: tier.accent }]}>{ticket.name}</Text>
              <Text style={styles.ticketKind}>{ticket.kind === 'FREE' ? 'Free ticket' : `${fmtCurrency(priceEach, ticket.currency)} each`}</Text>
            </View>
            <Text style={[styles.ticketPrice, { color: tier.accent }]}>
              {ticket.kind === 'FREE' ? 'Free' : fmtCurrency(priceEach, ticket.currency)}
            </Text>
          </View>

          {/* Qty stepper */}
          {maxQty > 1 && (
            <View style={styles.qtyRow}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                  <Feather name="minus" size={14} color="#fff" />
                </Pressable>
                <Text style={styles.qtyVal}>{qty}</Text>
                <Pressable style={styles.stepBtn} onPress={() => setQty(q => Math.min(maxQty, q + 1))}>
                  <Feather name="plus" size={14} color="#fff" />
                </Pressable>
              </View>
            </View>
          )}

          {/* Form fields */}
          <Field label="Full Name *" placeholder="Jane Smith" value={form.name}
            onChangeText={t => setForm(f => ({ ...f, name: t }))} />
          <Field label="Email *" placeholder="you@example.com" value={form.email}
            onChangeText={t => setForm(f => ({ ...f, email: t }))}
            keyboardType="email-address" autoCapitalize="none" />
          <Field label="Phone (optional)" placeholder="+1 555 000 0000" value={form.phone}
            onChangeText={t => setForm(f => ({ ...f, phone: t }))}
            keyboardType="phone-pad" />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Total + CTA */}
          {priceEach > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={[styles.totalValue, { color: tier.accent }]}>
                {fmtCurrency(total, ticket.currency)}
              </Text>
            </View>
          )}

          <Button
            label={loading ? 'Processing…' : ticket.kind === 'FREE' ? 'Get Free Ticket' : `Pay ${fmtCurrency(total, ticket.currency)}`}
            onPress={submit}
            loading={loading}
            accent={tier.accent}
            size="lg"
          />
        </View>
      )}
    </BottomSheet>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        placeholderTextColor={Colors.text.subtle}
        selectionColor={Colors.accent.indigo}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form:        { gap: 14 },
  ticketHead:  { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  ticketName:  { fontSize: 16, fontWeight: '800' },
  ticketKind:  { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  ticketPrice: { fontSize: 22, fontWeight: '900' },

  qtyRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bg.elevated, borderRadius: 12, paddingHorizontal: 4, paddingVertical: 4 },
  stepBtn:  { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.bg.card, alignItems: 'center', justifyContent: 'center' },
  qtyVal:   { fontSize: 16, fontWeight: '800', color: '#fff', minWidth: 24, textAlign: 'center' },

  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.text.muted, letterSpacing: 0.3 },
  fieldInput: { backgroundColor: Colors.bg.input, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.DEFAULT, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14 },

  error:      { fontSize: 12, color: Colors.accent.red, textAlign: 'center' },
  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: Colors.text.muted },
  totalValue: { fontSize: 22, fontWeight: '900' },

  successWrap:  { alignItems: 'center', gap: 14, paddingVertical: 20 },
  successIcon:  { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  successSub:   { fontSize: 13, color: Colors.text.muted, textAlign: 'center' },
});
