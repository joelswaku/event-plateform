import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useSuperAdminStore, SAActivity } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n?: number | null): string {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
function fmt(n?: number | null): string {
  return (n ?? 0).toLocaleString();
}
function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

const ACT_CFG: Record<string, { color: string; icon: keyof typeof Feather.glyphMap }> = {
  user_registered:  { color: '#6366f1', icon: 'user-plus'   },
  ticket_purchased: { color: '#10b981', icon: 'credit-card' },
  event_published:  { color: '#f59e0b', icon: 'calendar'    },
  plan_upgraded:    { color: '#c9a96e', icon: 'zap'         },
  registration:     { color: '#6366f1', icon: 'user-plus'   },
  ticket_sale:      { color: '#10b981', icon: 'tag'         },
  event_created:    { color: '#f59e0b', icon: 'calendar'    },
  upgrade:          { color: '#c9a96e', icon: 'zap'         },
};

// ─── Animated counter ─────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1000): number {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!target) { setVal(0); return; }
    const start = Date.now();
    let raf: any;
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

// ─── Live Badge ───────────────────────────────────────────────────────────────

function LiveBadge() {
  const pulse = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(16,185,129,0.22)', backgroundColor: 'rgba(16,185,129,0.10)', paddingHorizontal: 8, paddingVertical: 3 }}>
      <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', opacity: pulse }} />
      <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 0.6, color: '#10b981' }}>LIVE</Text>
    </View>
  );
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function RevenueLineChart({ data }: { data: Array<{ revenue: string | number }> }) {
  if (!data?.length || data.every(d => parseFloat(String(d.revenue)) === 0)) {
    return (
      <View style={{ height: 100, borderRadius: 10, backgroundColor: 'rgba(201,169,110,0.04)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.15)', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Feather name="trending-up" size={22} color="rgba(201,169,110,0.25)" />
        <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.22)', textAlign: 'center', paddingHorizontal: 20 }}>
          Revenue data will appear here once tickets are sold
        </Text>
      </View>
    );
  }
  const W = 600, H = 100;
  const values = data.map(d => parseFloat(String(d.revenue ?? 0)));
  const max    = Math.max(...values, 1);
  const xs     = data.map((_, i) => (i / Math.max(data.length - 1, 1)) * W);
  const ys     = values.map(v => H - (v / max) * (H - 4));
  const line   = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const fill   = `M 0 ${H} ${xs.map((x, i) => `L ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')} L ${W} ${H} Z`;
  return (
    <Svg viewBox={`0 0 ${W} ${H + 4}`} width="100%" height={130} preserveAspectRatio="none">
      <Defs>
        <SvgGrad id="dashFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#c9a96e" stopOpacity={0.28} />
          <Stop offset="100%" stopColor="#c9a96e" stopOpacity={0}    />
        </SvgGrad>
      </Defs>
      <Path d={fill} fill="url(#dashFill)" />
      <Path d={line} fill="none" stroke="#c9a96e" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {xs.map((x, i) => <Circle key={i} cx={x} cy={ys[i]} r={3} fill="#c9a96e" opacity={0.9} />)}
    </Svg>
  );
}

const INSIGHT_COLORS: Record<string, string> = {
  opportunity: '#c9a96e',
  warning:     '#ef4444',
  growth:      '#10b981',
  alert:       '#f59e0b',
  insight:     '#818cf8',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ w, h, r }: { w?: number | string; h?: number; r?: number }) {
  return (
    <View style={{
      width: w ?? '100%', height: h ?? 14, borderRadius: r ?? 6,
      backgroundColor: 'rgba(255,255,255,0.07)',
    }} />
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string;
  icon: keyof typeof Feather.glyphMap; accent: string;
}) {
  return (
    <View style={[styles.kpiCard, { borderColor: `${accent}20` }]}>
      <View style={styles.kpiTop}>
        <View style={[styles.kpiIcon, { backgroundColor: `${accent}18`, borderColor: `${accent}28` }]}>
          <Feather name={icon} size={15} color={accent} />
        </View>
        <Text style={[styles.kpiLabel, { color: `${accent}BB` }]}>{label}</Text>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      {!!sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, route, linkLabel, live }: {
  title: string; route?: string; linkLabel?: string; live?: boolean;
}) {
  const router = useRouter();
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {live && <LiveBadge />}
      </View>
      {!!route && (
        <Pressable style={styles.viewAllBtn} onPress={() => router.push(route as never)}>
          <Text style={styles.viewAllText}>{linkLabel ?? 'View all'}</Text>
          <Feather name="arrow-right" size={11} color={Colors.accent.gold} />
        </Pressable>
      )}
    </View>
  );
}

