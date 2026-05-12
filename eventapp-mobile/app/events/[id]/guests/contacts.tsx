import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Contacts from 'expo-contacts';
import Toast from 'react-native-toast-message';

import { useGuestStore } from '@/store/guest.store';
import { Colors } from '@/constants/colors';

interface PickedContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const ACCENT = Colors.accent.indigo;

/* ── Contact row ────────────────────────────────────────────────── */
function ContactRow({
  contact, selected, onToggle,
}: { contact: PickedContact; selected: boolean; onToggle: () => void }) {
  return (
    <Pressable style={[r.row, selected && r.rowSelected]} onPress={onToggle}>
      {/* Avatar */}
      <View style={[r.avatar, selected && { backgroundColor: `${ACCENT}30`, borderColor: ACCENT }]}>
        {selected
          ? <Feather name="check" size={16} color={ACCENT} />
          : <Text style={r.avatarTxt}>{getInitials(contact.name)}</Text>
        }
      </View>

      {/* Info */}
      <View style={r.info}>
        <Text style={r.name} numberOfLines={1}>{contact.name}</Text>
        <Text style={r.sub} numberOfLines={1}>
          {contact.phone ?? contact.email ?? '—'}
        </Text>
      </View>

      {/* Checkbox */}
      <View style={[r.box, selected && r.boxChecked]}>
        {selected && <Feather name="check" size={11} color="#fff" />}
      </View>
    </Pressable>
  );
}

const r = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 16,
    borderRadius: 14, marginHorizontal: 16, marginBottom: 6,
    backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  rowSelected: { borderColor: `${ACCENT}40`, backgroundColor: `${ACCENT}08` },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 13, fontWeight: '800', color: Colors.text.muted },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: '#fff' },
  sub:  { fontSize: 11, color: Colors.text.subtle },
  box: {
    width: 22, height: 22, borderRadius: 7,
    borderWidth: 1.5, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  boxChecked: { backgroundColor: ACCENT, borderColor: ACCENT },
});

/* ── Screen ─────────────────────────────────────────────────────── */
export default function ContactsPickerScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { createGuest } = useGuestStore();

  const [contacts, setContacts]   = useState<PickedContact[]>([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [saving, setSaving]       = useState(false);

  /* Load contacts */
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Contacts Permission',
          'Please allow access to contacts in your device settings.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        sort: Contacts.SortTypes.FirstName,
      });
      const mapped: PickedContact[] = data
        .filter(c => c.name)
        .map(c => ({
          id:    c.id ?? c.name!,
          name:  c.name!,
          phone: c.phoneNumbers?.[0]?.number ?? null,
          email: c.emails?.[0]?.email ?? null,
        }));
      setContacts(mapped);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts;
    const q = query.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleAdd = async () => {
    if (!selected.size || !eventId) return;
    setSaving(true);
    const toAdd = contacts.filter(c => selected.has(c.id));
    let added = 0;
    for (const c of toAdd) {
      const res = await createGuest(eventId, {
        full_name: c.name,
        email:     c.email ?? undefined,
        phone:     c.phone ?? undefined,
      });
      if (res.success) added++;
    }
    setSaving(false);
    Toast.show({
      type: 'success',
      text1: `${added} guest${added !== 1 ? 's' : ''} added`,
      text2: added < toAdd.length ? `${toAdd.length - added} already existed or failed` : undefined,
    });
    router.back();
  };

  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="x" size={18} color="#fff" />
        </Pressable>
        <View style={s.headerMid}>
          <View style={s.headerIcon}>
            <LinearGradient colors={['#4f46e5', '#818cf8']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Feather name="users" size={15} color="#fff" />
          </View>
          <View>
            <Text style={s.headerTitle}>Add from Contacts</Text>
            <Text style={s.headerSub}>{contacts.length} contacts</Text>
          </View>
        </View>
        {filtered.length > 0 && (
          <Pressable onPress={toggleAll} hitSlop={8}>
            <Text style={s.selectAll}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
          </Pressable>
        )}
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Feather name="search" size={14} color={Colors.text.subtle} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, phone or email…"
          placeholderTextColor={Colors.text.subtle}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Feather name="x-circle" size={14} color={Colors.text.subtle} />
          </Pressable>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={ACCENT} size="large" />
          <Text style={s.loadingTxt}>Loading contacts…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          renderItem={({ item }) => (
            <ContactRow
              contact={item}
              selected={selected.has(item.id)}
              onToggle={() => toggle(item.id)}
            />
          )}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="user-x" size={32} color={Colors.text.subtle} />
              <Text style={s.emptyTxt}>No contacts found</Text>
            </View>
          }
        />
      )}

      {/* CTA */}
      {selected.size > 0 && (
        <View style={s.ctaWrap}>
          <Pressable style={s.ctaBtn} onPress={handleAdd} disabled={saving}>
            <LinearGradient
              colors={[Colors.accent.indigo, Colors.accent.violet]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            {saving
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Feather name="user-plus" size={16} color="#fff" />
                  <Text style={s.ctaTxt}>Add {selected.size} Guest{selected.size !== 1 ? 's' : ''}</Text>
                </>
            }
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  headerMid:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },
  selectAll:   { fontSize: 12, fontWeight: '700', color: ACCENT },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.subtle,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchIcon:  {},
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0 },

  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, color: Colors.text.muted },

  empty:    { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 15, fontWeight: '600', color: Colors.text.muted },

  ctaWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: 36,
    backgroundColor: Colors.bg.primary,
    borderTopWidth: 1, borderTopColor: Colors.border.subtle,
  },
  ctaBtn: {
    height: 52, borderRadius: 14, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
  },
  ctaTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
