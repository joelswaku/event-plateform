import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useChatStore } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';
import { FloatingChatButton } from '@/components/FloatingChatButton';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'account', label: 'Account' },
  { id: 'billing', label: 'Billing' },
  { id: 'events', label: 'Events' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'planner', label: 'Planner' },
  { id: 'mobile', label: 'Mobile' },
];

const FAQ_ITEMS = [
  // Account & Billing
  {
    q: 'How do I upgrade or cancel my plan?',
    a: 'Go to Profile → Plans & Billing to view available plans, upgrade to Premium, or manage your subscription.',
    category: 'billing'
  },
  {
    q: 'What payment methods are supported?',
    a: 'We support all major credit and debit cards (Visa, Mastercard, Amex, Discover) through Stripe. Apple Pay and Google Pay are also supported.',
    category: 'billing'
  },
  {
    q: 'Can I get a refund if I cancel?',
    a: "You can cancel anytime and keep access until the end of your billing period. We don't offer prorated refunds for partial months.",
    category: 'billing'
  },
  {
    q: 'How do I change my email address?',
    a: "Go to Profile → Edit Profile and update your email. You'll receive a verification email at the new address to confirm the change.",
    category: 'account'
  },
  {
    q: 'How do I reset my password?',
    a: "Use the \"Forgot password\" link on the login screen. You'll receive an email with instructions to reset your password.",
    category: 'account'
  },

  // Events & Guests
  {
    q: 'How do I create a new event?',
    a: 'Tap the "+" button on the Events tab. Fill in your event details, set your ticket tiers, and tap Publish to make it live.',
    category: 'events'
  },
  {
    q: 'Can I create multiple events?',
    a: 'Yes! All plans support unlimited events. Create as many events as you need — simultaneous or scheduled for different dates.',
    category: 'events'
  },
  {
    q: "Why aren't my guests receiving emails?",
    a: "Check your event's email settings and ensure the guest has a valid email address. Emails can sometimes land in spam — ask guests to check there.",
    category: 'events'
  },
  {
    q: 'How do I export my guest list?',
    a: "On any event's Guests page, tap the Export button. You can export all guests or filter by status before exporting.",
    category: 'events'
  },
  {
    q: 'Can I send custom messages to my guests?',
    a: "Yes. Go to your event's Guests tab, select the guests, and tap Send Message. Pro users can also set up automated email reminders.",
    category: 'events'
  },
  {
    q: 'How do I delete an event?',
    a: 'Open the event, tap the three-dot menu, and select Delete Event. Events with sold tickets cannot be deleted — cancel them instead.',
    category: 'events'
  },

  // Tickets & Check-in
  {
    q: 'How do guests receive their tickets?',
    a: 'After a successful purchase, tickets are emailed to the guest automatically. Guests can also access their tickets anytime by entering their email in the My Tickets screen.',
    category: 'tickets'
  },
  {
    q: 'How do I check in guests at the door?',
    a: "Use the Scanner tab to scan the QR code on each guest's ticket. You can also manually search and check in guests from the event's guest list.",
    category: 'tickets'
  },
  {
    q: 'Can I change my ticket price after publishing?',
    a: 'You can edit ticket prices on draft events. For published events with existing purchases, pricing changes only apply to new sales — existing buyers are unaffected.',
    category: 'tickets'
  },
  {
    q: 'How do refunds work?',
    a: "Go to the ticket order in your event's Tickets page and tap Refund. The refund is processed through Stripe and typically takes 5-10 business days.",
    category: 'tickets'
  },
  {
    q: 'Can I create different ticket types?',
    a: 'Yes! You can create multiple ticket types (General, VIP, Early Bird, etc.) with different prices, quantities, and sale periods.',
    category: 'tickets'
  },
  {
    q: 'What if someone scans a QR code twice?',
    a: 'The system tracks check-ins. If a guest is already checked in, the scanner shows a warning. You can check them in again if needed.',
    category: 'tickets'
  },

  // Planner & Features
  {
    q: 'What is the Event Planner?',
    a: 'The Event Planner (Pro plan) helps you manage tasks, vendors, budget, and timeline all in one place. It includes AI-powered task suggestions.',
    category: 'planner'
  },
  {
    q: 'How do I access the Planner?',
    a: 'The Planner requires a Pro or Enterprise plan. After upgrading, tap Planner in the bottom nav and attach a planner to any event.',
    category: 'planner'
  },
  {
    q: 'Can I collaborate with team members?',
    a: 'Yes! Pro and Enterprise plans support team collaboration. Invite team members to your event and assign them roles.',
    category: 'planner'
  },

  // Mobile
  {
    q: 'Can I use the scanner offline?',
    a: "Yes. The mobile app supports offline check-ins. Scans are queued and automatically synced when you're back online.",
    category: 'mobile'
  },
  {
    q: 'How do I enable notifications?',
    a: 'Go to your device Settings → LiteEvent → Notifications and enable them. You can also manage notification preferences in the app settings.',
    category: 'mobile'
  },
  {
    q: 'Is Face ID/Touch ID supported?',
    a: 'Yes! Enable biometric authentication in Profile → Security to use Face ID or Touch ID for quick and secure login.',
    category: 'mobile'
  },
  {
    q: 'How do I enable dark mode?',
    a: 'Dark mode automatically follows your system preference. Change it in your device Settings → Display & Brightness.',
    category: 'mobile'
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={faqStyles.item}>
      <Pressable style={faqStyles.question} onPress={() => setOpen(v => !v)}>
        <Text style={faqStyles.questionText}>{question}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.text.muted} />
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
  item:         { borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  question:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
  questionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#fff', lineHeight: 20 },
  answerWrap:   { paddingBottom: 14, paddingRight: 26 },
  answerText:   { fontSize: 13, color: Colors.text.muted, lineHeight: 20 },
});

