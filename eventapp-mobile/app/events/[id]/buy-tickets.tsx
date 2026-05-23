/**
 * app/events/[id]/buy-tickets.tsx
 *
 * Public-facing ticket purchase screen.
 * Matches web/src/app/e/[slug]/tickets/page.js small-viewport design exactly:
 *   • Dark #07070f background
 *   • Sticky top bar  ← back  |  My Tickets
 *   • Ambient radial gradient overlay
 *   • Event header: label · title · date + venue
 *   • Full-width ticket cards with tier gradients, perf dividers, availability bar
 *   • Trust bar at bottom
 *   • PurchaseSheet bottom-sheet on card tap
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useEventStore }  from '@/store/event.store';
import { useTicketStore } from '@/store/ticket.store';
import { PurchaseSheet }  from '@/components/tickets/PurchaseSheet';
import { Colors }         from '@/constants/colors';
import { resolveTier }    from '@/lib/tier';
import { fmtCurrency, fmtDate } from '@/lib/format';
import { Event, TicketType } from '@/types';

// ── Tier card gradient backgrounds (mirrors web TIER.bg) ───────────────────────
const CARD_GRADIENT: Record<string, readonly [string, string]> = {
  free:     ['#022c22', '#064e3b'],
  early:    ['#1c1002', '#451a03'],
  standard: ['#0f0f1f', '#1e1b4b'],
  discount: ['#0a1520', '#0e4a5a'],
  vip:      ['#0f0b00', '#2d1f00'],
  pro:      ['#0d0718', '#1e0a3c'],
};

// ── Perforated divider (ticket stub aesthetic) ─────────────────────────────────
function Perf({ accent }: { accent: string }) {
  return (
    <View style={styles.perf}>
      <View style={[styles.perfLine, { backgroundColor: `${accent}20` }]} />
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.perfDot, { backgroundColor: `${accent}18` }]} />
      ))}
      <View style={[styles.perfLine, { backgroundColor: `${accent}20` }]} />
    </View>
  );
}

// ── Skeleton placeholder ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={styles.skeleton} />
  );
}

// ── Ticket card ─────────────────────────────────────────────────────────────────
function TicketCard({
  ticket,
  onBuy,
}: {
  ticket: TicketType;
  onBuy: (t: TicketType) => void;
}) {
  const tierKey  = resolveTier(ticket);
  const tier     = Colors.tier[tierKey];
  const gradient = CARD_GRADIENT[tierKey] ?? CARD_GRADIENT.standard;

  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : null;
  const isSoldOut = available !== null && available <= 0;
  const pct       = ticket.quantity_total
    ? Math.min(((ticket.quantity_sold ?? 0) / ticket.quantity_total) * 100, 100)
    : 0;
  const isUrgent  = available !== null && available > 0 && available <= 20;

  const features = ticket.description?.includes('·')
    ? ticket.description.split('·').filter(f => f.trim())
    : null;

  return (
    <Pressable
      onPress={() => !isSoldOut && onBuy(ticket)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.93 }]}
    >
      {/* Gradient background */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow border overlay */}
      <View style={[styles.cardBorder, { borderColor: `${tier.glow}` }]} />

      {/* Accent stripe */}
      <LinearGradient
        colors={[tier.accent, `${tier.accent}60`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentStripe}
      />

      {/* Header */}
      <View style={styles.cardHead}>
        <View style={styles.tierRow}>
          <Text style={styles.tierIcon}>{tier.icon}</Text>
          <View style={[
            styles.tierBadge,
            { backgroundColor: `${tier.accent}20`, borderColor: `${tier.accent}35` },
          ]}>
            <Text style={[styles.tierLabel, { color: tier.accent }]}>{tier.label}</Text>
          </View>
          {isUrgent && (
            <View style={styles.urgentRow}>
              <Feather name="zap" size={10} color="#ef4444" />
              <Text style={styles.urgentText}>{available} left</Text>
            </View>
          )}
        </View>

        <Text style={styles.ticketName}>{ticket.name}</Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: ticket.kind === 'FREE' ? tier.accent : '#fff' }]}>
            {ticket.kind === 'FREE' ? 'Free' : fmtCurrency(Number(ticket.price), ticket.currency)}
          </Text>
          {ticket.kind !== 'FREE' && (
            <Text style={[styles.perPerson, { color: `${tier.accent}99` }]}>/ person</Text>
          )}
        </View>
      </View>

      <Perf accent={tier.accent} />

      {/* Body */}
      <View style={styles.cardBody}>
        {features ? (
          features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={[styles.featureCheck, { color: tier.accent }]}>✓</Text>
              <Text style={[styles.featureText, { color: `${tier.accent}a0` }]}>{f.trim()}</Text>
            </View>
          ))
        ) : ticket.description ? (
          <Text style={[styles.descText, { color: `${tier.accent}99` }]} numberOfLines={3}>
            {ticket.description}
          </Text>
        ) : null}

        {ticket.quantity_total != null && (
          <View style={styles.availWrap}>
            <View style={styles.availRow}>
              <Text style={[styles.availLabel, { color: `${tier.accent}80` }]}>
                {isSoldOut
                  ? 'Sold out'
                  : isUrgent
                  ? `⚠ Only ${available} left!`
                  : `${available} available`}
              </Text>
              <Text style={[styles.availPct, { color: tier.accent }]}>{pct.toFixed(0)}%</Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: `${tier.accent}15` }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:           `${pct}%` as any,
                    backgroundColor: isSoldOut
                      ? 'rgba(255,255,255,0.15)'
                      : isUrgent
                      ? '#ef4444'
                      : tier.accent,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      <Perf accent={tier.accent} />

      {/* CTA */}
      <View style={styles.cardCta}>
        <View
          style={[
            styles.ctaBtn,
            isSoldOut
              ? styles.ctaBtnDisabled
              : {
                  backgroundColor: tier.accent,
                  shadowColor:     tier.accent,
                  shadowOpacity:   0.35,
                  shadowRadius:    16,
                  shadowOffset:    { width: 0, height: 4 },
                  elevation:       8,
                },
          ]}
        >
          <Text style={[styles.ctaText, { color: isSoldOut ? 'rgba(255,255,255,0.25)' : tier.dark }]}>
            {isSoldOut
              ? 'Sold Out'
              : ticket.kind === 'FREE'
              ? 'Reserve Free Spot →'
              : `Get ${tier.label} Ticket →`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default function BuyTicketsScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>();
  const router     = useRouter();
  const insets     = useSafeAreaInsets();

  const fetchEventById    = useEventStore(s => s.fetchEventById);
  const fetchPublicTickets = useTicketStore(s => s.fetchPublicTickets);

  const [event,    setEvent]    = useState<Event | null>(null);
  const [tickets,  setTickets]  = useState<TicketType[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<TicketType | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [evt, tix] = await Promise.all([
      fetchEventById(id),
      fetchPublicTickets(id),
    ]);
    setEvent(evt);
    setTickets(tix ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const activeTickets = tickets;

  return (
    <View style={styles.root}>
      {/* Ambient radial gradient */}
      <View style={styles.ambientWrap} pointerEvents="none">
        <LinearGradient
          colors={['rgba(99,102,241,0.10)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
        />
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={16} color="rgba(255,255,255,0.5)" />
          <Text style={styles.backLabel}>Back to event</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/my-tickets')}
          style={styles.myTicketsBtn}
        >
          <Text style={styles.myTicketsLabel}>My Tickets</Text>
        </Pressable>
      </View>

      {/* Content */}
      <FlatList
        data={loading ? [null, null, null] : activeTickets}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
        ListHeaderComponent={
          <>
            {/* Event header */}
            {loading ? (
              <View style={styles.headerSkeleton}>
                <View style={[styles.skLine, { width: 160, height: 12 }]} />
                <View style={[styles.skLine, { width: '80%', height: 28, marginTop: 10 }]} />
                <View style={[styles.skLine, { width: 200, height: 12, marginTop: 8 }]} />
              </View>
            ) : event ? (
              <View style={styles.eventHeader}>
                <Text style={styles.selectLabel}>🎟  Select Your Tickets</Text>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.metaRow}>
                  {event.starts_at_local && (
                    <View style={styles.metaItem}>
                      <Feather name="clock" size={12} color="rgba(255,255,255,0.35)" />
                      <Text style={styles.metaText}>{fmtDate(event.starts_at_local)}</Text>
                    </View>
                  )}
                  {event.venue_name && (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaText}>
                        📍 {event.venue_name}{event.city ? `, ${event.city}` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : null}

            {/* Empty state */}
            {!loading && activeTickets.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎟</Text>
                <Text style={styles.emptyTitle}>Tickets coming soon</Text>
                <Text style={styles.emptySub}>Check back closer to the event date.</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) =>
          item == null ? (
            <SkeletonCard />
          ) : (
            <TicketCard ticket={item} onBuy={setSelected} />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListFooterComponent={
          !loading && activeTickets.length > 0 ? (
            <View style={styles.trustBar}>
              {[
                ['🔒', 'Secure checkout'],
                ['✉️', 'Instant e-ticket'],
                ['📲', 'QR code entry'],
                ['💳', 'Powered by Stripe'],
              ].map(([icon, label]) => (
                <View key={label} style={styles.trustItem}>
                  <Text style={styles.trustText}>{icon} {label}</Text>
                </View>
              ))}
            </View>
          ) : null
        }
      />

      {/* Purchase sheet */}
      <PurchaseSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        ticket={selected}
        eventId={id ?? ''}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#07070f',
  },

  ambientWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  // ── Top bar ─────────────────────────────────────────
  topBar: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 16,
    paddingBottom:   12,
    backgroundColor: 'rgba(7,7,15,0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    zIndex:          10,
  },
  backBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
  },
  backLabel: {
    fontSize:    14,
    fontWeight:  '500',
    color:       'rgba(255,255,255,0.45)',
  },
  myTicketsBtn: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      10,
    backgroundColor:   'rgba(255,255,255,0.06)',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.08)',
  },
  myTicketsLabel: {
    fontSize:   12,
    fontWeight: '600',
    color:      'rgba(255,255,255,0.5)',
  },

  // ── List ────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop:        24,
  },

  // ── Event header ────────────────────────────────────
  eventHeader: {
    marginBottom: 24,
    gap:          8,
  },
  selectLabel: {
    fontSize:      12,
    fontWeight:    '700',
    color:         'rgba(99,102,241,0.85)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontSize:    28,
    fontWeight:  '900',
    color:       '#fff',
    lineHeight:  34,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           12,
    marginTop:     4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  metaText: {
    fontSize: 13,
    color:    'rgba(255,255,255,0.4)',
  },

  // ── Skeletons ───────────────────────────────────────
  headerSkeleton: {
    marginBottom: 24,
    gap:          6,
  },
  skLine: {
    borderRadius:    8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skeleton: {
    height:          280,
    borderRadius:    18,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  // ── Ticket card ─────────────────────────────────────
  card: {
    borderRadius: 18,
    overflow:     'hidden',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth:  1,
    zIndex:       1,
  },
  accentStripe: {
    height: 3,
  },
  cardHead: {
    paddingHorizontal: 20,
    paddingTop:        16,
    paddingBottom:     12,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  10,
  },
  tierIcon: {
    fontSize: 18,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      20,
    borderWidth:       1,
  },
  tierLabel: {
    fontSize:      10,
    fontWeight:    '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  urgentRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           3,
  },
  urgentText: {
    fontSize:   10,
    fontWeight: '900',
    color:      '#ef4444',
  },
  ticketName: {
    fontSize:   20,
    fontWeight: '800',
    color:      '#fff',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           5,
  },
  price: {
    fontSize:   30,
    fontWeight: '900',
  },
  perPerson: {
    fontSize: 12,
  },

  // ── Perf ────────────────────────────────────────────
  perf: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingVertical:   6,
    gap:               4,
  },
  perfLine: {
    flex:   1,
    height: 1,
  },
  perfDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },

  // ── Card body ───────────────────────────────────────
  cardBody: {
    paddingHorizontal: 20,
    paddingVertical:   12,
    gap:               8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           8,
  },
  featureCheck: {
    fontSize:   12,
    fontWeight: '800',
    lineHeight: 18,
  },
  featureText: {
    fontSize:   12,
    lineHeight: 18,
    flex:       1,
  },
  descText: {
    fontSize:   13,
    lineHeight: 20,
  },
  availWrap: {
    marginTop: 8,
    gap:       6,
  },
  availRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  availLabel: {
    fontSize:   12,
  },
  availPct: {
    fontSize:   12,
    fontWeight: '700',
  },
  progressBg: {
    height:       6,
    borderRadius: 3,
    overflow:     'hidden',
  },
  progressFill: {
    height:       6,
    borderRadius: 3,
  },

  // ── CTA ─────────────────────────────────────────────
  cardCta: {
    paddingHorizontal: 20,
    paddingVertical:   16,
  },
  ctaBtn: {
    borderRadius:   14,
    paddingVertical: 14,
    alignItems:     'center',
  },
  ctaBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  ctaText: {
    fontSize:   14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // ── Empty state ─────────────────────────────────────
  empty: {
    alignItems:   'center',
    paddingTop:   80,
    paddingBottom: 40,
    gap:           8,
  },
  emptyEmoji: {
    fontSize:     40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize:   18,
    fontWeight: '700',
    color:      '#fff',
  },
  emptySub: {
    fontSize: 13,
    color:    'rgba(255,255,255,0.35)',
  },

  // ── Trust bar ───────────────────────────────────────
  trustBar: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    justifyContent: 'center',
    gap:            16,
    paddingTop:     24,
    paddingBottom:  8,
  },
  trustItem: {},
  trustText: {
    fontSize: 11,
    color:    'rgba(255,255,255,0.25)',
  },
});
