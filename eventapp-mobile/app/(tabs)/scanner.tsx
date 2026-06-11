






/**
 * eventapp-mobile/app/(tabs)/scanner.tsx
 * 
 * UPDATED — adds event picker so users with multiple events
 * can choose which event the camera scans tickets for.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Modal, FlatList, ActivityIndicator, Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { notify } from '@/lib/toast';
import { useScannerStore } from '@/store/scanner.store';
import { useEventStore }   from '@/store/event.store';
import { ScanResultOverlay } from '@/components/scanner/ScanResultOverlay';
import { Colors } from '@/constants/colors';
import { ScanResult, Event } from '@/types';

/* ─── Fallback images ──────────────────────────────────────────────── */
const TYPE_IMG: Record<string, string> = {
  wedding:         'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=60',
  conference:      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=60',
  birthday:        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=60',
  concert:         'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=60',
  festival:        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&q=60',
  corporate_event: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=60',
  networking:      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&q=60',
  charity:         'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&q=60',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=60';

/* Camera viewport height — ~48% of screen, capped so it never overwhelms */
const { height: SH } = Dimensions.get('window');
const CAMERA_H   = Math.min(Math.round(SH * 0.48), 390);
const SCAN_TRAVEL = CAMERA_H - 120 - 10; // scan box minus top/bottom overlay minus margin

function coverImg(ev: Event): string {
  if (ev.cover_image_url) return ev.cover_image_url;
  const k = ev.event_type?.toLowerCase() ?? '';
  return TYPE_IMG[k] ?? DEFAULT_IMG;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return '—'; }
}

