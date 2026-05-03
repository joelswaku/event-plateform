import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useScannerStore } from '@/store/scanner.store';
import { Colors } from '@/constants/colors';

function TabIcon({
  name, focused, label, badge,
}: {
  name: keyof typeof Feather.glyphMap;
  focused: boolean;
  label: string;
  badge?: number;
}) {
  const color = focused ? Colors.accent.indigo : Colors.text.subtle;
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Feather name={name} size={19} color={color} />
        {!!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const offlineQueue = useScannerStore(s => s.offlineQueue);
  const pendingCount = offlineQueue.length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar" focused={focused} label="Events" />
          ),
        }}
      />
      <Tabs.Screen
        name="builder"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.builderTab, focused && styles.builderTabActive]}>
              <Feather name="layout" size={20} color={focused ? '#fff' : Colors.text.subtle} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="camera" focused={focused} label="Scan" badge={pendingCount || undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="user" focused={focused} label="Profile" />
          ),
        }}
      />
      {/* Hide tickets from tab bar — accessible via drawer */}
      <Tabs.Screen
        name="tickets"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    height:          Platform.OS === 'ios' ? 85 : 72,
    borderTopWidth:  1,
    borderTopColor:  Colors.border.DEFAULT,
    backgroundColor: 'transparent',
    elevation:       0,
  },
  tabItem: {
    alignItems:  'center',
    gap:          3,
    paddingTop:   6,
  },
  iconWrap: {
    width:           42,
    height:          42,
    borderRadius:    13,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  iconWrapActive: {
    backgroundColor: `${Colors.accent.indigo}15`,
    borderWidth:     1,
    borderColor:     `${Colors.accent.indigo}30`,
  },
  badge: {
    position:          'absolute',
    top:               5,
    right:             5,
    backgroundColor:   Colors.accent.red,
    borderRadius:      99,
    minWidth:          15,
    height:            15,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 8, fontWeight: '900', color: '#fff' },
  tabLabel:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },

  // Builder center button — special styled
  builderTab: {
    width:           50,
    height:          50,
    borderRadius:    16,
    backgroundColor: Colors.bg.elevated,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       -10,
    shadowColor:     Colors.accent.indigo,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.2,
    shadowRadius:    8,
    elevation:       6,
  },
  builderTabActive: {
    backgroundColor: Colors.accent.indigo,
    borderColor:     Colors.accent.indigo,
    shadowOpacity:   0.5,
  },
});
