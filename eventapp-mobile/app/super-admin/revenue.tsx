import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSuperAdminStore } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';

function fmtMoney(val?: string | number | null): string {
  const n = parseFloat(String(val ?? 0));
  if (isNaN(n)) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmt(n?: number | null): string {
  return (n ?? 0).toLocaleString();
}

function KpiCard({ label, value, icon, color, sub }: {
  label: string; value: string; sub?: string;
  icon: keyof typeof Feather.glyphMap; color: string;
}) {
  return (
    <View style={[styles.kpiCard, { borderColor: `${color}22` }]}>
      <View style={[styles.kpiIcon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color: '#fff' }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {!!sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

function SkeletonKpi() {
  return (
    <View style={styles.kpiCard}>
      <View style={{ height: 36, width: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 4 }} />
      <View style={{ height: 24, width: 90, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.09)' }} />
      <View style={{ height: 10, width: 80, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 4 }} />
    </View>
  );
}

export default function RevenueScreen() {
  const { revenue, stats, loading, fetchRevenue, fetchStats } = useSuperAdminStore();

  useFocusEffect(
    React.useCallback(() => {
      fetchRevenue();
      fetchStats();
    }, [])
  );

  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalTickets = stats?.totalTickets ?? 0;
  const avgPerTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* KPI row */}
        <View style={styles.kpiGrid}>
          {loading && !stats ? (
            [0, 1, 2].map(i => <SkeletonKpi key={i} />)
          ) : (
            <>
              <KpiCard
                label="Total Platform Revenue"
                value={fmtMoney(totalRevenue)}
                icon="dollar-sign"
                color={Colors.accent.gold}
              />
              <KpiCard
                label="Total Tickets Sold"
                value={fmt(totalTickets)}
                icon="tag"
                color={Colors.accent.emerald}
              />
              <KpiCard
                label="Avg per Ticket"
                value={totalTickets > 0 ? fmtMoney(avgPerTicket) : '—'}
                icon="trending-up"
                color={Colors.accent.indigo}
              />
            </>
          )}
        </View>

        {/* Monthly Revenue */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Monthly Revenue — Last 12 Months</Text>
          {loading && !revenue ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ height: 11, width: 56, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  <View style={{ flex: 1, height: 10, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  <View style={{ height: 12, width: 60, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.07)' }} />
                </View>
              ))}
            </View>
          ) : !revenue?.monthly?.length ? (
            <View style={styles.empty}>
              <Feather name="bar-chart-2" size={24} color="rgba(201,169,110,0.25)" />
              <Text style={styles.emptyText}>No revenue data yet</Text>
              <Text style={styles.emptySub}>Revenue will appear as tickets are sold</Text>
            </View>
          ) : (() => {
            const max = Math.max(...revenue!.monthly!.map(m => parseFloat(String(m.revenue))), 1);
            return (
              <View style={{ gap: 10 }}>
                {revenue!.monthly!.map((m, i) => {
                  const pct = (parseFloat(String(m.revenue)) / max) * 100;
                  return (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={styles.monthLabel}>{m.month}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.max(pct, 1)}%` as any }]} />
                      </View>
                      <View style={styles.barMeta}>
                        <Text style={styles.barRevenue}>{fmtMoney(m.revenue)}</Text>
                        <Text style={styles.barTickets}>{fmt(m.tickets)} tkts</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })()}
        </View>

        {/* Top Events */}
        <View style={styles.tableCard}>
          <Text style={styles.cardTitle}>Top Events by Revenue</Text>
          {(revenue?.topEvents?.length ?? 0) === 0 ? (
            <View style={styles.empty}>
              <Feather name="dollar-sign" size={20} color="rgba(255,255,255,0.12)" />
              <Text style={styles.emptyText}>No ticket sales yet</Text>
            </View>
          ) : (
            revenue!.topEvents!.map((ev, i) => (
              <View key={ev.id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#111127' : 'transparent' }]}>
                <Text style={styles.rankText}>#{i + 1}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{ev.title}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {ev.org_name}{ev.ticket_count != null ? ` · ${fmt(ev.ticket_count)} tickets` : ''}
                  </Text>
                </View>
                <Text style={styles.rowRevenue}>{fmtMoney(ev.revenue)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Top Orgs */}
        <View style={styles.tableCard}>
          <Text style={styles.cardTitle}>Top Organizations by Revenue</Text>
          {(revenue?.topOrgs?.length ?? 0) === 0 ? (
            <View style={styles.empty}>
              <Feather name="briefcase" size={20} color="rgba(255,255,255,0.12)" />
              <Text style={styles.emptyText}>No organization revenue yet</Text>
            </View>
          ) : (
            revenue!.topOrgs!.map((org, i) => (
              <View key={org.id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#111127' : 'transparent' }]}>
                <Text style={styles.rankText}>#{i + 1}</Text>
                <View style={[styles.orgIcon]}>
                  <Feather name="briefcase" size={12} color={Colors.accent.gold} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{org.name}</Text>
                  <Text style={styles.rowSub}>
                    {fmt(org.event_count)} events · {fmt(org.ticket_count)} tickets
                  </Text>
                </View>
                <Text style={styles.rowRevenue}>{fmtMoney(org.revenue)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#07070f' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: {
    flex:            1,
    minWidth:        '30%',
    backgroundColor: '#0d0d1a',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(201,169,110,0.12)',
    padding:         14,
    gap:             6,
  },
  kpiIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  kpiValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  kpiLabel: { fontSize: 10, color: Colors.text.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiSub:   { fontSize: 10, color: Colors.text.subtle },

  chartCard: {
    backgroundColor: '#0d0d1a',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(201,169,110,0.12)',
    padding:         16,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 16 },

  monthLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.35)',
    width: 56, textAlign: 'right', flexShrink: 0,
  },
  barTrack: {
    flex: 1, height: 10, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: 99,
    backgroundColor: '#c9a96e',
  },
  barMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8, width: 130, justifyContent: 'flex-end' },
  barRevenue: { fontSize: 12, fontWeight: '900', color: Colors.accent.gold, tabularNums: true } as any,
  barTickets: { fontSize: 10, color: 'rgba(255,255,255,0.30)', tabularNums: true } as any,

  tableCard: {
    backgroundColor: '#0d0d1a',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(201,169,110,0.10)',
    overflow:        'hidden',
    gap:             0,
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  rankText:   { fontSize: 11, fontWeight: '900', color: 'rgba(201,169,110,0.50)', width: 24 },
  orgIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(201,169,110,0.12)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rowTitle:   { fontSize: 12, fontWeight: '700', color: '#fff' },
  rowSub:     { fontSize: 10, color: 'rgba(255,255,255,0.30)', marginTop: 1 },
  rowRevenue: { fontSize: 13, fontWeight: '900', color: Colors.accent.gold, tabularNums: true } as any,

  empty:    { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  emptySub:  { fontSize: 12, color: 'rgba(255,255,255,0.30)' },
});
