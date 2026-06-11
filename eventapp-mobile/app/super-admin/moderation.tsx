import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSuperAdminStore } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';

function fmtMoney(val?: string | number | null): string {
  const n = parseFloat(String(val ?? 0));
  return isNaN(n) ? '$0' : `$${n.toFixed(2)}`;
}

function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function AllClear({ text }: { text: string }) {
  return (
    <View style={styles.allClear}>
      <View style={styles.allClearIcon}>
        <Feather name="check" size={20} color={Colors.accent.emerald} />
      </View>
      <Text style={styles.allClearText}>{text}</Text>
    </View>
  );
}

function SectionCard({ title, accent, children }: {
  title: string; accent?: string; children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, accent ? { borderColor: `${accent}30` } : undefined]}>
      <View style={[styles.sectionHeader, accent ? { borderBottomColor: `${accent}20` } : undefined]}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function SkeletonRow() {
  return (
    <View style={styles.row}>
      {[140, 100, 50, 70].map((w, i) => (
        <View key={i} style={{ height: 12, width: w, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.07)' }} />
      ))}
    </View>
  );
}

export default function ModerationScreen() {
  const { moderation, loading, fetchModeration } = useSuperAdminStore();

  useFocusEffect(
    React.useCallback(() => { fetchModeration(); }, [])
  );

  const suspicious  = moderation?.suspiciousTickets ?? [];
  const highVelocity = moderation?.highVelocity ?? [];
  const suspended   = moderation?.suspended ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Suspicious Ticket Activity */}
        <SectionCard title="Suspicious Ticket Activity (24h)" accent={Colors.accent.red}>
          {loading && !moderation ? (
            [0, 1, 2].map(i => <SkeletonRow key={i} />)
          ) : suspicious.length === 0 ? (
            <AllClear text="No suspicious activity in the last 24h" />
          ) : (
            suspicious.map((row, i) => (
              <View key={i} style={[styles.row, { borderBottomColor: 'rgba(239,68,68,0.10)' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowPrimary, { color: Colors.accent.red }]} numberOfLines={1}>
                    {row.buyer_email}
                  </Text>
                  <Text style={styles.rowSecondary}>{row.buyer_name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={styles.warningBadge}>
                    <Text style={styles.warningText}>{row.ticket_count} tickets</Text>
                  </View>
                  <Text style={styles.rowSecondary}>{fmtMoney(row.total_spent)}</Text>
                </View>
                <Text style={styles.timeText}>{timeAgo(row.last_activity)}</Text>
              </View>
            ))
          )}
        </SectionCard>

        {/* High Velocity Events */}
        <SectionCard title="High Velocity Events (last 1h)" accent={Colors.accent.amber}>
          {highVelocity.length === 0 ? (
            <AllClear text="No anomalies detected in the last hour" />
          ) : (
            highVelocity.map((row, i) => (
              <View key={i} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowPrimary} numberOfLines={1}>{row.title}</Text>
                  <Text style={styles.rowSecondary}>{row.org_name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.rowPrimary, { color: Colors.accent.amber }]}>
                    {row.tickets_last_hour}/hr
                  </Text>
                  <Text style={[styles.rowSecondary, { color: Colors.accent.emerald }]}>
                    {fmtMoney(row.revenue_last_hour)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </SectionCard>

        {/* Suspended Users */}
        <SectionCard title="Recently Suspended Users (30d)" accent={Colors.accent.indigo}>
          {suspended.length === 0 ? (
            <AllClear text="No recently suspended users" />
          ) : (
            suspended.map((u, i) => (
              <View key={i} style={styles.row}>
                <View style={styles.suspendedAvatar}>
                  <Feather name="user-x" size={14} color={Colors.accent.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowPrimary} numberOfLines={1}>{u.full_name}</Text>
                  <Text style={styles.rowSecondary} numberOfLines={1}>{u.email}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={styles.suspendedBadge}>
                    <Text style={styles.suspendedText}>{u.status}</Text>
                  </View>
                  <Text style={styles.timeText}>{timeAgo(u.updated_at)}</Text>
                </View>
              </View>
            ))
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#07070f' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },

  sectionCard: {
    backgroundColor: '#0d0d1a',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(201,169,110,0.12)',
    overflow:        'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },

  row: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              12,
    paddingHorizontal: 16,
    paddingVertical:  12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowPrimary:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  rowSecondary: { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  timeText:     { fontSize: 10, color: Colors.text.subtle, minWidth: 48, textAlign: 'right' },

  warningBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  warningText: { fontSize: 10, fontWeight: '800', color: Colors.accent.amber },

  suspendedAvatar: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  suspendedBadge: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  suspendedText: { fontSize: 10, fontWeight: '800', color: Colors.accent.red },

  allClear: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16,
  },
  allClearIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  allClearText: { fontSize: 13, color: Colors.accent.emerald, fontWeight: '600', flex: 1 },
});
