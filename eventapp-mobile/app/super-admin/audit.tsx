import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, TextInput,
  ScrollView, Share, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { useSuperAdminStore, SAAuditLog } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';
import api from '@/lib/api';

/* LayoutAnimation global NOT enabled — it causes all layout changes (including
   filter chip presses) to animate the full screen, creating unwanted "big div" effect. */

const GOLD = Colors.accent.gold ?? '#C9A96E';
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

/* ── Export helpers ──────────────────────────────────────────── */
function buildCsvRow(log: any): string {
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const d = log.details ?? {};
  return [
    log.id,
    log.created_at ? new Date(log.created_at).toISOString() : '',
    log.user_email ?? log.admin_email ?? '',
    log.user_name  ?? log.admin_name  ?? '',
    log.action     ?? '',
    log.resource_type ?? '',
    log.resource_id   ?? '',
    d.organization_id ?? '',
    d.event_title     ?? '',
    d.total ?? d.amount ?? '',
    d.currency ?? '',
    d.platform_fee ?? '',
    log.ip_address ?? '',
  ].map(esc).join(',');
}

function buildHtml(logs: any[], filters: any): string {
  const rows = logs.map(log => {
    const d = log.details ?? {};
    const color = log.action === 'TERMS_ACCEPTED' ? '#22d3ee'
      : log.action?.includes('DONATION') ? '#f43f5e'
      : log.action?.includes('TICKET')   ? '#a78bfa'
      : '#ffffff';
    return `<tr>
      <td>${new Date(log.created_at).toLocaleString()}</td>
      <td>${log.user_email ?? log.admin_email ?? '—'}</td>
      <td>${log.user_name ?? log.admin_name ?? '—'}</td>
      <td style="color:${color};font-weight:700">${log.action ?? '—'}</td>
      <td>${d.organization_id ?? '—'}</td>
      <td>${d.event_title ?? log.resource_type ?? '—'}</td>
      <td style="color:#10b981;font-weight:700">${d.total ?? d.amount ? `$${Number(d.total ?? d.amount).toFixed(2)}` : '—'}</td>
      <td style="font-family:monospace;font-size:11px">${log.ip_address ?? '—'}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Audit Log Export — LiteEvent Super Admin</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #f9fafb; color: #1a1a1a; margin: 0; padding: 20px; }
    h1 { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    thead { background: #1f2937; color: white; }
    th { padding: 10px 12px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tr:hover td { background: #f9fafb; }
    .footer { margin-top: 20px; font-size: 11px; color: #9ca3af; text-align: center; }
  </style></head><body>
  <h1>Audit Log</h1>
  <p class="meta">Exported: ${new Date().toLocaleString()} · ${logs.length} entries · LiteEvent LLC (dba LiteEvent)</p>
  <table>
    <thead><tr>
      <th>Date & Time</th><th>User Email</th><th>Name</th><th>Action</th>
      <th>Org ID</th><th>Event</th><th>Amount</th><th>IP Address</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">Confidential — LiteEvent LLC · 17200 E Iliff Ave Ste A12 PMB 1011, Aurora CO 80013</p>
  </body></html>`;
}

async function exportLogs(format: 'csv' | 'pdf', logs: any[], filters: any) {
  try {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      const header = 'ID,Date,User Email,User Name,Action,Resource Type,Resource ID,Org ID,Event,Amount,Currency,Platform Fee,IP';
      content  = [header, ...logs.map(buildCsvRow)].join('\n');
      filename = `audit-log-${Date.now()}.csv`;
      mimeType = 'text/csv';
    } else {
      content  = buildHtml(logs, filters);
      filename = `audit-log-${Date.now()}.html`;
      mimeType = 'text/html';
    }

    const path = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(path, content, { encoding: 'utf8' });

    await Share.share(
      Platform.OS === 'ios'
        ? { url: path, title: 'Audit Log Export' }
        : { message: format === 'csv' ? content : `Audit log HTML saved. Open the file to view.`, title: 'Audit Log Export' },
      { dialogTitle: 'Export Audit Log' }
    );
  } catch (err: any) {
    if (err?.message !== 'User did not share') {
      Alert.alert('Export Failed', err?.message ?? 'Could not export audit log.');
    }
  }
}

/* ── helpers ─────────────────────────────────────────────────── */
function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}
function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}
function actionColor(action?: string): string {
  if (!action) return Colors.text.muted;
  const a = action.toUpperCase();
  if (a === 'TERMS_ACCEPTED')                          return '#22d3ee';
  if (a.includes('DONATION'))                          return '#f43f5e';
  if (a.includes('TICKET'))                            return '#a78bfa';
  if (a.includes('DELETE'))                            return Colors.accent.red;
  if (a.includes('CREATE'))                            return Colors.accent.emerald;
  if (a.includes('ENABLED') || a.includes('DISABLED')) return Colors.accent.amber;
  return 'rgba(255,255,255,0.55)';
}
function actionIcon(action?: string): keyof typeof Feather.glyphMap {
  const a = (action ?? '').toUpperCase();
  if (a === 'TERMS_ACCEPTED')    return 'shield';
  if (a.includes('DONATION'))    return 'heart';
  if (a.includes('TICKET'))      return 'tag';
  if (a.includes('DELETE'))      return 'trash-2';
  if (a.includes('CREATE'))      return 'plus-circle';
  if (a.includes('UPDATE'))      return 'edit-2';
  if (a.includes('ENABLED') || a.includes('DISABLED')) return 'toggle-left';
  return 'activity';
}

