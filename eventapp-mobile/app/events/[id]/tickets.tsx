import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
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
    if (!form.name.trim()) return Toast.show({ type: 'error', text1: 'Ticket name is required' });
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
      Toast.show({ type: 'success', text1: editTarget ? 'Ticket updated' : 'Ticket created' });
      setSheetOpen(false);
      fetchTicketTypes(eventId!);
      fetchStats(eventId!);
    } else {
      Toast.show({ type: 'error', text1: 'Failed to save ticket' });
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
