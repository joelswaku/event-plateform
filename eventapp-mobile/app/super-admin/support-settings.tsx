import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, Pressable,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors } from '@/constants/colors';
import { showSuccess, showError } from '@/lib/toast';

const BG = '#07070f';
const CARD = '#0d0d1a';
const GOLD = '#C9A96E';

interface SupportSettings {
  auto_reply_enabled: boolean;
  auto_reply_message: string;
}

export default function SupportSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: SupportSettings }>('/chat/support-settings');
      const data = res.data?.data;
      if (data) {
        setEnabled(data.auto_reply_enabled ?? true);
        setMessage(data.auto_reply_message || 'Thank you for contacting support! A team member will respond to your message shortly.');
      }
    } catch (err) {
      console.error('Failed to load support settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleSave = async () => {
    if (!message.trim()) {
      showError('Auto-reply message cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await api.put('/chat/support-settings', {
        auto_reply_enabled: enabled,
        auto_reply_message: message.trim(),
      });
      showSuccess('Support settings saved successfully');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save settings';
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset to Default',
      'Reset auto-reply message to default text?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setMessage('Thank you for contacting support! A team member will respond to your message shortly.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
            <Feather name="chevron-left" size={22} color={GOLD} />
          </Pressable>
          <Text style={styles.headerTitle}>Support Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={GOLD} size="large" />
          </View>
        ) : (
          <>
            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Feather name="info" size={16} color={Colors.accent.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Automatic Welcome Message</Text>
                <Text style={styles.infoBody}>
                  When users send their first message to support, they'll automatically receive this reply. Customize it to set expectations and reassure users.
                </Text>
              </View>
            </View>

            {/* Enable/Disable Toggle */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Feather name="message-circle" size={15} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Auto-Reply Status</Text>
                  <Text style={styles.cardSub}>
                    {enabled ? 'Users receive automatic welcome message' : 'Auto-reply is disabled'}
                  </Text>
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Enable Auto-Reply</Text>
                <Pressable
                  style={[styles.toggle, enabled && styles.toggleActive]}
                  onPress={() => setEnabled(!enabled)}
                >
                  <View style={[styles.toggleKnob, enabled && styles.toggleKnobActive]} />
                </Pressable>
              </View>
            </View>

            {/* Message Editor */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Feather name="edit-3" size={15} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Auto-Reply Message</Text>
                  <Text style={styles.cardSub}>Customize the automatic welcome message</Text>
                </View>
              </View>

              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={styles.textarea}
                value={message}
                onChangeText={setMessage}
                placeholder="Enter your auto-reply message..."
                placeholderTextColor="rgba(255,255,255,0.22)"
                multiline
                maxLength={500}
                editable={enabled}
              />
              <View style={styles.charRow}>
                <Text style={styles.charCount}>{message.length}/500</Text>
                {enabled && (
                  <Pressable onPress={handleReset}>
                    <Text style={styles.resetLink}>Reset to default</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Preview */}
            {enabled && message.trim() && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderIcon}>
                    <Feather name="eye" size={15} color={Colors.accent.indigo} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Preview</Text>
                    <Text style={styles.cardSub}>How users will see the message</Text>
                  </View>
                </View>

                <View style={styles.previewBubble}>
                  <Text style={styles.previewText}>{message}</Text>
                  <Text style={styles.previewTime}>Just now</Text>
                </View>
              </View>
            )}

            {/* Save Button */}
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Feather name="check" size={16} color="#000" />
                  <Text style={styles.saveTxt}>Save Settings</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 16, gap: 16, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },

  loadingWrap: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: `${Colors.accent.indigo}15`,
    borderWidth: 1,
    borderColor: `${Colors.accent.indigo}30`,
    borderRadius: 14,
    padding: 14,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: `${Colors.accent.indigo}25`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accent.indigo,
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.60)',
    lineHeight: 18,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.18)',
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(201,169,110,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  cardSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: GOLD,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },

  label: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  textarea: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    height: 140,
    textAlignVertical: 'top',
  },
  charRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.22)',
  },
  resetLink: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent.indigo,
  },

  previewBubble: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 16,
    borderBottomLeftRadius: 6,
    padding: 14,
    maxWidth: '85%',
  },
  previewText: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 21,
    marginBottom: 4,
  },
  previewTime: {
    fontSize: 10,
    color: Colors.text.subtle,
    alignSelf: 'flex-end',
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: GOLD,
    marginTop: 8,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveTxt: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
});