/* ─── Event Picker Modal ───────────────────────────────────────────── */
function EventPickerModal({
  visible,
  events,
  activeId,
  onSelect,
  onClose,
}: {
  visible:  boolean;
  events:   Event[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose:  () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={p.overlay} onPress={onClose}>
        <Pressable style={p.sheet} onPress={e => e.stopPropagation()}>
          {/* Handle */}
          <View style={p.handle} />

          <Text style={p.title}>Select Event to Scan</Text>
          <Text style={p.sub}>
            Tickets scanned by camera will check guests in for the selected event.
          </Text>

          <FlatList
            data={events}
            keyExtractor={e => e.id}
            contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isActive = item.id === activeId;
              const cfg = Colors.status[item.status as keyof typeof Colors.status] ?? Colors.status.DRAFT;
              return (
                <Pressable
                  style={[p.eventRow, isActive && p.eventRowActive]}
                  onPress={() => { onSelect(item.id); onClose(); }}
                >
                  {/* Thumb */}
                  <View style={p.thumb}>
                    <Image
                      source={coverImg(item)}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    {isActive && (
                      <LinearGradient
                        colors={[`${Colors.accent.indigo}80`, `${Colors.accent.indigo}40`]}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                  </View>

                  {/* Info */}
                  <View style={p.eventInfo}>
                    <Text style={p.eventTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={p.eventMeta}>
                      <Feather name="calendar" size={10} color={Colors.text.subtle} />
                      <Text style={p.eventDate}>{fmtDate(item.starts_at_utc ?? item.starts_at)}</Text>
                    </View>
                    <View style={[p.statusPill, { backgroundColor: cfg.bg }]}>
                      <View style={[p.statusDot, { backgroundColor: cfg.dot }]} />
                      <Text style={[p.statusTxt, { color: cfg.text }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Active check */}
                  <View style={[p.check, isActive && p.checkActive]}>
                    {isActive && <Feather name="check" size={14} color="#fff" />}
                  </View>
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ─── Main Scanner Tab ─────────────────────────────────────────────── */
export default function ScannerTab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch,        setTorch]        = useState(false);
  const [manualInput,  setManualInput]  = useState('');
  const [lastResult,   setLastResult]   = useState<ScanResult | null>(null);
  const [pickerOpen,   setPickerOpen]   = useState(false);

  const isFocused   = useIsFocused();
  const lastScanRef = useRef(0);

  const { scanTicket, syncOffline, offlineQueue, stats, fetchStats, online } = useScannerStore();
  const { events, fetchEvents, activeEventId, setActiveEvent } = useEventStore();

  // Resolve the event to scan for
  const eventId     = activeEventId ?? events[0]?.id ?? '';
  const activeEvent = events.find(e => e.id === eventId) ?? null;
  const cfg         = activeEvent
    ? (Colors.status[activeEvent.status as keyof typeof Colors.status] ?? Colors.status.DRAFT)
    : null;

  // Scan line animation
  const scanY    = useSharedValue(0);
  const scanAnim = useAnimatedStyle(() => ({ transform: [{ translateY: scanY.value }] }));

  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(SCAN_TRAVEL, { duration: 2000, easing: Easing.linear }),
      -1, true,
    );
  }, []);

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      if (state.isConnected && offlineQueue.length > 0 && eventId) {
        syncOffline(eventId);
      }
    });
    return unsub;
  }, [offlineQueue.length, eventId]);

  useEffect(() => {
    if (eventId) fetchStats(eventId);
  }, [eventId]);

  const handleScan = useCallback(async (data: string) => {
    const now = Date.now();
    if (now - lastScanRef.current < 1500) return;
    lastScanRef.current = now;

    if (!eventId) {
      notify.noEventSelected();
      return;
    }

    const result = await scanTicket(eventId, data.trim());
    setLastResult(result);
    if (result.type === 'SUCCESS') {
      notify.checkinSuccess(result.holder_name ?? result.ticket_type_name);
    } else if (result.type === 'DUPLICATE') {
      notify.checkinDuplicate(result.holder_name ?? undefined);
    }
  }, [eventId, scanTicket]);

  const handleManualScan = () => {
    if (!manualInput.trim()) return;
    handleScan(manualInput.trim());
    setManualInput('');
  };

  const handleSelectEvent = (id: string) => {
    setActiveEvent(id);
    const ev = events.find(e => e.id === id);
    notify.eventSelected(ev?.title);
  };

  const pendingCount = offlineQueue.length;
  const checkinPct   = stats && stats.total_issued > 0
    ? Math.round((stats.checked_in / stats.total_issued) * 100)
    : 0;

  /* ── Permission gates ────────────────────────────────────────────── */
  if (!permission) {
    return <View style={s.center}><ActivityIndicator color={Colors.accent.indigo} /></View>;
  }
  if (!permission.granted) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Feather name="camera-off" size={40} color={Colors.text.subtle} />
          <Text style={s.permTitle}>Camera access needed</Text>
          <Text style={s.permSub}>Required to scan QR codes on tickets</Text>
          <Pressable style={s.permBtn} onPress={requestPermission}>
            <LinearGradient colors={[Colors.accent.indigo, Colors.accent.violet]} style={StyleSheet.absoluteFill} />
            <Text style={s.permBtnTxt}>Grant Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Event selector banner ──────────────────────────────────── */}
      <Pressable style={s.eventSelector} onPress={() => setPickerOpen(true)}>
        {activeEvent ? (
          <>
            {/* Thumb */}
            <View style={s.selectorThumb}>
              <Image source={coverImg(activeEvent)} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />
            </View>

            <View style={s.selectorInfo}>
              {/* "Scanning for" label */}
              <Text style={s.scanningFor}>SCANNING FOR</Text>
              <Text style={s.selectorTitle} numberOfLines={1}>{activeEvent.title}</Text>
              {cfg && (
                <View style={[s.selectorPill, { backgroundColor: cfg.bg }]}>
                  <View style={[s.selectorDot, { backgroundColor: cfg.dot }]} />
                  <Text style={[s.selectorStatus, { color: cfg.text }]}>
                    {activeEvent.status.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats inline */}
            {stats && (
              <View style={s.selectorStats}>
                <Text style={s.selectorStatNum}>{stats.checked_in}</Text>
                <Text style={s.selectorStatLabel}>/ {stats.total_issued}</Text>
                <Text style={s.selectorStatPct}>{checkinPct}%</Text>
              </View>
            )}

            {/* Change button */}
            <View style={s.changeBtn}>
              <Feather name="chevron-down" size={14} color={Colors.text.muted} />
              {events.length > 1 && (
                <View style={s.changeBadge}>
                  <Text style={s.changeBadgeTxt}>{events.length}</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          /* No event yet */
          <View style={s.noEventRow}>
            <View style={s.noEventIcon}>
              <Feather name="calendar" size={18} color={Colors.accent.indigo} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.noEventTitle}>No event selected</Text>
              <Text style={s.noEventSub}>Tap to choose which event to scan</Text>
            </View>
            <Feather name="chevron-down" size={16} color={Colors.text.muted} />
          </View>
        )}
      </Pressable>

      {/* ── Offline sync bar ───────────────────────────────────────── */}
      {pendingCount > 0 && (
        <Pressable
          style={s.offlineBar}
          onPress={() => eventId && syncOffline(eventId)}
        >
          <Feather name="wifi-off" size={13} color={Colors.accent.amber} />
          <Text style={s.offlineTxt}>
            {pendingCount} scan{pendingCount !== 1 ? 's' : ''} queued — tap to sync
          </Text>
        </Pressable>
      )}

      {/* ── Camera viewport ────────────────────────────────────────── */}
      <View style={s.cameraWrap}>
        {isFocused && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            onBarcodeScanned={({ data }) => handleScan(data)}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        )}

        {/* Dark edges */}
        <View style={s.overlayTop} />
        <View style={s.overlayBottom} />
        <View style={s.overlayRow}>
          <View style={s.overlaySide} />
          <View style={s.scanBox}>
            {/* Corner markers */}
            {([['TL','top','left'],['TR','top','right'],['BL','bottom','left'],['BR','bottom','right']] as const).map(([k,v,h]) => (
              <View key={k} style={[s.corner, { [v]: 0, [h]: 0, borderTopWidth: v==='top'?3:0, borderBottomWidth: v==='bottom'?3:0, borderLeftWidth: h==='left'?3:0, borderRightWidth: h==='right'?3:0, borderColor: Colors.accent.indigo }]} />
            ))}
            {/* Scan line */}
            <Animated.View style={[s.scanLine, scanAnim, { backgroundColor: Colors.accent.indigo }]} />
          </View>
          <View style={s.overlaySide} />
        </View>

        {/* Torch toggle */}
        <Pressable style={s.torchBtn} onPress={() => setTorch(t => !t)}>
          <BlurView intensity={40} tint="dark" style={s.torchBlur}>
            <Feather name={torch ? 'zap-off' : 'zap'} size={18} color={torch ? Colors.accent.amber : '#fff'} />
          </BlurView>
        </Pressable>

        {/* Hint text */}
        <View style={s.hintWrap}>
          <Text style={s.hintTxt}>
            {activeEvent ? `Scanning for "${activeEvent.title}"` : 'Select an event above to start scanning'}
          </Text>
        </View>

        {/* Scan result overlay */}
        {lastResult && (
          <ScanResultOverlay result={lastResult} onDismiss={() => setLastResult(null)} />
        )}
      </View>

      {/* ── Manual input ───────────────────────────────────────────── */}
      <View style={s.manualWrap}>
        <View style={s.manualRow}>
          <Feather name="hash" size={15} color={Colors.text.subtle} />
          <TextInput
            style={s.manualInput}
            placeholder="Enter ticket code manually…"
            placeholderTextColor={Colors.text.subtle}
            value={manualInput}
            onChangeText={setManualInput}
            onSubmitEditing={handleManualScan}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {manualInput.length > 0 && (
            <Pressable
              style={s.manualSubmit}
              onPress={handleManualScan}
            >
              <LinearGradient
                colors={[Colors.accent.indigo, Colors.accent.violet]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <Text style={s.manualSubmitTxt}>Check In</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Event picker modal ─────────────────────────────────────── */}
      <EventPickerModal
        visible={pickerOpen}
        events={events}
        activeId={eventId || null}
        onSelect={handleSelectEvent}
        onClose={() => setPickerOpen(false)}
      />

    </SafeAreaView>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary, gap: 12 },

  /* Event selector banner */
  eventSelector: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: 16,
    paddingVertical:   12,
    backgroundColor:   Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  selectorThumb: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    overflow: 'hidden',
  },
  selectorInfo:   { flex: 1, gap: 3 },
  scanningFor:    { fontSize: 9, fontWeight: '800', color: Colors.accent.indigo, letterSpacing: 1.2, textTransform: 'uppercase' },
  selectorTitle:  { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  selectorPill:   { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  selectorDot:    { width: 5, height: 5, borderRadius: 3 },
  selectorStatus: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  selectorStats:    { alignItems: 'flex-end', gap: 1 },
  selectorStatNum:  { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  selectorStatLabel:{ fontSize: 10, color: Colors.text.subtle, fontWeight: '600' },
  selectorStatPct:  { fontSize: 11, fontWeight: '800', color: Colors.accent.emerald },

  changeBtn:      { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT, alignItems: 'center', justifyContent: 'center' },
  changeBadge:    { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.accent.indigo, alignItems: 'center', justifyContent: 'center' },
  changeBadgeTxt: { fontSize: 9, fontWeight: '900', color: '#fff' },

  noEventRow:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  noEventIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.accent.indigo}15`, borderWidth: 1, borderColor: `${Colors.accent.indigo}30`, alignItems: 'center', justifyContent: 'center' },
  noEventTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  noEventSub:   { fontSize: 12, color: Colors.text.subtle, marginTop: 2 },

  /* Offline bar */
  offlineBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: `${Colors.accent.amber}12`, borderBottomWidth: 1, borderBottomColor: `${Colors.accent.amber}25` },
  offlineTxt: { fontSize: 12, fontWeight: '700', color: Colors.accent.amber, flex: 1 },

  /* Camera */
  cameraWrap:    { height: CAMERA_H, position: 'relative', backgroundColor: '#000' },
  overlayTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1 },
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1 },
  overlayRow:    { position: 'absolute', top: 60, bottom: 60, left: 0, right: 0, flexDirection: 'row', zIndex: 1 },
  overlaySide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  scanBox:       { width: 220, position: 'relative' },
  corner:        { position: 'absolute', width: 22, height: 22 },
  scanLine:      { position: 'absolute', left: 4, right: 4, height: 2, opacity: 0.85 },
  torchBtn:      { position: 'absolute', top: 14, right: 14, borderRadius: 99, overflow: 'hidden', zIndex: 2 },
  torchBlur:     { padding: 12 },
  hintWrap:      { position: 'absolute', bottom: 8, left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  hintTxt:       { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },

  /* Manual input */
  manualWrap: { backgroundColor: Colors.bg.card, borderTopWidth: 1, borderTopColor: Colors.border.DEFAULT, padding: 12 },
  manualRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bg.elevated, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.DEFAULT, paddingHorizontal: 14, height: 48 },
  manualInput:{ flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },
  manualSubmit:{ height: 34, paddingHorizontal: 14, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  manualSubmitTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },

  /* Permission */
  permTitle:  { fontSize: 18, fontWeight: '900', color: '#fff', marginTop: 12 },
  permSub:    { fontSize: 13, color: Colors.text.muted, textAlign: 'center', maxWidth: 260 },
  permBtn:    { marginTop: 8, height: 48, paddingHorizontal: 28, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  permBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

/* ─── Picker Modal Styles ──────────────────────────────────────────── */
const p = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.bg.sheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '75%', borderWidth: 1, borderColor: Colors.border.DEFAULT, borderBottomWidth: 0 },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.DEFAULT, alignSelf: 'center', marginBottom: 16 },
  title:   { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.3, marginBottom: 4 },
  sub:     { fontSize: 13, color: Colors.text.muted, lineHeight: 18, marginBottom: 20 },

  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bg.elevated,
    borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
  },
  eventRowActive: {
    borderColor: `${Colors.accent.indigo}60`,
    backgroundColor: `${Colors.accent.indigo}08`,
  },
  thumb:      { width: 56, height: 56, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.bg.card },
  eventInfo:  { flex: 1, gap: 4 },
  eventTitle: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  eventMeta:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventDate:  { fontSize: 11, color: Colors.text.subtle, fontWeight: '600' },
  statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  statusDot:  { width: 5, height: 5, borderRadius: 3 },
  statusTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  check:      { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.border.DEFAULT, alignItems: 'center', justifyContent: 'center' },
  checkActive:{ backgroundColor: Colors.accent.indigo, borderColor: Colors.accent.indigo },
});






// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import {
//   View, Text, TextInput, Pressable, StyleSheet,
// } from 'react-native';
// import { CameraView, useCameraPermissions } from 'expo-camera';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';
// import { Feather } from '@expo/vector-icons';
// import Animated, {
//   useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
// } from 'react-native-reanimated';
// import { useIsFocused } from '@react-navigation/native';
// import NetInfo from '@react-native-community/netinfo';
// import Toast from 'react-native-toast-message';
// import { useScannerStore } from '@/store/scanner.store';
// import { useEventStore }   from '@/store/event.store';
// import { ScanResultOverlay } from '@/components/scanner/ScanResultOverlay';
// import { Colors } from '@/constants/colors';
// import { ScanResult } from '@/types';

// export default function ScannerTab() {
//   const [permission, requestPermission] = useCameraPermissions();
//   const [torch,       setTorch]      = useState(false);
//   const [manualInput, setManualInput]= useState('');
//   const [lastResult,  setLastResult] = useState<ScanResult | null>(null);

//   const isFocused   = useIsFocused();
//   const lastScanRef = useRef(0);

//   const { scanTicket, syncOffline, offlineQueue, stats, fetchStats, online } = useScannerStore();
//   const { events, fetchEvents, activeEventId } = useEventStore();

//   const eventId      = activeEventId ?? events[0]?.id ?? '';
//   const activeEvent  = events.find(e => e.id === eventId) ?? null;

//   // Animated scan line
//   const scanY = useSharedValue(0);
//   const scanAnim = useAnimatedStyle(() => ({ transform: [{ translateY: scanY.value }] }));

//   useEffect(() => {
//     scanY.value = withRepeat(
//       withTiming(280, { duration: 2000, easing: Easing.linear }),
//       -1,
//       true,
//     );
//   }, []);

//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   // Auto-sync on reconnect
//   useEffect(() => {
//     const unsub = NetInfo.addEventListener(state => {
//       if (state.isConnected && offlineQueue.length > 0 && eventId) {
//         syncOffline(eventId);
//       }
//     });
//     return unsub;
//   }, [offlineQueue.length, eventId]);

//   useEffect(() => {
//     if (eventId) fetchStats(eventId);
//   }, [eventId]);

//   const handleScan = useCallback(async (data: string) => {
//     const now = Date.now();
//     if (now - lastScanRef.current < 1500) return;
//     lastScanRef.current = now;

//     if (!eventId) {
//       Toast.show({ type: 'info', text1: 'No active event', text2: 'Set an active event from the Events tab' });
//       return;
//     }

//     const result = await scanTicket(eventId, data.trim());
//     setLastResult(result);
//   }, [eventId, scanTicket]);

//   const handleManualScan = () => {
//     if (!manualInput.trim()) return;
//     handleScan(manualInput.trim());
//     setManualInput('');
//   };

//   const pendingCount = offlineQueue.length;
//   const checkinPct   = stats
//     ? stats.total_issued > 0 ? Math.round((stats.checked_in / stats.total_issued) * 100) : 0
//     : 0;

//   if (!permission) return <View style={styles.center} />;

//   if (!permission.granted) {
//     return (
//       <SafeAreaView style={styles.safe}>
//         <View style={styles.permissionWrap}>
//           <Feather name="camera-off" size={48} color={Colors.text.muted} />
//           <Text style={styles.permTitle}>Camera Access Required</Text>
//           <Text style={styles.permSub}>EventApp needs camera access to scan QR codes at events.</Text>
//           <Pressable style={styles.permBtn} onPress={requestPermission}>
//             <Text style={styles.permBtnText}>Grant Permission</Text>
//           </Pressable>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safe} edges={['top']}>
//       <View style={styles.root}>

//         {/* Header */}
//         <View style={styles.header}>
//           <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
//             <Text style={styles.headerTitle}>QR Scanner</Text>
//             {activeEvent ? (
//               <View style={styles.activeEventChip}>
//                 <View style={[styles.activeEventDot, { backgroundColor: Colors.accent.emerald }]} />
//                 <Text style={styles.activeEventName} numberOfLines={1}>{activeEvent.title}</Text>
//               </View>
//             ) : (
//               <View style={styles.noEventChip}>
//                 <Feather name="alert-circle" size={10} color={Colors.accent.red} />
//                 <Text style={styles.noEventText}>No active event — set one in Events tab</Text>
//               </View>
//             )}
//           </View>
//           <View style={styles.headerRight}>
//             {/* Online/Offline badge */}
//             <View style={[
//               styles.onlineBadge,
//               { borderColor: online ? `${Colors.accent.emerald}40` : `${Colors.accent.red}40`,
//                 backgroundColor: online ? `${Colors.accent.emerald}15` : `${Colors.accent.red}15` },
//             ]}>
//               <View style={[styles.onlineDot, { backgroundColor: online ? Colors.accent.emerald : Colors.accent.red }]} />
//               <Text style={[styles.onlineText, { color: online ? Colors.accent.emerald : Colors.accent.red }]}>
//                 {online ? 'Online' : 'Offline'}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Camera */}
//         <View style={styles.cameraWrap}>
//           {isFocused && (
//             <CameraView
//               style={StyleSheet.absoluteFill}
//               facing="back"
//               enableTorch={torch}
//               barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
//               onBarcodeScanned={({ data }) => handleScan(data)}
//             />
//           )}

//           {/* Dark overlay with cutout */}
//           <View style={styles.overlayTop} />
//           <View style={styles.overlayRow}>
//             <View style={styles.overlaySide} />
//             <View style={styles.scanBox}>
//               {/* Corner brackets */}
//               {(['TL','TR','BL','BR'] as const).map(pos => (
//                 <View key={pos} style={[styles.corner, styles[`corner${pos}`], { borderColor: Colors.accent.indigo }]} />
//               ))}
//               {/* Scan line */}
//               <Animated.View style={[styles.scanLine, scanAnim, { backgroundColor: Colors.accent.indigo }]} />
//             </View>
//             <View style={styles.overlaySide} />
//           </View>
//           <View style={styles.overlayBottom} />

//           {/* Torch */}
//           <Pressable style={styles.torchBtn} onPress={() => setTorch(t => !t)}>
//             <BlurView intensity={40} tint="dark" style={styles.torchBlur}>
//               <Feather name={torch ? 'zap-off' : 'zap'} size={18} color={torch ? Colors.accent.amber : '#fff'} />
//             </BlurView>
//           </Pressable>

//           {/* Result overlay */}
//           {lastResult && (
//             <ScanResultOverlay result={lastResult} onDismiss={() => setLastResult(null)} />
//           )}
//         </View>

//         {/* Stats strip */}
//         {stats && (
//           <View style={styles.statsStrip}>
//             <StatPill label="Issued"  value={stats.total_issued} />
//             <StatPill label="Scanned" value={stats.checked_in}   accent={Colors.accent.emerald} />
//             <StatPill label="Rate"    value={`${checkinPct}%`}   accent={Colors.accent.indigo}  />
//           </View>
//         )}

//         {/* Offline sync */}
//         {pendingCount > 0 && (
//           <Pressable style={styles.syncBanner} onPress={() => eventId && syncOffline(eventId)}>
//             <Feather name="clock" size={13} color={Colors.accent.amber} />
//             <Text style={styles.syncText}>{pendingCount} pending — tap to sync</Text>
//           </Pressable>
//         )}

//         {/* Manual input */}
//         <View style={styles.manualWrap}>
//           <TextInput
//             style={styles.manualInput}
//             placeholder="Enter QR code manually…"
//             placeholderTextColor={Colors.text.subtle}
//             value={manualInput}
//             onChangeText={setManualInput}
//             onSubmitEditing={handleManualScan}
//             returnKeyType="done"
//             autoCapitalize="none"
//             autoCorrect={false}
//           />
//           <Pressable style={styles.manualBtn} onPress={handleManualScan}>
//             <Feather name="arrow-right" size={16} color="#fff" />
//           </Pressable>
//         </View>

//       </View>
//     </SafeAreaView>
//   );
// }

// function StatPill({ label, value, accent = Colors.text.muted }: { label: string; value: string | number; accent?: string }) {
//   return (
//     <View style={[styles.statPill, { borderColor: `${accent}30`, backgroundColor: `${accent}10` }]}>
//       <Text style={[styles.statVal, { color: accent }]}>{value}</Text>
//       <Text style={styles.statLabel}>{label}</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   safe:   { flex: 1, backgroundColor: Colors.bg.primary },
//   root:   { flex: 1, gap: 8 },
//   center: { flex: 1, backgroundColor: Colors.bg.primary },

//   header: {
//     flexDirection:   'row',
//     alignItems:      'center',
//     justifyContent:  'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
//   headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },

//   activeEventChip: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     gap:               5,
//     alignSelf:         'flex-start',
//     paddingHorizontal: 9,
//     paddingVertical:   4,
//     borderRadius:      99,
//     backgroundColor:   `${Colors.accent.emerald}12`,
//     borderWidth:       1,
//     borderColor:       `${Colors.accent.emerald}30`,
//   },
//   activeEventDot: { width: 5, height: 5, borderRadius: 3 },
//   activeEventName: {
//     fontSize:   11,
//     fontWeight: '700',
//     color:      Colors.accent.emerald,
//     flexShrink: 1,
//   },

//   noEventChip: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     gap:               5,
//     alignSelf:         'flex-start',
//     paddingHorizontal: 9,
//     paddingVertical:   4,
//     borderRadius:      99,
//     backgroundColor:   `${Colors.accent.red}12`,
//     borderWidth:       1,
//     borderColor:       `${Colors.accent.red}30`,
//   },
//   noEventText: {
//     fontSize:   11,
//     fontWeight: '700',
//     color:      Colors.accent.red,
//     flexShrink: 1,
//   },

//   onlineBadge: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     gap:               5,
//     paddingHorizontal: 10,
//     paddingVertical:   5,
//     borderRadius:      99,
//     borderWidth:       1,
//   },
//   onlineDot:  { width: 6, height: 6, borderRadius: 3 },
//   onlineText: { fontSize: 11, fontWeight: '700' },

//   cameraWrap: {
//     height:   280,
//     position: 'relative',
//     backgroundColor: '#000',
//   },

//   overlayTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: 40, backgroundColor: 'rgba(0,0,0,0.6)' },
//   overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: 'rgba(0,0,0,0.6)' },
//   overlayRow:    { position: 'absolute', top: 40, bottom: 40, left: 0, right: 0, flexDirection: 'row' },
//   overlaySide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
//   scanBox:       { width: 200, position: 'relative' },

//   corner: { position: 'absolute', width: 20, height: 20, borderWidth: 3 },
//   cornerTL: { top: 0,    left:  0,  borderRightWidth: 0, borderBottomWidth: 0 },
//   cornerTR: { top: 0,    right: 0,  borderLeftWidth:  0, borderBottomWidth: 0 },
//   cornerBL: { bottom: 0, left:  0,  borderRightWidth: 0, borderTopWidth:    0 },
//   cornerBR: { bottom: 0, right: 0,  borderLeftWidth:  0, borderTopWidth:    0 },

//   scanLine: { position: 'absolute', left: 4, right: 4, height: 2, opacity: 0.8 },

//   torchBtn: { position: 'absolute', top: 12, right: 12, borderRadius: 99, overflow: 'hidden' },
//   torchBlur: { padding: 10 },

//   statsStrip: {
//     flexDirection:     'row',
//     gap:               8,
//     paddingHorizontal: 16,
//   },
//   statPill: {
//     flex:          1,
//     alignItems:    'center',
//     paddingVertical: 8,
//     borderRadius:  12,
//     borderWidth:   1,
//     gap:           2,
//   },
//   statVal:   { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
//   statLabel: { fontSize: 9,  fontWeight: '700', color: Colors.text.subtle, letterSpacing: 0.5 },

//   syncBanner: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     gap:               6,
//     marginHorizontal:  16,
//     backgroundColor:   `${Colors.accent.amber}15`,
//     borderWidth:       1,
//     borderColor:       `${Colors.accent.amber}35`,
//     borderRadius:      12,
//     paddingHorizontal: 12,
//     paddingVertical:   8,
//   },
//   syncText: { fontSize: 12, fontWeight: '700', color: Colors.accent.amber },

//   manualWrap: {
//     flexDirection:     'row',
//     gap:               8,
//     paddingHorizontal: 16,
//   },
//   manualInput: {
//     flex:              1,
//     backgroundColor:   Colors.bg.input,
//     borderRadius:      12,
//     borderWidth:       1,
//     borderColor:       Colors.border.DEFAULT,
//     paddingHorizontal: 14,
//     paddingVertical:   10,
//     color:             '#fff',
//     fontSize:          13,
//   },
//   manualBtn: {
//     width:           44,
//     height:          44,
//     borderRadius:    12,
//     backgroundColor: Colors.accent.indigo,
//     alignItems:      'center',
//     justifyContent:  'center',
//   },

//   // Permission screen
//   permissionWrap: {
//     flex: 1,
//     alignItems:     'center',
//     justifyContent: 'center',
//     padding:        32,
//     gap:            12,
//   },
//   permTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
//   permSub:   { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
//   permBtn: {
//     marginTop:         8,
//     backgroundColor:   Colors.accent.indigo,
//     borderRadius:      14,
//     paddingHorizontal: 24,
//     paddingVertical:   12,
//   },
//   permBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
// });
