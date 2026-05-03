import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';

interface AvatarProps {
  name:     string;
  imageUrl?: string | null;
  size?:    number;
  accent?:  string;
}

export function Avatar({ name, imageUrl, size = 40, accent = Colors.accent.indigo }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fontSize = size * 0.36;

  return (
    <View
      style={[
        styles.wrap,
        {
          width:           size,
          height:          size,
          borderRadius:    size / 2,
          backgroundColor: `${accent}20`,
          borderColor:     `${accent}35`,
        },
      ]}
    >
      {imageUrl ? (
        <Image
          source={imageUrl}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          contentFit="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize, color: accent }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  initials: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
