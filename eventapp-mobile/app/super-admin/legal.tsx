import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, TextInput,
  ScrollView, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import api from '@/lib/api';
import { Colors } from '@/constants/colors';
import { toast } from '@/lib/toast';

const GOLD = '#C9A96E';
const BG   = '#07070f';
const CARD = '#0d0d1a';

const PAGE_META: Record<string, { color: string; icon: string }> = {
  'terms':          { color: '#f59e0b', icon: 'file-text'  },
  'privacy-policy': { color: '#6366f1', icon: 'lock'       },
  'cookies-policy': { color: '#10b981', icon: 'shield'     },
  'acceptable-use': { color: '#a78bfa', icon: 'book-open'  },
};
function meta(slug: string) { return PAGE_META[slug] ?? { color: GOLD, icon: 'file-text' }; }

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Edit sheet ─────────────────────────────────────────────────── */
function EditSheet({ page, onClose, onSaved }: { page: any; onClose: () => void; onSaved: (p: any) => void }) {
  const [form, setForm] = useState({
    slug:           page?.slug           ?? '',
    title:          page?.title          ?? '',
    content:        page?.content        ?? '',
    version:        page?.version        ?? '1.0',
    effective_date: page?.effective_date ? page.effective_date.slice(0,10) : new Date().toISOString().slice(0,10),
    is_published:   page?.is_published   ?? true,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.slug.trim() || !form.title.trim() || !form.content.trim()) {
      toast.warning('Missing fields', 'Slug, title and content are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/super-admin/legal/${form.slug.trim()}`, form);
      onSaved(res.data?.data);
      toast.success('Saved', `${form.title} updated.`);
      onClose();
    } catch (e: any) {
      toast.error('Error', e?.response?.data?.message ?? 'Could not save page.');
    } finally { setSaving(false); }
  };

  const inputStyle = {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    color: '#fff', fontSize: 13, fontWeight: '500' as const,
  };

  return (
    <View style={{ flex: 1, backgroundColor: CARD }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        {/* Slug */}
        <View>
          <Text style={s.label}>Slug *</Text>
          <TextInput style={inputStyle} value={form.slug}
            onChangeText={t => set('slug', t.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="e.g. terms" placeholderTextColor="rgba(255,255,255,0.22)"
            editable={!page?.slug} autoCapitalize="none" />
        </View>
        {/* Title */}
        <View>
          <Text style={s.label}>Title *</Text>
          <TextInput style={inputStyle} value={form.title}
            onChangeText={t => set('title', t)} placeholder="Terms of Service"
            placeholderTextColor="rgba(255,255,255,0.22)" />
        </View>
        {/* Version */}
        <View>
          <Text style={s.label}>Version</Text>
          <TextInput style={inputStyle} value={form.version}
            onChangeText={t => set('version', t)} placeholder="1.0"
            placeholderTextColor="rgba(255,255,255,0.22)" />
        </View>
        {/* Published */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                       padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)',
                       borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Published</Text>
            <Text style={{ fontSize: 11, color: Colors.text.muted, marginTop: 1 }}>Visible to public users</Text>
          </View>
          <Switch value={form.is_published} onValueChange={v => set('is_published', v)}
            trackColor={{ false: 'rgba(255,255,255,0.12)', true: 'rgba(99,102,241,0.55)' }}
            thumbColor={form.is_published ? '#6366f1' : Colors.text.muted} />
        </View>
        {/* Content */}
        <View>
          <Text style={s.label}>Content (Markdown) *</Text>
          <TextInput
            style={[inputStyle, { height: 280, textAlignVertical: 'top', paddingTop: 12, fontFamily: 'monospace', fontSize: 11 }]}
            value={form.content} onChangeText={t => set('content', t)}
            placeholder={'# Title\n\nYour legal content here…\n\n## Section\n\nParagraph text.'}
            placeholderTextColor="rgba(255,255,255,0.18)"
            multiline autoCapitalize="none" autoCorrect={false} />
        </View>
        {/* Save */}
        <Pressable
          style={[s.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Feather name="save" size={15} color="#fff" /><Text style={s.saveTxt}>Save Page</Text></>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ── Screen ──────────────────────────────────────────────────────── */
export default function LegalPagesScreen() {
  const [pages,       setPages]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [editing,     setEditing]     = useState<any>(null);
  const [loadingEdit, setLoadingEdit] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/super-admin/legal'); setPages(res.data?.data ?? []); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSaved = (saved: any) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.slug === saved.slug);
      return idx >= 0 ? prev.map((p, i) => i === idx ? saved : p) : [...prev, saved];
    });
  };

  const handleEdit = async (page: any) => {
    setLoadingEdit(page.slug);
    try {
      const res = await api.get(`/super-admin/legal/${page.slug}`);
      setEditing(res.data?.data ?? page);
    } catch {
      setEditing(page);
    } finally {
      setLoadingEdit(null);
    }
  };

  const handleDelete = (page: any) => {
    Alert.alert('Delete page?', `Remove "${page.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/super-admin/legal/${page.slug}`);
            setPages(prev => prev.filter(p => p.slug !== page.slug));
            toast.success('Deleted', `${page.title} removed.`);
          } catch { toast.error('Error', 'Could not delete page.'); }
        }
      },
    ]);
  };

  if (editing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CARD }} edges={['bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                       paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
                       borderBottomColor: 'rgba(255,255,255,0.07)', backgroundColor: BG }}>
          <Pressable onPress={() => setEditing(null)} hitSlop={8}>
            <Feather name="x" size={20} color="rgba(255,255,255,0.55)" />
          </Pressable>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>
            {editing === 'new' ? 'New Page' : `Edit — ${editing.title}`}
          </Text>
          <View style={{ width: 28 }} />
        </View>
        <EditSheet
          page={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['bottom']}>
      {/* Add button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                     paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
                     borderBottomColor: 'rgba(255,255,255,0.06)' }}>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', fontWeight: '600' }}>
          {pages.length} {pages.length === 1 ? 'page' : 'pages'}
        </Text>
        <Pressable onPress={() => setEditing('new')} style={s.addBtn}>
          <Feather name="plus" size={14} color="#fff" />
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>New Page</Text>
        </Pressable>
      </View>

      <FlatList
        data={loading ? [] : pages}
        keyExtractor={item => item.slug}
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={GOLD} size="large" style={{ marginTop: 60 }} />
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
              <Feather name="file-text" size={32} color="rgba(255,255,255,0.15)" />
              <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 15, fontWeight: '700' }}>No legal pages yet</Text>
              <Text style={{ color: 'rgba(255,255,255,0.20)', fontSize: 12 }}>Tap "+ New Page" to create one.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const { color, icon } = meta(item.slug);
          return (
            <View style={s.card}>
              {/* Header row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                               backgroundColor: color + '18', borderWidth: 1, borderColor: color + '30' }}>
                  <Feather name={icon as any} size={17} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>{item.title}</Text>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', fontFamily: 'monospace', marginTop: 1 }}>
                    /{item.slug}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
                               backgroundColor: item.is_published ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)' }}>
                  <Text style={{ fontSize: 9, fontWeight: '800',
                                 color: item.is_published ? '#10b981' : 'rgba(255,255,255,0.28)' }}>
                    {item.is_published ? 'Published' : 'Draft'}
                  </Text>
                </View>
              </View>

              {/* Meta */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>v{item.version}</Text>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Updated {fmtDate(item.updated_at)}</Text>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Pressable style={[s.editBtn, loadingEdit === item.slug && { opacity: 0.5 }]}
                  onPress={() => handleEdit(item)} disabled={loadingEdit === item.slug}>
                  {loadingEdit === item.slug
                    ? <ActivityIndicator size="small" color="rgba(255,255,255,0.55)" />
                    : <Feather name="edit-2" size={13} color="rgba(255,255,255,0.55)" />}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.55)' }}>
                    {loadingEdit === item.slug ? 'Loading…' : 'Edit'}
                  </Text>
                </Pressable>
                <Pressable style={s.deleteBtn} onPress={() => handleDelete(item)}>
                  <Feather name="trash-2" size={13} color="#ef4444" />
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  label:   { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14,
             backgroundColor: '#6366f1', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  saveTxt: { fontSize: 15, fontWeight: '900', color: '#fff' },
  addBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
             backgroundColor: 'rgba(99,102,241,0.18)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.30)' },
  card:    { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36,
             borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.04)' },
  deleteBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10,
               borderWidth: 1, borderColor: 'rgba(239,68,68,0.22)', backgroundColor: 'rgba(239,68,68,0.08)' },
});
