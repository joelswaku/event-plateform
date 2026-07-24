import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useChatStore } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';

interface FloatingChatButtonProps {
  onPress?: () => void;
}

export function FloatingChatButton({ onPress }: FloatingChatButtonProps) {
  const router = useRouter();
  const isSuperAdmin = useAuthStore(s => !!s.user?.is_super_admin);
  const unreadTotal = useChatStore(s => s.unreadTotal);
  const fetchUnreadCount = useChatStore(s => s.fetchUnreadCount);
  const fetchConversations = useChatStore(s => s.fetchConversations);
  const openSupport = useChatStore(s => s.openSupport);

  const [opening, setOpening] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));

  // Fetch unread count and conversations periodically
  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();
    fetchConversations();

    // Poll every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchConversations]);

  // Pulse animation when there are new messages
  useEffect(() => {
    if (unreadTotal > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [unreadTotal, pulseAnim]);

  const handlePress = async () => {
    if (opening) return;

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
      return;
    }

    setOpening(true);
    try {
      if (isSuperAdmin) {
        router.push('/super-admin/chat' as never);
      } else {
        const conv = await openSupport();
        if (conv) {
          router.push(`/chat/${conv.id}` as never);
        }
      }
    } finally {
      setOpening(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        style={styles.button}
        onPress={handlePress}
        disabled={opening}
      >
        <View style={styles.iconWrapper}>
          <Feather name="message-circle" size={24} color="#fff" />
        </View>

        {/* Notification Badge - Only show for regular users, not super admins */}
        {!isSuperAdmin && unreadTotal > 0 && (
          <Animated.View
            style={[
              styles.badge,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text style={styles.badgeText}>
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 999,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: Colors.bg.primary,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
  },
});
