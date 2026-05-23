import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuthStore }         from '@/store/auth.store';
import { useDrawerStore }       from '@/store/drawer.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { ConfirmModal }         from '@/components/ui/ConfirmModal';
import { Colors }               from '@/constants/colors';

export default function ProfileTab() {
  const router       = useRouter();
  const openDrawer   = useDrawerStore(s => s.open);
  const user         = useAuthStore(s => s.user);
  const logout       = useAuthStore(s => s.logout);
  const updateAvatar = useAuthStore(s => s.updateAvatar);
  const [logoutModal,    setLogoutModal]    = useState(false);
  const [avatarLoading,  setAvatarLoading]  = useState(false);

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo library access to change your profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setAvatarLoading(true);
    const res = await updateAvatar(asset.uri, asset.mimeType ?? 'image/jpeg', asset.fileName ?? 'avatar.jpg');
    setAvatarLoading(false);
    if (!res.success) Alert.alert('Upload failed', res.message ?? 'Could not update photo.');
  }

  const isSubscribed = useSubscriptionStore(s => s.isSubscribed);
  const plan         = useSubscriptionStore(s => s.plan);
  const isPremium    = isSubscribed && plan !== 'free';

  const PLAN_DISPLAY: Record<string, string> = {
    free: 'Free', starter: 'Starter', pro: 'Pro', premium: 'Pro', enterprise: 'Enterprise',
  };
  const planDisplayName = PLAN_DISPLAY[plan] ?? 'Free';

  const initials = (user?.full_name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pageHeader}>
        <Pressable style={styles.menuBtn} onPress={openDrawer} hitSlop={10}>
          <Feather name="menu" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar + name */}
        <View style={styles.profileHead}>
          <Pressable onPress={handlePickAvatar} style={styles.avatarWrap}>
            <LinearGradient
              colors={[`${Colors.accent.indigo}40`, `${Colors.accent.violet}30`]}
              style={styles.avatarRing}
            >
              <View style={styles.avatar}>
                {user?.avatar_url
                  ? <Image source={{ uri: user.avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <Text style={styles.avatarText}>{initials}</Text>}
              </View>
            </LinearGradient>
            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              {avatarLoading
                ? <ActivityIndicator size={10} color="#fff" />
                : <Feather name="camera" size={11} color="#fff" />}
            </View>
          </Pressable>
          <Text style={styles.name}>{user?.full_name ?? '—'}</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>

        {/* Plan card */}
        <View style={[styles.planCard, { borderColor: isPremium ? `${Colors.accent.gold}40` : Colors.border.DEFAULT }]}>
          <LinearGradient
            colors={isPremium
              ? [Colors.bg.elevated, `${Colors.accent.gold}08`]
              : [Colors.bg.elevated, Colors.bg.elevated]}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
          <View style={styles.planRow}>
            <View>
              <Text style={styles.planLabel}>Current Plan</Text>
              <Text style={[styles.planName, { color: isPremium ? Colors.accent.gold : Colors.text.muted }]}>
                {isPremium ? `✦ ${planDisplayName}` : 'Free'}
              </Text>
            </View>
            {!isPremium && (
              <Pressable
                style={styles.upgradeBtn}
                onPress={() => router.push('/profile/billing' as never)}
              >
                <Feather name="zap" size={13} color={Colors.accent.amber} />
                <Text style={styles.upgradeBtnText}>Upgrade</Text>
              </Pressable>
            )}
          </View>
          {!isPremium && (
            <Text style={styles.planLimits}>
              Free: 1 event · 50 guests · 3 templates
            </Text>
          )}
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          <MenuItem icon="user"        label="Edit Profile"    onPress={() => router.push('/profile/edit-profile' as never)} />
          <MenuItem icon="calendar"    label="My Events"       onPress={() => router.push('/(tabs)/events' as never)} />
          <MenuItem icon="credit-card" label="My Tickets"      onPress={() => router.push('/my-tickets' as never)} />
          <MenuItem icon="layers"      label="Plans & Billing" onPress={() => router.push('/profile/billing' as never)} />
          <MenuItem icon="bell"        label="Notifications"   onPress={() => router.push('/profile/notifications' as never)} />
          <MenuItem icon="shield"      label="Security"        onPress={() => router.push('/profile/security' as never)} />
          <MenuItem icon="help-circle" label="Help & Support"  onPress={() => router.push('/profile/support' as never)} />
        </View>

        {/* Logout */}
        <Pressable
          style={styles.logoutBtn}
          onPress={() => setLogoutModal(true)}
        >
          <Feather name="log-out" size={16} color={Colors.accent.red} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

      </ScrollView>

      <ConfirmModal
        open={logoutModal}
        title="Sign out?"
        description="You'll need to log back in to manage your events."
        confirmText="Sign Out"
        variant="danger"
        onConfirm={() => logout()}
        onClose={() => setLogoutModal(false)}
      />
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconWrap}>
        <Feather name={icon} size={16} color={Colors.accent.indigo} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Feather name="chevron-right" size={16} color={Colors.text.subtle} style={{ marginLeft: 'auto' }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg.primary },
  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  content:   { padding: 24, gap: 20, paddingBottom: 100 },

  profileHead: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  avatarWrap: { position: 'relative' },
  avatarRing: {
    width:        96,
    height:       96,
    borderRadius: 48,
    padding:       3,
  },
  avatar: {
    flex:            1,
    borderRadius:    48,
    backgroundColor: Colors.bg.elevated,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: Colors.accent.indigo },
  cameraBadge: {
    position:        'absolute',
    bottom:          2,
    right:           2,
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: Colors.accent.indigo,
    borderWidth:     2,
    borderColor:     Colors.bg.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  name:       { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  email:      { fontSize: 13, color: Colors.text.muted },

  planCard: {
    borderRadius:  16,
    borderWidth:   1,
    padding:       16,
    overflow:      'hidden',
    gap:           6,
    backgroundColor: Colors.bg.elevated,
  },
  planRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planLabel:   { fontSize: 10, fontWeight: '700', color: Colors.text.subtle, letterSpacing: 0.8, textTransform: 'uppercase' },
  planName:    { fontSize: 18, fontWeight: '900', marginTop: 2 },
  planLimits:  { fontSize: 11, color: Colors.text.subtle },
  upgradeBtn:  {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 12,
    paddingVertical:   7,
    borderRadius:      99,
    backgroundColor:   `${Colors.accent.amber}18`,
    borderWidth:       1,
    borderColor:       `${Colors.accent.amber}35`,
  },
  upgradeBtnText: { fontSize: 12, fontWeight: '800', color: Colors.accent.amber },

  menu:     { gap: 2 },
  menuItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingVertical:   14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  menuIconWrap: {
    width:           36,
    height:          36,
    borderRadius:    10,
    backgroundColor: `${Colors.accent.indigo}15`,
    alignItems:      'center',
    justifyContent:  'center',
  },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },

  logoutBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    paddingVertical: 14,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     `${Colors.accent.red}30`,
    backgroundColor: `${Colors.accent.red}10`,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: Colors.accent.red },
});
