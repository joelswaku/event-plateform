import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useEventStore }  from '@/store/event.store';
import { useDrawerStore } from '@/store/drawer.store';
import { EventCard }      from '@/components/events/EventCard';
import { Colors }         from '@/constants/colors';
import { EventStatus }    from '@/types';

type Filter = 'ALL' | EventStatus;
const FILTERS: Filter[] = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED'];

export default function EventsTab() {
  const router     = useRouter();
  const openDrawer = useDrawerStore(s => s.open);
  const { events, fetchEvents, loading } = useEventStore();
  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  useEffect(() => { fetchEvents(); }, []);

  const filtered = useMemo(() => {
    return events
      .filter(e => filter === 'ALL' || e.status === filter)
      .filter(e => !query || e.title.toLowerCase().includes(query.toLowerCase()));
  }, [events, filter, query]);

  const refresh = useCallback(() => fetchEvents(), []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.menuBtn} onPress={openDrawer} hitSlop={10}>
            <Feather name="menu" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.title}>My Events</Text>
          <Pressable style={styles.createBtn} onPress={() => router.push('/events/create' as never)}>
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Feather name="search" size={15} color={Colors.text.subtle} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            placeholder="Search events…"
            placeholderTextColor={Colors.text.subtle}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Feather name="x" size={15} color={Colors.text.subtle} />
            </Pressable>
          )}
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTERS.map(f => (
            <Pressable
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* List */}
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.accent.indigo} />}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="calendar" size={40} color={Colors.text.subtle} />
              <Text style={styles.emptyTitle}>
                {query ? `No results for "${query}"` : 'No events'}
              </Text>
              <Text style={styles.emptyText}>
                {query ? 'Try a different search term' : 'Create your first event to get started'}
              </Text>
            </View>
          ) : (
            filtered.map(event => (
              <EventCard key={event.id} event={event} onRefresh={fetchEvents} />
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  root: { flex: 1, gap: 12 },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        12,
    gap:               12,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  title:     { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4, flex: 1 },
  createBtn: {
    width:           40,
    height:          40,
    borderRadius:    12,
    backgroundColor: Colors.accent.indigo,
    alignItems:      'center',
    justifyContent:  'center',
  },

  searchWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.bg.input,
    borderRadius:      14,
    borderWidth:       1,
    borderColor:       Colors.border.DEFAULT,
    marginHorizontal:  16,
    paddingHorizontal: 12,
    height:            46,
    gap:               8,
  },
  searchIcon: { flexShrink: 0 },
  search:     { flex: 1, color: '#fff', fontSize: 14 },

  filtersRow: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical:    7,
    borderRadius:       99,
    borderWidth:        1,
    borderColor:        Colors.border.DEFAULT,
    backgroundColor:    Colors.bg.elevated,
  },
  filterChipActive: {
    backgroundColor: `${Colors.accent.indigo}20`,
    borderColor:     `${Colors.accent.indigo}50`,
  },
  filterText:       { fontSize: 12, fontWeight: '600', color: Colors.text.muted },
  filterTextActive: { color: Colors.accent.indigo, fontWeight: '700' },

  list:       { padding: 16, paddingBottom: 100 },
  empty:      { alignItems: 'center', gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text.primary },
  emptyText:  { fontSize: 13, color: Colors.text.muted, textAlign: 'center' },
});
