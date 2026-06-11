import React from 'react';
import {
  View, Text, StyleSheet, Dimensions, Platform,
} from 'react-native';

const SW = Dimensions.get('window').width;

type ToastType = 'success' | 'error' | 'info' | 'warning';

const CFG: Record<ToastType, { icon: string; iconColor: string; iconBg: string; bar: string }> = {
  success: { icon: '✓', iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.16)', bar: '#10b981' },
  error:   { icon: '✕', iconColor: '#ef4444', iconBg: 'rgba(239,68,68,0.16)',   bar: '#ef4444' },
  info:    { icon: 'i', iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.16)',   bar: '#6366f1' },
  warning: { icon: '!', iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.16)',   bar: '#f59e0b' },
};

interface ToastProps {
  text1?: string;
  text2?: string;
}

function ToastCard({ type, text1, text2 }: ToastProps & { type: ToastType }) {
  const c = CFG[type] ?? CFG.info;
  return (
    <View style={[styles.card, { shadowColor: c.bar }]}>
      <View style={[styles.bar, { backgroundColor: c.bar }]} />
      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: c.iconBg }]}>
          <Text style={[styles.iconText, { color: c.iconColor }]}>{c.icon}</Text>
        </View>
        <View style={styles.textWrap}>
          {!!text1 && (
            <Text style={styles.title} numberOfLines={1}>{text1}</Text>
          )}
          {!!text2 && (
            <Text style={styles.subtitle} numberOfLines={2}>{text2}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export const toastConfig = {
  success: ({ text1, text2 }: ToastProps) => (
    <ToastCard type="success" text1={text1} text2={text2} />
  ),
  error: ({ text1, text2 }: ToastProps) => (
    <ToastCard type="error" text1={text1} text2={text2} />
  ),
  info: ({ text1, text2 }: ToastProps) => (
    <ToastCard type="info" text1={text1} text2={text2} />
  ),
  warning: ({ text1, text2 }: ToastProps) => (
    <ToastCard type="warning" text1={text1} text2={text2} />
  ),
};

const styles = StyleSheet.create({
  card: {
    width: SW - 32,
    marginHorizontal: 16,
    backgroundColor: '#0e0e1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  bar: {
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 11,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.50)',
    lineHeight: 17,
  },
});
