import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TicketType } from '@/types';
import { Colors, TierKey } from '@/constants/colors';
import { getTierConfig } from '@/lib/tier';
import { fmtCurrency } from '@/lib/format';

interface TicketTypeCardProps {
  ticket:   TicketType;
  onEdit?:  () => void;
  onDelete?: () => void;
}

export function TicketTypeCard({ ticket, onEdit, onDelete }: TicketTypeCardProps) {
  const tier      = getTierConfig(ticket);
  const sold      = ticket.quantity_sold;
  const total     = ticket.quantity_total;
  const available = total != null ? total - sold : null;
  const pct       = total ? Math.min((sold / total) * 100, 100) : 0;
  const soldOut   = available !== null && available <= 0;

  return (
    <View style={[styles.card, { borderColor: `${tier.accent}30`, shadowColor: tier.accent }]}>
      <LinearGradient
        colors={[tier.dark, `${tier.dark}cc`]}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />

      {/* Top stripe */}
      <View style={[styles.stripe, { backgroundColor: tier.accent }]} />

      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.tierBadge, { backgroundColor: `${tier.accent}20`, borderColor: `${tier.accent}40` }]}>
              <Text style={{ fontSize: 11 }}>{Colors.tier[getTierKey(ticket)]?.icon}</Text>
              <Text style={[styles.tierLabel, { color: tier.accent }]}>
                {Colors.tier[getTierKey(ticket)]?.label}
              </Text>
            </View>
            <Text style={styles.name}>{ticket.name}</Text>
          </View>
          <Text style={[styles.price, { color: tier.accent }]}>
            {ticket.kind === 'FREE' ? 'Free' : fmtCurrency(ticket.price, ticket.currency)}
          </Text>
        </View>

        {/* Description */}
        {ticket.description && (
          <Text style={styles.desc} numberOfLines={2}>{ticket.description}</Text>
        )}

        {/* Availability */}
        {total != null && (
          <View style={styles.availability}>
            <View style={styles.availRow}>
              <Text style={styles.availText}>
                {soldOut ? 'Sold out' : `${available} remaining`}
              </Text>
              <Text style={styles.soldText}>{sold}/{total} sold</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${pct}%` as `${number}%`, backgroundColor: tier.accent }]} />
            </View>
          </View>
        )}

        {/* Active badge */}
        <View style={styles.footer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: ticket.is_active ? `${Colors.accent.emerald}20` : `${Colors.accent.red}15` },
          ]}>
            <View style={[styles.dot, { backgroundColor: ticket.is_active ? Colors.accent.emerald : Colors.accent.red }]} />
            <Text style={[styles.statusText, { color: ticket.is_active ? Colors.accent.emerald : Colors.accent.red }]}>
              {ticket.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={styles.actions}>
            {onEdit && (
              <Pressable style={styles.actionBtn} onPress={onEdit}>
                <Feather name="edit-2" size={13} color={Colors.text.muted} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
                <Feather name="trash-2" size={13} color={Colors.accent.red} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function getTierKey(t: TicketType): TierKey {
  const n = (t.name ?? '').toLowerCase();
  if (t.kind === 'FREE')                                                               return 'free';
  if (n.includes('vip') || n.includes('platinum') || n.includes('premium'))           return 'vip';
  if (n.includes('pro') || n.includes('diamond') || n.includes('all-access'))         return 'pro';
  if (n.includes('early') || n.includes('bird') || n.includes('presale'))             return 'early';
  if (n.includes('student') || n.includes('youth') || n.includes('concession'))       return 'discount';
  return 'standard';
}

const styles = StyleSheet.create({
  card: {
    borderRadius:  16,
    borderWidth:   1,
    overflow:      'hidden',
    shadowOpacity: 0.25,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 6 },
    elevation:     8,
    marginBottom:  12,
  },
  stripe: { height: 3 },
  body:   { padding: 14, gap: 10 },

  headerRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { gap: 4, flex: 1 },
  tierBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      99,
    borderWidth:       1,
    alignSelf:         'flex-start',
  },
  tierLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  name:      { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  price:     { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },

  desc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 17 },

  availability: { gap: 6 },
  availRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  availText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  soldText:  { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  progressBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressFill: { height: 4, borderRadius: 2 },

  footer:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  dot:       { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actions:   { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.bg.elevated, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { backgroundColor: `${Colors.accent.red}15` },
});
