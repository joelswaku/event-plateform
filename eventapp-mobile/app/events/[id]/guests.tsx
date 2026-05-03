import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useGuestStore } from '@/store/guest.store';
import { GuestListItem } from '@/components/guests/GuestListItem';
import { BottomSheet }   from '@/components/ui/BottomSheet';
import { Button }        from '@/components/ui/Button';
import { Input }         from '@/components/ui/Input';
import { EmptyState }    from '@/components/ui/EmptyState';
import { Colors }        from '@/constants/colors';
import { GuestStatus }   from '@/types';
import Toast             from 'react-native-toast-message';

type Filter = 'ALL' | GuestStatus | 'CHECKED_IN';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL',        label: 'All' },
  { key: 'CONFIRMED',  label: 'Confirmed' },
  { key: 'PENDING',    label: 'Pending' },
  { key: 'DECLINED',   label: 'Declined' },
  { key: 'CHECKED_IN', label: 'Checked In' },
];

export default function GuestsScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router          = useRouter();
  const { guests, dashboard, fetchGuests, fetchDashboard, createGuest } = useGuestStore();

  const [query,   setQuery]   = useState('');
  const [filter,  setFilter]  = useState<Filter>('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({ full_name: '', email: '', phone: '', is_vip: false });
  const [adding,  setAdding]  = useState(false);

  useEffect(() => {
    if (!eventId) return;
    fetchGuests(eventId);
    fetchDashboard(eventId);
  }, [eventId]);

  const filtered = useMemo(() => {
    return guests
      .filter(g => {
        if (filter === 'ALL')        return true;
        if (filter === 'CHECKED_IN') return !!g.checked_in_at;
        return g.status === filter;
      })
      .filter(g => !query || g.full_name.toLowerCase().includes(query.toLowerCase()) || g.email?.includes(query));
  }, [guests, filter, query]);

  const handleAdd = async () => {
    if (!newGuest.full_name.trim()) return;
    setAdding(true);
    const result = await createGuest(eventId!, newGuest);
    setAdding(false);
    if (result.success) {
      Toast.show({ type: 'success', text1: 'Guest added' });
      setAddOpen(false);
      setNewGuest({ full_name: '', email: '', phone: '', is_vip: false });
    } else {
      Toast.show({ type: 'error', text1: 'Failed to add guest' });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Guests</Text>
            {dashboard && (
              <Text style={styles.sub}>{dashboard.total} total · {dashboard.checked_in} checked in</Text>
            )}
          </View>
          <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <Feather name="user-plus" size={16} color="#fff" />
          </Pressable>
        </View>

        {/* Stats strip */}
        {dashboard && (
          <View style={styles.statsRow}>
            <StatPill label="Confirmed" value={dashboard.confirmed} accent={Colors.accent.emerald} />
            <StatPill label="Pending"   value={dashboard.pending}   accent={Colors.accent.amber}   />
            <StatPill label="Declined"  value={dashboard.declined}  accent={Colors.accent.red}     />
            <StatPill label="In"        value={dashboard.checked_in}accent={Colors.accent.indigo}  />
          </View>
        )}

        {/* Search */}
        <View style={styles.searchWrap}>
          <Feather name="search" size={14} color={Colors.text.subtle} />
          <TextInput
            style={styles.search}
            placeholder="Search guests…"
            placeholderTextColor={Colors.text.subtle}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTERS.map(f => (
            <Pressable
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* List */}
        <ScrollView
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => fetchGuests(eventId!)} tintColor={Colors.accent.indigo} />}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <EmptyState icon="users" title="No guests" description="Add guests to your event to get started." actionLabel="Add Guest" onAction={() => setAddOpen(true)} />
          ) : (
            filtered.map(g => (
              <GuestListItem
                key={g.id}
                guest={g}
                onPress={() => router.push(`/events/${eventId}/guests/${g.id}` as never)}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Add guest sheet */}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Add Guest">
        <View style={styles.addForm}>
          <Input label="Full Name *" icon="user" placeholder="Jane Smith" value={newGuest.full_name}
            onChangeText={t => setNewGuest(g => ({ ...g, full_name: t }))} />
          <Input label="Email" icon="mail" placeholder="jane@example.com" keyboardType="email-address"
            autoCapitalize="none" value={newGuest.email}
            onChangeText={t => setNewGuest(g => ({ ...g, email: t }))} />
          <Input label="Phone" icon="phone" placeholder="+1 555 000 0000" keyboardType="phone-pad"
            value={newGuest.phone} onChangeText={t => setNewGuest(g => ({ ...g, phone: t }))} />

          <Pressable
            style={[styles.vipToggle, newGuest.is_vip && { borderColor: `${Colors.accent.gold}50`, backgroundColor: `${Colors.accent.gold}12` }]}
            onPress={() => setNewGuest(g => ({ ...g, is_vip: !g.is_vip }))}
          >
            <Text style={{ fontSize: 16 }}>👑</Text>
            <Text style={[styles.vipLabel, newGuest.is_vip && { color: Colors.accent.gold }]}>VIP Guest</Text>
            {newGuest.is_vip && <Feather name="check" size={14} color={Colors.accent.gold} style={{ marginLeft: 'auto' }} />}
          </Pressable>

          <Button label="Add Guest" onPress={handleAdd} loading={adding} accent={Colors.accent.indigo} size="lg" />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function StatPill({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View style={[styles.statPill, { backgroundColor: `${accent}12`, borderColor: `${accent}25` }]}>
      <Text style={[styles.statVal, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  root: { flex: 1 },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg.elevated, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: '#fff' },
  sub:   { fontSize: 12, color: Colors.text.muted },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.accent.indigo, alignItems: 'center', justifyContent: 'center' },

  statsRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  statPill:   { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 2 },
  statVal:    { fontSize: 18, fontWeight: '900' },
  statLabel:  { fontSize: 9, fontWeight: '700', color: Colors.text.subtle },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bg.input, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.DEFAULT, marginHorizontal: 16, paddingHorizontal: 12, height: 42, marginBottom: 8 },
  search:     { flex: 1, color: '#fff', fontSize: 13 },

  filtersRow:    { paddingHorizontal: 16, gap: 6, marginBottom: 4 },
  chip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: Colors.border.DEFAULT, backgroundColor: Colors.bg.elevated },
  chipActive:    { backgroundColor: `${Colors.accent.indigo}20`, borderColor: `${Colors.accent.indigo}50` },
  chipText:      { fontSize: 11, fontWeight: '600', color: Colors.text.muted },
  chipTextActive:{ color: Colors.accent.indigo, fontWeight: '700' },

  addForm:    { gap: 14 },
  vipToggle:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.DEFAULT, backgroundColor: Colors.bg.elevated },
  vipLabel:   { fontSize: 14, fontWeight: '700', color: Colors.text.muted },
});
