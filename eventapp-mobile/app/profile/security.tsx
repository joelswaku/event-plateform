import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors } from '@/constants/colors';
import { toast } from '@/lib/toast';
import { InfoModal, useInfo } from '@/components/ui/ConfirmModal';

export default function SecurityScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving,          setSaving]          = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { info, infoProps } = useInfo();

  async function handleSave() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      info({ title: 'Validation', message: 'Please fill in all fields.', variant: 'warning' });
      return;
    }
    if (newPassword.length < 8) {
      info({ title: 'Validation', message: 'New password must be at least 8 characters.', variant: 'warning' });
      return;
    }
    if (newPassword !== confirmPassword) {
      info({ title: 'Validation', message: 'New passwords do not match.', variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Success', 'Your password has been updated.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not update password. Please check your current password and try again.';
      toast.error('Error', msg);
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
          <Text style={styles.headerTitle}>Security</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon + subtitle */}
          <View style={styles.iconSection}>
            <View style={styles.iconWrap}>
              <Feather name="shield" size={28} color={Colors.accent.indigo} />
            </View>
            <Text style={styles.pageSubtitle}>
              Keep your account secure by using a strong, unique password.
            </Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Change Password</Text>

            <PasswordField
              label="Current Password"
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              show={showCurrent}
              onToggleShow={() => setShowCurrent(v => !v)}
            />

            <View style={styles.fieldSep} />

            <PasswordField
              label="New Password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChangeText={setNewPassword}
              show={showNew}
              onToggleShow={() => setShowNew(v => !v)}
            />

            <View style={styles.fieldSep} />

            <PasswordField
              label="Confirm New Password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              show={showConfirm}
              onToggleShow={() => setShowConfirm(v => !v)}
            />
          </View>

          {/* Requirements hint */}
          <View style={styles.hintsCard}>
            <RequirementRow
              met={newPassword.length >= 8}
              text="At least 8 characters"
            />
            <RequirementRow
              met={newPassword === confirmPassword && confirmPassword.length > 0}
              text="Passwords match"
            />
          </View>

          {/* Save button */}
          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Feather name="lock" size={16} color="#fff" />}
            <Text style={styles.saveBtnText}>{saving ? 'Updating…' : 'Update Password'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      <InfoModal {...infoProps} />
    </SafeAreaView>
  );
}

function PasswordField({
  label, placeholder, value, onChangeText, show, onToggleShow,
}: {
  label:          string;
  placeholder:    string;
  value:          string;
  onChangeText:   (v: string) => void;
  show:           boolean;
  onToggleShow:   () => void;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.inputRow}>
        <TextInput
          style={fieldStyles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.subtle}
          secureTextEntry={!show}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        <Pressable onPress={onToggleShow} hitSlop={8} style={fieldStyles.eye}>
          <Feather name={show ? 'eye-off' : 'eye'} size={16} color={Colors.text.muted} />
        </Pressable>
      </View>
    </View>
  );
}

function RequirementRow({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={reqStyles.row}>
      <Feather
        name={met ? 'check-circle' : 'circle'}
        size={13}
        color={met ? Colors.accent.emerald : Colors.text.subtle}
      />
      <Text style={[reqStyles.text, met && { color: Colors.accent.emerald }]}>{text}</Text>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap:     { gap: 6 },
  label:    { fontSize: 12, fontWeight: '600', color: Colors.text.muted },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex:              1,
    backgroundColor:   Colors.bg.input ?? Colors.bg.primary,
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       Colors.border.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical:   12,
    paddingRight:      44,
    color:             '#fff',
    fontSize:          15,
  },
  eye: {
    position: 'absolute',
    right:    14,
  },
});

const reqStyles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 12, color: Colors.text.subtle },
});

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

  content: { padding: 24, gap: 16, paddingBottom: 60 },

  iconSection: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  iconWrap: {
    width:           64,
    height:          64,
    borderRadius:    20,
    backgroundColor: `${Colors.accent.indigo}18`,
    alignItems:      'center',
    justifyContent:  'center',
  },
  pageSubtitle: {
    fontSize:   13,
    color:      Colors.text.muted,
    textAlign:  'center',
    lineHeight: 19,
    maxWidth:   280,
  },

  sectionLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         Colors.text.subtle,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  8,
  },
  card: {
    backgroundColor:   Colors.bg.elevated,
    borderRadius:      16,
    borderWidth:       1,
    borderColor:       Colors.border.DEFAULT,
    padding:           20,
    gap:               4,
  },
  fieldSep: { height: 16 },

  hintsCard: {
    backgroundColor: Colors.bg.elevated,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     Colors.border.subtle,
    padding:         14,
    gap:             8,
  },

  saveBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    paddingVertical: 15,
    borderRadius:   14,
    backgroundColor: Colors.accent.indigo,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
