import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSuperAdminStore, SAActivity } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

const FILTERS = [
  { key: 'all',          label: 'All' },
  { key: 'ticket_sale',  label: 'Ticket Sales' },
  { key: 'registration', label: 'Registrations' },
  { key: 'event',        label: 'Events' },
  { key: 'upgrade',      label: 'Upgrades' },
] as const;

type FilterKey = typeof FILTERS[number]['key'];

function activityIcon(type: string): keyof typeof Feather.glyphMap {
  if (type.includes('ticket'))   return 'tag';
  if (type.includes('register')) return 'user-plus';
  if (type.includes('event'))    return 'calendar';
  if (type.includes('upgrade'))  return 'zap';
  return 'activity';
}

function activityColor(type: string): string {
  if (type.includes('ticket'))   return Colors.accent.emerald;
  if (type.includes('register')) return Colors.accent.indigo;
  if (type.includes('event'))    return Colors.accent.amber;
  if (type.includes('upgrade'))  return Colors.accent.gold;
  return Colors.accent.gold;
}

function formatMoney(val?: string | number): string {
  if (!val) return '';
  return `$${parseFloat(String(val)).toFixed(2)}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <View style={styles.itemCard}>
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 12, width: '65%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <View style={{ height: 10, width: '40%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const { activity, loading, fetchActivity } = useSuperAdminStore();
  const [activeFilter, setActiveFilter]    = useState<FilterKey>('all');
  const [countdown, setCountdown]          = useState(15);
  const countdownRef                       = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim                          = useRef(new Animated.Value(1)).current;

  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(15);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          fetchActivity();
          return 15;
        }
        return c - 1;
      });
    }, 1000);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchActivity();
      startCountdown();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        ])
      ).start();
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }, [])
  );

  const filtered = activity.filter(item => {
    if (activeFilter === 'all') return true;
    return item.type.includes(activeFilter);
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Refresh indicator */}
      <View style={styles.refreshBar}>
        <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
        <Text style={styles.refreshText}>Live · refreshing in {countdown}s</Text>
        <Pressable onPress={() => { fetchActivity(); startCountdown(); }} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={13} color={Colors.accent.gold} />
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map(f => (
          <Pressable
            key={f.key}
            style={[styles.chip, activeFilter === f.key && styles.chipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.chipText, activeFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && !activity.length ? (
          [0, 1, 2].map(i => <SkeletonRow key={i} />)
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={32} color={Colors.text.muted} />
            <Text style={styles.emptyText}>No activity found</Text>
          </View>
        ) : (
          filtered.map((item: SAActivity) => {
            const color = activityColor(item.type);
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
                  <Feather name={activityIcon(item.type)} size={15} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemSub}>
                    {item.subtitle ?? item.type} · {timeAgo(item.created_at)}
                  </Text>
                </View>
                {!!item.amount && (
                  <Text style={[styles.itemAmount, { color }]}>{formatMoney(item.amount)}</Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#07070f' },

  refreshBar: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              8,
    paddingHorizontal: 20,
    paddingVertical:  10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  liveDot: {
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: Colors.accent.emerald,
  },
  refreshText: { flex: 1, fontSize: 12, color: Colors.text.muted },
  refreshBtn:  {
    padding:         6,
    borderRadius:    8,
    backgroundColor: 'rgba(201,169,110,0.1)',
  },

  filtersScroll:  { flexGrow: 0 },
  filtersContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      99,
    backgroundColor:   '#0d0d1a',
    borderWidth:       1,
    borderColor:       Colors.border.DEFAULT,
  },
  chipActive: {
    backgroundColor: 'rgba(201,169,110,0.15)',
    borderColor:     'rgba(201,169,110,0.4)',
  },
  chipText:       { fontSize: 12, fontWeight: '600', color: Colors.text.muted },
  chipTextActive: { color: Colors.accent.gold },

  list:        { flex: 1 },
  listContent: { padding: 16, gap: 10 },

  itemCard: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              12,
    backgroundColor:  '#0d0d1a',
    borderRadius:     14,
    padding:          14,
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.05)',
  },
  iconWrap: {
    width:           38,
    height:          38,
    borderRadius:    11,
    alignItems:      'center',
    justifyContent:  'center',
  },
  itemTitle:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  itemSub:    { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  itemAmount: { fontSize: 13, fontWeight: '800' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.text.muted },
});
