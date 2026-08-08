import React from 'react';
import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { Config } from '@/constants/config';

type LiteEventLogoProps = {
  size?: number;
  radius?: number;
  style?: StyleProp<ImageStyle>;
};

const logoUri = `${Config.WEB_URL.replace(/\/$/, '')}/logo.png`;

/** The same public LiteEvent mark used by the web application. */
export function LiteEventLogo({ size = 48, radius = 14, style }: LiteEventLogoProps) {
  return (
    <Image
      source={{ uri: logoUri }}
      accessibilityLabel="LiteEvent"
      resizeMode="contain"
      style={[styles.logo, { width: size, height: size, borderRadius: radius }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: '#ffffff',
  },
});
