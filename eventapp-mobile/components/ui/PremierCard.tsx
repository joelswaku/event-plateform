import React from 'react';
import { Pressable, View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PremierCardProps {
  children:   React.ReactNode;
  onPress?:   () => void;
  accent?:    string;
  glow?:      boolean;
  style?:     ViewStyle;
  disabled?:  boolean;
  blur?:      boolean;
  padding?:   number;
}

export function PremierCard({
  children, onPress, accent, glow = false, style,
  disabled = false, blur = true, padding = 16,
}: PremierCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = () => { scale.value = withSpring(0.97, { damping: 15 }); };
  const handlePressOut = () => { scale.value = withSpring(1,    { damping: 15 }); };

  const shadow: ViewStyle = glow && accent ? {
    shadowColor:   accent,
    shadowOpacity: 0.35,
    shadowRadius:  24,
    shadowOffset:  { width: 0, height: 8 },
    elevation:     12,
  } : {
    shadowColor:   '#000',
    shadowOpacity: 0.4,
    shadowRadius:  12,
    shadowOffset:  { width: 0, height: 4 },
    elevation:     6,
  };

  const borderColor = accent
    ? `${accent}30`
    : Colors.border.DEFAULT;

  const inner = (
    <View style={[styles.inner, { padding }, style]}>
      {children}
    </View>
  );

  const card = blur ? (
    <BlurView
      intensity={20}
      tint="dark"
      style={[styles.blurBase, { borderColor, borderWidth: 1 }]}
    >
      {inner}
    </BlurView>
  ) : (
    <View style={[styles.blurBase, { backgroundColor: Colors.bg.card, borderColor, borderWidth: 1 }]}>
      {inner}
    </View>
  );

  if (!onPress) return (
    <View style={[styles.wrapper, shadow, style]}>
      {card}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      disabled={disabled}
      style={[styles.wrapper, shadow, animStyle]}
    >
      {card}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurBase: {
    borderRadius: 20,
    overflow:     'hidden',
  },
  inner: {
    borderRadius: 20,
  },
});
