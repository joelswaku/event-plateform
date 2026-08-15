import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomSheetProps {
  open:       boolean;
  onClose:    () => void;
  title?:     string;
  children:   React.ReactNode;
  maxHeight?:  number;
}

export function BottomSheet({ open, onClose, title, children, maxHeight = 600 }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(600);
  const opacity    = useSharedValue(0);
  const closingRef = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      opacity.value    = withTiming(1,   { duration: 200 });
      translateY.value = withSpring(0,   { damping: 20, stiffness: 200 });
    } else {
      opacity.value    = withTiming(0,   { duration: 180 });
      translateY.value = withTiming(600, { duration: 200 });
    }
  }, [open]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const sheetAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const bgAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const close = () => {
    if (!open || closingRef.current) return;
    closingRef.current = true;

    const finishClose = () => {
      if (!closingRef.current) return;
      closingRef.current = false;
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      onClose();
    };

    opacity.value    = withTiming(0, { duration: 180 });
    translateY.value = withTiming(600, { duration: 200 }, () => {
      runOnJS(finishClose)();
    });

    // Reanimated callbacks can occasionally be skipped if Android/iOS pauses
    // a frame. Never leave a transparent native Modal over the whole screen.
    closeTimer.current = setTimeout(finishClose, 280);
  };

  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, bgAnim]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          </Animated.View>

          {/* Sheet */}
          <Animated.View style={[styles.sheet, { maxHeight, paddingBottom: Math.max(insets.bottom, 12) }, sheetAnim]}>
            {/* Handle */}
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            {title && (
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Pressable onPress={close} style={styles.closeBtn}>
                  <Feather name="x" size={18} color={Colors.text.muted} />
                </Pressable>
              </View>
            )}

            {/* Content */}
            <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 20 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheet: {
    position:              'absolute',
    bottom:                0,
    left:                  0,
    right:                 0,
    backgroundColor:       Colors.bg.sheet,
    borderTopLeftRadius:   28,
    borderTopRightRadius:  28,
    borderWidth:           1,
    borderColor:           Colors.border.DEFAULT,
    borderBottomWidth:     0,
    overflow:              'hidden',
  },
  handleWrap: {
    alignItems:    'center',
    paddingTop:    12,
    paddingBottom: 4,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.border.strong,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  title: {
    fontSize:   17,
    fontWeight: '800',
    color:      '#fff',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width:           32,
    height:          32,
    borderRadius:    10,
    backgroundColor: Colors.bg.elevated,
    alignItems:      'center',
    justifyContent:  'center',
  },
  content: {
    padding:       20,
  },
});