// ─── Quick Action Card ────────────────────────────────────────────────────────

function QuickActionCard({ label, sub, icon, accent, route }: {
  label: string; sub: string; icon: keyof typeof Feather.glyphMap;
  accent: string; route: string;
}) {
  const router = useRouter();
  return (
    <Pressable
      style={[styles.qaCard, { borderColor: `${accent}20` }]}
      onPress={() => router.push(route as never)}
    >
      <View style={[styles.qaIcon, { backgroundColor: `${accent}18` }]}>
        <Feather name={icon} size={15} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.qaLabel}>{label}</Text>
        {!!sub && <Text style={styles.qaSub}>{sub}</Text>}
      </View>
      <Feather name="arrow-right" size={12} color={`${accent}60`} />
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const {
    stats, revenue, activity, health, aiInsights, financial,
    fetchStats, fetchRevenue, fetchActivity, fetchHealth, fetchAiInsights, fetchFinancial,
    loading,
  } = useSuperAdminStore();

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
      fetchRevenue();
      fetchActivity();
      fetchHealth();
      fetchAiInsights();
      fetchFinancial();
    }, [])
  );

  const s               = stats ?? ({} as any);
  const recentActivity  = (activity ?? []).slice(0, 8);
  const topInsights     = (Array.isArray(aiInsights) ? aiInsights : []).slice(0, 3);
  const services        = health?.services ?? [];
  const allOk           = Array.isArray(services)
    ? services.every((sv: any) => sv.status === 'healthy' || sv.status === 'operational' || sv.status === 'connected')
    : Object.values(services as any).every((s: any) => ['operational','connected'].includes(s?.status));

  const avgTicket = s.totalTickets > 0 ? Math.round((s.totalRevenue ?? 0) / s.totalTickets) : 0;

  const cRevenue = useCountUp(s.totalRevenue   ?? 0);
  const cUsers   = useCountUp(s.totalUsers     ?? 0);
  const cEvents  = useCountUp(s.totalEvents    ?? 0);
  const cTickets = useCountUp(s.totalTickets   ?? 0);
  const cOrgs    = useCountUp(s.totalOrgs      ?? 0);
  const cActive  = useCountUp(s.activeEvents   ?? 0);
  const cNew     = useCountUp(s.newUsersLast30 ?? 0);
  const cAvg     = useCountUp(s.totalTickets > 0 ? avgTicket : 0);

  // bar chart data for revenue trend
  const chartData = financial?.daily30 ?? revenue?.monthly ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.shieldWrap}>
            <Feather name="shield" size={18} color="#000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>Platform Overview</Text>
            <Text style={styles.headerTitle}>Super Admin Dashboard</Text>
          </View>
          <View style={[styles.statusPill, { borderColor: allOk ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)', backgroundColor: allOk ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)' }]}>
            <View style={[styles.statusDot, { backgroundColor: allOk ? '#10b981' : '#ef4444' }]} />
            <Text style={[styles.statusText, { color: allOk ? '#10b981' : '#ef4444' }]}>
              {allOk ? 'All OK' : 'Issue'}
            </Text>
          </View>
        </View>

        {/* ── KPI Grid ── */}
        {loading && !stats ? (
          <View style={styles.kpiGrid}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <View key={i} style={[styles.kpiCard, { gap: 12 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Sk w={36} h={36} r={10} />
                  <Sk w={70} h={10} />
                </View>
                <Sk w="60%" h={24} r={6} />
                <Sk w="45%" h={10} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.kpiGrid}>
            <KpiCard label="TOTAL REVENUE"   value={fmtMoney(cRevenue)}  sub="Gross platform revenue"               icon="dollar-sign"  accent="#c9a96e" />
            <KpiCard label="TOTAL USERS"     value={fmt(cUsers)}         sub={`+${fmt(s.newUsersLast30)} last 30d`} icon="users"        accent="#6366f1" />
            <KpiCard label="TOTAL EVENTS"    value={fmt(cEvents)}        sub={`${fmt(s.activeEvents)} published`}  icon="calendar"     accent="#10b981" />
            <KpiCard label="TICKETS SOLD"    value={fmt(cTickets)}       sub="Issued across platform"              icon="tag"          accent="#f59e0b" />
            <KpiCard label="ORGANIZATIONS"   value={fmt(cOrgs)}          sub="Active accounts"                     icon="briefcase"    accent="#a78bfa" />
            <KpiCard label="LIVE EVENTS"     value={fmt(cActive)}        sub="Currently published"                 icon="activity"     accent="#10b981" />
            <KpiCard label="NEW USERS (30D)" value={fmt(cNew)}           sub="Past 30 days"                        icon="user-plus"    accent="#06b6d4" />
            <KpiCard label="AVG / TICKET"    value={cAvg > 0 ? fmtMoney(cAvg) : '—'} sub="Revenue per ticket sold" icon="trending-up" accent="#10b981" />
          </View>
        )}

        {/* ── Revenue Trend ── */}
        <View style={styles.card}>
          <SectionHeader title="Revenue Trend (30 days)" route="/super-admin/financial" linkLabel="Full report" />
          <RevenueLineChart data={chartData as any[]} />
        </View>

        {/* ── Live Activity ── */}
        <View style={styles.card}>
          <SectionHeader title="Live Activity" route="/super-admin/activity" live />
          {recentActivity.length === 0 ? (
            <View style={styles.emptyRow}>
              <Feather name="activity" size={24} color="rgba(255,255,255,0.12)" />
              <Text style={styles.emptyText}>Activity will appear here as users register and purchase tickets</Text>
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              {recentActivity.map((item: SAActivity, i: number) => {
                const cfg = ACT_CFG[item.type] ?? ACT_CFG.user_registered;
                return (
                  <View key={item.id ?? i} style={styles.actItem}>
                    <View style={[styles.actIcon, { backgroundColor: `${cfg.color}18` }]}>
                      <Feather name={cfg.icon} size={11} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.actTime}>{timeAgo(item.created_at)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Top Events ── */}
        <View style={styles.card}>
          <SectionHeader title="Top Events · Revenue" route="/super-admin/events" />
          {(revenue?.topEvents?.length ?? 0) === 0 ? (
            <View style={styles.emptyRow}>
              <Feather name="dollar-sign" size={20} color="rgba(255,255,255,0.10)" />
              <Text style={styles.emptyText}>Revenue data appears once tickets are sold</Text>
            </View>
          ) : (
            <View style={{ gap: 2 }}>
              {revenue!.topEvents!.slice(0, 5).map((ev, i) => (
                <View key={ev.id} style={[styles.listRow, { backgroundColor: i % 2 === 0 ? '#111127' : 'transparent' }]}>
                  <Text style={styles.listRank}>{i + 1}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.listTitle} numberOfLines={1}>{ev.title}</Text>
                    <Text style={styles.listSub} numberOfLines={1}>{ev.org_name}</Text>
                  </View>
                  <Text style={styles.listValue}>{fmtMoney(parseFloat(String(ev.revenue ?? 0)))}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── AI Insights ── */}
        <View style={styles.card}>
          <SectionHeader title="AI Insights" route="/super-admin/ai" linkLabel="Full analysis" />
          {topInsights.length === 0 ? (
            <View style={styles.emptyRow}>
              <Feather name="cpu" size={20} color="rgba(255,255,255,0.10)" />
              <Text style={styles.emptyText}>Loading AI insights…</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {topInsights.map((ins: any, i: number) => {
                const col = INSIGHT_COLORS[ins.type] ?? '#818cf8';
                return (
                  <View key={i} style={[styles.insightCard, { backgroundColor: `${col}18`, borderColor: `${col}22` }]}>
                    <View style={styles.insightTop}>
                      <View style={[styles.insightDot, { backgroundColor: col }]} />
                      <Text style={styles.insightTitle}>{ins.title}</Text>
                      <Text style={[styles.insightPriority, { color: col }]}>{ins.priority?.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.insightDesc} numberOfLines={3}>{ins.description?.slice(0, 100)}{(ins.description?.length ?? 0) > 100 ? '…' : ''}</Text>
                    {!!ins.metric && <Text style={[styles.insightMetric, { color: col }]}>{ins.metric}</Text>}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── System Health ── */}
        <View style={styles.card}>
          <SectionHeader title="System Health" route="/super-admin/health" />
          {!health ? (
            <View style={styles.emptyRow}>
              <Feather name="heart" size={20} color="rgba(255,255,255,0.10)" />
              <Text style={styles.emptyText}>Checking services…</Text>
            </View>
          ) : (Array.isArray(services) ? services : Object.entries(services as any).map(([name, info]: any) => ({ name, ...info }))).map((svc: any, i: number) => {
            const ok  = svc.status === 'healthy' || svc.status === 'operational' || svc.status === 'connected';
            const na  = svc.status === 'not_configured';
            const col = ok ? '#10b981' : na ? 'rgba(255,255,255,0.25)' : '#ef4444';
            return (
              <View key={i} style={styles.svcRow}>
                <View style={[styles.svcDot, { backgroundColor: col }]} />
                <Text style={styles.svcName}>{svc.name ?? svc.service ?? 'Service'}</Text>
                {svc.latency != null && svc.latency > 0 && (
                  <Text style={styles.svcLatency}>{svc.latency}ms</Text>
                )}
                <Text style={[styles.svcStatus, { color: col }]}>{na ? 'N/A' : svc.status}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Quick Actions ── */}
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.qaGrid}>
            <QuickActionCard label="Manage Events"       sub={`${fmt(s.totalEvents)} total`}       icon="calendar"      accent="#10b981" route="/super-admin/events"        />
            <QuickActionCard label="Organizations"       sub={`${fmt(s.totalOrgs)} accounts`}      icon="briefcase"     accent="#a78bfa" route="/super-admin/organizations"  />
            <QuickActionCard label="Users & Permissions" sub={`${fmt(s.totalUsers)} members`}      icon="users"         accent="#6366f1" route="/super-admin/users"          />
            <QuickActionCard label="Moderation Center"   sub="Safety & fraud"                      icon="shield"        accent="#ef4444" route="/super-admin/moderation"     />
            <QuickActionCard label="Financial Center"    sub={`${fmtMoney(s.totalRevenue)} GMV`}   icon="dollar-sign"   accent="#c9a96e" route="/super-admin/financial"      />
            <QuickActionCard label="AI Insights"         sub="Platform analytics"                  icon="cpu"           accent="#818cf8" route="/super-admin/ai"             />
            <QuickActionCard label="Feature Flags"       sub="Toggle features"                     icon="toggle-left"   accent="#f59e0b" route="/super-admin/flags"          />
            <QuickActionCard label="Audit Logs"          sub="Admin actions"                       icon="clipboard"     accent="#06b6d4" route="/super-admin/audit"          />
            <QuickActionCard label="Support Settings"    sub="Auto-reply messages"                 icon="message-circle" accent="#10b981" route="/super-admin/support-settings" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#07070f' },
  scroll:  { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shieldWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#c9a96e',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#c9a96e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16,
    elevation: 8,
  },
  headerSub:   { fontSize: 10, fontWeight: '700', color: 'rgba(201,169,110,0.65)', textTransform: 'uppercase', letterSpacing: 0.8 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },

  // KPI
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    width: '48%',
    backgroundColor: '#0d0d1a',
    borderRadius:    16,
    borderWidth:     1,
    padding:         14,
    gap:             6,
  },
  kpiTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  kpiIcon: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  kpiLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'right', flexShrink: 1, flex: 1, marginLeft: 6 },
  kpiValue: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  kpiSub:   { fontSize: 10, color: 'rgba(255,255,255,0.30)' },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle:  { fontSize: 14, fontWeight: '900', color: '#fff' },
  viewAllBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText:   { fontSize: 11, fontWeight: '700', color: Colors.accent.gold },

  // Card container
  card: {
    backgroundColor: '#0d0d1a',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(201,169,110,0.12)',
    padding:         16,
  },

  // Activity
  actItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
  actIcon: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  actTitle: { fontSize: 11, fontWeight: '600', color: '#fff', lineHeight: 16 },
  actTime:  { fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 2 },

  // Lists
  listRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  listRank:  { fontSize: 11, fontWeight: '900', color: 'rgba(201,169,110,0.50)', width: 16 },
  listTitle: { fontSize: 12, fontWeight: '700', color: '#fff' },
  listSub:   { fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 1 },
  listValue: { fontSize: 12, fontWeight: '900', color: '#c9a96e' },

  // AI insights
  insightCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  insightTop:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insightDot:  { width: 6, height: 6, borderRadius: 3 },
  insightTitle: { flex: 1, fontSize: 11, fontWeight: '900', color: '#fff' },
  insightPriority: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  insightDesc: { fontSize: 11, color: 'rgba(255,255,255,0.50)', lineHeight: 16 },
  insightMetric: { fontSize: 12, fontWeight: '900' },

  // System health
  svcRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 4 },
  svcDot:    { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  svcName:   { flex: 1, fontSize: 12, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  svcLatency:{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' },
  svcStatus: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

  // Quick actions
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  qaCard: {
    width: '48%',
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    backgroundColor: '#0d0d1a',
    borderRadius:    16,
    borderWidth:     1,
    padding:         14,
  },
  qaIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  qaLabel: { fontSize: 12, fontWeight: '700', color: '#fff' },
  qaSub:   { fontSize: 10, color: 'rgba(255,255,255,0.30)', marginTop: 2 },

  // Empty states
  emptyRow:  { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  emptyText: { fontSize: 12, color: 'rgba(255,255,255,0.22)', textAlign: 'center', paddingHorizontal: 20 },
});
