import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

const SCREEN_OPTIONS = {
  headerStyle: {
    backgroundColor: Colors.bg.primary,
  },
  headerTintColor: Colors.accent.indigo,
  headerTitleStyle: {
    color: Colors.text.primary,
    fontWeight: '700' as const,
    fontSize: 17,
  },
  headerShadowVisible: false,
  headerBackTitle: '',
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: Colors.bg.primary },
  animation: 'slide_from_right' as const,
};

export default function ChatLayout() {
  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Messages',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Chat',
          headerShown: true,
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
