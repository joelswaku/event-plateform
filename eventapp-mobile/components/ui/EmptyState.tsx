import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';
import { Colors } from '@/constants/colors';

interface EmptyStateProps {
  icon:        keyof typeof Feather.glyphMap;
  title:       string;
  description: string;
  actionLabel?: string;
  onAction?:   () => void;
  accent?:     string;
}

export function EmptyState({
  icon, title, description, actionLabel, onAction, accent = Colors.accent.indigo,
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}15`, borderColor: `${accent}25` }]}>
        <Feather name={icon} size={32} color={accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          accent={accent}
          variant="secondary"
          size="md"
          fullWidth={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 12,
  },
  iconWrap: {
    width:        72,
    height:       72,
    borderRadius: 22,
    borderWidth:  1,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize:   18,
    fontWeight: '800',
    color:      '#fff',
    textAlign:  'center',
    letterSpacing: -0.3,
  },
  desc: {
    fontSize:  13,
    color:     Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
