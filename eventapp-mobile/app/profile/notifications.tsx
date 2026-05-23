import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

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

export default function NotificationsScreen() {
  const router = useRouter();

  // Events section
  const [eventReminders, setEventReminders] = useState(true);
  const [guestActivity,  setGuestActivity]  = useState(true);
  const [ticketUpdates,  setTicketUpdates]  = useState(true);

  // Account section
  const [marketing,      setMarketing]      = useState(false);
  // Security alerts locked on
  const securityAlerts = true;

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
});