const ACTION_FILTERS = [
  { label: 'All',          value: '' },
  { label: 'Transactions', value: 'TICKET|DONATION' },
  { label: 'Legal',        value: 'TERMS_ACCEPTED' },
  { label: 'Tickets',      value: 'TICKET' },
  { label: 'Donations',    value: 'DONATION' },
  { label: 'Admin',        value: 'CREATE|DELETE' },
];

/* ── Detail row ──────────────────────────────────────────────── */
function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={3}>{String(value)}</Text>
    </View>
  );
}

/* ── Log card ────────────────────────────────────────────────── */
function LogCard({ item }: { item: SAAuditLog & { details?: any } }) {
  const [open, setOpen] = useState(false);
  const color = actionColor(item.action);
  const icon  = actionIcon(item.action);
  const d     = (item as any).details ?? {};
  const isTransaction = item.action?.includes('TICKET') || item.action?.includes('DONATION');
  const isLegal       = item.action === 'TERMS_ACCEPTED';

  const toggle = () => setOpen(v => !v);

  return (
    <Pressable onPress={toggle} style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }]}>

      {/* ── Colored left accent handled by borderLeft, no extra view needed ── */}

      <View style={styles.cardInner}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
          <Feather name={icon} size={16} color={color} />
        </View>

        {/* Main content */}
        <View style={{ flex: 1, gap: 3 }}>
          {/* Action badge */}
          <View style={[styles.actionBadge, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
            <Text style={[styles.actionText, { color }]}>{item.action}</Text>
          </View>

          {/* User */}
          <Text style={styles.userEmail} numberOfLines={1}>
            {(item as any).user_email ?? (item as any).admin_email ?? '—'}
          </Text>
          {((item as any).user_name ?? (item as any).admin_name) && (
            <Text style={styles.userName} numberOfLines={1}>
              {(item as any).user_name ?? (item as any).admin_name}
            </Text>
          )}

          {/* Event title */}
          {d.event_title && (
            <View style={styles.eventRow}>
              <Feather name="calendar" size={9} color={Colors.text.subtle} />
              <Text style={styles.eventTitle} numberOfLines={1}>{d.event_title}</Text>
            </View>
          )}
        </View>

        {/* Right column */}
        <View style={styles.cardRight}>
          {/* Amount — prominent for transactions */}
          {(d.total || d.amount) ? (
            <View style={styles.amountBadge}>
              <Text style={styles.amountText}>
                ${Number(d.total ?? d.amount).toFixed(2)}
              </Text>
            </View>
          ) : null}
          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={13} color="rgba(255,255,255,0.25)" />
        </View>
      </View>

      {/* IP chip */}
      {item.ip_address && (
        <View style={styles.ipRow}>
          <Feather name="wifi" size={9} color="rgba(255,255,255,0.20)" />
          <Text style={styles.ipText}>{item.ip_address}</Text>
        </View>
      )}

      {/* ── Expanded detail ── */}
      {open && (
        <View style={styles.detail}>
          <View style={[styles.detailDivider, { borderColor: `${color}20` }]} />

          {/* Key detail pills */}
          <View style={styles.detailGrid}>
            {[
              ['Date', fmtDate(item.created_at)],
              ['User', (item as any).user_email ?? (item as any).admin_email],
              ['Name', (item as any).user_name  ?? (item as any).admin_name],
              ['IP',   item.ip_address],
              ['Org',  d.organization_id],
              ['Ref',  item.resource_id],
              ['Buyer', d.buyer_name ?? d.donor_name],
              ['Payer Email', d.buyer_email ?? d.donor_email],
              ['Payment', d.payment_status],
              ['Order',   d.order_status],
              ['Fee',    d.platform_fee ? `$${d.platform_fee}` : null],
              ['Terms',  d.terms_version],
            ].filter(([, v]) => v).map(([label, val]) => (
              <View key={label as string} style={styles.detailPill}>
                <Text style={styles.detailPillLabel}>{label}</Text>
                <Text style={styles.detailPillValue} numberOfLines={2}>{val as string}</Text>
              </View>
            ))}
          </View>

          {/* Ticket items table */}
          {Array.isArray(d.items) && d.items.length > 0 && (
            <View style={styles.itemsBox}>
              <Text style={styles.itemsTitle}>Ticket Items</Text>
              {d.items.map((it: any, i: number) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{it.ticket_type_name}</Text>
                  <Text style={styles.itemQty}>×{it.quantity}</Text>
                  <Text style={[styles.itemTotal, { color }]}>${Number(it.line_total).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

/* ── Screen ──────────────────────────────────────────────────── */
export default function AuditScreen() {
  const { auditLogs, auditMeta, loading, fetchAuditLogs } = useSuperAdminStore();
  const [page,      setPage]      = useState(1);
  const [action,    setAction]    = useState('');
  const [email,     setEmail]     = useState('');
  const [exporting, setExporting] = useState<'csv'|'pdf'|null>(null);

  const load = useCallback(() => {
    fetchAuditLogs({ page, limit: 30,
      action:     action || undefined,
      user_email: email  || undefined,
    });
  }, [page, action, email]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalPages = auditMeta ? Math.ceil(auditMeta.total / 30) : 1;

  const ListHeader = (
    <View>
      {/* Stats strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContent}>
        {[
          { label: 'Total',        value: auditMeta?.total ?? 0, color: '#fff'    },
          { label: 'Transactions', value: (auditLogs as any[]).filter((l: any) => l.action?.includes('TICKET') || l.action?.includes('DONATION')).length, color: '#a78bfa' },
          { label: 'Donations',    value: (auditLogs as any[]).filter((l: any) => l.action?.includes('DONATION')).length, color: '#f43f5e' },
          { label: 'Tickets',      value: (auditLogs as any[]).filter((l: any) => l.action?.includes('TICKET')).length,   color: '#818cf8' },
          { label: 'Legal',        value: (auditLogs as any[]).filter((l: any) => l.action === 'TERMS_ACCEPTED').length,   color: '#22d3ee' },
          { label: 'Page',         value: page,                  color: GOLD      },
        ].map(({ label, value, color }) => (
          <View key={label} style={styles.statCard}>
            <Text style={[styles.statVal, { color }]}>{value.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={13} color="rgba(255,255,255,0.28)" />
          <TextInput value={email} onChangeText={t => { setEmail(t); setPage(1); }}
            placeholder="Search by email…" placeholderTextColor="rgba(255,255,255,0.22)"
            style={styles.searchInput} returnKeyType="search" autoCapitalize="none" onSubmitEditing={load} />
          {!!email && <Pressable onPress={() => setEmail('')} hitSlop={8}><Feather name="x" size={12} color="rgba(255,255,255,0.30)" /></Pressable>}
        </View>
        <Pressable onPress={load} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={14} color={GOLD} />
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContent}>
        {ACTION_FILTERS.map(f => (
          <Pressable key={f.value} onPress={() => { setAction(f.value); setPage(1); }}
            style={[styles.chip, action === f.value && styles.chipActive]}>
            <Text style={[styles.chipText, action === f.value && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Export row */}
      <View style={styles.exportRow}>
        <Text style={styles.exportLabel}>Export:</Text>
        <Pressable style={[styles.exportBtn, { borderColor: 'rgba(16,185,129,0.28)' }]}
          onPress={async () => { setExporting('csv'); await exportLogs('csv', auditLogs as any[], {}); setExporting(null); }}
          disabled={!!exporting || auditLogs.length === 0}>
          {exporting === 'csv' ? <ActivityIndicator size={10} color="#10b981" /> : <Feather name="download" size={11} color="#10b981" />}
          <Text style={[styles.exportBtnTxt, { color: '#10b981' }]}>CSV</Text>
        </Pressable>
        <Pressable style={[styles.exportBtn, { borderColor: 'rgba(245,158,11,0.28)' }]}
          onPress={async () => { setExporting('pdf'); await exportLogs('pdf', auditLogs as any[], {}); setExporting(null); }}
          disabled={!!exporting || auditLogs.length === 0}>
          {exporting === 'pdf' ? <ActivityIndicator size={10} color={Colors.accent.amber} /> : <Feather name="file-text" size={11} color={Colors.accent.amber} />}
          <Text style={[styles.exportBtnTxt, { color: Colors.accent.amber }]}>PDF</Text>
        </Pressable>
        <Text style={styles.pageInfo}>{auditMeta?.total?.toLocaleString() ?? '0'} entries · {page}/{totalPages}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={loading && !auditLogs.length ? [] : auditLogs as any[]}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonWrap}>
              {[0,1,2,3].map(i => (
                <View key={i} style={[styles.card, { marginBottom: 8 }]}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <View style={{ height: 12, width: '55%', borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.07)' }} />
                      <View style={{ height: 10, width: '40%', borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Feather name="clipboard" size={28} color={GOLD} style={{ opacity: 0.4 }} />
              <Text style={styles.emptyTitle}>No logs match</Text>
              <Text style={styles.emptySub}>Adjust filters and try again.</Text>
            </View>
          )
        }
        renderItem={({ item }) => <LogCard item={item} />}
        ListFooterComponent={
          auditMeta && auditMeta.total > 30 ? (
            <View style={styles.pagination}>
              <Pressable style={[styles.pageBtn, page <= 1 && styles.pageBtnOff]}
                disabled={page <= 1} onPress={() => setPage(p => Math.max(1, p - 1))}>
                <Feather name="chevron-left" size={15} color={page <= 1 ? Colors.text.subtle : GOLD} />
                <Text style={[styles.pageBtnTxt, page <= 1 && { color: Colors.text.subtle }]}>Prev</Text>
              </Pressable>
              <Text style={styles.pageInd}>{page} / {totalPages}</Text>
              <Pressable style={[styles.pageBtn, page >= totalPages && styles.pageBtnOff]}
                disabled={page >= totalPages} onPress={() => setPage(p => p + 1)}>
                <Text style={[styles.pageBtnTxt, page >= totalPages && { color: Colors.text.subtle }]}>Next</Text>
                <Feather name="chevron-right" size={15} color={page >= totalPages ? Colors.text.subtle : GOLD} />
              </Pressable>
            </View>
          ) : <View style={{ height: 30 }} />
        }
      />
    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#07070f' },

  /* stats strip */
  statsContent: { gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  statCard: {
    backgroundColor: '#0d0d1a', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    minWidth: 84, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center',
  },
  statVal:   { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: 'rgba(255,255,255,0.28)', marginTop: 3 },

  /* search */
  searchRow:   { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, alignItems: 'center' },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0d0d1a', borderRadius: 13, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchInput: { flex: 1, color: '#fff', fontSize: 13 },
  refreshBtn:  { width: 44, height: 44, backgroundColor: '#0d0d1a', borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },

  /* chips */
  chipsContent:   { gap: 6, paddingHorizontal: 16, paddingBottom: 10 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  chipActive:     { backgroundColor: 'rgba(201,169,110,0.12)', borderColor: 'rgba(201,169,110,0.28)' },
  chipText:       { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  chipTextActive: { color: GOLD, fontWeight: '800' },

  /* export */
  exportRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  exportLabel:  { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.8 },
  exportBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)' },
  exportBtnTxt: { fontSize: 11, fontWeight: '800' },
  pageInfo:     { marginLeft: 'auto' as any, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: '600' },

  listContent:  { paddingHorizontal: 12, paddingBottom: 40 },
  skeletonWrap: { gap: 0 },

  /* card */
  card: {
    backgroundColor: '#0d0d1a',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    paddingRight: 14, paddingTop: 14, paddingBottom: 12,
    paddingLeft: 16,
  },
  cardInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap:  {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actionBadge: {
    alignSelf: 'flex-start', borderRadius: 7, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 2,
  },
  actionText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },
  userEmail:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  userName:   { fontSize: 10, color: 'rgba(255,255,255,0.32)' },
  eventRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  eventTitle: { fontSize: 10, color: 'rgba(255,255,255,0.35)', flex: 1 },

  cardRight:   { alignItems: 'flex-end', gap: 5, flexShrink: 0, minWidth: 70 },
  amountBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)',
  },
  amountText: { fontSize: 13, fontWeight: '900', color: '#10b981' },
  timeText:   { fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: '600' },

  ipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  ipText: { fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace' },

  /* expanded */
  detail:        { marginTop: 12 },
  detailDivider: { borderTopWidth: 1, marginBottom: 12 },
  detailGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  detailPill: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 10, paddingVertical: 7,
    minWidth: '47%', flex: 1,
  },
  detailPillLabel: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  detailPillValue: { fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: '600', lineHeight: 15 },
  itemsBox: {
    marginTop: 10, backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 10,
  },
  itemsTitle:   { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  itemRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  itemName:     { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.60)', fontWeight: '600' },
  itemQty:      { fontSize: 11, color: 'rgba(255,255,255,0.30)', marginRight: 10 },
  itemTotal:    { fontSize: 13, fontWeight: '900' },

  empty: {
    height: 180,                    /* fixed — prevents FlatList stretching to full screen */
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  emptySub:   { fontSize: 12, color: Colors.text.muted, textAlign: 'center', paddingHorizontal: 40 },

  pagination: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 16, paddingHorizontal: 4,
  },
  pageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: 'rgba(201,169,110,0.10)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(201,169,110,0.20)',
  },
  pageBtnOff: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: Colors.border.subtle },
  pageBtnTxt: { fontSize: 12, fontWeight: '700', color: GOLD },
  pageInd:    { fontSize: 12, color: Colors.text.muted, fontWeight: '600' },
});
