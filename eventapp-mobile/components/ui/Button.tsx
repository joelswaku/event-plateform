import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

const AP = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label:     string;
  onPress:   () => void;
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  disabled?: boolean;
  accent?:   string;
  icon?:     React.ReactNode;
  style?:    ViewStyle;
  textStyle?:TextStyle;
  haptic?:   boolean;
  fullWidth?: boolean;
}

const SIZE: Record<Size, { h: number; px: number; fontSize: number }> = {
  sm: { h: 36, px: 14, fontSize: 12 },
  md: { h: 46, px: 20, fontSize: 14 },
  lg: { h: 56, px: 28, fontSize: 15 },
};

export function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, accent, icon,
  style, textStyle, haptic = true, fullWidth = true,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { h, px, fontSize } = SIZE[size];

  const press = async () => {
    if (haptic) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  let bg: string, textColor: string, borderColor: string | undefined;
  const a = accent ?? Colors.accent.indigo;

  switch (variant) {
    case 'primary':
      bg = a; textColor = '#fff'; break;
    case 'secondary':
      bg = `${a}18`; textColor = a; borderColor = `${a}35`; break;
    case 'danger':
      bg = Colors.accent.red; textColor = '#fff'; break;
    case 'ghost':
      bg = 'transparent'; textColor = Colors.text.muted; break;
    case 'outline':
      bg = 'transparent'; textColor = a; borderColor = `${a}50`; break;
  }

  if (disabled || loading) { bg = 'rgba(255,255,255,0.08)'; textColor = Colors.text.subtle; }

  return (
    <AP
      onPress={disabled || loading ? undefined : press}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      style={[
        anim,
        {
          height:          h,
          paddingHorizontal: px,
          backgroundColor: bg,
          borderRadius:    h / 2,
          borderWidth:     borderColor ? 1 : 0,
          borderColor:     borderColor,
          flexDirection:   'row',
          alignItems:      'center',
          justifyContent:  'center',
          gap:             8,
          alignSelf:       fullWidth ? 'stretch' : 'flex-start',
          opacity:         disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={textColor} />
        : <>
            {icon}
            <Text style={[{ color: textColor, fontSize, fontWeight: '700', letterSpacing: 0.3 }, textStyle]}>
              {label}
            </Text>
          </>
      }
    </AP>
  );
}
