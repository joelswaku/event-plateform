import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Button } from './Button';
import { Colors } from '@/constants/colors';

interface ConfirmModalProps {
  open:         boolean;
  title:        string;
  description:  string;
  confirmText?: string;
  cancelText?:  string;
  variant?:     'danger' | 'default';
  onConfirm:    () => void;
  onClose:      () => void;
}

export function ConfirmModal({
  open, title, description, confirmText = 'Confirm', cancelText = 'Cancel',
  variant = 'default', onConfirm, onClose,
}: ConfirmModalProps) {
  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>
          <View style={styles.actions}>
            <Button
              label={cancelText}
              onPress={onClose}
              variant="ghost"
              size="md"
            />
            <Button
              label={confirmText}
              onPress={() => { onConfirm(); onClose(); }}
              variant={variant === 'danger' ? 'danger' : 'primary'}
              accent={variant === 'danger' ? Colors.accent.red : Colors.accent.indigo}
              size="md"
            />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg.sheet,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    padding:         24,
    paddingBottom:   40,
    gap:             12,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    borderBottomWidth: 0,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.border.DEFAULT,
    alignSelf:       'center',
    marginBottom:    8,
  },
  title: {
    fontSize:   18,
    fontWeight: '800',
    color:      Colors.text.primary,
  },
  desc: {
    fontSize: 14,
    color:    Colors.text.muted,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap:           10,
    marginTop:     8,
  },
});
