import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useSuperAdminStore } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';

function fmtMoney(val?: string | number | null): string {
  const n = parseFloat(String(val ?? 0));
  if (isNaN(n)) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// ─── SVG Line Chart ────────────────────────────────────────────────────────────

function LineChart({ data }: { data: Array<{ day: string; revenue: string | number }> }) {
  if (!data?.length) {
    return (
      <View style={chartEmpty}>
        <Feather name="trending-up" size={22} color="rgba(201,169,110,0.25)" />
        <Text style={chartEmptyText}>Revenue data will appear as transactions occur</Text>
      </View>
    );
  }

  const W = 600, H = 100;
  const values = data.map(d => parseFloat(String(d.revenue ?? 0)));
  const max    = Math.max(...values, 1);
  const xs     = data.map((_, i) => (i / Math.max(data.length - 1, 1)) * W);
  const ys     = values.map(v => H - (v / max) * (H - 4));

  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const fillPath = `M 0 ${H} ${xs.map((x, i) => `L ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')} L ${W} ${H} Z`;

  return (
    <Svg
      viewBox={`0 0 ${W} ${H + 4}`}
      width="100%"
      height={130}
      preserveAspectRatio="none"
    >
      <Defs>
        <SvgGrad id="revFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#c9a96e" stopOpacity={0.30} />
          <Stop offset="100%" stopColor="#c9a96e" stopOpacity={0}    />
        </SvgGrad>
      </Defs>
      <Path d={fillPath} fill="url(#revFill)" />
      <Path d={linePath} fill="none" stroke="#c9a96e" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {xs.map((x, i) => (
        <Circle key={i} cx={x} cy={ys[i]} r={3} fill="#c9a96e" opacity={0.8} />
      ))}
    </Svg>
  );
}

// shared inline styles for chart empty state
const chartEmpty: any     = { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 28 };
const chartEmptyText: any = { fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', paddingHorizontal: 20 };

// ─── KPI Cards ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {!!sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

function SkeletonKpi() {
  return (
    <View style={styles.kpiCard}>
      <View style={{ height: 11, width: 80, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
      <View style={{ height: 26, width: 90, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.09)' }} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FinancialScreen() {
  const { financial, loading, fetchFinancial } = useSuperAdminStore();
  const f = financial;

  useFocusEffect(
    React.useCallback(() => { fetchFinancial(); }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* KPI row 1 */}
        <View style={styles.kpiGrid}>
          {loading && !f ? (
            [0, 1, 2, 3].map(i => <SkeletonKpi key={i} />)
          ) : (
            <>
              <KpiCard label="Gross Merchandise Value" value={fmtMoney(f?.gmv)} />
              <KpiCard label="Net Revenue"             value={fmtMoney(f?.netRevenue)} />
              <KpiCard label="Estimated Fees"          value={fmtMoney(f?.estimatedFees)} sub="~2.9% + $0.30/txn" />
              <KpiCard label="Total Transactions"      value={(f?.totalTransactions ?? 0).toLocaleString()} />
            </>
          )}
        </View>

        {/* KPI row 2 */}
        <View style={styles.kpiGrid}>
          {loading && !f ? (
            [0, 1, 2].map(i => <SkeletonKpi key={i} />)
          ) : (
            <>
              <KpiCard label="Last 24h Revenue"  value={fmtMoney(f?.last24h?.revenue)} sub={`${f?.last24h?.tickets ?? 0} tickets`} />
              <KpiCard label="Last 7d Revenue"   value={fmtMoney(f?.last7d?.revenue)}  sub={`${f?.last7d?.tickets ?? 0} tickets`} />
              <KpiCard label="Avg Transaction"   value={fmtMoney(f?.avgTransaction)} />
            </>
          )}
        </View>

        {/* SVG Line Chart — Daily Revenue */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Daily Revenue (Last 30 Days)</Text>
          <LineChart data={f?.daily30 ?? []} />
          {(f?.daily30?.length ?? 0) > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              {/* day is already "MM/DD" from the API — no date parsing */}
              <Text style={styles.chartLabel}>{f!.daily30![0]?.day}</Text>
              <Text style={styles.chartLabel}>{f!.daily30![f!.daily30!.length - 1]?.day}</Text>
            </View>
          )}
        </View>

        {/* Revenue Breakdown */}
        {f && parseFloat(String(f.gmv ?? 0)) > 0 && (() => {
          const gmv  = parseFloat(String(f.gmv ?? 0));
          const net  = parseFloat(String(f.netRevenue ?? 0));
          const fees = parseFloat(String(f.estimatedFees ?? 0));
          const rows = [
            { label: 'Gross Revenue (GMV)',  value: fmtMoney(gmv),  pct: 100,                             color: '#c9a96e' },
            { label: 'Net Revenue',          value: fmtMoney(net),  pct: Math.round((net  / gmv) * 100), color: '#10b981' },
            { label: 'Est. Fees',            value: fmtMoney(fees), pct: Math.round((fees / gmv) * 100), color: '#ef4444' },
          ];
          return (
            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>Revenue Breakdown</Text>
              <View style={{ gap: 14 }}>
                {rows.map(({ label, value, pct, color }) => (
                  <View key={label}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>{label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>{pct}%</Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color }}>{value}</Text>
                      </View>
                    </View>
                    <View style={{ height: 7, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${pct}%`, borderRadius: 99, backgroundColor: color }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Top Buyers */}
        <View style={styles.tableCard}>
          <Text style={styles.cardTitle}>Top Buyers</Text>
          {loading && !f ? (
            [0, 1, 2].map(i => (
              <View key={i} style={styles.tableRow}>
                <View style={{ height: 12, width: 28, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.07)' }} />
                <View style={{ flex: 1, height: 12, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <View style={{ height: 12, width: 60, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.05)' }} />
              </View>
            ))
          ) : (f?.topBuyers?.length ?? 0) === 0 ? (
            <View style={styles.empty}>
              <Feather name="trending-up" size={24} color={Colors.text.muted} />
              <Text style={styles.emptyText}>No buyers yet — transactions will appear here</Text>
            </View>
          ) : (
            f!.topBuyers!.map((b, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.rank}>#{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.buyerName} numberOfLines={1}>{b.buyer_name}</Text>
                  <Text style={styles.buyerEmail} numberOfLines={1}>{b.buyer_email}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.buyerSpent}>{fmtMoney(b.total_spent)}</Text>
                  <Text style={styles.buyerTickets}>{b.tickets} tickets</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#07070f' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    flex:            1,
    minWidth:        '45%',
    backgroundColor: '#0d0d1a',
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     'rgba(201,169,110,0.12)',
    padding:         14,
    gap:             4,
  },
  kpiLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  kpiValue: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.4, marginTop: 4 },
  kpiSub:   { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 },

  chartCard: {
    backgroundColor: '#0d0d1a',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(201,169,110,0.12)',
    padding:         16,
  },
  cardTitle:  { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 14 },
  chartLabel: { fontSize: 10, color: 'rgba(255,255,255,0.25)' },

  tableCard: {
    backgroundColor: '#0d0d1a',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(201,169,110,0.12)',
    padding:         16,
    gap:             4,
  },
  tableRow: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              12,
    paddingVertical:  12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  rank:         { fontSize: 13, fontWeight: '900', color: Colors.accent.gold, width: 28 },
  buyerName:    { fontSize: 13, fontWeight: '700', color: '#fff' },
  buyerEmail:   { fontSize: 10, color: Colors.text.muted, marginTop: 1 },
  buyerSpent:   { fontSize: 13, fontWeight: '800', color: Colors.accent.emerald },
  buyerTickets: { fontSize: 10, color: Colors.text.muted, marginTop: 1 },

  empty:     { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 13, color: Colors.text.muted, textAlign: 'center' },
});
