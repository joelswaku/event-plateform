import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface InputProps extends TextInputProps {
  label?:      string;
  error?:      string;
  icon?:       keyof typeof Feather.glyphMap;
  rightIcon?:  keyof typeof Feather.glyphMap;
  onRightPress?: () => void;
}

export function Input({
  label, error, icon, rightIcon, onRightPress, style, multiline, ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.accent.red
    : focused
    ? Colors.accent.indigo
    : Colors.border.DEFAULT;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.row, { borderColor }, multiline && styles.rowMultiline]}>
        {icon && (
          <Feather name={icon} size={16} color={Colors.text.muted} style={[styles.iconLeft, multiline && styles.iconTopAlign]} />
        )}
        <TextInput
          multiline={multiline}
          style={[
            styles.input,
            icon      ? { paddingLeft: 0 } : {},
            rightIcon ? { paddingRight: 0 } : {},
            multiline && styles.inputMultiline,
            style,
          ]}
          placeholderTextColor={Colors.text.subtle}
          selectionColor={Colors.accent.indigo}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && (
          <Pressable onPress={onRightPress} style={styles.iconRight}>
            <Feather name={rightIcon} size={16} color={Colors.text.muted} />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:   { gap: 6 },
  label:     { fontSize: 12, fontWeight: '600', color: Colors.text.muted, letterSpacing: 0.3 },
  row: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  Colors.bg.input,
    borderRadius:     14,
    borderWidth:      1,
    paddingHorizontal: 14,
    minHeight:        50,
    gap:              10,
  },
  rowMultiline:   { alignItems: 'flex-start', paddingVertical: 12 },
  iconLeft:       { flexShrink: 0 },
  iconTopAlign:   { marginTop: 2 },
  iconRight:      { padding: 4 },
  input: {
    flex:      1,
    color:     Colors.text.primary,
    fontSize:  15,
    fontWeight:'500',
  },
  inputMultiline: { textAlignVertical: 'top' as const, minHeight: 60 },
  error: { fontSize: 11, color: Colors.accent.red },
});
