import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, ScrollView, Pressable,
  StyleSheet, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { Config } from '@/constants/config';

const BG   = '#07070f';
const CARD = '#0d0d1a';

/* ── Minimal markdown renderer for React Native ─────────────────── */
function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (/^### /.test(line)) {
      elements.push(<Text key={i} style={md.h3}>{line.slice(4)}</Text>);
    } else if (/^## /.test(line)) {
      elements.push(<Text key={i} style={md.h2}>{line.slice(3)}</Text>);
    } else if (/^# /.test(line)) {
      elements.push(<Text key={i} style={md.h1}>{line.slice(2)}</Text>);
    } else if (/^[-*] /.test(line)) {
      elements.push(
        <View key={i} style={md.bulletRow}>
          <Text style={md.bullet}>•</Text>
          <Text style={md.bulletText}>{renderInline(line.slice(2))}</Text>
        </View>
      );
    } else if (/^\*\*\*/.test(line) || /^---/.test(line)) {
      elements.push(<View key={i} style={md.divider} />);
    } else if (line === '') {
      elements.push(<View key={i} style={{ height: 8 }} />);
    } else {
      elements.push(<Text key={i} style={md.p}>{renderInline(line)}</Text>);
    }
  }

  return <>{elements}</>;
}

/* renders **bold** and *italic* inline */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<Text key={key++}>{text.slice(last, m.index)}</Text>);
    if (m[1]) parts.push(<Text key={key++} style={{ fontWeight: '700', color: '#fff' }}>{m[1]}</Text>);
    else if (m[2]) parts.push(<Text key={key++} style={{ fontStyle: 'italic' }}>{m[2]}</Text>);
    else if (m[3]) parts.push(<Text key={key++} style={{ fontFamily: 'monospace', color: '#a78bfa', fontSize: 12 }}>{m[3]}</Text>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<Text key={key++}>{text.slice(last)}</Text>);
  return parts.length === 1 && typeof parts[0] === 'string' ? text : parts;
}

/* ── Component ──────────────────────────────────────────────────── */
interface Props {
  slug:    string | null; // null = closed
  onClose: () => void;
}

export function LegalPageModal({ slug, onClose }: Props) {
  const [page,    setPage]    = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!slug) { setPage(null); setError(false); return; }
    setLoading(true);
    setError(false);
    setPage(null);
    axios
      .get(`${Config.API_URL}/public/legal/${slug}`)
      .then(r  => setPage(r.data?.data ?? null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <Modal
      visible={!!slug}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.headerLabel}>Legal</Text>
            <Text style={s.headerTitle} numberOfLines={1}>
              {page?.title ?? (loading ? 'Loading…' : '—')}
            </Text>
          </View>
          <Pressable onPress={onClose} style={s.closeBtn} hitSlop={12}>
            <Feather name="x" size={18} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>

        {/* Body */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color="#6366f1" size="large" />
            <Text style={s.loadingText}>Loading…</Text>
          </View>
        ) : error ? (
          <View style={s.center}>
            <Feather name="wifi-off" size={32} color="rgba(255,255,255,0.2)" />
            <Text style={s.errorTitle}>Could not load page</Text>
            <Text style={s.errorSub}>Please try again later or visit liteevent.com</Text>
          </View>
        ) : page ? (
          <ScrollView
            contentContainerStyle={s.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Meta */}
            <View style={s.metaRow}>
              {page.effective_date && (
                <View style={s.metaChip}>
                  <Text style={s.metaChipText}>Effective {fmtDate(page.effective_date)}</Text>
                </View>
              )}
              {page.version && (
                <View style={s.metaChip}>
                  <Text style={s.metaChipText}>v{page.version}</Text>
                </View>
              )}
            </View>

            {/* Markdown content */}
            <MarkdownText content={page.content} />

            {/* Bottom spacer */}
            <View style={{ height: 40 }} />
          </ScrollView>
        ) : null}

      </SafeAreaView>
    </Modal>
  );
}

/* ── Styles ─────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    backgroundColor: CARD,
  },
  headerLabel: {
    fontSize: 10, fontWeight: '800', color: 'rgba(99,102,241,0.8)',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2,
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8 },
  errorTitle:  { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  errorSub:    { fontSize: 12, color: 'rgba(255,255,255,0.28)', textAlign: 'center' },
  content:     { paddingHorizontal: 20, paddingTop: 20 },
  metaRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  metaChip:    {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)',
  },
  metaChipText: { fontSize: 11, fontWeight: '700', color: 'rgba(99,102,241,0.9)' },
});

const md = StyleSheet.create({
  h1:  { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 24, marginBottom: 10, lineHeight: 28 },
  h2:  { fontSize: 17, fontWeight: '800', color: '#fff', marginTop: 22, marginBottom: 8,  lineHeight: 24 },
  h3:  { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginTop: 16, marginBottom: 6 },
  p:   { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 22, marginBottom: 4 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 4, paddingLeft: 4 },
  bullet:    { fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 22, width: 14 },
  bulletText:{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 22, flex: 1 },
  divider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 16 },
});
