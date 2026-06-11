import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable,
  ActivityIndicator, RefreshControl, TextInput,
  KeyboardAvoidingView, Platform, Switch, ScrollView,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LegalPageModal } from '@/components/ui/LegalPageModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDonationStore, Donation } from '@/store/donation.store';
import { Colors } from '@/constants/colors';
import { toast } from '@/lib/toast';

const ROSE = '#f43f5e';
const DEFAULT_AMOUNTS = [5, 10, 25];

function fmtAmount(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function initials(name: string | null, anon?: boolean) {
  if (anon || !name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ── Donut chart (react-native-svg) ──────────────────────────── */
interface Seg { label: string; count: number; color: string; }
function DonutChart({ title, segments }: { title: string; segments: Seg[] }) {
  const total = segments.reduce((s, g) => s + g.count, 0);
  const R = 36, cx = 44, cy = 44, sw = 11;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  const arcs = segments.map(seg => {
    const dash = total > 0 ? (seg.count / total) * circ : 0;
    const arc  = { ...seg, dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <View style={dc.card}>
      <Text style={dc.title}>{title}</Text>
      <View style={dc.row}>
        <View style={{ width: 88, height: 88 }}>
          <Svg width={88} height={88} viewBox="0 0 88 88">
            <Circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
            {total > 0 && arcs.map((arc, i) => (
              <Circle key={i} cx={cx} cy={cy} r={R} fill="none"
                stroke={arc.color} strokeWidth={sw}
                strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
                strokeDashoffset={-arc.offset}
                rotation={-90} originX={cx} originY={cy}
              />
            ))}
          </Svg>
          <View style={dc.centre}>
            <Text style={dc.centreNum}>{total}</Text>
            <Text style={dc.centreLbl}>total</Text>
          </View>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          {segments.map(seg => (
            <View key={seg.label} style={dc.legendRow}>
              <View style={[dc.dot, { backgroundColor: seg.color }]} />
              <Text style={dc.legendLbl} numberOfLines={1}>{seg.label}</Text>
              <Text style={dc.legendCnt}>{seg.count}</Text>
              <Text style={dc.legendPct}>
                {total > 0 ? `${Math.round(seg.count / total * 100)}%` : '—'}
              </Text>
            </View>
          ))}
          {total === 0 && <Text style={dc.empty}>No data yet</Text>}
        </View>
      </View>
    </View>
  );
}

/* ── Stat tile ───────────────────────────────────────────────── */
function StatTile({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={[s.stat, { borderColor: `${color}30`, backgroundColor: `${color}12` }]}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/* ── Donation row (expandable, no delete) ───────────────────────── */
function DonationRow({ item }: { item: Donation }) {
  const [open, setOpen] = useState(false);
  const isOk = item.payment_status === 'SUCCEEDED';
  const ini  = initials(item.donor_name, item.is_anonymous);

  return (
    <View style={s.rowWrap}>
      {/* Summary row */}
      <Pressable onPress={() => setOpen(v => !v)} style={s.row}>
        <View style={[s.rowAvatar, { backgroundColor: `${ROSE}18`, borderColor: `${ROSE}30` }]}>
          {item.is_anonymous
            ? <Feather name="heart" size={14} color={ROSE} />
            : <Text style={[s.rowAvatarTxt, { color: ROSE }]}>{ini}</Text>}
        </View>

        <View style={s.rowBody}>
          <Text style={s.rowName} numberOfLines={1}>
            {item.is_anonymous ? 'Anonymous' : (item.donor_name || 'Anonymous')}
          </Text>
          <Text style={s.rowSub} numberOfLines={1}>
            {(!item.is_anonymous && item.donor_email) ? item.donor_email : fmtDate(item.created_at)}
          </Text>
          {item.message && !open
            ? <Text style={s.rowMsg} numberOfLines={1}>"{item.message}"</Text>
            : null}
        </View>

        <View style={s.rowRight}>
          <Text style={[s.rowAmount, { color: isOk ? Colors.accent.emerald : Colors.accent.amber }]}>
            {fmtAmount(item.amount, item.currency)}
          </Text>
          <View style={[s.pill, { backgroundColor: isOk ? `${Colors.accent.emerald}18` : `${Colors.accent.amber}18` }]}>
            <Feather name={isOk ? 'check-circle' : 'clock'} size={9} color={isOk ? Colors.accent.emerald : Colors.accent.amber} />
            <Text style={[s.pillTxt, { color: isOk ? Colors.accent.emerald : Colors.accent.amber }]}>
              {isOk ? 'Received' : 'Pending'}
            </Text>
          </View>
        </View>

        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color="rgba(255,255,255,0.25)" style={{ marginLeft: 4 }} />
      </Pressable>

      {/* Expanded details */}
      {open && (
        <View style={s.details}>
          {[
            { icon: 'mail',         label: 'Email',       value: item.is_anonymous ? 'Anonymous' : (item.donor_email || '—') },
            { icon: 'phone',        label: 'Phone',       value: item.is_anonymous ? '—' : (item.donor_phone || '—') },
            { icon: 'calendar',     label: 'Date',        value: fmtDate(item.created_at) },
            { icon: 'refresh-cw',   label: 'Frequency',   value: item.frequency === 'monthly' ? 'Monthly recurring' : 'One-time' },
            { icon: 'hash',         label: 'Transaction', value: item.provider_transaction_id ? item.provider_transaction_id.slice(-12) : '—' },
          ].map(({ icon, label, value }) => (
            <View key={label} style={s.detailRow}>
              <View style={s.detailIcon}>
                <Feather name={icon as any} size={11} color="rgba(255,255,255,0.3)" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.detailLabel}>{label}</Text>
                <Text style={s.detailValue} numberOfLines={1}>{value}</Text>
              </View>
            </View>
          ))}
          {item.message ? (
            <View style={[s.detailRow, { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]}>
              <Text style={[s.detailValue, { fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }]}>"{item.message}"</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

/* ── Amount config sheet ─────────────────────────────────────── */
function ConfigSheet({ eventId, amounts, savedMsg, onSaved, onClose }: {
  eventId: string; amounts: number[]; savedMsg: string;
  onSaved: (a: number[], m: string) => void; onClose: () => void;
}) {
  const { saveDonationConfig } = useDonationStore();
  const [vals, setVals]  = useState<string[]>(
    amounts.length === 3 ? amounts.map(String) : ['', '', '']
  );
  const [msg, setMsg]       = useState(savedMsg ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSave = async () => {
    const parsed = vals.map(v => parseFloat(v));
    if (parsed.some(n => !n || n <= 0)) {
      setError('All 3 amounts are required and must be greater than 0.');
      return;
    }
    setSaving(true); setError('');
    try {
      await saveDonationConfig(eventId, parsed, msg.trim());
      onSaved(parsed, msg.trim());
      toast.success('Saved', 'Donation amounts updated.');
      onClose();
    } catch {
      toast.error('Error', 'Could not save amounts.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.configSheet}>
      {/* drag handle */}
      <View style={s.dragHandle} />

      <View style={s.configHeader}>
        <Text style={s.configTitle}>Preset Amounts</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Feather name="x" size={18} color={Colors.text.muted} />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <Text style={s.configSub}>
          Set a message and 3 donation amounts. Donors see these on the event page.
        </Text>

        {/* Message */}
        <View style={s.configRow}>
          <Text style={s.configLabel}>Message <Text style={s.optional}>(shown on event page)</Text></Text>
          <View style={[s.configInputWrap, { height: 80, alignItems: 'flex-start', paddingTop: 10 }]}>
            <TextInput
              style={[s.configInput, { height: 60, textAlignVertical: 'top' }]}
              placeholder="e.g. Help us make this event amazing for everyone!"
              placeholderTextColor={Colors.text.subtle}
              multiline
              maxLength={280}
              value={msg}
              onChangeText={t => setMsg(t)}
            />
          </View>
          <Text style={s.charCount}>{msg.length}/280</Text>
        </View>

        {[0, 1, 2].map(i => (
          <View key={i} style={s.configRow}>
            <Text style={s.configLabel}>
              Amount {i + 1} <Text style={{ color: ROSE }}>*</Text>
            </Text>
            <View style={[s.configInputWrap, !vals[i] && !!error ? { borderColor: `${ROSE}60` } : {}]}>
              <Text style={s.configPrefix}>$</Text>
              <TextInput
                style={s.configInput}
                placeholder={String([5, 10, 25][i])}
                placeholderTextColor={Colors.text.subtle}
                keyboardType="decimal-pad"
                returnKeyType={i < 2 ? 'next' : 'done'}
                value={vals[i] ?? ''}
                onChangeText={t => { setError(''); setVals(v => { const n = [...v]; n[i] = t; return n; }); }}
              />
            </View>
          </View>
        ))}
        {!!error && (
          <View style={s.configError}>
            <Feather name="alert-circle" size={13} color="#ef4444" />
            <Text style={s.configErrorTxt}>{error}</Text>
          </View>
        )}
        <Pressable style={[s.configSaveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <LinearGradient colors={['#be185d', ROSE]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.configSaveTxt}>Save Amounts</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ── Donate form ─────────────────────────────────────────────── */
function DonateForm({ eventId, presets }: { eventId: string; presets: number[] }) {
  const { createDonation, submitting } = useDonationStore();
  const [name, setName] = useState('');
  const [email, setEmail]       = useState('');
  const [message, setMessage]   = useState('');
  const [anon, setAnon]         = useState(false);
  const [open, setOpen]         = useState(false);
  const [done, setDone]         = useState(false);

  const [amountText,   setAmountText]   = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [legalSlug,    setLegalSlug]    = useState<string | null>(null);
  const amount = parseFloat(amountText) || 0;

  const handleDonate = async () => {
    setTermsTouched(true);
    if (!amount || amount <= 0) {
      toast.warning('Choose an amount', 'Please select a donation amount.');
      return;
    }
    if (!termsChecked) {
      toast.warning('Terms required', 'Please accept the terms to donate.');
      return;
    }
    try {
      await createDonation(eventId, {
        amount,
        currency: 'USD',
        donor_name:   anon ? undefined : name.trim() || undefined,
        donor_email:  email.trim() || undefined,
        message:      message.trim() || undefined,
        is_anonymous: anon,
      });
      setDone(true);
      toast.success('Thank you! 💝', `Donation of ${fmtAmount(amount)} recorded.`);
      setTimeout(() => {
        setDone(false); setOpen(false);
        setAmountText(''); setName(''); setEmail(''); setMessage(''); setAnon(false);
      }, 2000);
    } catch (e: any) {
      toast.error('Donation failed', e?.response?.data?.message ?? 'Please try again.');
    }
  };

  return (
    <View style={s.formCard}>
      {/* top bar */}
      <View style={s.formTopBar} />

      {/* header */}
      <Pressable style={s.formHeader} onPress={() => setOpen(v => !v)}>
        <View style={s.formHeaderLeft}>
          <View style={s.formIconWrap}>
            <Feather name="heart" size={16} color={ROSE} />
          </View>
          <View>
            <Text style={s.formTitle}>Make a Donation</Text>
            <Text style={s.formSub}>Choose an amount and contribute</Text>
          </View>
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.text.muted} />
      </Pressable>

      {open && (
        <>
          {/* Amount input */}
          <View style={s.fieldRow}>
            <Text style={s.label}>Donation amount (USD) <Text style={{ color: ROSE }}>*</Text></Text>
            <View style={[s.inputWrap, amountText ? { borderColor: `${ROSE}50` } : {}]}>
              <Text style={s.prefix}>$</Text>
              <TextInput
                style={s.input}
                placeholder="0.00"
                placeholderTextColor={Colors.text.subtle}
                keyboardType="decimal-pad"
                value={amountText}
                onChangeText={t => setAmountText(t)}
              />
            </View>
            {amount > 0 && (
              <Text style={[s.amountHint, { color: ROSE }]}>Recording {fmtAmount(amount)}</Text>
            )}
          </View>

          <View style={s.divider} />

          {/* Name */}
          <View style={s.fieldRow}>
            <Text style={s.label}>Name <Text style={s.optional}>(optional)</Text></Text>
            <View style={[s.inputWrap, anon && s.inputDisabled]}>
              <TextInput style={s.input} placeholder={anon ? 'Anonymous' : 'Full name'}
                placeholderTextColor={Colors.text.subtle} value={name}
                onChangeText={setName} editable={!anon} />
            </View>
          </View>

          {/* Email */}
          <View style={s.fieldRow}>
            <Text style={s.label}>Email <Text style={s.optional}>(optional)</Text></Text>
            <View style={[s.inputWrap, anon && s.inputDisabled]}>
              <TextInput style={s.input} placeholder={anon ? 'Anonymous' : 'you@example.com'}
                placeholderTextColor={Colors.text.subtle} keyboardType="email-address"
                autoCapitalize="none" value={email} onChangeText={setEmail} editable={!anon} />
            </View>
          </View>

          {/* Message */}
          <View style={s.fieldRow}>
            <Text style={s.label}>Message <Text style={s.optional}>(optional)</Text></Text>
            <View style={s.inputWrap}>
              <TextInput style={[s.input, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Leave a kind note…" placeholderTextColor={Colors.text.subtle}
                multiline value={message} onChangeText={setMessage} />
            </View>
          </View>

          {/* Anonymous */}
          <View style={s.anonRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.anonLabel}>Donate anonymously</Text>
              <Text style={s.anonSub}>Name won't appear publicly</Text>
            </View>
            <Switch value={anon} onValueChange={setAnon}
              trackColor={{ false: Colors.border.DEFAULT, true: `${ROSE}60` }}
              thumbColor={anon ? ROSE : Colors.text.muted} />
          </View>

          {/* Terms */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
            <Pressable
              onPress={() => { setTermsChecked(v => !v); setTermsTouched(true); }}
              hitSlop={8}
              style={{
                width: 17, height: 17, borderRadius: 5, borderWidth: 2, marginTop: 1,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                backgroundColor: termsChecked ? ROSE : 'rgba(0,0,0,0.06)',
                borderColor: termsTouched && !termsChecked ? '#ef4444' : termsChecked ? ROSE : 'rgba(0,0,0,0.22)',
              }}>
              {termsChecked && <Feather name="check" size={10} color="#fff" />}
            </Pressable>
            <Text style={{ flex: 1, fontSize: 11, color: 'rgba(0,0,0,0.45)', lineHeight: 17 }}>
              {'I agree to the '}
              <Text onPress={() => setLegalSlug('terms')}
                style={{ color: ROSE, textDecorationLine: 'underline' }}>Terms of Service</Text>
              {' and '}
              <Text onPress={() => setLegalSlug('privacy-policy')}
                style={{ color: ROSE, textDecorationLine: 'underline' }}>Privacy Policy</Text>
            </Text>
          </View>
          <LegalPageModal slug={legalSlug} onClose={() => setLegalSlug(null)} />

          {/* CTA */}
          <Pressable
            style={[s.donateBtn, (!amount || amount <= 0 || submitting || done) && s.donateBtnOff]}
            onPress={handleDonate}
            disabled={!amount || amount <= 0 || submitting || done || !amountText}
          >
            <LinearGradient colors={['#be185d', ROSE]} style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : done
              ? <><Feather name="check" size={15} color="#fff" /><Text style={s.donateTxt}>Done!</Text></>
              : <><Feather name="heart" size={15} color="#fff" />
                  <Text style={s.donateTxt}>{amount > 0 ? `Donate ${fmtAmount(amount)}` : 'Donate'}</Text></>
            }
          </Pressable>
        </>
      )}
    </View>
  );
}

/* ── Screen ──────────────────────────────────────────────────── */
export default function DonationsScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { donations, loading, totalRaised, confirmedCount,
          donationAmounts, fetchDonations, fetchDonationConfig } = useDonationStore();
  const [configOpen, setConfigOpen] = useState(false);
  const [localAmounts, setLocalAmounts] = useState<number[]>([]);
  const [localMessage, setLocalMessage] = useState('');

  useEffect(() => {
    if (!eventId) return;
    fetchDonations(eventId);
    fetchDonationConfig(eventId);
  }, [eventId]);

  const onRefresh = useCallback(() => {
    if (eventId) { fetchDonations(eventId); fetchDonationConfig(eventId); }
  }, [eventId]);

  const presets = (localAmounts.length ? localAmounts : donationAmounts);

  const [showAll, setShowAll] = useState(false);
  const PREVIEW = 5;

  // chart segments
  const pending = donations.filter(d => d.payment_status !== 'SUCCEEDED');
  const monthly = donations.filter(d => d.frequency === 'monthly');
  const chartSegments = {
    status: [
      { label: 'Received', count: confirmedCount,                    color: Colors.accent.emerald },
      { label: 'Pending',  count: pending.length,                    color: Colors.accent.amber },
    ],
    frequency: [
      { label: 'One-time', count: donations.length - monthly.length, color: '#6366f1' },
      { label: 'Monthly',  count: monthly.length,                    color: '#a78bfa' },
    ],
    amounts: [
      { label: '< $10',   count: donations.filter(d => Number(d.amount) < 10).length,                                   color: '#f43f5e' },
      { label: '$10–$25', count: donations.filter(d => Number(d.amount) >= 10 && Number(d.amount) < 25).length,         color: '#fb923c' },
      { label: '$25–$50', count: donations.filter(d => Number(d.amount) >= 25 && Number(d.amount) < 50).length,         color: '#facc15' },
      { label: '$50+',    count: donations.filter(d => Number(d.amount) >= 50).length,                                  color: '#4ade80' },
    ],
  };

  const visibleDonations = showAll ? donations : donations.slice(0, PREVIEW);
  const hiddenCount      = donations.length - PREVIEW;

  const ListHeader = (
    <>
      {/* Stats */}
      <View style={s.statsRow}>
        <StatTile label="Total Raised"  value={fmtAmount(totalRaised)} color={ROSE} />
        <StatTile label="Confirmed"     value={confirmedCount}          color={Colors.accent.emerald} />
        <StatTile label="Total"         value={donations.length}        color={Colors.accent.indigo} />
      </View>

      {/* Donut charts */}
      {donations.length > 0 && (
        <View style={{ gap: 10, marginBottom: 4 }}>
          <DonutChart title="By Status"    segments={chartSegments.status} />
          <DonutChart title="By Frequency" segments={chartSegments.frequency} />
          <DonutChart title="By Amount"    segments={chartSegments.amounts} />
        </View>
      )}

      {/* Section label + config button */}
      <View style={s.sectionRow}>
        <Text style={s.sectionLabel}>
          DONORS {donations.length > 0 ? `(${donations.length})` : ''}
        </Text>
        <Pressable onPress={() => setConfigOpen(true)} style={s.configBtn} hitSlop={8}>
          <Feather name="settings" size={13} color={Colors.text.muted} />
          <Text style={s.configBtnTxt}>Amounts</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </Pressable>
          <View style={s.headerMid}>
            <View style={s.headerIcon}>
              <LinearGradient colors={['#be185d', ROSE]} style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <Feather name="heart" size={16} color="#fff" />
            </View>
            <View>
              <Text style={s.headerTitle}>Donations</Text>
              <Text style={s.headerSub}>Track & receive contributions</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={visibleDonations}
          keyExtractor={d => d.id}
          renderItem={({ item }) => <DonationRow item={item} />}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={loading && donations.length > 0} onRefresh={onRefresh} tintColor={ROSE} />
          }
          ListFooterComponent={
            donations.length > PREVIEW ? (
              <Pressable
                onPress={() => setShowAll(v => !v)}
                style={s.showMoreBtn}
              >
                <Feather
                  name={showAll ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={ROSE}
                />
                <Text style={s.showMoreTxt}>
                  {showAll
                    ? 'Show less'
                    : `Show all ${donations.length} donors (+${hiddenCount} more)`}
                </Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            loading
              ? <ActivityIndicator color={ROSE} size="large" style={{ marginTop: 48 }} />
              : (
                <View style={s.empty}>
                  <View style={s.emptyIcon}>
                    <Feather name="heart" size={28} color={ROSE} style={{ opacity: 0.4 }} />
                  </View>
                  <Text style={s.emptyTitle}>No donations yet</Text>
                  <Text style={s.emptySub}>Use the form above to record the first donation.</Text>
                </View>
              )
          }
        />

        {/* Config sheet overlay */}
        {configOpen && (
          <View style={StyleSheet.absoluteFill}>
            <Pressable style={s.overlay} onPress={() => setConfigOpen(false)} />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={s.sheetWrap}
            >
              <ConfigSheet
                eventId={eventId as string}
                amounts={localAmounts.length === 3 ? localAmounts : donationAmounts}
                savedMsg={localMessage}
                onSaved={(a, m) => { setLocalAmounts(a); setLocalMessage(m); }}
                onClose={() => setConfigOpen(false)}
              />
            </KeyboardAvoidingView>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },

  /* header */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  headerMid:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },

  listContent: { paddingHorizontal: 16, paddingBottom: 48 },

  /* stats */
  statsRow: { flexDirection: 'row', gap: 10, paddingTop: 16, paddingBottom: 12 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  statVal:   { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, fontWeight: '700', color: Colors.text.subtle, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 },

  /* section row */
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1.5 },
  configBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: Colors.border.DEFAULT, backgroundColor: Colors.bg.elevated },
  configBtnTxt: { fontSize: 11, fontWeight: '700', color: Colors.text.muted },

  /* form card */
  formCard: { borderRadius: 16, borderWidth: 1, borderColor: Colors.border.DEFAULT, backgroundColor: Colors.bg.elevated, marginBottom: 4, overflow: 'hidden' },
  formTopBar: { height: 3, background: 'linear-gradient(90deg,#be185d,#f43f5e)' },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  formHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  formIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${ROSE}14`, borderWidth: 1, borderColor: `${ROSE}30`, alignItems: 'center', justifyContent: 'center' },
  formTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  formSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },

  presets:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  presetBtn:   { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99, borderWidth: 1 },
  presetTxt:   { fontSize: 14, fontWeight: '800', color: Colors.text.primary },
  noPresets:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(245,158,11,0.10)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  noPresetsTxt:{ fontSize: 12, color: Colors.accent.amber, flex: 1, lineHeight: 17 },

  fieldRow:    { paddingHorizontal: 16, paddingBottom: 12 },
  label:       { fontSize: 10, fontWeight: '700', color: Colors.text.subtle, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  optional:    { fontWeight: '400', textTransform: 'none', fontSize: 10 },
  amountHint:  { fontSize: 11, fontWeight: '700', marginTop: 4 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.border.DEFAULT, backgroundColor: Colors.bg.primary, paddingHorizontal: 14, minHeight: 44 },
  inputDisabled: { opacity: 0.4 },
  prefix:      { fontSize: 15, color: Colors.text.muted, marginRight: 4 },
  input:       { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text.primary, height: 44 },
  divider:     { height: 1, backgroundColor: Colors.border.subtle, marginHorizontal: 16, marginBottom: 12 },
  anonRow:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 14, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle, backgroundColor: Colors.bg.primary },
  anonLabel:   { fontSize: 13, fontWeight: '700', color: Colors.text.primary },
  anonSub:     { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  donateBtn:   { marginHorizontal: 16, marginBottom: 16, height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  donateBtnOff:{ opacity: 0.45 },
  donateTxt:   { fontSize: 15, fontWeight: '900', color: '#fff' },

  /* donation row */
  rowWrap:    { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: Colors.bg.elevated, marginBottom: 8, overflow: 'hidden' },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  details:    { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 14, paddingVertical: 12, gap: 8, backgroundColor: 'rgba(255,255,255,0.02)' },
  detailRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  detailLabel:{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 0.6 },
  detailValue:{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  rowAvatar:  { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rowAvatarTxt: { fontSize: 12, fontWeight: '900' },
  rowBody:    { flex: 1, gap: 2 },
  rowName:    { fontSize: 14, fontWeight: '700', color: '#fff' },
  rowSub:     { fontSize: 11, color: Colors.text.subtle },
  rowMsg:     { fontSize: 11, color: Colors.text.muted, fontStyle: 'italic' },
  rowRight:   { alignItems: 'flex-end', gap: 4 },
  rowAmount:  { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  pill:       { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  pillTxt:    { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  deleteBtn:  { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.subtle },

  sep:  { height: 1, backgroundColor: Colors.border.subtle },
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 4, marginBottom: 16, paddingVertical: 12, borderRadius: 14,
    borderWidth: 1, borderColor: `${ROSE}30`, backgroundColor: `${ROSE}08`,
  },
  showMoreTxt: { fontSize: 13, fontWeight: '700', color: ROSE },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: `${ROSE}10`, borderWidth: 1, borderColor: `${ROSE}20`, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  emptySub:   { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  /* config sheet */
  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetWrap:  { position: 'absolute', bottom: 0, left: 0, right: 0 },
  configSheet:{ backgroundColor: Colors.bg.elevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, borderTopWidth: 1, borderColor: Colors.border.DEFAULT, maxHeight: '85%' },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border.DEFAULT, alignSelf: 'center', marginBottom: 16 },
  configHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  configTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  configSub:   { fontSize: 12, color: Colors.text.muted, marginBottom: 20, lineHeight: 18 },
  configRow:   { marginBottom: 14 },
  configLabel: { fontSize: 10, fontWeight: '700', color: Colors.text.subtle, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  configInputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.border.DEFAULT, backgroundColor: Colors.bg.primary, paddingHorizontal: 14, height: 44 },
  configPrefix: { fontSize: 15, color: Colors.text.muted, marginRight: 4 },
  configInput:  { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  optional:       { fontWeight: '400', fontSize: 10, color: Colors.text.muted },
  charCount:      { fontSize: 10, color: Colors.text.subtle, textAlign: 'right', marginTop: 3 },
  configError:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.10)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  configErrorTxt: { fontSize: 12, color: '#ef4444', flex: 1 },
  configSaveBtn:  { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 8 },
  configSaveTxt:  { fontSize: 15, fontWeight: '900', color: '#fff' },
});

/* ── Donut chart styles ─────────────────────────────────────────── */
const dc = StyleSheet.create({
  card:      { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: Colors.bg.elevated, padding: 14 },
  title:     { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
  centre:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  centreNum: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 20 },
  centreLbl: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 0.6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  legendLbl: { flex: 1, fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  legendCnt: { fontSize: 11, fontWeight: '900', color: '#fff' },
  legendPct: { fontSize: 10, color: 'rgba(255,255,255,0.28)', width: 32, textAlign: 'right' },
  empty:     { fontSize: 11, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' },
});
