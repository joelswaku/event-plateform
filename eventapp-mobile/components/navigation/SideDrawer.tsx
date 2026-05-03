import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Dimensions,
  Modal, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore }   from '@/store/auth.store';
import { useDrawerStore } from '@/store/drawer.store';
import { Colors } from '@/constants/colors';

const DRAWER_W = Math.min(Dimensions.get('window').width * 0.78, 320);

interface NavItem {
  icon:   keyof typeof Feather.glyphMap;
  label:  string;
  route:  string;
  accent: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'home',        label: 'Home',       route: '/(tabs)',           accent: Colors.accent.indigo  },
  { icon: 'calendar',    label: 'My Events',  route: '/(tabs)/events',    accent: Colors.accent.violet  },
  { icon: 'layout',      label: 'Builder',    route: '/(tabs)/builder',   accent: Colors.accent.cyan    },
  { icon: 'camera',      label: 'Scanner',    route: '/(tabs)/scanner',   accent: Colors.accent.emerald },
  { icon: 'credit-card', label: 'My Tickets', route: '/(tabs)/tickets',   accent: Colors.accent.amber   },
  { icon: 'user',        label: 'Profile',    route: '/(tabs)/profile',   accent: Colors.accent.indigo  },
];

export function SideDrawer() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const segments = useSegments();
  const { isOpen, close } = useDrawerStore();
  const user     = useAuthStore(s => s.user);
  const logout   = useAuthStore(s => s.logout);

  const slideX = useRef(new Animated.Value(-DRAWER_W)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideX, {
        toValue: isOpen ? 0 : -DRAWER_W,
        damping: 22,
        stiffness: 200,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  const isPremium = user?.is_subscribed && user?.subscription_plan === 'premium';

  const initials = (user?.full_name ?? 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const currentRoute = `/${segments.slice(1).join('/')}`;

  const navigate = (route: string) => {
    close();
    setTimeout(() => router.push(route as never), 50);
  };

  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={close} statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideX }], paddingTop: insets.top }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* User profile section */}
          <View style={styles.profileSection}>
            <LinearGradient
              colors={[`${Colors.accent.indigo}30`, `${Colors.accent.violet}20`]}
              style={styles.avatarRing}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{user?.full_name ?? '—'}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{user?.email ?? '—'}</Text>
              <View style={[styles.planBadge, { backgroundColor: isPremium ? `${Colors.accent.gold}20` : `${Colors.accent.emerald}20` }]}>
                <Text style={[styles.planText, { color: isPremium ? Colors.accent.gold : Colors.accent.emerald }]}>
                  {isPremium ? '✦ Premium' : '🎁 Free Plan'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Navigation items */}
          <View style={styles.navSection}>
            <Text style={styles.navSectionLabel}>Navigation</Text>
            {NAV_ITEMS.map(item => {
              const active = currentRoute.includes(item.route.replace('/(tabs)', ''));
              return (
                <Pressable
                  key={item.route}
                  style={[styles.navItem, active && { backgroundColor: `${item.accent}12` }]}
                  onPress={() => navigate(item.route)}
                >
                  <View style={[styles.navIcon, { backgroundColor: `${item.accent}18` }]}>
                    <Feather name={item.icon} size={17} color={active ? item.accent : Colors.text.muted} />
                  </View>
                  <Text style={[styles.navLabel, active && { color: item.accent }]}>{item.label}</Text>
                  {active && <View style={[styles.activeBar, { backgroundColor: item.accent }]} />}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Upgrade CTA */}
          {!isPremium && (
            <Pressable onPress={() => navigate('/profile/upgrade')} style={styles.upgradeCard}>
              <LinearGradient
                colors={[`${Colors.accent.amber}22`, `${Colors.accent.violet}18`]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              />
              <View style={styles.upgradeRow}>
                <Text style={styles.upgradeIcon}>✨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                  <Text style={styles.upgradeSub}>Unlimited events, guests & templates</Text>
                </View>
                <Feather name="chevron-right" size={16} color={Colors.accent.amber} />
              </View>
            </Pressable>
          )}

          {/* Sign out */}
          <Pressable
            style={styles.signOutBtn}
            onPress={() => { close(); logout(); }}
          >
            <Feather name="log-out" size={15} color={Colors.accent.red} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>

        </ScrollView>

        {/* Version */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.footerText}>EventApp v1.0.0</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  drawer: {
    position:        'absolute',
    left:            0,
    top:             0,
    bottom:          0,
    width:           DRAWER_W,
    backgroundColor: Colors.bg.sheet,
    borderRightWidth: 1,
    borderRightColor: Colors.border.DEFAULT,
    shadowColor:     '#000',
    shadowOffset:    { width: 8, height: 0 },
    shadowOpacity:   0.4,
    shadowRadius:    20,
    elevation:       20,
  },
  scrollContent: { padding: 20, gap: 8, paddingBottom: 20 },

  // Profile
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  avatarRing: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: `${Colors.accent.indigo}40`,
  },
  avatarText:   { fontSize: 20, fontWeight: '900', color: Colors.accent.indigo },
  profileInfo:  { flex: 1, gap: 3 },
  profileName:  { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  profileEmail: { fontSize: 11, color: Colors.text.muted },
  planBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99, marginTop: 2,
  },
  planText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  divider: { height: 1, backgroundColor: Colors.border.subtle, marginVertical: 8 },

  // Nav
  navSection:      { gap: 2 },
  navSectionLabel: { fontSize: 9, fontWeight: '800', color: Colors.text.subtle, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4, paddingLeft: 4 },
  navItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingVertical:   11,
    paddingHorizontal: 10,
    borderRadius:      12,
    position:          'relative',
  },
  navIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  navLabel:  { fontSize: 14, fontWeight: '600', color: Colors.text.muted, flex: 1 },
  activeBar: {
    position: 'absolute', right: 10,
    width: 3, height: 20, borderRadius: 2,
  },

  // Upgrade
  upgradeCard: {
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: `${Colors.accent.amber}25`,
    overflow: 'hidden', marginTop: 4,
  },
  upgradeRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  upgradeIcon: { fontSize: 22 },
  upgradeTitle:{ fontSize: 13, fontWeight: '800', color: '#fff' },
  upgradeSub:  { fontSize: 11, color: Colors.text.muted, marginTop: 1 },

  // Sign out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12, marginTop: 8,
    borderWidth: 1, borderColor: `${Colors.accent.red}25`,
    backgroundColor: `${Colors.accent.red}08`,
  },
  signOutText: { fontSize: 13, fontWeight: '700', color: Colors.accent.red },

  footer:     { paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: Colors.border.subtle, paddingTop: 12 },
  footerText: { fontSize: 10, color: Colors.text.subtle, textAlign: 'center' },
});
