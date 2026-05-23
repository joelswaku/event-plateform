import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const STYLES = [
  { id: 'CLASSIC', label: 'Classic', accent: '#c9a96e', desc: 'Timeless & refined'  },
  { id: 'MODERN',  label: 'Modern',  accent: '#6c6fee', desc: 'Clean & bold',        premium: true },
  { id: 'MINIMAL', label: 'Minimal', accent: '#d4d0c8', desc: 'Less is more',        premium: true },
  { id: 'FUN',     label: 'Fun',     accent: '#F59E0B', desc: 'Energetic & playful', premium: true },
  { id: 'ELEGANT', label: 'Elegant', accent: '#e2d9c9', desc: 'Sophisticated',       premium: true },
  { id: 'LUXURY',  label: 'Luxury',  accent: '#C9A96E', desc: 'Premium gold',        premium: true },
];

interface Props {
  currentStyle: string;
  isPremium: boolean;
  onStyleSelect: (s: string) => void;
  onUpgrade: () => void;
}

export default function StylePanel({ currentStyle, isPremium, onStyleSelect, onUpgrade }: Props) {
  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.header}>PAGE STYLE</Text>
      {STYLES.map((st) => {
        const locked = (st as any).premium && !isPremium;
        const active = currentStyle === st.id;
        return (
          <TouchableOpacity
            key={st.id}
            style={[s.row, active && { borderColor: st.accent, borderWidth: 2 }]}
            onPress={() => locked ? onUpgrade() : onStyleSelect(st.id)}
            activeOpacity={0.8}
          >
            <View style={[s.dot, { backgroundColor: st.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.label, active && { color: '#fff' }]}>{st.label}</Text>
              <Text style={s.desc}>{st.desc}</Text>
            </View>
            {locked && <Text style={s.lock}>🔒</Text>}
            {active && <View style={[s.activePip, { backgroundColor: st.accent }]} />}
          </TouchableOpacity>
        );
      })}
      {!isPremium && (
        <TouchableOpacity style={s.banner} onPress={onUpgrade} activeOpacity={0.85}>
          <Text style={s.bannerTxt}>✦ Unlock all styles — Upgrade to Starter or Pro</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:      { padding: 16, gap: 8 },
  header:    { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: '#555a66', marginBottom: 4 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e2026', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dot:       { width: 16, height: 16, borderRadius: 8 },
  label:     { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  desc:      { fontSize: 11, color: '#555a66', marginTop: 1 },
  lock:      { fontSize: 12 },
  activePip: { width: 8, height: 8, borderRadius: 4 },
  banner:    { marginTop: 4, padding: 14, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  bannerTxt: { fontSize: 12, fontWeight: '700', color: '#f59e0b', textAlign: 'center' },
});
