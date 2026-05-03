import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const isConnected = useNetworkStatus();
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
    <Animated.View style={[styles.banner, anim]}>
      <Text style={styles.text}>📵  Offline Mode — scans queued locally</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    zIndex:          9999,
    backgroundColor: Colors.accent.amber,
    paddingVertical: 10,
    alignItems:      'center',
  },
  text: {
    color:      '#1c1002',
    fontSize:   12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
