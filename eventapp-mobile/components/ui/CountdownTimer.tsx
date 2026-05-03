import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCountdown } from '@/hooks/useCountdown';
import { Colors } from '@/constants/colors';

interface CountdownTimerProps {
  targetIso: string | null | undefined;
  accent?:   string;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function CountdownTimer({ targetIso, accent = Colors.accent.indigo }: CountdownTimerProps) {
  const time = useCountdown(targetIso);

  if (!time) return null;

  if (time.ended) {
    return (
      <View style={styles.endedRow}>
        <Text style={[styles.endedText, { color: accent }]}>🎉 Event started!</Text>
      </View>
    );
  }

  const units = time.days > 0
    ? [{ v: time.days, l: 'DAYS' }, { v: time.hours, l: 'HRS' }, { v: time.minutes, l: 'MIN' }, { v: time.seconds, l: 'SEC' }]
    : [{ v: time.hours, l: 'HRS' }, { v: time.minutes, l: 'MIN' }, { v: time.seconds, l: 'SEC' }];

  return (
    <View style={styles.row}>
      {units.map(({ v, l }, i) => (
        <React.Fragment key={l}>
          <View style={[styles.box, { borderColor: `${accent}30`, backgroundColor: `${accent}10` }]}>
            <Text style={[styles.num, { color: '#fff' }]}>{pad(v)}</Text>
            <Text style={[styles.unit, { color: accent }]}>{l}</Text>
          </View>
          {i < units.length - 1 && (
            <Text style={[styles.colon, { color: accent }]}>:</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  box: {
    width:         56,
    height:        56,
    borderRadius:  14,
    borderWidth:   1,
    alignItems:    'center',
    justifyContent:'center',
    gap:           2,
  },
  num: {
    fontSize:   20,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums' as const],
  },
  unit: {
    fontSize:   8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  colon: {
    fontSize:   20,
    fontWeight: '900',
    marginBottom: 10,
  },
  endedRow:   { alignItems: 'center' },
  endedText:  { fontSize: 16, fontWeight: '800' },
});
