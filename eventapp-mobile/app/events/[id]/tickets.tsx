import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { notify } from '@/lib/toast';
import { useTicketStore }  from '@/store/ticket.store';
import { TicketTypeCard }  from '@/components/tickets/TicketTypeCard';
import { BottomSheet }     from '@/components/ui/BottomSheet';
import { Input }           from '@/components/ui/Input';
import { Button }          from '@/components/ui/Button';
import { ConfirmModal }    from '@/components/ui/ConfirmModal';
import { EmptyState }      from '@/components/ui/EmptyState';
import { Colors }          from '@/constants/colors';
import { fmtCurrency }     from '@/lib/format';
import { TicketType, TicketKind } from '@/types';

type FormData = { name: string; kind: TicketKind; price: string; quantity_total: string; description: string; };

const EMPTY_FORM: FormData = { name: '', kind: 'PAID', price: '', quantity_total: '', description: '' };

export default function EventTicketsScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { ticketTypes, stats, fetchTicketTypes, fetchStats, createTicketType, updateTicketType, deleteTicketType } = useTicketStore();

  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<TicketType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TicketType | null>(null);
  const [form,       setForm]       = useState<FormData>(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (!eventId) return;
    fetchTicketTypes(eventId);
    fetchStats(eventId);
  }, [eventId]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditTarget(null); setSheetOpen(true); };
  const openEdit   = (t: TicketType) => {
    setEditTarget(t);
    setForm({ name: t.name, kind: t.kind, price: String(t.price), quantity_total: t.quantity_total != null ? String(t.quantity_total) : '', description: t.description ?? '' });
    setSheetOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return notify.ticketRequired();
    setSaving(true);
    const payload = {
      name:           form.name.trim(),
      kind:           form.kind,
      price:          form.kind === 'FREE' ? 0 : parseFloat(form.price) || 0,
      quantity_total: form.quantity_total ? parseInt(form.quantity_total) : null,
      description:    form.description.trim() || null,
      is_active:      true,
    };
    let res;
    if (editTarget) res = await updateTicketType(editTarget.id, payload);
    else            res = await createTicketType(eventId!, payload);
    setSaving(false);
    if (res.success) {
      editTarget ? notify.ticketUpdated() : notify.ticketCreated();
      setSheetOpen(false);
      fetchTicketTypes(eventId!);
      fetchStats(eventId!);
    } else {
      notify.ticketFailed();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => { fetchTicketTypes(eventId!); fetchStats(eventId!); }} tintColor={Colors.accent.indigo} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Tickets</Text>
          <Pressable style={styles.addBtn} onPress={openCreate}>
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Stats KPIs */}
        {stats && (
          <View style={styles.kpiRow}>
            <KPI label="Revenue"  value={fmtCurrency(stats.gross_revenue)}  accent={Colors.accent.emerald} />
            <KPI label="Orders"   value={stats.paid_orders}                  accent={Colors.accent.indigo}  />
            <KPI label="Issued"   value={stats.total_issued}                 accent={Colors.accent.amber}   />
            <KPI label="Checked"  value={stats.checked_in}                   accent={Colors.accent.violet}  />
          </View>
        )}

        {/* Charts */}
        {stats && stats.total_issued > 0 && (
          <View style={{ gap: 10 }}>
            <DonutChart
              title="Ticket status"
              centerLabel={stats.total_issued}
              centerSub="issued"
              segments={[
                { label: 'Active',     count: stats.active_tickets ?? (stats.total_issued - stats.checked_in - (stats.revoked ?? 0)), color: '#6366f1' },
                { label: 'Checked in', count: stats.checked_in,     color: '#10b981' },
                { label: 'Revoked',    count: stats.revoked ?? 0,   color: '#f43f5e' },
              ]}
            />
            <DonutChart
              title="Orders"
              centerLabel={stats.total_orders}
              centerSub="orders"
              segments={[
                { label: 'Paid',    count: stats.paid_orders,                        color: '#10b981' },
                { label: 'Pending', count: stats.total_orders - stats.paid_orders,   color: '#f59e0b' },
              ]}
            />
            <DonutChart
              title="By ticket kind"
              centerLabel={ticketTypes.reduce((s, t) => s + (t.quantity_sold ?? 0), 0)}
              centerSub="sold"
              segments={ticketTypes.reduce((acc: Seg[], t) => {
                const ex = acc.find(s => s.label === t.kind);
                if (ex) ex.count += (t.quantity_sold ?? 0);
                else acc.push({ label: t.kind, count: t.quantity_sold ?? 0,
                  color: t.kind === 'FREE' ? '#10b981' : t.kind === 'PAID' ? '#6366f1' : '#f59e0b' });
                return acc;
              }, [])}
            />
            <CapacityBars ticketTypes={ticketTypes} />
          </View>
        )}

        {/* Ticket types */}
        {ticketTypes.length === 0 ? (
          <EmptyState
            icon="credit-card"
            title="No ticket types"
            description="Create your first ticket type to start selling."
            actionLabel="Create Ticket"
            onAction={openCreate}
            accent={Colors.accent.indigo}
          />
        ) : (
          ticketTypes.map(t => (
            <TicketTypeCard
              key={t.id}
              ticket={t}
              onEdit={() => openEdit(t)}
              onDelete={() => setDeleteTarget(t)}
              onToggle={async () => {
                await updateTicketType(t.id, { is_active: !t.is_active });
                fetchTicketTypes(eventId!);
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Create/Edit sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editTarget ? 'Edit Ticket' : 'Create Ticket'}>
        <View style={styles.form}>
          <Input label="Ticket Name *" placeholder="e.g. VIP Access" value={form.name}
            onChangeText={t => setForm(f => ({ ...f, name: t }))} />

          {/* Kind selector */}
          <View style={styles.kindRow}>
            {(['FREE','PAID'] as TicketKind[]).map(k => (
              <Pressable
                key={k}
                style={[styles.kindBtn, form.kind === k && { backgroundColor: `${Colors.accent.indigo}25`, borderColor: `${Colors.accent.indigo}50` }]}
                onPress={() => setForm(f => ({ ...f, kind: k }))}
              >
                <Text style={[styles.kindText, form.kind === k && { color: Colors.accent.indigo }]}>{k}</Text>
              </Pressable>
            ))}
          </View>

          {form.kind === 'PAID' && (
            <Input label="Price (USD) *" placeholder="0.00" keyboardType="decimal-pad" value={form.price}
              onChangeText={t => setForm(f => ({ ...f, price: t }))} />
          )}
          <Input label="Quantity (leave empty for unlimited)" placeholder="100" keyboardType="number-pad"
            value={form.quantity_total} onChangeText={t => setForm(f => ({ ...f, quantity_total: t }))} />
          <Input label="Description" placeholder="What's included…" value={form.description}
            onChangeText={t => setForm(f => ({ ...f, description: t }))} multiline />

          <Button label={saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Ticket'} onPress={save} loading={saving} accent={Colors.accent.indigo} size="lg" />
        </View>
      </BottomSheet>

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          open
          title={`Delete "${deleteTarget.name}"?`}
          description="All sales data associated with this ticket type will remain but this type will be removed."
          confirmText="Delete"
          variant="danger"
          onConfirm={async () => {
            await deleteTicketType(deleteTarget.id);
            await fetchTicketTypes(eventId!);
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

function KPI({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <View style={[styles.kpi, { borderColor: `${accent}25`, backgroundColor: `${accent}08` }]}>
      <Text style={[styles.kpiVal, { color: accent }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

/* ── Donut chart ─────────────────────────────────────────── */
interface Seg { label: string; count: number; color: string; }
function DonutChart({ title, segments, centerLabel, centerSub }: { title: string; segments: Seg[]; centerLabel?: number | string; centerSub?: string }) {
  const total = segments.reduce((s, g) => s + g.count, 0);
  const R = 34, cx = 42, cy = 42, sw = 10;
  const circ = 2 * Math.PI * R;
  let off = 0;
  const arcs = segments.map(seg => {
    const dash = total > 0 ? (seg.count / total) * circ : 0;
    const arc  = { ...seg, dash, off };
    off += dash;
    return arc;
  });
  return (
    <View style={ch.card}>
      <Text style={ch.title}>{title}</Text>
      <View style={ch.row}>
        <View style={{ width: 84, height: 84 }}>
          <Svg width={84} height={84} viewBox="0 0 84 84">
            <Circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
            {total > 0 && arcs.map((arc, i) => (
              <Circle key={i} cx={cx} cy={cy} r={R} fill="none"
                stroke={arc.color} strokeWidth={sw}
                strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
                strokeDashoffset={-arc.off}
                rotation={-90} originX={cx} originY={cy}
              />
            ))}
          </Svg>
          <View style={ch.centre}>
            <Text style={ch.centreNum}>{centerLabel ?? total}</Text>
            <Text style={ch.centreSub}>{centerSub ?? 'total'}</Text>
          </View>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          {segments.map(seg => (
            <View key={seg.label} style={ch.legendRow}>
              <View style={[ch.dot, { backgroundColor: seg.color }]} />
              <Text style={ch.legendLbl} numberOfLines={1}>{seg.label}</Text>
              <Text style={ch.legendCnt}>{seg.count}</Text>
              <Text style={ch.legendPct}>{total > 0 ? `${Math.round(seg.count / total * 100)}%` : '—'}</Text>
            </View>
          ))}
          {total === 0 && <Text style={ch.empty}>No data yet</Text>}
        </View>
      </View>
    </View>
  );
}

/* ── Capacity bars ───────────────────────────────────────── */
function CapacityBars({ ticketTypes }: { ticketTypes: any[] }) {
  const withCap = ticketTypes.filter(t => t.quantity_total);
  if (withCap.length === 0) return null;
  return (
    <View style={ch.card}>
      <Text style={ch.title}>Capacity fill</Text>
      <View style={{ gap: 10 }}>
        {withCap.map(t => {
          const pct  = Math.min(((t.quantity_sold ?? 0) / t.quantity_total) * 100, 100);
          const color = pct >= 100 ? '#f43f5e' : pct >= 80 ? '#f59e0b' : '#6366f1';
          return (
            <View key={t.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.70)' }} numberOfLines={1}>{t.name}</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color }}>
                  {t.quantity_sold ?? 0}/{t.quantity_total} · {pct.toFixed(0)}%
                  {pct >= 100 ? ' 🔴' : pct >= 80 ? ' 🟡' : ''}
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <View style={{ height: 6, borderRadius: 3, width: `${pct}%` as any, backgroundColor: color }} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  card:      { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: Colors.bg.elevated, padding: 14 },
  title:     { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  centre:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  centreNum: { fontSize: 17, fontWeight: '900', color: '#fff', lineHeight: 19 },
  centreSub: { fontSize: 7, fontWeight: '700', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:       { width: 7, height: 7, borderRadius: 4 },
  legendLbl: { flex: 1, fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.52)' },
  legendCnt: { fontSize: 11, fontWeight: '900', color: '#fff' },
  legendPct: { fontSize: 9, color: 'rgba(255,255,255,0.25)', width: 30, textAlign: 'right' },
  empty:     { fontSize: 11, color: 'rgba(255,255,255,0.22)', fontStyle: 'italic' },
});

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: 16, gap: 14, paddingBottom: 40 },

  header:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back:    { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg.elevated, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 20, fontWeight: '900', color: '#fff', flex: 1 },
  addBtn:  { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.accent.indigo, alignItems: 'center', justifyContent: 'center' },

  kpiRow:   { flexDirection: 'row', gap: 8 },
  kpi:      { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 2 },
  kpiVal:   { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  kpiLabel: { fontSize: 9, fontWeight: '700', color: Colors.text.subtle },

  form:    { gap: 14 },
  kindRow: { flexDirection: 'row', gap: 8 },
  kindBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.DEFAULT, backgroundColor: Colors.bg.elevated, alignItems: 'center' },
  kindText:{ fontSize: 12, fontWeight: '800', color: Colors.text.muted },
});
