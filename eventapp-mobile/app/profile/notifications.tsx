import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import {
  scheduleTestNotification,
  cancelTestNotification,
  requestPushPermission,
} from '@/lib/push-notifications';

interface ToggleRowProps {
  label:       string;
  description: string;
  value:       boolean;
  onChange:    (v: boolean) => void;
  disabled?:   boolean;
}

function ToggleRow({ label, description, value, onChange, disabled = false }: ToggleRowProps) {
  return (
    <View style={[rowStyles.row, disabled && rowStyles.rowDisabled]}>
      <View style={rowStyles.text}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.desc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: Colors.border.DEFAULT, true: `${Colors.accent.indigo}80` }}
        thumbColor={value ? Colors.accent.indigo : Colors.text.subtle}
        ios_backgroundColor={Colors.border.DEFAULT}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 14,
    gap:            12,
  },
  rowDisabled: { opacity: 0.5 },
  text: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: '600', color: '#fff' },
  desc:  { fontSize: 12, color: Colors.text.muted, lineHeight: 17 },
});

const TEST_DELAY = 300; // 5 minutes

export default function NotificationsScreen() {
  const router = useRouter();

  // Events section
  const [eventReminders, setEventReminders] = useState(true);
  const [guestActivity,  setGuestActivity]  = useState(true);
  const [ticketUpdates,  setTicketUpdates]  = useState(true);

  // Account section
  const [marketing,      setMarketing]      = useState(false);
  const securityAlerts = true;

  // Test notification state
  const [testScheduled,  setTestScheduled]  = useState(false);
  const [testLoading,    setTestLoading]    = useState(false);
  const [testId,         setTestId]         = useState<string | null>(null);
  const [countdown,      setCountdown]      = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  async function handleScheduleTest() {
    setTestLoading(true);
    const granted = await requestPushPermission();
    if (!granted) {
      setTestLoading(false);
      return;
    }
    const id = await scheduleTestNotification(TEST_DELAY);
    setTestLoading(false);
    if (id) {
      setTestId(id);
      setTestScheduled(true);
      setCountdown(TEST_DELAY);
      countdownRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(countdownRef.current!);
            setTestScheduled(false);
            setTestId(null);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
  }

  async function handleCancelTest() {
    if (testId) await cancelTestNotification(testId);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setTestScheduled(false);
    setTestId(null);
    setCountdown(0);
  }

  function fmtCountdown(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageSubtitle}>
          Choose which notifications you'd like to receive.
        </Text>

        {/* Events section */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Events</Text>
          <ToggleRow
            label="Event reminders"
            description="Get reminded before your events start."
            value={eventReminders}
            onChange={setEventReminders}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Guest activity"
            description="Know when guests RSVP or check in."
            value={guestActivity}
            onChange={setGuestActivity}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Ticket updates"
            description="Alerts when tickets are purchased or transferred."
            value={ticketUpdates}
            onChange={setTicketUpdates}
          />
        </View>

        {/* Account section */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Account</Text>
          <ToggleRow
            label="Marketing & tips"
            description="Occasional product updates and feature tips."
            value={marketing}
            onChange={setMarketing}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Security alerts"
            description="Always notified of important account security events."
            value={securityAlerts}
            onChange={() => {}}
            disabled
          />
        </View>

        {/* ── Test notification card ── */}
        <View style={styles.testCard}>
          <View style={styles.testHeader}>
            <View style={styles.testIconWrap}>
              <Feather name="bell" size={16} color={Colors.accent.violet} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.testTitle}>Test Notification</Text>
              <Text style={styles.testSub}>
                {testScheduled
                  ? `Fires in ${fmtCountdown(countdown)} — keep the app open or background it`
                  : 'Schedule a local notification 5 minutes from now'}
              </Text>
            </View>
            {testScheduled && (
              <View style={styles.countdownPill}>
                <Text style={styles.countdownText}>{fmtCountdown(countdown)}</Text>
              </View>
            )}
          </View>

          {testScheduled ? (
            <Pressable onPress={handleCancelTest} style={styles.cancelBtn} android_ripple={{ color: 'rgba(239,68,68,0.15)' }}>
              <Feather name="x" size={13} color="#f87171" />
              <Text style={styles.cancelBtnText}>Cancel test</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleScheduleTest}
              disabled={testLoading}
              style={[styles.testBtn, testLoading && { opacity: 0.6 }]}
              android_ripple={{ color: 'rgba(167,139,250,0.2)' }}
            >
              {testLoading
                ? <ActivityIndicator size="small" color={Colors.accent.violet} />
                : <Feather name="zap" size={13} color={Colors.accent.violet} />
              }
              <Text style={styles.testBtnText}>
                {testLoading ? 'Scheduling…' : 'Send test in 5 minutes'}
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.footer}>
          Push notification permissions are managed in your device settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  backBtn: {
    width:           40,
    height:          40,
    borderRadius:    12,
    backgroundColor: Colors.bg.elevated,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },

  content: { padding: 24, gap: 16, paddingBottom: 60 },

  pageSubtitle: { fontSize: 13, color: Colors.text.muted, lineHeight: 19 },

  sectionLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         Colors.text.subtle,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  4,
  },
  card: {
    backgroundColor: Colors.bg.elevated,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    paddingHorizontal: 16,
    paddingTop:      14,
    paddingBottom:   6,
  },
  divider: {
    height:          1,
    backgroundColor: Colors.border.subtle,
  },

  footer: {
    fontSize:   11,
    color:      Colors.text.subtle,
    textAlign:  'center',
    lineHeight: 16,
    marginTop:  4,
  },

  testCard: {
    backgroundColor: Colors.bg.elevated,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     `${Colors.accent.violet}28`,
    padding:         16,
    gap:             14,
  },
  testHeader: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            12,
  },
  testIconWrap: {
    width:           36,
    height:          36,
    borderRadius:    11,
    backgroundColor: `${Colors.accent.violet}18`,
    borderWidth:     1,
    borderColor:     `${Colors.accent.violet}28`,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  testTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  testSub:   { fontSize: 12, color: Colors.text.muted, lineHeight: 17 },

  countdownPill: {
    backgroundColor: `${Colors.accent.violet}18`,
    borderRadius:    10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth:     1,
    borderColor:     `${Colors.accent.violet}30`,
  },
  countdownText: {
    fontSize:   13,
    fontWeight: '800',
    color:      Colors.accent.violet,
    fontVariant: ['tabular-nums'],
  },

  testBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             7,
    paddingVertical: 11,
    borderRadius:    12,
    backgroundColor: `${Colors.accent.violet}14`,
    borderWidth:     1,
    borderColor:     `${Colors.accent.violet}30`,
  },
  testBtnText: { fontSize: 13, fontWeight: '700', color: Colors.accent.violet },

  cancelBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             6,
    paddingVertical: 10,
    borderRadius:    12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth:     1,
    borderColor:     'rgba(239,68,68,0.20)',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#f87171' },
});
