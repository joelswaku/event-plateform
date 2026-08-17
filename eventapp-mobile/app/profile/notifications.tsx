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
  note?:       string;
}

function ToggleRow({ label, description, value, onChange, disabled = false, note }: ToggleRowProps) {
  return (
    <View style={[rowStyles.row, disabled && rowStyles.rowDisabled]}>
      <View style={rowStyles.text}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.desc}>{description}</Text>
        {!!note && <Text style={rowStyles.note}>{note}</Text>}
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
  note:  { fontSize: 10, color: Colors.accent.indigo, lineHeight: 15, marginTop: 2, fontWeight: '600' },
});

export default function NotificationsScreen() {
  const router = useRouter();

  // Events section
  const [eventReminders, setEventReminders] = useState(true);
  const [guestActivity,  setGuestActivity]  = useState(true);
  const [ticketUpdates,  setTicketUpdates]  = useState(true);

  // Account section
  const [marketing,      setMarketing]      = useState(false);
  const securityAlerts = true;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Control which emails and alerts you receive</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bellHero}>
          <Feather name="bell" size={30} color={Colors.accent.indigo} />
        </View>

        {/* Events section */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Events</Text>
          <ToggleRow
            label="Event reminders"
            description="Get reminded before your events go live."
            value={eventReminders}
            onChange={setEventReminders}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Guest activity"
            description="RSVP confirmations and guest updates."
            value={guestActivity}
            onChange={setGuestActivity}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Ticket updates"
            description="Ticket purchases and check-in activity."
            value={ticketUpdates}
            onChange={setTicketUpdates}
          />
        </View>

        {/* Account section */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Account</Text>
          <ToggleRow
            label="Tips & updates"
            description="Product news, tips, and feature announcements."
            value={marketing}
            onChange={setMarketing}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Security alerts"
            description="Sign-in activity and security notices."
            value={securityAlerts}
            onChange={() => {}}
            disabled
            note="Always enabled for your security"
          />
        </View>

        <Text style={styles.footer}>
          Preference changes take effect immediately. We'll never spam you.
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
    paddingHorizontal: 16,
    paddingVertical:   12,
    gap:               12,
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
  headerCopy: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  headerSubtitle: { fontSize: 11, color: Colors.text.muted },

  content: { padding: 20, gap: 16, paddingBottom: 60 },
  bellHero: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.accent.indigo}1F`,
    borderWidth: 1,
    borderColor: `${Colors.accent.indigo}40`,
    marginVertical: 2,
  },

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
