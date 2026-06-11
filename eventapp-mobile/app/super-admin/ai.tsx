import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSuperAdminStore, SAAiInsight } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';

const PRIORITY_STYLE = {
  high:   { color: Colors.accent.red,     bg: 'rgba(239,68,68,0.12)',   icon: 'alert-triangle' as const },
  medium: { color: Colors.accent.amber,   bg: 'rgba(245,158,11,0.12)',  icon: 'info'            as const },
  low:    { color: Colors.accent.emerald, bg: 'rgba(16,185,129,0.12)',  icon: 'check-circle'    as const },
};

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 13, width: '70%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)' }} />
          <View style={{ height: 11, width: '90%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <View style={{ height: 11, width: '60%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.04)' }} />
        </View>
      </View>
    </View>
  );
}

function InsightCard({ item }: { item: SAAiInsight }) {
  const ps = PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.medium;
  return (
    <View style={[styles.card, { borderLeftColor: ps.color, borderLeftWidth: 3 }]}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[styles.iconWrap, { backgroundColor: ps.bg }]}>
          <Feather name={ps.icon} size={16} color={ps.color} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.insightTitle} numberOfLines={2}>{item.title}</Text>
          </View>
          <Text style={styles.insightDesc}>{item.description}</Text>
          {!!item.metric && (
            <View style={styles.metricChip}>
              <Text style={styles.metricText}>{item.metric}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={[styles.priorityBadge, { backgroundColor: ps.bg }]}>
        <Text style={[styles.priorityText, { color: ps.color }]}>
          {item.priority.toUpperCase()} PRIORITY
        </Text>
      </View>
    </View>
  );
}

export default function AiInsightsScreen() {
  const { aiInsights, loading, fetchAiInsights } = useSuperAdminStore();

  useFocusEffect(
    React.useCallback(() => { fetchAiInsights(); }, [])
  );

  const high   = aiInsights.filter(i => i.priority === 'high');
  const medium = aiInsights.filter(i => i.priority === 'medium');
  const low    = aiInsights.filter(i => i.priority === 'low');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {loading && !aiInsights.length ? (
          [0, 1, 2, 3].map(i => <SkeletonCard key={i} />)
        ) : aiInsights.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="cpu" size={32} color={Colors.text.muted} />
            <Text style={styles.emptyText}>No insights yet</Text>
            <Text style={styles.emptySub}>AI insights will appear as your platform grows</Text>
          </View>
        ) : (
          <>
            {high.length > 0 && (
              <View style={styles.group}>
                <Text style={[styles.groupLabel, { color: Colors.accent.red }]}>High Priority</Text>
                {high.map((i, idx) => <InsightCard key={i.id ?? idx} item={i} />)}
              </View>
            )}
            {medium.length > 0 && (
              <View style={styles.group}>
                <Text style={[styles.groupLabel, { color: Colors.accent.amber }]}>Medium Priority</Text>
                {medium.map((i, idx) => <InsightCard key={i.id ?? idx} item={i} />)}
              </View>
            )}
            {low.length > 0 && (
              <View style={styles.group}>
                <Text style={[styles.groupLabel, { color: Colors.accent.emerald }]}>Low Priority</Text>
                {low.map((i, idx) => <InsightCard key={i.id ?? idx} item={i} />)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#07070f' },
  content: { padding: 16, gap: 10, paddingBottom: 40 },

  group: { gap: 10 },
  groupLabel: {
    fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 2,
  },

  card: {
    backgroundColor: '#0d0d1a',
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     Colors.border.subtle,
    padding:         14,
    gap:             10,
    overflow:        'hidden',
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  insightTitle: { fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 18 },
  insightDesc:  { fontSize: 12, color: Colors.text.muted, lineHeight: 17 },

  metricChip: {
    alignSelf:       'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius:    6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop:       2,
  },
  metricText: { fontSize: 11, color: Colors.text.subtle, fontFamily: 'monospace' },

  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  priorityText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },

  empty:    { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  emptySub:  { fontSize: 12, color: Colors.text.muted, textAlign: 'center' },
});
