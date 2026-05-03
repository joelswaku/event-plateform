import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import { useScannerStore } from '@/store/scanner.store';
import { useOfflineSync }  from '@/hooks/useOfflineSync';
import { ScanResultOverlay } from '@/components/scanner/ScanResultOverlay';
import { ScanFeed }          from '@/components/scanner/ScanFeed';
import { Colors }            from '@/constants/colors';
import { ScanResult }        from '@/types';

export default function EventScannerScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router          = useRouter();
  const isFocused       = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch,       setTorch]    = useState(false);
  const [lastResult,  setResult]   = useState<ScanResult | null>(null);
  const lastScanRef  = useRef(0);

  const { scanTicket, syncOffline, offlineQueue, feed, stats, fetchStats, online } = useScannerStore();

  useOfflineSync(eventId ?? null);

  const scanY  = useSharedValue(0);
  const scanAnim = useAnimatedStyle(() => ({ transform: [{ translateY: scanY.value }] }));

  useEffect(() => {
    scanY.value = withRepeat(withTiming(220, { duration: 1800, easing: Easing.linear }), -1, true);
  }, []);

  useEffect(() => {
    if (eventId) fetchStats(eventId);
  }, [eventId]);

  const handleScan = useCallback(async (data: string) => {
    const now = Date.now();
    if (now - lastScanRef.current < 1500 || !eventId) return;
    lastScanRef.current = now;
    const result = await scanTicket(eventId, data.trim());
    setResult(result);
  }, [eventId, scanTicket]);

  const pending = offlineQueue.filter(s => s.eventId === eventId).length;
  const pct     = stats && stats.total_issued > 0
    ? Math.round((stats.checked_in / stats.total_issued) * 100) : 0;

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permWrap}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </Pressable>
          <Feather name="camera-off" size={44} color={Colors.text.muted} />
          <Text style={styles.permTitle}>Camera access required</Text>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Scanner</Text>
            <Text style={styles.sub}>Dedicated event check-in</Text>
          </View>
          <View style={[styles.onlineBadge, {
            backgroundColor: online ? `${Colors.accent.emerald}15` : `${Colors.accent.red}15`,
            borderColor:     online ? `${Colors.accent.emerald}40` : `${Colors.accent.red}40`,
          }]}>
            <View style={[styles.onlineDot, { backgroundColor: online ? Colors.accent.emerald : Colors.accent.red }]} />
            <Text style={[styles.onlineText, { color: online ? Colors.accent.emerald : Colors.accent.red }]}>
              {online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Camera */}
        <View style={styles.cameraWrap}>
          {isFocused && (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => handleScan(data)}
            />
          )}
          <View style={styles.overlayTop} />
          <View style={styles.overlayRow}>
            <View style={styles.overlaySide} />
            <View style={styles.scanBox}>
              {(['TL','TR','BL','BR'] as const).map(p => (
                <View key={p} style={[styles.corner, styles[`corner${p}`], { borderColor: Colors.accent.indigo }]} />
              ))}
              <Animated.View style={[styles.scanLine, scanAnim, { backgroundColor: Colors.accent.indigo }]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom} />

          {/* Torch */}
          <Pressable style={styles.torchBtn} onPress={() => setTorch(t => !t)}>
            <BlurView intensity={40} tint="dark" style={styles.torchBlur}>
              <Feather name={torch ? 'zap-off' : 'zap'} size={18} color={torch ? Colors.accent.amber : '#fff'} />
            </BlurView>
          </Pressable>

          {lastResult && (
            <ScanResultOverlay result={lastResult} onDismiss={() => setResult(null)} />
          )}
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <StatPill label="Issued"  value={stats.total_issued} />
            <StatPill label="Checked" value={stats.checked_in}   accent={Colors.accent.emerald} />
            <StatPill label="Rate"    value={`${pct}%`}          accent={Colors.accent.indigo} />
          </View>
        )}

        {/* Pending sync */}
        {pending > 0 && (
          <Pressable style={styles.syncBanner} onPress={() => eventId && syncOffline(eventId)}>
            <Feather name="clock" size={13} color={Colors.accent.amber} />
            <Text style={styles.syncText}>{pending} scan{pending !== 1 ? 's' : ''} queued — tap to sync</Text>
          </Pressable>
        )}

        {/* Feed */}
        {feed.length > 0 && (
          <View style={styles.feedWrap}>
            <ScanFeed items={feed} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({ label, value, accent = Colors.text.muted }: { label: string; value: string | number; accent?: string }) {
  return (
    <View style={[styles.statPill, { borderColor: `${accent}30`, backgroundColor: `${accent}10` }]}>
      <Text style={[styles.statVal, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg.primary },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  back:      { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg.elevated, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 18, fontWeight: '900', color: '#fff' },
  sub:       { fontSize: 11, color: Colors.text.muted },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  onlineDot:   { width: 6, height: 6, borderRadius: 3 },
  onlineText:  { fontSize: 10, fontWeight: '700' },

  cameraWrap:   { height: 260, backgroundColor: '#000', position: 'relative' },
  overlayTop:   { position: 'absolute', top: 0, left: 0, right: 0, height: 30, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayRow:   { position: 'absolute', top: 30, bottom: 30, left: 0, right: 0, flexDirection: 'row' },
  overlaySide:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanBox:      { width: 200, position: 'relative' },
  corner:       { position: 'absolute', width: 20, height: 20, borderWidth: 3 },
  cornerTL:     { top: 0,    left: 0,   borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR:     { top: 0,    right: 0,  borderLeftWidth: 0,  borderBottomWidth: 0 },
  cornerBL:     { bottom: 0, left: 0,   borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR:     { bottom: 0, right: 0,  borderLeftWidth: 0,  borderTopWidth: 0 },
  scanLine:     { position: 'absolute', left: 4, right: 4, height: 2, opacity: 0.8 },
  torchBtn:     { position: 'absolute', top: 10, right: 10, borderRadius: 99, overflow: 'hidden' },
  torchBlur:    { padding: 10 },

  statsRow:  { flexDirection: 'row', gap: 8, padding: 12 },
  statPill:  { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 2 },
  statVal:   { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, fontWeight: '700', color: Colors.text.subtle, letterSpacing: 0.5 },

  syncBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 12, backgroundColor: `${Colors.accent.amber}15`, borderWidth: 1, borderColor: `${Colors.accent.amber}35`, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  syncText:   { fontSize: 12, fontWeight: '700', color: Colors.accent.amber },

  feedWrap:  { paddingHorizontal: 16, paddingBottom: 40 },

  permWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  permTitle:  { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  permBtn:    { backgroundColor: Colors.accent.indigo, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText:{ color: '#fff', fontWeight: '800', fontSize: 15 },
});
