import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTicketStore }  from '@/store/ticket.store';
import { useScannerStore } from '@/store/scanner.store';
import { Colors }          from '@/constants/colors';
import { fmtCurrency }     from '@/lib/format';
import { getTierConfig }   from '@/lib/tier';

export default function AnalyticsScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router          = useRouter();
  const { stats, fetchStats: fetchTicketStats } = useTicketStore();
  const { stats: scanStats, fetchStats: fetchScanStats } = useScannerStore();

  useEffect(() => {
    if (!eventId) return;
    fetchTicketStats(eventId);
    fetchScanStats(eventId);
  }, [eventId]);

  const checkinRate = scanStats && scanStats.total_issued > 0
    ? Math.round((scanStats.checked_in / scanStats.total_issued) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Analytics</Text>
        </View>

        {/* Revenue KPIs */}
        {stats && (
          <>
            <View style={styles.kpiGrid}>
              <KPI icon="dollar-sign" label="Gross Revenue" value={fmtCurrency(stats.gross_revenue)}  accent={Colors.accent.emerald} large />
              <KPI icon="shopping-bag" label="Paid Orders"  value={stats.paid_orders}                 accent={Colors.accent.indigo}  />
              <KPI icon="tag"          label="Total Orders" value={stats.total_orders}                 accent={Colors.accent.amber}   />
              <KPI icon="credit-card"  label="Issued"       value={stats.total_issued}                 accent={Colors.accent.violet}  />
            </View>

            {/* Check-in rate circle */}
            <View style={styles.rateCard}>
              <View style={styles.rateCircle}>
                <Text style={[styles.ratePct, { color: Colors.accent.emerald }]}>{checkinRate}%</Text>
                <Text style={styles.rateSub}>checked in</Text>
              </View>
              <View style={styles.rateInfo}>
                <Text style={styles.rateTitle}>Check-in Rate</Text>
                <Text style={styles.rateDesc}>
                  {scanStats?.checked_in ?? 0} of {scanStats?.total_issued ?? 0} tickets scanned
                </Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${checkinRate}%` as `${number}%`, backgroundColor: Colors.accent.emerald }]} />
                </View>
              </View>
            </View>

            {/* Ticket type breakdown */}
            {stats.by_ticket_type.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ticket Breakdown</Text>
                {stats.by_ticket_type.map(t => {
                  const pct   = t.quantity_total ? Math.min((t.quantity_sold / t.quantity_total) * 100, 100) : 0;
                  const tier  = getTierConfig({ name: t.name, kind: 'PAID' });
                  return (
                    <View key={t.ticket_type_id} style={styles.ticketRow}>
                      <View style={styles.ticketRowHead}>
                        <Text style={[styles.ticketName, { color: tier.accent }]}>{t.name}</Text>
                        <Text style={styles.ticketRevenue}>{fmtCurrency(t.revenue)}</Text>
                      </View>
                      <View style={styles.ticketMeta}>
                        <Text style={styles.ticketSold}>{t.quantity_sold} sold{t.quantity_total ? ` / ${t.quantity_total}` : ''}</Text>
                      </View>
                      {t.quantity_total && (
                        <View style={styles.barBg}>
                          <View style={[styles.barFill, { width: `${pct}%` as `${number}%`, backgroundColor: tier.accent }]} />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {!stats && (
          <View style={styles.empty}>
            <Feather name="bar-chart-2" size={40} color={Colors.text.subtle} />
            <Text style={styles.emptyText}>No analytics data yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function KPI({ icon, label, value, accent, large = false }: {
  icon: keyof typeof Feather.glyphMap;
  label: string; value: string | number; accent: string; large?: boolean;
}) {
  return (
    <View style={[styles.kpi, large && styles.kpiLarge, { borderColor: `${accent}25`, backgroundColor: `${accent}08` }]}>
      <Feather name={icon} size={14} color={accent} />
      <Text style={[styles.kpiVal, large && styles.kpiValLarge, { color: accent }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: 16, gap: 14, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back:   { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg.elevated, alignItems: 'center', justifyContent: 'center' },
  title:  { fontSize: 20, fontWeight: '900', color: '#fff' },

  kpiGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpi:        { borderRadius: 14, borderWidth: 1, padding: 12, gap: 4, minWidth: '47%', flex: 1 },
  kpiLarge:   { minWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  kpiVal:     { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  kpiValLarge:{ fontSize: 28 },
  kpiLabel:   { fontSize: 10, fontWeight: '700', color: Colors.text.muted },

  rateCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             16,
    backgroundColor: Colors.bg.card,
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    padding:         20,
  },
  rateCircle: {
    width:           80,
    height:          80,
    borderRadius:    40,
    borderWidth:     4,
    borderColor:     `${Colors.accent.emerald}40`,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: `${Colors.accent.emerald}08`,
  },
  ratePct:  { fontSize: 18, fontWeight: '900' },
  rateSub:  { fontSize: 8,  fontWeight: '700', color: Colors.text.muted },
  rateInfo: { flex: 1, gap: 4 },
  rateTitle:{ fontSize: 14, fontWeight: '800', color: '#fff' },
  rateDesc: { fontSize: 12, color: Colors.text.muted },
  progressBg:  { height: 6, borderRadius: 3, backgroundColor: Colors.border.DEFAULT },
  progressFill:{ height: 6, borderRadius: 3 },

  section:      { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  ticketRow:    { backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.DEFAULT, padding: 14, gap: 6 },
  ticketRowHead:{ flexDirection: 'row', justifyContent: 'space-between' },
  ticketName:   { fontSize: 14, fontWeight: '800' },
  ticketRevenue:{ fontSize: 14, fontWeight: '900', color: Colors.accent.emerald },
  ticketMeta:   {},
  ticketSold:   { fontSize: 11, color: Colors.text.muted },
  barBg:        { height: 4, borderRadius: 2, backgroundColor: Colors.border.DEFAULT },
  barFill:      { height: 4, borderRadius: 2 },

  empty:     { alignItems: 'center', gap: 10, paddingVertical: 60 },
  emptyText: { fontSize: 14, color: Colors.text.muted },
});