export default function SupportScreen() {
  const router      = useRouter();
  const isSuperAdmin = useAuthStore(s => !!s.user?.is_super_admin);
  const openSupport  = useChatStore(s => s.openSupport);
  const markRead     = useChatStore(s => s.markRead);
  const unreadTotal  = useChatStore(s => s.unreadTotal);
  const fetchUnreadCount = useChatStore(s => s.fetchUnreadCount);
  const [opening, setOpening] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  // Fetch unread count when screen is focused (only for regular users)
  useFocusEffect(
    React.useCallback(() => {
      if (isSuperAdmin) return; // Super admins don't need notifications here

      fetchUnreadCount();

      // Poll every 5 seconds while on this screen
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 5000);

      return () => clearInterval(interval);
    }, [isSuperAdmin, fetchUnreadCount])
  );

  async function handleLiveChat() {
    if (isSuperAdmin) { router.push('/super-admin/chat' as never); return; }
    if (opening) return;
    setOpening(true);
    try {
      const conv = await openSupport();
      if (conv) {
        // Clear the support notification as soon as the user opens its thread.
        await markRead(conv.id);
        await fetchUnreadCount();
        router.push(`/chat/${conv.id}` as never);
      }
      else Alert.alert('Unavailable', 'Could not open support chat. Try again later.');
    } finally { setOpening(false); }
  }

  function handleEmail() {
    Linking.openURL('mailto:support@liteevent.com').catch(() =>
      Alert.alert('Cannot open email', 'Please email us at support@liteevent.com')
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Help &amp; Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="help-circle" size={30} color={Colors.accent.indigo} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Browse the FAQ or reach out directly — we reply within a few hours.</Text>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={[
                styles.categoryChip,
                activeCategory === cat.id && styles.categoryChipActive
              ]}
            >
              <Text style={[
                styles.categoryChipText,
                activeCategory === cat.id && styles.categoryChipTextActive
              ]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* FAQ */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
          {FAQ_ITEMS.filter(item => activeCategory === 'all' || item.category === activeCategory).map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} />
          ))}
          {FAQ_ITEMS.filter(item => activeCategory === 'all' || item.category === activeCategory).length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No questions in this category</Text>
            </View>
          )}
        </View>

        {/* Still need help? */}
        <View style={styles.contactCard}>
          <Text style={styles.sectionLabel}>Still need help?</Text>

          {/* Email */}
          <Pressable style={styles.contactRow} onPress={handleEmail}>
            <View style={[styles.contactIcon, { backgroundColor: `${Colors.accent.indigo}15` }]}>
              <Feather name="mail" size={18} color={Colors.accent.indigo} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Email support</Text>
              <Text style={styles.contactSub}>support@liteevent.com</Text>
            </View>
            <Feather name="external-link" size={14} color={Colors.text.subtle} />
          </Pressable>

          <View style={styles.divider} />

          {/* Live chat */}
          <Pressable style={styles.contactRow} onPress={handleLiveChat} disabled={opening}>
            <View style={[styles.contactIcon, { backgroundColor: 'rgba(16,185,129,0.12)', position: 'relative' }]}>
              {opening
                ? <ActivityIndicator size="small" color="#10b981" />
                : <Feather name="message-square" size={18} color="#10b981" />}
              {!isSuperAdmin && !opening && unreadTotal > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>
                    {unreadTotal > 9 ? '9+' : unreadTotal}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Live chat</Text>
              <Text style={styles.contactSub}>
                {!isSuperAdmin && unreadTotal > 0
                  ? `${unreadTotal} new message${unreadTotal > 1 ? 's' : ''}`
                  : 'Available Mon–Fri, 9am–6pm UTC'}
              </Text>
            </View>
            <View style={styles.onlineDot} />
          </Pressable>
        </View>

        {/* Legal */}
        <View style={styles.legalRow}>
          <Pressable onPress={() => Linking.openURL('https://liteevent.com/privacy-policy')} style={styles.legalLink}>
            <Text style={styles.legalText}>Privacy Policy</Text>
          </Pressable>
          <View style={styles.legalDot} />
          <Pressable onPress={() => Linking.openURL('https://liteevent.com/terms')} style={styles.legalLink}>
            <Text style={styles.legalText}>Terms of Service</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>Version 1.0.0 · LiteEvent</Text>
      </ScrollView>

      {/* Floating Chat Button */}
      <FloatingChatButton onPress={handleLiveChat} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },

  content: { padding: 20, gap: 16, paddingBottom: 60 },

  categoryScroll: { marginHorizontal: -20 },
  categoryContent: { paddingHorizontal: 20, gap: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  categoryChipActive: {
    backgroundColor: Colors.accent.indigo,
    borderColor: Colors.accent.indigo,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.muted,
  },
  categoryChipTextActive: {
    color: '#fff',
  },

  hero:     { alignItems: 'center', gap: 10, paddingVertical: 8 },
  heroIcon: {
    width: 68, height: 68, borderRadius: 22,
    backgroundColor: `rgba(99,102,241,0.12)`,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  heroSub:   { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.text.subtle,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.bg.elevated, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.text.muted,
  },

  contactCard: {
    backgroundColor: Colors.bg.elevated, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    padding: 16, gap: 0,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  contactIcon: {
    width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
  },
  contactText:  { flex: 1, gap: 2 },
  contactTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  contactSub:   { fontSize: 12, color: Colors.text.muted },
  divider:      { height: 1, backgroundColor: Colors.border.subtle, marginVertical: 2 },
  onlineDot:    {
    width: 9, height: 9, borderRadius: 5, backgroundColor: '#10b981',
    shadowColor: '#10b981', shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  },

  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.bg.elevated,
  },
  notificationText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
  },

  legalRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  legalLink: { paddingVertical: 4, paddingHorizontal: 4 },
  legalText: { fontSize: 12, color: Colors.text.muted, textDecorationLine: 'underline' },
  legalDot:  { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.text.subtle },

  version: { fontSize: 11, color: Colors.text.subtle, textAlign: 'center', marginTop: 4 },
});
