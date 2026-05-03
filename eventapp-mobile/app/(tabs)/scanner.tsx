import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, FlatList,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { useScannerStore } from '@/store/scanner.store';
import { useEventStore }   from '@/store/event.store';
import { ScanResultOverlay } from '@/components/scanner/ScanResultOverlay';
import { Colors } from '@/constants/colors';
import { ScanResult } from '@/types';

export default function ScannerTab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch,       setTorch]         = useState(false);
  const [manualInput, setManualInput]   = useState('');
  const [lastResult,  setLastResult]    = useState<ScanResult | null>(null);
  const [selectedEventId, setEventId]  = useState<string | null>(null);

  const isFocused    = useIsFocused();
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScanRef  = useRef(0);

  const { scanTicket, syncOffline, offlineQueue, stats, fetchStats, online } = useScannerStore();
  const { events, fetchEvents } = useEventStore();

  // Animated scan line
  const scanY = useSharedValue(0);
  const scanAnim = useAnimatedStyle(() => ({ transform: [{ translateY: scanY.value }] }));

  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(280, { duration: 2000, easing: Easing.linear }),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Auto-sync on reconnect
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      if (state.isConnected && offlineQueue.length > 0 && selectedEventId) {
        syncOffline(selectedEventId);
      }
    });
    return unsub;
  }, [offlineQueue.length, selectedEventId]);

  useEffect(() => {
    if (selectedEventId) fetchStats(selectedEventId);
  }, [selectedEventId]);

  const handleScan = useCallback(async (data: string) => {
    const now = Date.now();
    if (now - lastScanRef.current < 1500) return;
    lastScanRef.current = now;

    const eventId = selectedEventId ?? events[0]?.id;
    if (!eventId) {
      Toast.show({ type: 'info', text1: 'Select an event first' });
      return;
    }

    const result = await scanTicket(eventId, data.trim());
    setLastResult(result);
  }, [selectedEventId, events, scanTicket]);

  const handleManualScan = () => {
    if (!manualInput.trim()) return;
    handleScan(manualInput.trim());
    setManualInput('');
  };

  const pendingCount = offlineQueue.length;
  const eventId      = selectedEventId ?? events[0]?.id ?? '';
  const checkinPct   = stats
    ? stats.total_issued > 0 ? Math.round((stats.checked_in / stats.total_issued) * 100) : 0
    : 0;

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionWrap}>
          <Feather name="camera-off" size={48} color={Colors.text.muted} />
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permSub}>EventApp needs camera access to scan QR codes at events.</Text>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>QR Scanner</Text>
            <Text style={styles.headerSub}>Scan tickets at the door</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Online/Offline badge */}
            <View style={[
              styles.onlineBadge,
              { borderColor: online ? `${Colors.accent.emerald}40` : `${Colors.accent.red}40`,
                backgroundColor: online ? `${Colors.accent.emerald}15` : `${Colors.accent.red}15` },
            ]}>
              <View style={[styles.onlineDot, { backgroundColor: online ? Colors.accent.emerald : Colors.accent.red }]} />
              <Text style={[styles.onlineText, { color: online ? Colors.accent.emerald : Colors.accent.red }]}>
                {online ? 'Online' : 'Offline'}
              </Text>
            </View>
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

          {/* Dark overlay with cutout */}
          <View style={styles.overlayTop} />
          <View style={styles.overlayRow}>
            <View style={styles.overlaySide} />
            <View style={styles.scanBox}>
              {/* Corner brackets */}
              {(['TL','TR','BL','BR'] as const).map(pos => (
                <View key={pos} style={[styles.corner, styles[`corner${pos}`], { borderColor: Colors.accent.indigo }]} />
              ))}
              {/* Scan line */}
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

          {/* Result overlay */}
          {lastResult && (
            <ScanResultOverlay result={lastResult} onDismiss={() => setLastResult(null)} />
          )}
        </View>

        {/* Stats strip */}
        {stats && (
          <View style={styles.statsStrip}>
            <StatPill label="Issued"  value={stats.total_issued} />
            <StatPill label="Scanned" value={stats.checked_in}   accent={Colors.accent.emerald} />
            <StatPill label="Rate"    value={`${checkinPct}%`}   accent={Colors.accent.indigo}  />
          </View>
        )}

        {/* Offline sync */}
        {pendingCount > 0 && (
          <Pressable style={styles.syncBanner} onPress={() => eventId && syncOffline(eventId)}>
            <Feather name="clock" size={13} color={Colors.accent.amber} />
            <Text style={styles.syncText}>{pendingCount} pending — tap to sync</Text>
          </Pressable>
        )}

        {/* Manual input */}
        <View style={styles.manualWrap}>
          <TextInput
            style={styles.manualInput}
            placeholder="Enter QR code manually…"
            placeholderTextColor={Colors.text.subtle}
            value={manualInput}
            onChangeText={setManualInput}
            onSubmitEditing={handleManualScan}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.manualBtn} onPress={handleManualScan}>
            <Feather name="arrow-right" size={16} color="#fff" />
          </Pressable>
        </View>

        {/* Event selector */}
        {events.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventPicker}
          >
            {events.filter(e => e.allow_qr_checkin || e.allow_ticketing).map(e => (
              <Pressable
                key={e.id}
                style={[
                  styles.eventChip,
                  selectedEventId === e.id && {
                    backgroundColor: `${Colors.accent.indigo}25`,
                    borderColor:     `${Colors.accent.indigo}50`,
                  },
                ]}
                onPress={() => setEventId(e.id)}
              >
                <Text style={[
                  styles.eventChipText,
                  selectedEventId === e.id && { color: Colors.accent.indigo },
                ]} numberOfLines={1}>
                  {e.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

      </View>
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
  safe:   { flex: 1, backgroundColor: Colors.bg.primary },
  root:   { flex: 1, gap: 8 },
  center: { flex: 1, backgroundColor: Colors.bg.primary },

  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  onlineBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      99,
    borderWidth:       1,
  },
  onlineDot:  { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 11, fontWeight: '700' },

  cameraWrap: {
    height:   280,
    position: 'relative',
    backgroundColor: '#000',
  },

  overlayTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: 40, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayRow:    { position: 'absolute', top: 40, bottom: 40, left: 0, right: 0, flexDirection: 'row' },
  overlaySide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanBox:       { width: 200, position: 'relative' },

  corner: { position: 'absolute', width: 20, height: 20, borderWidth: 3 },
  cornerTL: { top: 0,    left:  0,  borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0,    right: 0,  borderLeftWidth:  0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left:  0,  borderRightWidth: 0, borderTopWidth:    0 },
  cornerBR: { bottom: 0, right: 0,  borderLeftWidth:  0, borderTopWidth:    0 },

  scanLine: { position: 'absolute', left: 4, right: 4, height: 2, opacity: 0.8 },

  torchBtn: { position: 'absolute', top: 12, right: 12, borderRadius: 99, overflow: 'hidden' },
  torchBlur: { padding: 10 },

  statsStrip: {
    flexDirection:     'row',
    gap:               8,
    paddingHorizontal: 16,
  },
  statPill: {
    flex:          1,
    alignItems:    'center',
    paddingVertical: 8,
    borderRadius:  12,
    borderWidth:   1,
    gap:           2,
  },
  statVal:   { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 9,  fontWeight: '700', color: Colors.text.subtle, letterSpacing: 0.5 },

  syncBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    marginHorizontal:  16,
    backgroundColor:   `${Colors.accent.amber}15`,
    borderWidth:       1,
    borderColor:       `${Colors.accent.amber}35`,
    borderRadius:      12,
    paddingHorizontal: 12,
    paddingVertical:   8,
  },
  syncText: { fontSize: 12, fontWeight: '700', color: Colors.accent.amber },

  manualWrap: {
    flexDirection:     'row',
    gap:               8,
    paddingHorizontal: 16,
  },
  manualInput: {
    flex:              1,
    backgroundColor:   Colors.bg.input,
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       Colors.border.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical:   10,
    color:             '#fff',
    fontSize:          13,
  },
  manualBtn: {
    width:           44,
    height:          44,
    borderRadius:    12,
    backgroundColor: Colors.accent.indigo,
    alignItems:      'center',
    justifyContent:  'center',
  },

  eventPicker: {
    paddingHorizontal: 16,
    gap:               8,
    paddingBottom:     8,
  },
  eventChip: {
    paddingHorizontal: 12,
    paddingVertical:   7,
    borderRadius:      99,
    borderWidth:       1,
    borderColor:       Colors.border.DEFAULT,
    backgroundColor:   Colors.bg.elevated,
    maxWidth:          160,
  },
  eventChipText: { fontSize: 12, fontWeight: '600', color: Colors.text.muted },

  // Permission screen
  permissionWrap: {
    flex: 1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        32,
    gap:            12,
  },
  permTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  permSub:   { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
  permBtn: {
    marginTop:         8,
    backgroundColor:   Colors.accent.indigo,
    borderRadius:      14,
    paddingHorizontal: 24,
    paddingVertical:   12,
  },
  permBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
