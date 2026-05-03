import React, { useEffect } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface BottomSheetProps {
  open:       boolean;
  onClose:    () => void;
  title?:     string;
  children:   React.ReactNode;
  maxHeight?:  number;
}

export function BottomSheet({ open, onClose, title, children, maxHeight = 600 }: BottomSheetProps) {
  const translateY = useSharedValue(600);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    if (open) {
      opacity.value    = withTiming(1,   { duration: 200 });
      translateY.value = withSpring(0,   { damping: 20, stiffness: 200 });
    } else {
      opacity.value    = withTiming(0,   { duration: 180 });
      translateY.value = withTiming(600, { duration: 200 });
    }
  }, [open]);

  const sheetAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const bgAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const close = () => {
    opacity.value    = withTiming(0, { duration: 180 });
    translateY.value = withTiming(600, { duration: 200 }, () => runOnJS(onClose)());
  };

  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent>
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
          <Animated.View style={[styles.sheet, { maxHeight }, sheetAnim]}>
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
              contentContainerStyle={styles.content}
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
    paddingBottom: 40,
  },
});
