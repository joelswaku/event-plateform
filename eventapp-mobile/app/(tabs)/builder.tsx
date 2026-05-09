import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEventStore } from '@/store/event.store';
import { Colors } from '@/constants/colors';

export default function BuilderGateway() {
  const router = useRouter();
  const { events, activeEventId, fetchEvents, loading } = useEventStore();

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    if (loading) return;
    const target = events.find(e => e.id === activeEventId) ?? events[0];
    if (target) {
      router.replace(`/events/${target.id}/builder` as never);
    }
  }, [events, activeEventId, loading]);

  if (!loading && events.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <View style={s.iconWrap}>
            <Feather name="layout" size={32} color={Colors.accent.indigo} />
          </View>
          <Text style={s.title}>No events yet</Text>
          <Text style={s.sub}>Create an event first to start building your page</Text>
          <Pressable style={s.btn} onPress={() => router.push('/events/create' as never)}>
            <LinearGradient
              colors={[Colors.accent.indigo, Colors.accent.violet]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
            />
            <Feather name="plus" size={15} color="#fff" />
            <Text style={s.btnTxt}>Create Event</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.safe}>
      <ActivityIndicator size="large" color={Colors.accent.indigo} style={s.loader} />
    </View>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.bg.primary },
  loader:   { flex: 1 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingHorizontal: 40,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.accent.indigo + '14',
    borderWidth: 1, borderColor: Colors.accent.indigo + '25',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title:  { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  sub:    { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, overflow: 'hidden', marginTop: 8,
  },
  btnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
