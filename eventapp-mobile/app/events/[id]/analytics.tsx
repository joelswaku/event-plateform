import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Path, Defs,
  LinearGradient as SvgGrad, Stop,
  Circle as SvgDot,
  Line as SvgLine,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import api from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Interval = 'day' | 'hour' | 'month';

interface RevenuePoint { bucket: string; revenue: number; orders: number; }
interface TicketTypeSale {
  ticket_type_id: string;
  ticket_type_name: string;
  kind: string;
  price: number;
  paid_quantity: number;
  quantity_total: number;
  paid_revenue: number;
}
interface TicketSalesData {
  by_ticket_type: TicketTypeSale[];
  timeline: Array<{ bucket: string; paid_revenue: number; }>;
}
interface CheckinData {
  summary: { success: number; already_used: number; invalid: number; revoked: number; };
  by_hour: Array<{ hour: number; successful_scans: number; }>;
}
interface ConversionData {
  invited: number;
  attending: number;
  buyers: number;
  conversion_rate: number;
}
interface InsightsData {
  top_ticket?: { name: string; sold: number; };
  peak_hour?:  { hour: number; orders: number; };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}
function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${Number(n).toFixed(1)}%`;
}
function fmtHour(h: number | null | undefined): string {
  if (h == null) return '—';
  const ampm = Number(h) >= 12 ? 'PM' : 'AM';
  const d = Number(h) % 12 || 12;
  return `${d}:00 ${ampm}`;
}

// ─── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data, color, id, w = 64, h = 26 }: {
  data: number[]; color: string; id: string; w?: number; h?: number;
}) {
  if (!data || data.length < 2) return <View style={{ width: w, height: h }} />;
  const mx = Math.max(...data, 1), mn = Math.min(...data);
  const range = mx - mn || 1;
  const pad = 2;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((v - mn) / range) * (h - pad * 2),
  }));
  const ln = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const ar = `${ln} L ${pts[pts.length - 1].x} ${h - pad} L ${pts[0].x} ${h - pad} Z`;
  const lp = pts[pts.length - 1];
  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGrad id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </SvgGrad>
      </Defs>
      <Path d={ar} fill={`url(#${id})`} />
      <Path d={ln} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <SvgDot cx={lp.x} cy={lp.y} r="2.5" fill={color} />
    </Svg>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, accent, sparkData, sparkId, loading }: {
  icon: keyof typeof Feather.glyphMap;
  label: string; value: string; sub?: string;
  accent: string; sparkData?: number[]; sparkId?: string; loading?: boolean;
}) {
  return (
    <View style={[styles.kpiCard, { borderColor: `${accent}30`, backgroundColor: `${accent}08` }]}>
      <View style={styles.kpiTop}>
        <View style={[styles.kpiIcon, { backgroundColor: `${accent}18` }]}>
          <Feather name={icon} size={13} color={accent} />
        </View>
        {sparkData && sparkData.length > 1 && sparkId && !loading && (
          <Sparkline data={sparkData} color={accent} id={sparkId} />
        )}
      </View>
      {loading
        ? <View style={styles.kpiSkeleton} />
        : <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      }
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub && !loading ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

// ─── Revenue Line Chart ────────────────────────────────────────────────────────

function RevenueChart({ data, chartW }: { data: RevenuePoint[]; chartW: number }) {
  const H = 130;
  const pL = 44, pR = 8, pT = 8, pB = 24;
  const iW = chartW - pL - pR;
  const iH = H - pT - pB;

  if (!data.length) {
    return (
      <View style={{ height: H, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.text.subtle, fontSize: 12 }}>No revenue data yet</Text>
      </View>
    );
  }

  const revenues = data.map(d => Number(d.revenue ?? 0));
  const maxR = Math.max(...revenues, 1);
  const xs = (i: number) => pL + (i / Math.max(data.length - 1, 1)) * iW;
  const ys = (v: number) => pT + iH - (v / maxR) * iH;

  const pts = data.map((d, i) => ({ x: xs(i), y: ys(Number(d.revenue ?? 0)) }));
  const ln  = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const ar  = `${ln} L ${xs(data.length - 1)} ${pT + iH} L ${xs(0)} ${pT + iH} Z`;

  const yTicks = [0, 0.5, 1].map(t => ({ y: pT + iH * (1 - t), label: fmtMoney(maxR * t) }));
  const step = Math.max(1, Math.floor(data.length / 4));
  const xTicks = data
    .map((d, i) => ({ i, label: new Date(d.bucket).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }))
    .filter((_, i, arr) => i % step === 0 || i === arr.length - 1);

  return (
    <Svg width={chartW} height={H}>
      <Defs>
        <SvgGrad id="revArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={Colors.accent.indigo} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={Colors.accent.indigo} stopOpacity="0" />
        </SvgGrad>
      </Defs>
      {yTicks.map(t => (
        <G key={t.y}>
          <SvgLine x1={pL} y1={t.y} x2={chartW - pR} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <SvgText x={pL - 4} y={t.y + 4} textAnchor="end" fontSize="8" fill={Colors.text.subtle}>{t.label}</SvgText>
        </G>
      ))}
      {xTicks.map(t => (
        <SvgText key={t.i} x={xs(t.i)} y={H - 4} textAnchor="middle" fontSize="8" fill={Colors.text.subtle}>{t.label}</SvgText>
      ))}
      <Path d={ar} fill="url(#revArea)" />
      <Path d={ln} fill="none" stroke={Colors.accent.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <SvgDot cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill={Colors.accent.indigo} stroke="rgba(99,102,241,0.3)" strokeWidth="4" />
    </Svg>
  );
}

// ─── Interval Toggle ──────────────────────────────────────────────────────────

function IntervalToggle({ value, onChange }: { value: Interval; onChange: (v: Interval) => void }) {
  return (
    <View style={styles.toggleRow}>
      {(['hour', 'day', 'month'] as Interval[]).map(o => (
        <Pressable key={o} onPress={() => onChange(o)} style={[styles.toggleBtn, value === o && styles.toggleBtnActive]}>
          <Text style={[styles.toggleLabel, value === o && styles.toggleLabelActive]}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, subtitle, action, children }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skel({ h = 56 }: { h?: number }) {
  return <View style={[styles.skeleton, { height: h }]} />;
}

// ─── Ticket Types ─────────────────────────────────────────────────────────────

const TICKET_ACCENTS = [
  Colors.accent.indigo, Colors.accent.violet, Colors.accent.emerald,
  Colors.accent.amber,  Colors.accent.cyan,
];

function TicketTypeRows({ data, loading }: { data: TicketTypeSale[]; loading: boolean }) {
  if (loading) return <View style={{ gap: 8 }}>{[1,2,3].map(i => <Skel key={i} h={64} />)}</View>;
  if (!data.length) return <Text style={styles.emptyText}>No ticket types found.</Text>;
  return (
    <View style={{ gap: 8 }}>
      {data.map((tt, idx) => {
        const fillPct = tt.quantity_total > 0 ? Math.min((tt.paid_quantity / tt.quantity_total) * 100, 100) : 0;
        const accent  = TICKET_ACCENTS[idx % TICKET_ACCENTS.length];
        return (
          <View key={tt.ticket_type_id} style={[styles.ticketRow, { borderColor: `${accent}22` }]}>
            <View style={styles.ticketRowTop}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.ticketName, { color: accent }]}>{tt.ticket_type_name}</Text>
                <Text style={styles.ticketKind}>{tt.kind?.toLowerCase()} · {tt.price === 0 ? 'Free' : `$${tt.price}`}</Text>
              </View>
              <Text style={styles.ticketRev}>{fmtMoney(tt.paid_revenue)}</Text>
            </View>
            <View style={styles.ticketMeta}>
              <Text style={styles.ticketSold}>
                {fmtNum(tt.paid_quantity)} sold{tt.quantity_total > 0 ? ` / ${fmtNum(tt.quantity_total)}` : ''}
              </Text>
              <Text style={styles.ticketPct}>{fmtPct(fillPct)}</Text>
            </View>
            {tt.quantity_total > 0 && (
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${fillPct}%` as `${number}%`, backgroundColor: accent }]} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Conversion Funnel ────────────────────────────────────────────────────────

function Funnel({ data, loading }: { data: ConversionData | null; loading: boolean }) {
  if (loading) return <View style={{ gap: 10 }}>{[1,2,3].map(i => <Skel key={i} h={54} />)}</View>;
  if (!data) return null;

  const steps = [
    { label: 'Invited',   value: data.invited,   accent: Colors.accent.indigo },
    { label: "RSVP'd",    value: data.attending, accent: Colors.accent.violet },
    { label: 'Buyers',    value: data.buyers,    accent: Colors.accent.emerald },
  ];
  const max = Math.max(...steps.map(s => s.value), 1);

  return (
    <View style={{ gap: 10 }}>
      {steps.map((s, i) => (
        <View key={s.label} style={[styles.funnelRow, { backgroundColor: `${s.accent}0C`, borderColor: `${s.accent}22` }]}>
          <View style={styles.funnelRowHead}>
            <Text style={styles.funnelLabel}>{s.label}</Text>
            <Text style={[styles.funnelValue, { color: s.accent }]}>{fmtNum(s.value)}</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${(s.value / max) * 100}%` as `${number}%`, backgroundColor: s.accent }]} />
          </View>
          {i > 0 && steps[i - 1].value > 0 && (
            <Text style={styles.funnelPct}>{fmtPct((s.value / steps[i - 1].value) * 100)} of previous step</Text>
          )}
        </View>
      ))}
      <View style={[styles.funnelRow, { backgroundColor: `${Colors.accent.indigo}10`, borderColor: `${Colors.accent.indigo}35` }]}>
        <Text style={[styles.funnelLabel, { color: Colors.accent.indigo, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }]}>Overall Conversion</Text>
        <Text style={[styles.funnelValue, { color: Colors.accent.indigo, fontSize: 26, lineHeight: 30 }]}>{fmtPct(data.conversion_rate)}</Text>
        <Text style={[styles.funnelPct]}>invited → ticket buyers</Text>
      </View>
    </View>
  );
}

// ─── Check-in Stats ───────────────────────────────────────────────────────────

function CheckinStats({ data, loading }: { data: CheckinData | null; loading: boolean }) {
  if (loading) return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {[1,2,3,4].map(i => <View key={i} style={[styles.skeleton, { height: 70, flex: 1, minWidth: '47%' }]} />)}
    </View>
  );
  if (!data?.summary) return null;

  const { success, already_used, invalid, revoked } = data.summary;
  const total = success + already_used + invalid + revoked;

  const items = [
    { label: 'Successful', value: success,      icon: 'check-circle' as const, accent: Colors.accent.emerald },
    { label: 'Duplicate',  value: already_used, icon: 'copy'         as const, accent: Colors.accent.amber  },
    { label: 'Invalid',    value: invalid,       icon: 'x-circle'     as const, accent: Colors.accent.red    },
    { label: 'Revoked',    value: revoked,       icon: 'alert-circle' as const, accent: Colors.text.muted   },
  ];

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.checkinGrid}>
        {items.map(item => (
          <View key={item.label} style={[styles.checkinCell, { backgroundColor: `${item.accent}0C`, borderColor: `${item.accent}22` }]}>
            <Feather name={item.icon} size={15} color={item.accent} />
            <Text style={[styles.checkinValue, { color: item.accent }]}>{fmtNum(item.value)}</Text>
            <Text style={styles.checkinLabel}>{item.label}</Text>
            {total > 0 && <Text style={styles.checkinPct}>{fmtPct((item.value / total) * 100)}</Text>}
          </View>
        ))}
      </View>
      {total > 0 && (
        <View style={{ gap: 6 }}>
          <Text style={styles.microLabel}>SCAN BREAKDOWN</Text>
          <View style={styles.segBar}>
            {items.map(item => (
              <View
                key={item.label}
                style={{
                  height: '100%',
                  width: `${(item.value / total) * 100}%` as `${number}%`,
                  backgroundColor: item.accent === Colors.text.muted ? '#9ca3af' : item.accent,
                }}
              />
            ))}
          </View>
          <Text style={styles.microLabel}>{fmtNum(total)} total scans</Text>
        </View>
      )}
      {data.by_hour && data.by_hour.length > 1 && (
        <View style={{ gap: 6 }}>
          <Text style={styles.microLabel}>CHECK-INS OVER TIME</Text>
          <Sparkline data={data.by_hour.map(h => h.successful_scans)} color={Colors.accent.emerald} id="checkinTime" w={300} h={44} />
        </View>
      )}
    </View>
  );
}

// ─── Insights ─────────────────────────────────────────────────────────────────

function Insights({ data, loading }: { data: InsightsData | null; loading: boolean }) {
  if (loading) return <View style={{ gap: 10 }}>{[1,2].map(i => <Skel key={i} h={70} />)}</View>;
  if (!data) return null;
  if (!data.top_ticket && !data.peak_hour) {
    return (
      <View style={styles.emptyInsight}>
        <Feather name="zap" size={15} color={Colors.text.subtle} />
        <Text style={styles.emptyText}>Insights appear once sales begin.</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      {data.top_ticket ? (
        <View style={[styles.insightCard, { borderColor: `${Colors.accent.indigo}28`, backgroundColor: `${Colors.accent.indigo}0A` }]}>
          <View style={[styles.insightIcon, { backgroundColor: `${Colors.accent.indigo}20` }]}>
            <Feather name="tag" size={14} color={Colors.accent.indigo} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.microLabel, { color: Colors.accent.indigo }]}>TOP SELLING TICKET</Text>
            <Text style={styles.insightHeading}>{data.top_ticket.name}</Text>
            <Text style={styles.insightSub}>{fmtNum(data.top_ticket.sold)} units sold</Text>
          </View>
        </View>
      ) : null}
      {data.peak_hour ? (
        <View style={[styles.insightCard, { borderColor: `${Colors.accent.amber}28`, backgroundColor: `${Colors.accent.amber}0A` }]}>
          <View style={[styles.insightIcon, { backgroundColor: `${Colors.accent.amber}20` }]}>
            <Feather name="clock" size={14} color={Colors.accent.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.microLabel, { color: Colors.accent.amber }]}>PEAK SALES HOUR</Text>
            <Text style={styles.insightHeading}>{fmtHour(data.peak_hour.hour)}</Text>
            <Text style={styles.insightSub}>{fmtNum(data.peak_hour.orders)} orders in that hour</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const chartW = width - 32;

  const [interval, setInterval]     = useState<Interval>('day');
  const [refreshing, setRefreshing] = useState(false);

  const [ticketSales, setTicketSales] = useState<TicketSalesData | null>(null);
  const [checkins,    setCheckins]    = useState<CheckinData | null>(null);
  const [revenue,     setRevenue]     = useState<RevenuePoint[]>([]);
  const [conversion,  setConversion]  = useState<ConversionData | null>(null);
  const [insights,    setInsights]    = useState<InsightsData | null>(null);

  const [loading, setLoading] = useState({
    ticketSales: true, checkins: true, revenue: true, conversion: true, insights: true,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!eventId) return;
    setError(null);
    setLoading({ ticketSales: true, checkins: true, revenue: true, conversion: true, insights: true });

    type LoadKey = keyof typeof loading;
    const safe = async (key: LoadKey, fn: () => Promise<unknown>) => {
      try {
        const data = await fn();
        if      (key === 'ticketSales') setTicketSales(data as TicketSalesData);
        else if (key === 'checkins')    setCheckins(data as CheckinData);
        else if (key === 'revenue')     setRevenue((data as RevenuePoint[]) ?? []);
        else if (key === 'conversion')  setConversion(data as ConversionData);
        else if (key === 'insights')    setInsights(data as InsightsData);
      } catch {
        if (key === 'ticketSales') setError('Failed to load analytics');
      } finally {
        setLoading(prev => ({ ...prev, [key]: false }));
      }
    };

    await Promise.all([
      safe('ticketSales', () => api.get(`/dashboard/events/${eventId}/analytics/ticket-sales`).then(r => r.data?.data)),
      safe('checkins',    () => api.get(`/dashboard/events/${eventId}/analytics/ticket-checkins`).then(r => r.data?.data)),
      safe('revenue',     () => api.get(`/dashboard/events/${eventId}/analytics/revenue`, { params: { interval } }).then(r => r.data?.data)),
      safe('conversion',  () => api.get(`/dashboard/events/${eventId}/analytics/conversion`).then(r => r.data?.data)),
      safe('insights',    () => api.get(`/dashboard/events/${eventId}/analytics/insights`).then(r => r.data?.data)),
    ]);
  }, [eventId, interval]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const kpiRevenue  = ticketSales?.by_ticket_type?.reduce((s, t) => s + (t.paid_revenue  ?? 0), 0) ?? 0;
  const kpiTickets  = ticketSales?.by_ticket_type?.reduce((s, t) => s + (t.paid_quantity ?? 0), 0) ?? 0;
  const kpiCheckins = checkins?.summary?.success ?? 0;
  const kpiConv     = conversion?.conversion_rate ?? 0;
  const kpiInvited  = conversion?.invited ?? 0;

  const revSpark = (revenue ?? []).map(d => Number(d.revenue ?? 0)).slice(-12);
  const tixSpark = (ticketSales?.timeline ?? []).map(t => Number(t.paid_revenue ?? 0)).slice(-12);

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Feather name="arrow-left" size={18} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Pressable
          onPress={handleRefresh}
          style={[styles.headerBtn, refreshing && { opacity: 0.4 }]}
          disabled={refreshing}
        >
          <Feather name="refresh-cw" size={15} color={Colors.text.muted} />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <Feather name="alert-circle" size={32} color={Colors.accent.red} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={handleRefresh} style={styles.retryBtn}>
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* KPI scroll row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll} contentContainerStyle={styles.kpiRow}>
            <KpiCard
              icon="dollar-sign" label="Revenue"    value={fmtMoney(kpiRevenue)}
              sub={`${fmtNum(conversion?.buyers)} buyers`}
              accent={Colors.accent.indigo} sparkData={revSpark} sparkId="kpiRev"
              loading={loading.ticketSales}
            />
            <KpiCard
              icon="tag" label="Sold" value={fmtNum(kpiTickets)}
              sub="paid tickets"
              accent={Colors.accent.violet} sparkData={tixSpark} sparkId="kpiTix"
              loading={loading.ticketSales}
            />
            <KpiCard
              icon="check-circle" label="Check-ins" value={fmtNum(kpiCheckins)}
              sub="successful"
              accent={Colors.accent.emerald} loading={loading.checkins}
            />
            <KpiCard
              icon="users" label="Invited" value={fmtNum(kpiInvited)}
              sub="total guests"
              accent={Colors.accent.cyan} loading={loading.conversion}
            />
            <KpiCard
              icon="trending-up" label="Conversion" value={fmtPct(kpiConv)}
              sub="invited → buyer"
              accent={Colors.accent.amber} loading={loading.conversion}
            />
          </ScrollView>

          {/* Revenue timeline */}
          <Section
            title="Revenue Timeline"
            subtitle="Paid orders grouped by period"
            action={<IntervalToggle value={interval} onChange={v => setInterval(v)} />}
          >
            {loading.revenue
              ? <Skel h={130} />
              : <RevenueChart data={revenue} chartW={chartW} />
            }
          </Section>

          {/* Ticket types */}
          <Section title="Ticket Types" subtitle="Sold, revenue and capacity">
            <TicketTypeRows data={ticketSales?.by_ticket_type ?? []} loading={loading.ticketSales} />
          </Section>

          {/* Conversion funnel */}
          <Section title="Conversion Funnel" subtitle="Invited → RSVP → Buyer">
            <Funnel data={conversion} loading={loading.conversion} />
          </Section>

          {/* Check-in stats */}
          <Section title="Check-in Analytics" subtitle="Scanner activity and outcomes">
            <CheckinStats data={checkins} loading={loading.checkins} />
          </Section>

          {/* Insights */}
          <Section title="Key Insights" subtitle="Auto-detected from your event data">
            <Insights data={insights} loading={loading.insights} />
          </Section>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },

  content: { padding: 16, gap: 14, paddingBottom: 52 },

  errorWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText:  { fontSize: 14, color: Colors.text.muted, textAlign: 'center' },
  retryBtn:   { backgroundColor: Colors.accent.indigo, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryLabel: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // KPI
  kpiScroll: { marginHorizontal: -16 },
  kpiRow:    { paddingHorizontal: 16, gap: 10 },
  kpiCard:   {
    width: 148, borderRadius: 18, borderWidth: 1,
    padding: 14, gap: 6,
  },
  kpiTop:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  kpiIcon:   { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  kpiValue:  { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  kpiLabel:  { fontSize: 10, fontWeight: '700', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  kpiSub:    { fontSize: 10, color: Colors.text.subtle },
  kpiSkeleton: { height: 24, borderRadius: 6, backgroundColor: Colors.bg.elevated },

  // Section card
  section:     { gap: 12, backgroundColor: Colors.bg.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border.DEFAULT, padding: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  sectionTitle:{ fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  sectionSub:  { fontSize: 11, color: Colors.text.subtle, marginTop: 2 },

  // Interval toggle
  toggleRow:        { flexDirection: 'row', gap: 2, backgroundColor: Colors.bg.elevated, borderRadius: 10, padding: 2 },
  toggleBtn:        { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  toggleBtnActive:  { backgroundColor: Colors.bg.card, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  toggleLabel:      { fontSize: 10, fontWeight: '600', color: Colors.text.muted },
  toggleLabelActive:{ color: '#fff' },

  // Ticket rows
  ticketRow:    { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6, backgroundColor: Colors.bg.elevated },
  ticketRowTop: { flexDirection: 'row', alignItems: 'flex-start' },
  ticketName:   { fontSize: 13, fontWeight: '800' },
  ticketKind:   { fontSize: 10, color: Colors.text.subtle },
  ticketRev:    { fontSize: 14, fontWeight: '900', color: Colors.accent.emerald },
  ticketMeta:   { flexDirection: 'row', justifyContent: 'space-between' },
  ticketSold:   { fontSize: 10, color: Colors.text.muted },
  ticketPct:    { fontSize: 10, color: Colors.text.muted },

  // Progress bars
  barBg:   { height: 5, borderRadius: 3, backgroundColor: Colors.border.DEFAULT, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },
  segBar:  { height: 7, borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },

  microLabel: { fontSize: 9, fontWeight: '700', color: Colors.text.subtle, letterSpacing: 0.5 },

  // Funnel
  funnelRow:    { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  funnelRowHead:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  funnelLabel:  { fontSize: 12, fontWeight: '600', color: Colors.text.primary },
  funnelValue:  { fontSize: 16, fontWeight: '900' },
  funnelPct:    { fontSize: 10, color: Colors.text.subtle },

  // Check-in grid
  checkinGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  checkinCell: {
    flex: 1, minWidth: '47%', borderRadius: 12, borderWidth: 1, padding: 12,
    gap: 3, alignItems: 'flex-start',
  },
  checkinValue: { fontSize: 22, fontWeight: '900' },
  checkinLabel: { fontSize: 10, fontWeight: '700', color: Colors.text.muted },
  checkinPct:   { fontSize: 10, color: Colors.text.subtle },

  // Insights
  insightCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  insightIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  insightHeading:{ fontSize: 14, fontWeight: '800', color: '#fff', marginTop: 2 },
  insightSub:    { fontSize: 11, color: Colors.text.muted, marginTop: 2 },

  emptyInsight: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16,
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.border.DEFAULT,
  },
  emptyText: { fontSize: 13, color: Colors.text.muted },

  skeleton: { borderRadius: 12, backgroundColor: Colors.bg.elevated },
});
