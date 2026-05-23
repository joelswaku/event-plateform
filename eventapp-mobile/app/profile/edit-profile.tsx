import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Pressable,
  Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Colors } from '@/constants/colors';

export default function EditProfileScreen() {
  const router    = useRouter();
  const user      = useAuthStore(s => s.user);
  const fetchMe   = useAuthStore(s => s.fetchMe);

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [saving,   setSaving]   = useState(false);

  const initials = (user?.full_name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  async function handleSave() {
    const trimmed = fullName.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/profile', { full_name: trimmed });
      await fetchMe();
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not save profile. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
            <Feather name="chevron-left" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar display */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                {user?.avatar_url
                  ? <Image source={{ uri: user.avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <Text style={styles.avatarText}>{initials}</Text>}
              </View>
            </View>
            <Text style={styles.avatarHint}>To change your photo, go to Profile and tap your avatar.</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Personal Info</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor={Colors.text.subtle}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>

            <View style={[styles.field, { marginTop: 16 }]}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputReadOnly}>
                <Text style={styles.inputReadOnlyText}>{user?.email ?? '—'}</Text>
                <Feather name="lock" size={13} color={Colors.text.subtle} style={{ marginLeft: 8 }} />
              </View>
              <Text style={styles.fieldHint}>Email cannot be changed here.</Text>
            </View>
          </View>

          {/* Save button */}
          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Feather name="check" size={16} color="#fff" />}
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  backBtn: {
    width:           40,
    height:          40,
    borderRadius:    12,
    backgroundColor: Colors.bg.elevated,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },

  content: { padding: 24, gap: 20, paddingBottom: 60 },

  avatarSection: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  avatarRing: {
    width:           88,
    height:          88,
    borderRadius:    44,
    borderWidth:     2,
    borderColor:     `${Colors.accent.indigo}50`,
    padding:         3,
  },
  avatar: {
    flex:            1,
    borderRadius:    40,
    backgroundColor: Colors.bg.elevated,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  avatarText: { fontSize: 26, fontWeight: '900', color: Colors.accent.indigo },
  avatarHint: { fontSize: 12, color: Colors.text.muted, textAlign: 'center', maxWidth: 240 },

  card: {
    backgroundColor: Colors.bg.elevated,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    padding:         20,
    gap:             4,
  },
  sectionLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         Colors.text.subtle,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  8,
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.muted },
  input: {
    backgroundColor:   Colors.bg.input ?? Colors.bg.primary,
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       Colors.border.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical:   12,
    color:             '#fff',
    fontSize:          15,
  },
  inputReadOnly: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.bg.input ?? Colors.bg.primary,
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       Colors.border.subtle,
    paddingHorizontal: 14,
    paddingVertical:   12,
    opacity:           0.6,
  },
  inputReadOnlyText: { flex: 1, color: Colors.text.muted, fontSize: 15 },
  fieldHint: { fontSize: 11, color: Colors.text.subtle },

  saveBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    paddingVertical:   15,
    borderRadius:      14,
    backgroundColor:   Colors.accent.indigo,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
