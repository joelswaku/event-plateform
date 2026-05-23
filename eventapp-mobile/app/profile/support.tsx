import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const FAQ_ITEMS = [
  {
    q: 'How do I create a new event?',
    a: 'Tap the "+" button on the Events tab. Fill in your event details, set your ticket tiers, and tap Publish to make it live.',
  },
  {
    q: 'Can I change my ticket price after publishing?',
    a: 'You can edit ticket prices on draft events. For published events with existing purchases, pricing changes only apply to new sales — existing buyers are unaffected.',
  },
  {
    q: 'How do guests receive their tickets?',
    a: 'After a successful purchase, tickets are emailed to the guest automatically. Guests can also access their tickets anytime by entering their email in the My Tickets screen.',
  },
  {
    q: 'How do I check in guests at the door?',
    a: 'Use the Scanner tab to scan the QR code on each guest\'s ticket. You can also manually search and check in guests from the event\'s guest list.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'We support all major credit and debit cards via our secure payment processor. Payment availability may vary by region.',
  },
  {
    q: 'How do I upgrade or cancel my plan?',
    a: 'Go to Profile → Plans & Billing to view available plans, upgrade to Premium, or manage your subscription.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={faqStyles.item}>
      <Pressable style={faqStyles.question} onPress={() => setOpen(v => !v)}>
        <Text style={faqStyles.questionText}>{question}</Text>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.text.muted}
        />
      </Pressable>
      {open && (
        <View style={faqStyles.answerWrap}>
          <Text style={faqStyles.answerText}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

const faqStyles = StyleSheet.create({
  item: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  question: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 14,
    gap:             10,
  },
  questionText: {
    flex:       1,
    fontSize:   14,
    fontWeight: '600',
    color:      '#fff',
    lineHeight: 20,
  },
  answerWrap: {
    paddingBottom: 14,
    paddingRight:  26,
  },
  answerText: {
    fontSize:   13,
    color:      Colors.text.muted,
    lineHeight: 20,
  },
});

export default function SupportScreen() {
  const router = useRouter();

  function handleContactSupport() {
    Linking.openURL('mailto:support@meetcraft.app').catch(() => {
      Alert.alert('Unable to open email', 'Please email us at support@meetcraft.app');
    });
  }

  function handlePrivacyPolicy() {
    Alert.alert('Privacy Policy', 'Our privacy policy will be available at meetcraft.app/privacy.');
  }

  function handleTermsOfService() {
    Alert.alert('Terms of Service', 'Our terms of service will be available at meetcraft.app/terms.');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="help-circle" size={30} color={Colors.accent.indigo} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>
            Browse the FAQ below or reach out directly.
          </Text>
        </View>

        {/* FAQ */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
          {FAQ_ITEMS.map((item, index) => (
            <FAQItem key={index} question={item.q} answer={item.a} />
          ))}
        </View>

        {/* Contact support */}
        <Pressable style={styles.contactBtn} onPress={handleContactSupport}>
          <View style={styles.contactIconWrap}>
            <Feather name="mail" size={18} color={Colors.accent.indigo} />
          </View>
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Contact Support</Text>
            <Text style={styles.contactSub}>support@meetcraft.app</Text>
          </View>
          <Feather name="chevron-right" size={16} color={Colors.text.subtle} />
        </Pressable>

        {/* Legal links */}
        <View style={styles.legalRow}>
          <Pressable style={styles.legalLink} onPress={handlePrivacyPolicy}>
            <Text style={styles.legalText}>Privacy Policy</Text>
          </Pressable>
          <View style={styles.legalDot} />
          <Pressable style={styles.legalLink} onPress={handleTermsOfService}>
            <Text style={styles.legalText}>Terms of Service</Text>
          </Pressable>
        </View>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
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

  content: { padding: 24, gap: 16, paddingBottom: 60 },

  hero: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  heroIcon: {
    width:           68,
    height:          68,
    borderRadius:    22,
    backgroundColor: `${Colors.accent.indigo}18`,
    alignItems:      'center',
    justifyContent:  'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  heroSub:   { fontSize: 13, color: Colors.text.muted, textAlign: 'center' },

  sectionLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         Colors.text.subtle,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  4,
  },
  card: {
    backgroundColor:   Colors.bg.elevated,
    borderRadius:      16,
    borderWidth:       1,
    borderColor:       Colors.border.DEFAULT,
    paddingHorizontal: 16,
    paddingTop:        14,
    paddingBottom:     4,
  },

  contactBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    backgroundColor: Colors.bg.elevated,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    padding:         16,
  },
  contactIconWrap: {
    width:           44,
    height:          44,
    borderRadius:    13,
    backgroundColor: `${Colors.accent.indigo}15`,
    alignItems:      'center',
    justifyContent:  'center',
  },
  contactText:  { flex: 1, gap: 2 },
  contactTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  contactSub:   { fontSize: 12, color: Colors.text.muted },

  legalRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
  },
  legalLink: { paddingVertical: 4, paddingHorizontal: 4 },
  legalText: { fontSize: 12, color: Colors.text.muted, textDecorationLine: 'underline' },
  legalDot:  { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.text.subtle },

  version: {
    fontSize:   11,
    color:      Colors.text.subtle,
    textAlign:  'center',
    marginTop:  4,
  },
});
