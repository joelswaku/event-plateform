import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface StatCardProps {
  label:  string;
  value:  string | number;
  icon:   keyof typeof Feather.glyphMap;
  accent?: string;
  sub?:   string;
}

export function StatCard({ label, value, icon, accent = Colors.accent.indigo, sub }: StatCardProps) {
  return (
    <View style={[styles.card, { borderColor: `${accent}25` }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
        <Feather name={icon} size={16} color={accent} />
      </View>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex:            1,
    backgroundColor: Colors.bg.card,
    borderRadius:    16,
    borderWidth:     1,
    padding:         14,
    gap:             4,
    minWidth:        80,
  },
  iconWrap: {
    width:        32,
    height:       32,
    borderRadius: 10,
    alignItems:   'center',
    justifyContent:'center',
    marginBottom: 4,
  },
  value: {
    fontSize:   22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    color:    Colors.text.muted,
    fontWeight:'600',
  },
  sub: {
    fontSize: 10,
    color:    Colors.text.subtle,
  },
});
