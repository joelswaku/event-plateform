import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  const insets      = useSafeAreaInsets();
  const opacity     = useSharedValue(0);
  const translateY  = useSharedValue(-40);

  useEffect(() => {
    if (!isConnected) {
      opacity.value    = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      opacity.value    = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-40, { duration: 300 });
    }
  }, [isConnected]);

  const anim = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.banner, { top: insets.top + 10 }, anim]}>
      <View style={styles.iconWrap}>
        <Feather name="wifi-off" size={17} color="#FBBF24" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>You&apos;re offline</Text>
        <Text style={styles.text}>Check your Wi-Fi or mobile data, then try again.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position:        'absolute',
    left:            12,
    right:           12,
    zIndex:          9999,
    backgroundColor: '#17130A',
    borderColor:     `${Colors.accent.amber}66`,
    borderWidth:     1,
    borderRadius:    14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    elevation:       16,
  },
  iconWrap: {
    width:           34,
    height:          34,
    borderRadius:    10,
    backgroundColor: `${Colors.accent.amber}22`,
    alignItems:      'center',
    justifyContent:  'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    color:      '#FFFFFF',
    fontSize:   13,
    fontWeight: '800',
    marginBottom: 1,
  },
  text: {
    color:      'rgba(255,255,255,0.66)',
    fontSize:   12,
    fontWeight: '500',
    lineHeight: 17,
  },
});
