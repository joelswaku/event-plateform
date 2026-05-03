import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, StatusKey } from '@/constants/colors';
import { EventStatus } from '@/types';

interface StatusBadgeProps { status: EventStatus; }

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = Colors.status[status as StatusKey] ?? Colors.status.DRAFT;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.label, { color: cfg.text }]}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </Text>
    </View>
  );
}

interface ChipProps {
  label:    string;
  accent?:  string;
  icon?:    string;
  size?:    'sm' | 'md';
}

export function Chip({ label, accent = Colors.accent.indigo, icon, size = 'sm' }: ChipProps) {
  const fontSize = size === 'sm' ? 10 : 12;
  return (
    <View style={[styles.chip, { backgroundColor: `${accent}18`, borderColor: `${accent}35` }]}>
      {icon && <Text style={{ fontSize: fontSize + 2 }}>{icon}</Text>}
      <Text style={[styles.chipLabel, { color: accent, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:   99,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
  },
  label: {
    fontSize:   11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chip: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    paddingHorizontal: 10,
    paddingVertical:    3,
    borderRadius:   99,
    borderWidth:    1,
  },
  chipLabel: {
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
