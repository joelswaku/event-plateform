import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScanResult, ScanResultType } from '@/types';
import { Colors } from '@/constants/colors';
import { fmtRelative } from '@/lib/format';

const TYPE_CFG: Record<ScanResultType, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  SUCCESS:   { icon: 'check-circle', color: Colors.accent.emerald },
  DUPLICATE: { icon: 'alert-circle', color: Colors.accent.amber   },
  INVALID:   { icon: 'x-circle',    color: Colors.accent.red      },
  REVOKED:   { icon: 'slash',       color: Colors.accent.red      },
  QUEUED:    { icon: 'clock',       color: Colors.accent.indigo   },
};

interface ScanFeedProps {
  items: ScanResult[];
}

export function ScanFeed({ items }: ScanFeedProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Recent Scans</Text>
      {items.slice(0, 8).map((item, i) => {
        const cfg = TYPE_CFG[item.type];
        return (
          <View key={`${item.qr_token}-${i}`} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: `${cfg.color}20` }]}>
              <Feather name={cfg.icon} size={12} color={cfg.color} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {item.holder_name ?? item.message ?? item.qr_token.slice(0, 16) + '…'}
              </Text>
              {item.ticket_type_name && (
                <Text style={styles.type}>{item.ticket_type_name}</Text>
              )}
            </View>
            <Text style={styles.time}>{fmtRelative(item.scanned_at)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { gap: 4 },
  label: {
    fontSize:   10,
    fontWeight: '800',
    color:      Colors.text.subtle,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  dot: {
    width:         28,
    height:        28,
    borderRadius:  8,
    alignItems:    'center',
    justifyContent:'center',
    flexShrink:    0,
  },
  info:  { flex: 1, minWidth: 0 },
  name:  { fontSize: 13, fontWeight: '600', color: '#fff' },
  type:  { fontSize: 11, color: Colors.text.muted },
  time:  { fontSize: 10, color: Colors.text.subtle, flexShrink: 0 },
});
