import React from 'react';
import { Pressable, View } from 'react-native';
import { Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SuperAdminDrawer } from '@/components/super-admin/SuperAdminDrawer';
import { useSADrawerStore } from '@/store/superAdminDrawer.store';

const GOLD = '#C9A96E';

function HamburgerBtn() {
  const open = useSADrawerStore(s => s.open);
  return (
    <Pressable
      onPress={open}
      hitSlop={12}
      style={{ marginLeft: 8, padding: 6 }}
    >
      <View style={{
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: 'rgba(201,169,110,0.10)',
        borderWidth: 1, borderColor: 'rgba(201,169,110,0.22)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Feather name="menu" size={17} color={GOLD} />
      </View>
    </Pressable>
  );
}

const SCREEN_OPTIONS = {
  headerStyle:       { backgroundColor: '#07070f' },
  headerTintColor:   GOLD,
  headerTitleStyle:  { color: '#ffffff', fontWeight: '700' as const, fontSize: 17 },
  headerShadowVisible: false,
  headerBackTitle:   '',
  contentStyle:      { backgroundColor: '#07070f' },
  // gold bottom border via headerBottom workaround — use borderBottomColor where supported
  headerLeft:        () => <HamburgerBtn />,
};

export default function SuperAdminLayout() {
  return (
    <>
      <SuperAdminDrawer />
      <Stack screenOptions={SCREEN_OPTIONS}>
        <Stack.Screen name="index"         options={{ title: 'Super Admin'       }} />
        <Stack.Screen name="activity"      options={{ title: 'Live Activity'     }} />
        <Stack.Screen name="events"        options={{ title: 'Events'            }} />
        <Stack.Screen name="organizations" options={{ title: 'Organizations'     }} />
        <Stack.Screen name="users"         options={{ title: 'Users'             }} />
        <Stack.Screen name="revenue"       options={{ title: 'Revenue'           }} />
        <Stack.Screen name="financial"     options={{ title: 'Financial'         }} />
        <Stack.Screen name="moderation"    options={{ title: 'Moderation'        }} />
        <Stack.Screen name="ai"            options={{ title: 'AI Insights'       }} />
        <Stack.Screen name="health"        options={{ title: 'System Health'     }} />
        <Stack.Screen name="flags"         options={{ title: 'Feature Flags'     }} />
        <Stack.Screen name="audit"         options={{ title: 'Audit Logs'        }} />
        <Stack.Screen name="vendors"       options={{ title: 'Vendors'           }} />
        <Stack.Screen name="chat"          options={{ title: 'Support'           }} />
        <Stack.Screen name="notifications" options={{ title: 'Notification Center'}} />
        <Stack.Screen name="legal"         options={{ title: 'Legal Pages'       }} />
      </Stack>
    </>
  );
}
