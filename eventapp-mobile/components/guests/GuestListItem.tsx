import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Guest } from '@/types';
import { Colors } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';

interface GuestListItemProps {
  guest:   Guest;
  onPress: () => void;
}

const RSVP_COLORS: Record<string, string> = {
  CONFIRMED: Colors.accent.emerald,
  PENDING:   Colors.accent.amber,
  DECLINED:  Colors.accent.red,
};

export function GuestListItem({ guest, onPress }: GuestListItemProps) {
  const rsvpColor = RSVP_COLORS[guest.status] ?? Colors.text.muted;
  const isCheckedIn = !!guest.checked_in_at;

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={{ position: 'relative' }}>
        <Avatar
          name={guest.full_name}
          size={44}
          accent={guest.is_vip ? Colors.accent.gold : Colors.accent.indigo}
        />
        {isCheckedIn && (
          <View style={styles.checkinDot}>
            <Feather name="check" size={8} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{guest.full_name}</Text>
          {guest.is_vip && <Text style={styles.vip}>👑</Text>}
        </View>
        {guest.email && (
          <Text style={styles.email} numberOfLines={1}>{guest.email}</Text>
        )}
      </View>

      <View style={styles.right}>
        <View style={[styles.rsvpBadge, { backgroundColor: `${rsvpColor}18`, borderColor: `${rsvpColor}35` }]}>
          <Text style={[styles.rsvpText, { color: rsvpColor }]}>
            {guest.status.charAt(0) + guest.status.slice(1).toLowerCase()}
          </Text>
        </View>
        <Feather name="chevron-right" size={14} color={Colors.text.subtle} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  checkinDot: {
    position:        'absolute',
    bottom:          0,
    right:           0,
    width:           16,
    height:          16,
    borderRadius:    8,
    backgroundColor: Colors.accent.emerald,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     Colors.bg.primary,
  },
  info:    { flex: 1, gap: 2, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name:    { fontSize: 14, fontWeight: '700', color: '#fff', flex: 1 },
  vip:     { fontSize: 13 },
  email:   { fontSize: 12, color: Colors.text.muted },
  right:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rsvpBadge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      99,
    borderWidth:       1,
  },
  rsvpText: { fontSize: 10, fontWeight: '700' },
});
