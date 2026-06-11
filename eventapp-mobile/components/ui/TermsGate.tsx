import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, Pressable, ScrollView,
  StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import axios      from 'axios';
import { Config } from '@/constants/config';
import { useAuthStore } from '@/store/auth.store';
import api              from '@/lib/api';
import { Colors }       from '@/constants/colors';
import { toast }        from '@/lib/toast';

const CURRENT_VERSION = '2025.1';
const BG   = '#07070f';
const CARD = '#0d0d1a';

/* ── Inline legal reader (rendered inside the same Modal) ────────── */
function LegalReader({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [page,    setPage]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true); setError(false); setPage(null);
    axios.get(`${Config.API_URL}/public/legal/${slug}`)
      .then(r  => setPage(r.data?.data ?? null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Sub-header */}
      <View style={r.bar}>
        <Pressable onPress={onBack} style={r.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={18} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <Text style={r.barTitle} numberOfLines={1}>
          {page?.title ?? (loading ? 'Loading…' : '—')}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={r.center}>
          <ActivityIndicator color="#6366f1" size="large" />
          <Text style={r.loadTxt}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={r.center}>
          <Feather name="wifi-off" size={30} color="rgba(255,255,255,0.18)" />
          <Text style={r.errTitle}>Could not load page</Text>
          <Text style={r.errSub}>Please try again or visit liteevent.com</Text>
        </View>
      ) : page ? (
        <ScrollView contentContainerStyle={r.content} showsVerticalScrollIndicator={false}>
          {/* Meta chips */}
          <View style={r.metaRow}>
            {page.effective_date && (
              <View style={r.chip}>
                <Text style={r.chipTxt}>Effective {fmtDate(page.effective_date)}</Text>
              </View>
            )}
            {page.version && (
              <View style={[r.chip, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)' }]}>
                <Text style={[r.chipTxt, { color: 'rgba(255,255,255,0.35)' }]}>v{page.version}</Text>
              </View>
            )}
          </View>
          {/* Plain text content (strip markdown markers for readability) */}
          {page.content.split('\n').map((line: string, i: number) => {
            const t = line.trimEnd();
            if (/^### /.test(t))    return <Text key={i} style={r.h3}>{t.slice(4)}</Text>;
            if (/^## /.test(t))     return <Text key={i} style={r.h2}>{t.slice(3)}</Text>;
            if (/^# /.test(t))      return <Text key={i} style={r.h1}>{t.slice(2)}</Text>;
            if (/^[-*] /.test(t))   return (
              <View key={i} style={r.bulletRow}>
                <Text style={r.bullet}>•</Text>
                <Text style={r.bodyTxt}>{t.slice(2).replace(/\*\*(.+?)\*\*/g,'$1')}</Text>
              </View>
            );
            if (/^---$/.test(t))    return <View key={i} style={r.divider} />;
            if (t === '')           return <View key={i} style={{ height: 6 }} />;
            return <Text key={i} style={r.bodyTxt}>{t.replace(/\*\*(.+?)\*\*/g,'$1')}</Text>;
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : null}
    </View>
  );
}

/* ── TermsGate ───────────────────────────────────────────────────── */
export function TermsGate() {
  const user    = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);

  const needsAcceptance = !!user && !user.terms_accepted_at;

  const [checked,   setChecked]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [reading,   setReading]   = useState<string | null>(null); // slug being read

  if (!needsAcceptance) return null;

  const handleAccept = async () => {
    if (!checked) { toast.warning('Required', 'Please check the box to accept the terms.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/accept-terms', { version: CURRENT_VERSION });
      if (res.data?.success) {
        setUser({ ...user, terms_accepted_at: res.data.terms_accepted_at, terms_version_accepted: CURRENT_VERSION });
      }
    } catch {
      toast.error('Error', 'Could not save. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {}}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>

        {/* If reading a doc, show the inline reader; otherwise show the acceptance screen */}
        {reading ? (
          <LegalReader slug={reading} onBack={() => setReading(null)} />
        ) : (
          <>
            {/* Header */}
            <View style={s.header}>
              <View style={s.iconWrap}>
                <Feather name="shield" size={22} color="#818cf8" />
              </View>
              <Text style={s.title}>Review our terms</Text>
              <Text style={s.subtitle}>
                Before continuing, please read and accept our Terms of Service and Privacy Policy.
              </Text>
            </View>

            <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
              {/* Doc buttons */}
              {([
                { slug: 'terms',          icon: 'file-text' as const, label: 'Terms of Service', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
                { slug: 'privacy-policy', icon: 'lock'      as const, label: 'Privacy Policy',   color: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
              ] as const).map(({ slug, icon, label, color, bg }) => (
                <Pressable key={slug} onPress={() => setReading(slug)}
                  style={[s.docBtn, { backgroundColor: bg, borderColor: color + '28' }]}>
                  <View style={[s.docIcon, { backgroundColor: color + '18' }]}>
                    <Feather name={icon} size={15} color={color} />
                  </View>
                  <Text style={s.docLabel}>{label}</Text>
                  <Feather name="chevron-right" size={16} style={{ color: color + '80' }} />
                </Pressable>
              ))}

              {/* Checkbox */}
              <View style={s.checkRow}>
                <Pressable
                  onPress={() => setChecked(v => !v)}
                  hitSlop={8}
                  style={[s.checkBox, {
                    backgroundColor: checked ? Colors.accent.indigo : 'rgba(255,255,255,0.05)',
                    borderColor:     checked ? Colors.accent.indigo : 'rgba(255,255,255,0.22)',
                  }]}>
                  {checked && <Feather name="check" size={11} color="#fff" />}
                </Pressable>
                <Text style={s.checkText}>
                  {'I have read and agree to the '}
                  <Text onPress={() => setReading('terms')} style={s.link}>Terms of Service</Text>
                  {' and '}
                  <Text onPress={() => setReading('privacy-policy')} style={s.link}>Privacy Policy</Text>
                  {'. I confirm I am at least 18 years old.'}
                </Text>
              </View>

              {/* Accept button */}
              <Pressable onPress={handleAccept} disabled={loading}
                style={[s.cta, loading && { opacity: 0.6 }]}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.ctaText}>Accept & Continue</Text>}
              </Pressable>
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/* ── Reader styles ───────────────────────────────────────────────── */
const r = StyleSheet.create({
  bar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
             borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', backgroundColor: CARD },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
             backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  barTitle:{ flex: 1, fontSize: 15, fontWeight: '800', color: '#fff', textAlign: 'center' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  loadTxt: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 8 },
  errTitle:{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.45)' },
  errSub:  { fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
             backgroundColor: 'rgba(99,102,241,0.12)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)' },
  chipTxt: { fontSize: 11, fontWeight: '700', color: 'rgba(99,102,241,0.9)' },
  h1:      { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 20, marginBottom: 8 },
  h2:      { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 18, marginBottom: 6 },
  h3:      { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)', marginTop: 14, marginBottom: 4 },
  bodyTxt: { fontSize: 13, color: 'rgba(255,255,255,0.52)', lineHeight: 21, marginBottom: 2 },
  bulletRow:{ flexDirection: 'row', gap: 8, marginBottom: 2, paddingLeft: 4 },
  bullet:  { fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 21, width: 14 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 14 },
});

/* ── Acceptance screen styles ────────────────────────────────────── */
const s = StyleSheet.create({
  header:  { alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 20 },
  iconWrap:{ width: 56, height: 56, borderRadius: 18, marginBottom: 16,
             backgroundColor: 'rgba(99,102,241,0.14)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.28)',
             alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle:{ fontSize: 13, color: 'rgba(255,255,255,0.40)', textAlign: 'center', lineHeight: 20 },
  body:    { padding: 20, gap: 12, paddingBottom: 40 },
  docBtn:  { flexDirection: 'row', alignItems: 'center', gap: 12,
             padding: 14, borderRadius: 14, borderWidth: 1 },
  docIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docLabel:{ flex: 1, fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.80)' },
  checkRow:{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 },
  checkBox:{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, marginTop: 1,
             alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkText:{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 18 },
  link:    { color: '#818cf8', textDecorationLine: 'underline' },
  cta:     { marginTop: 8, height: 52, borderRadius: 16, backgroundColor: '#6366f1',
             alignItems: 'center', justifyContent: 'center',
             shadowColor: '#6366f1', shadowOffset: { width: 0, height: 6 },
             shadowOpacity: 0.40, shadowRadius: 16, elevation: 8 },
  ctaText: { fontSize: 16, fontWeight: '900', color: '#fff' },
});
