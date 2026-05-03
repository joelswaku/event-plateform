import React, { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTicketStore } from '@/store/ticket.store';
import { Colors }         from '@/constants/colors';
import { fmtCurrency }    from '@/lib/format';
import { getTierConfig }  from '@/lib/tier';

export default function TicketsTab() {
  const router   = useRouter();
  const { eventsWithTickets, fetchEventsWithTickets, fetchStats, stats } = useTicketStore();

  useEffect(() => { fetchEventsWithTickets(); }, []);
  const refresh = useCallback(() => fetchEventsWithTickets(), []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={Colors.accent.indigo} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Tickets</Text>
          <Text style={styles.sub}>Manage ticket types and orders</Text>
        </View>

        {eventsWithTickets.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="credit-card" size={40} color={Colors.text.subtle} />
            <Text style={styles.emptyTitle}>No ticketed events</Text>
            <Text style={styles.emptyText}>Enable ticketing on an event to start selling tickets.</Text>
          </View>
        ) : (
          eventsWithTickets.map(event => (
            <Pressable
              key={event.id}
              style={styles.eventCard}
              onPress={() => router.push(`/events/${event.id}/tickets` as never)}
            >
              <View style={styles.eventCardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventType}>{event.event_type?.toUpperCase()}</Text>
                  <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.text.muted} />
              </View>
              <View style={styles.eventCardMeta}>
                <Text style={styles.metaText}>
                  <Text style={{ color: Colors.accent.emerald, fontWeight: '700' }}>
                    {event.city ?? 'Online'}
                  </Text>
                  {event.starts_at_local ? ` · ${new Date(event.starts_at_local).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: 16, gap: 12, paddingBottom: 100 },

  header: { paddingVertical: 8 },
  title:  { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  sub:    { fontSize: 13, color: Colors.text.muted, marginTop: 2 },

  empty:      { alignItems: 'center', gap: 10, paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text.primary },
  emptyText:  { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 18 },

  eventCard: {
    backgroundColor: Colors.bg.card,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    padding:         16,
    gap:             6,
  },
  eventCardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventType:     { fontSize: 9, fontWeight: '800', color: Colors.accent.indigo, letterSpacing: 1 },
  eventTitle:    { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  eventCardMeta: {},
  metaText:      { fontSize: 12, color: Colors.text.muted },
});
