import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const color = focused ? '#ffffff' : 'rgba(255,255,255,0.45)';
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Feather name={name} size={17} color={color} />
        {!!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const offlineQueue = useScannerStore(s => s.offlineQueue);
  const pendingCount = offlineQueue.length;
  const isIOS = Platform.OS === 'ios';
  const bottomInset = isIOS ? Math.max(insets.bottom, 22) : Math.max(insets.bottom, 8);
  const tabContentHeight = isIOS ? 50 : 64;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Android can draw its system navigation controls over app content.
        // Reserve that inset so every tab remains visible and tappable.
        tabBarStyle: [
          styles.tabBar,
          { height: tabContentHeight + bottomInset, paddingBottom: bottomInset },
        ],
        // The selected state belongs to TabIcon only. Do not let the navigator
        // paint a full-width selected/pressed background behind the bar.
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarItemStyle: styles.tabBarItem,
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
        name="scanner"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <View style={styles.scanTab}>
                <Feather name="maximize" size={20} color="#fff" />
              </View>
              <Text style={[styles.tabLabel, { color: Colors.text.subtle }]}>Scan</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="clipboard" focused={focused} label="Planner" />
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
      {/* Hidden — accessible via event detail or drawer */}
      <Tabs.Screen name="builder" options={{ href: null }} />
      <Tabs.Screen name="tickets" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    height:            Platform.OS === 'ios' ? 84 : 64,
    borderTopWidth:    1,
    borderTopColor:    'rgba(11,148,253,0.38)',
    backgroundColor:   '#071827',
    elevation:         18,
    paddingBottom:     Platform.OS === 'ios' ? 22 : 6,
    paddingHorizontal: 0,
  },
  tabItem: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:            1,
    paddingTop:     2,
    minWidth:       44,
  },
  tabBarItem: {
    backgroundColor: 'transparent',
  },
  iconWrap: {
    width:           38,
    height:          38,
    borderRadius:    11,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(99,102,241,0.20)',  // Indigo background when selected
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.50)',     // Brighter border
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
  tabLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         'rgba(255,255,255,0.45)',  // Brighter gray for better readability
    letterSpacing: 0,
    textAlign:     'center',
  },
  tabLabelActive: {
    color: '#ffffff',  // Pure white when selected for maximum contrast
    fontWeight: '800',
  },

  // Scan center FAB — green, matches web mobile
  scanTab: {
    width:           54,
    height:          54,
    borderRadius:    16,
    backgroundColor: '#059669',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       -10,
    shadowColor:     '#10b981',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.45,
    shadowRadius:    12,
    elevation:       8,
  },
});
