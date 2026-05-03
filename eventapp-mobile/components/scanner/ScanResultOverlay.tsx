import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { ScanResult, ScanResultType } from '@/types';
import { Colors } from '@/constants/colors';
import { useHaptics } from '@/hooks/useHaptics';
import { fmtDateTime } from '@/lib/format';

const RESULT_CONFIG: Record<ScanResultType, {
  icon:    keyof typeof Feather.glyphMap;
  emoji:   string;
  accent:  string;
  title:   string;
}> = {
  SUCCESS:   { icon: 'check-circle', emoji: '✅', accent: Colors.accent.emerald, title: 'Checked In!' },
  DUPLICATE: { icon: 'alert-circle', emoji: '⚠️', accent: Colors.accent.amber,   title: 'Already Checked In' },
  INVALID:   { icon: 'x-circle',    emoji: '❌', accent: Colors.accent.red,      title: 'Invalid Ticket' },
  REVOKED:   { icon: 'slash',       emoji: '🚫', accent: Colors.accent.red,      title: 'Ticket Revoked' },
  QUEUED:    { icon: 'clock',       emoji: '⏳', accent: Colors.accent.indigo,   title: 'Queued for Sync' },
};

interface Props {
  result:    ScanResult;
  onDismiss: () => void;
}

export function ScanResultOverlay({ result, onDismiss }: Props) {
  const { forScan } = useHaptics();
  const cfg         = RESULT_CONFIG[result.type];

  const translateY = useSharedValue(200);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    forScan(result.type);
    translateY.value = withSpring(0,   { damping: 18, stiffness: 180 });
    opacity.value    = withTiming(1,   { duration: 200 });

    const timer = setTimeout(() => {
      opacity.value    = withTiming(0, { duration: 250 });
      translateY.value = withTiming(200, { duration: 250 }, () => {
        runOnJS(onDismiss)();
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [result]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, anim]}>
      <BlurView intensity={60} tint="dark" style={[styles.card, { borderColor: `${cfg.accent}50` }]}>
        {/* Glow */}
        <View style={[styles.glow, { backgroundColor: `${cfg.accent}20` }]} />

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: `${cfg.accent}25` }]}>
          <Feather name={cfg.icon} size={28} color={cfg.accent} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: cfg.accent }]}>
            {cfg.emoji} {cfg.title}
          </Text>

          {result.holder_name && (
            <Text style={styles.holderName}>{result.holder_name}</Text>
          )}
          {result.ticket_type_name && (
            <Text style={styles.ticketType}>{result.ticket_type_name}</Text>
          )}
          {result.message && result.type !== 'SUCCESS' && (
            <Text style={styles.message}>{result.message}</Text>
          )}
          <Text style={styles.time}>{fmtDateTime(result.scanned_at)}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom:   120,
    left:     16,
    right:    16,
    zIndex:   100,
  },
  card: {
    borderRadius:  20,
    borderWidth:   1,
    overflow:      'hidden',
    flexDirection: 'row',
    alignItems:    'center',
    padding:       16,
    gap:           14,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
  },
  iconWrap: {
    width:         56,
    height:        56,
    borderRadius:  16,
    alignItems:    'center',
    justifyContent:'center',
    flexShrink:    0,
  },
  content: { flex: 1, gap: 2 },
  title: {
    fontSize:   16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  holderName: {
    fontSize:   14,
    fontWeight: '700',
    color:      Colors.text.primary,
  },
  ticketType: {
    fontSize:  12,
    color:     Colors.text.muted,
    fontWeight:'600',
  },
  message: {
    fontSize:  12,
    color:     Colors.text.muted,
  },
  time: {
    fontSize:  10,
    color:     Colors.text.subtle,
    marginTop: 2,
  },
});
