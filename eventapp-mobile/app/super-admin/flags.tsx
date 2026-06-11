import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSuperAdminStore, SAFlag } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 8, flex: 1 }}>
          <View style={{ height: 14, width: '55%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)' }} />
          <View style={{ height: 11, width: '80%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <View style={{ height: 18, width: 60, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 4 }} />
        </View>
        <View style={{ height: 28, width: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', marginLeft: 16 }} />
      </View>
    </View>
  );
}

function FlagCard({ flag }: { flag: SAFlag & { updated_by?: string; updated_at?: string } }) {
  const { updateFlag } = useSuperAdminStore();

  return (
    <View style={[styles.card, flag.enabled && styles.cardActive]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={styles.flagName}>{flag.name}</Text>
            <View style={[styles.onOffBadge, { backgroundColor: flag.enabled ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.07)' }]}>
              <Text style={[styles.onOffText, { color: flag.enabled ? Colors.accent.gold : Colors.text.subtle }]}>
                {flag.enabled ? 'ON' : 'OFF'}
              </Text>
            </View>
          </View>
          {!!flag.description && (
            <Text style={styles.flagDesc}>{flag.description}</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <View style={styles.keyBadge}>
              <Text style={styles.keyText}>{flag.key}</Text>
            </View>
            {(flag.updated_by || flag.updated_at) && (
              <Text style={styles.updatedMeta}>
                {flag.updated_by ? `by ${flag.updated_by}` : ''}
                {flag.updated_by && flag.updated_at ? ' · ' : ''}
                {flag.updated_at ? timeAgo(flag.updated_at) : ''}
              </Text>
            )}
          </View>
        </View>
        <Switch
          value={flag.enabled}
          onValueChange={v => updateFlag(flag.key, v)}
          trackColor={{ false: 'rgba(255,255,255,0.10)', true: 'rgba(201,169,110,0.45)' }}
          thumbColor={flag.enabled ? Colors.accent.gold : 'rgba(255,255,255,0.35)'}
          ios_backgroundColor="rgba(255,255,255,0.10)"
        />
      </View>
    </View>
  );
}

export default function FlagsScreen() {
  const { flags, loading, fetchFlags } = useSuperAdminStore();

  useFocusEffect(
    React.useCallback(() => { fetchFlags(); }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && !flags.length ? (
          [0, 1, 2, 3].map(i => <SkeletonCard key={i} />)
        ) : flags.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="toggle-left" size={32} color={Colors.text.muted} />
            <Text style={styles.emptyText}>No feature flags yet</Text>
          </View>
        ) : (
          flags.map(flag => <FlagCard key={flag.key} flag={flag as any} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#07070f' },
  content: { padding: 16, gap: 10, paddingBottom: 40 },

  card: {
    backgroundColor: '#0d0d1a',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
    padding:         16,
  },
  cardActive: {
    borderColor: 'rgba(201,169,110,0.30)',
  },

  flagName:  { fontSize: 14, fontWeight: '800', color: '#fff' },
  flagDesc:  { fontSize: 12, color: Colors.text.muted, lineHeight: 18 },

  onOffBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
  },
  onOffText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  keyBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
  },
  keyText:     { fontSize: 10, color: Colors.text.subtle, fontFamily: 'monospace' },
  updatedMeta: { fontSize: 10, color: Colors.text.subtle },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.text.muted },
});
