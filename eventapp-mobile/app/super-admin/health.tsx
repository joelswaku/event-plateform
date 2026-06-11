import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSuperAdminStore } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';

const STATUS_STYLE = {
  healthy:  { dot: Colors.accent.emerald, bg: 'rgba(16,185,129,0.12)',  text: '#10b981', label: 'Healthy'  },
  degraded: { dot: Colors.accent.amber,   bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', label: 'Degraded' },
  down:     { dot: Colors.accent.red,     bg: 'rgba(239,68,68,0.12)',   text: '#ef4444', label: 'Down'     },
} as const;

function SkeletonCard() {
  return (
    <View style={styles.serviceCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <View style={{ height: 13, width: 120, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <View style={{ height: 20, width: 64, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 'auto' }} />
      </View>
    </View>
  );
}

export default function HealthScreen() {
  const { health, loading, fetchHealth } = useSuperAdminStore();

  useFocusEffect(
    React.useCallback(() => { fetchHealth(); }, [])
  );

  const allHealthy = health?.services.every(s => s.status === 'healthy');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Overall status banner */}
        {!loading && health && (
          <View style={[styles.banner, { backgroundColor: allHealthy ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)', borderColor: allHealthy ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)' }]}>
            <Feather
              name={allHealthy ? 'check-circle' : 'alert-circle'}
              size={20}
              color={allHealthy ? Colors.accent.emerald : Colors.accent.red}
            />
            <View>
              <Text style={[styles.bannerTitle, { color: allHealthy ? Colors.accent.emerald : Colors.accent.red }]}>
                {allHealthy ? 'All Systems Operational' : 'Some Systems Degraded'}
              </Text>
              {!!health.uptime && (
                <Text style={styles.bannerSub}>Uptime: {health.uptime}</Text>
              )}
            </View>
          </View>
        )}

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {loading && !health ? (
            [0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
          ) : (
            health?.services.map((svc, i) => {
              const st = STATUS_STYLE[svc.status] ?? STATUS_STYLE.degraded;
              return (
                <View key={i} style={[styles.serviceCard, { borderColor: `${st.dot}30` }]}>
                  <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
                  <Text style={styles.serviceName}>{svc.name}</Text>
                  {svc.latency !== undefined && (
                    <Text style={styles.serviceLatency}>{svc.latency}ms</Text>
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: st.bg, marginLeft: 'auto' }]}>
                    <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Metrics */}
        {health?.metrics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metrics</Text>
            <View style={styles.metricsGrid}>
              {[
                { label: 'Total Users',    value: health.metrics.total_users,       icon: 'users'    as const },
                { label: 'Total Events',   value: health.metrics.total_events,      icon: 'calendar' as const },
                { label: 'Total Tickets',  value: health.metrics.total_tickets,     icon: 'tag'      as const },
                { label: 'Active (24h)',   value: health.metrics.active_users_24h,  icon: 'activity' as const },
              ].filter(m => m.value !== undefined).map(m => (
                <View key={m.label} style={styles.metricCard}>
                  <Feather name={m.icon} size={14} color={Colors.accent.gold} />
                  <Text style={styles.metricValue}>{m.value?.toLocaleString() ?? '—'}</Text>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Refresh button */}
        <Pressable style={styles.refreshBtn} onPress={() => fetchHealth()}>
          <Feather name="refresh-cw" size={14} color={Colors.accent.gold} />
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#07070f' },
  content: { padding: 20, gap: 20, paddingBottom: 40 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 16,
  },
  bannerTitle: { fontSize: 15, fontWeight: '800' },
  bannerSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 2 },

  section:      { gap: 10 },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: Colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  serviceCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    backgroundColor: '#0d0d1a',
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     Colors.border.subtle,
    padding:         14,
  },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  serviceName:    { flex: 1, fontSize: 13, fontWeight: '700', color: '#fff' },
  serviceLatency: { fontSize: 11, color: Colors.text.muted, fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText:  { fontSize: 10, fontWeight: '800' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: {
    width:           '47.5%',
    backgroundColor: '#0d0d1a',
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     Colors.border.subtle,
    padding:         14,
    gap:             6,
    alignItems:      'flex-start',
  },
  metricValue: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  metricLabel: { fontSize: 11, color: Colors.text.muted, fontWeight: '600' },

  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(201,169,110,0.10)',
    borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)',
  },
  refreshText: { fontSize: 14, fontWeight: '700', color: Colors.accent.gold },
});
