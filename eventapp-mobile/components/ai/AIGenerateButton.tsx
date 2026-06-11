import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface Props {
  onPress: () => void;
  loading?: boolean;
  label?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function AIGenerateButton({ onPress, loading, label = 'Generate with AI', style, disabled }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[styles.btn, style, (loading || disabled) && styles.disabled]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Feather name="zap" size={14} color="#fff" />
      )}
      <Text style={styles.label}>{loading ? 'Generating…' : label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: Colors.accent.indigo,
  },
  disabled: { opacity: 0.6 },
  label: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
