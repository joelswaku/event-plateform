import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated,
  Dimensions, Modal, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore }     from '@/store/auth.store';
import { useSADrawerStore } from '@/store/superAdminDrawer.store';
import { Colors } from '@/constants/colors';

const DRAWER_W = Math.min(Dimensions.get('window').width * 0.82, 280);
const GOLD     = '#C9A96E';

interface NavItem {
  icon:  keyof typeof Feather.glyphMap;
  label: string;
  route: string;
}

const NAV: NavItem[] = [
  { icon: 'grid',           label: 'Dashboard',     route: '/super-admin'              },
  { icon: 'zap',            label: 'Activity',      route: '/super-admin/activity'     },
  { icon: 'calendar',       label: 'Events',        route: '/super-admin/events'       },
  { icon: 'briefcase',      label: 'Organizations', route: '/super-admin/organizations'},
  { icon: 'users',          label: 'Users',         route: '/super-admin/users'        },
  { icon: 'shopping-bag',  label: 'Vendors',       route: '/super-admin/vendors'       },
  { icon: 'life-buoy',      label: 'Support',       route: '/super-admin/chat'          },
  { icon: 'bell',           label: 'Notifications', route: '/super-admin/notifications' },
  { icon: 'dollar-sign',    label: 'Revenue',       route: '/super-admin/revenue'       },
  { icon: 'trending-up',    label: 'Financial',     route: '/super-admin/financial'    },
  { icon: 'alert-triangle', label: 'Moderation',    route: '/super-admin/moderation'   },
  { icon: 'cpu',            label: 'AI Insights',   route: '/super-admin/ai'           },
  { icon: 'activity',       label: 'System Health', route: '/super-admin/health'       },
  { icon: 'toggle-left',    label: 'Feature Flags', route: '/super-admin/flags'        },
  { icon: 'clipboard',      label: 'Audit Logs',    route: '/super-admin/audit'        },
  { icon: 'file-text',     label: 'Legal Pages',   route: '/super-admin/legal'        },
];

export function SuperAdminDrawer() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const pathname = usePathname();
  const { isOpen, close } = useSADrawerStore();
  const user   = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const slideX  = useRef(new Animated.Value(-DRAWER_W)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideX, {
        toValue:    isOpen ? 0 : -DRAWER_W,
        damping:    22, stiffness: 200, mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isOpen ? 1 : 0, duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  const initials = (user?.full_name ?? 'SA')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const navigate = (route: string) => {
    close();
    setTimeout(() => router.push(route as never), 60);
  };

  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={close} statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slideX }], paddingTop: insets.top }]}
      >
        {/* Gold gradient glow at top */}
        <LinearGradient
          colors={['rgba(201,169,110,0.18)', 'rgba(201,169,110,0.04)', 'transparent']}
          style={styles.headerGlow}
          pointerEvents="none"
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.shieldWrap}>
              <Feather name="shield" size={16} color="#000" />
            </View>
            <View>
              <Text style={styles.logoTitle}>Super Admin</Text>
              <Text style={styles.logoSub}>Platform Control</Text>
            </View>
          </View>

          {/* User card */}
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>{user?.full_name ?? 'Super Admin'}</Text>
              <Text style={styles.userRole}>Platform Owner</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Navigation — matches web sidebar style */}
          <View style={{ gap: 1 }}>
            {NAV.map(item => {
              const active = item.route === '/super-admin'
                ? pathname === '/super-admin'
                : pathname.startsWith(item.route);
              return (
                <Pressable
                  key={item.route}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => navigate(item.route)}
                >
                  <Feather
                    name={item.icon}
                    size={14}
                    color={active ? GOLD : 'rgba(255,255,255,0.48)'}
                  />
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  {active && (
                    <Feather name="chevron-right" size={11} color={GOLD} style={{ opacity: 0.6 }} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Back to app */}
          <Pressable style={styles.bottomBtn} onPress={() => { close(); router.push('/(tabs)' as never); }}>
            <Feather name="chevron-left" size={12} color="rgba(255,255,255,0.35)" />
            <Text style={styles.bottomBtnText}>Back to Dashboard</Text>
          </Pressable>

          {/* Sign out */}
          <Pressable style={styles.bottomBtn} onPress={() => { close(); logout(); }}>
            <Feather name="log-out" size={12} color="rgba(255,255,255,0.35)" />
            <Text style={styles.bottomBtnText}>Sign out</Text>
          </Pressable>

        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.60)',
  },
  drawer: {
    position:         'absolute',
    left:             0, top: 0, bottom: 0,
    width:            DRAWER_W,
    backgroundColor:  '#0d0d1a',
    borderRightWidth: 1,
    borderRightColor: 'rgba(201,169,110,0.12)',
    shadowColor:      '#000',
    shadowOffset:     { width: 10, height: 0 },
    shadowOpacity:    0.5,
    shadowRadius:     24,
    elevation:        24,
    overflow:         'hidden',
  },
  headerGlow: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 180,
  },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 24 },

  // Logo
  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingBottom: 16, borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,169,110,0.10)', marginBottom: 16,
  },
  shieldWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10,
    elevation: 6,
  },
  logoTitle: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  logoSub:   { fontSize: 10, color: 'rgba(201,169,110,0.70)', fontWeight: '600', marginTop: 1 },

  // User card
  userCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    backgroundColor: 'rgba(201,169,110,0.07)',
    borderRadius:    12,
    padding:         10,
    marginBottom:    12,
  },
  avatar: {
    width: 28, height: 28, borderRadius: 99,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: '900', color: '#000' },
  userName:   { fontSize: 12, fontWeight: '700', color: '#fff' },
  userRole:   { fontSize: 10, color: 'rgba(201,169,110,0.60)', fontWeight: '600', marginTop: 1 },

  divider: { height: 1, backgroundColor: 'rgba(201,169,110,0.10)', marginVertical: 12 },

  // Nav items — matches web sidebar exactly
  navItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingVertical:   9,
    paddingHorizontal: 12,
    borderRadius:      10,
    borderLeftWidth:   2,
    borderLeftColor:   'transparent',
  },
  navItemActive: {
    backgroundColor: 'rgba(201,169,110,0.12)',
    borderLeftColor: GOLD,
  },
  navLabel:       { flex: 1, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.48)' },
  navLabelActive: { color: GOLD, fontWeight: '700' },

  // Bottom buttons
  bottomBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10,
  },
  bottomBtnText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
});
