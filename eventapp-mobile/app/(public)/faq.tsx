import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

const FAQ_DATA = [
  {
    category: 'Getting Started',
    icon: 'help-circle',
    questions: [
      {
        question: 'How do I create my first event?',
        answer:
          "Creating your first event is easy! After signing up, click 'Create Event' from your dashboard. Choose a template, add your event details (name, date, location), customize the design, and publish. The entire process takes less than 10 minutes.",
      },
      {
        question: 'Do I need technical skills to use LiteEvent?',
        answer:
          'No technical skills required! LiteEvent is designed to be user-friendly. Our drag-and-drop editor, pre-built templates, and intuitive interface make it easy for anyone to create professional events without coding knowledge.',
      },
      {
        question: 'Can I try LiteEvent before committing to a paid plan?',
        answer:
          'Absolutely! Our Free plan is available forever with no credit card required. You can create 1 event with up to 50 guests to test all the basic features. Upgrade anytime as your needs grow.',
      },
      {
        question: 'How long does it take to set up an event?',
        answer:
          'Most users complete their first event setup in 5-15 minutes. Simply select a template, fill in your event details, upload images, customize colors, and publish. You can always edit and refine later.',
      },
    ],
  },
  {
    category: 'Events & Tickets',
    icon: 'book',
    questions: [
      {
        question: 'What types of events can I create?',
        answer:
          'LiteEvent supports all event types: weddings, conferences, birthdays, concerts, fundraisers, workshops, networking events, festivals, corporate events, and more. Choose from templates designed specifically for your event type.',
      },
      {
        question: 'Can I sell tickets through LiteEvent?',
        answer:
          'Yes! Our Starter and Pro plans include integrated ticketing. Create multiple ticket types (Early Bird, VIP, General Admission), set prices, add discounts, and accept payments securely through Stripe. We charge a small platform fee (5% for Starter, 2% for Pro).',
      },
      {
        question: 'How do I set up different ticket types and pricing?',
        answer:
          "In your event settings, go to Ticketing and click 'Add Ticket Type'. Create multiple tiers (Free, Early Bird, VIP, etc.), set quantities, prices, descriptions, and sale periods. You can also create promo codes for discounts.",
      },
      {
        question: 'Can I offer early bird pricing or discounts?',
        answer:
          'Yes! Create time-limited ticket types for early bird pricing, or generate promo codes for percentage or fixed-amount discounts. Set validity periods and usage limits to control how discounts are applied.',
      },
      {
        question: 'Can I create private or invite-only events?',
        answer:
          "Absolutely! Toggle your event to 'Private' mode, and it will only be accessible via direct link or invitation. You can also require a password or manually approve each RSVP before confirming guest access.",
      },
    ],
  },
  {
    category: 'Guest Management',
    icon: 'users',
    questions: [
      {
        question: 'How does RSVP tracking work?',
        answer:
          "When guests visit your event page, they can RSVP by filling out a form. You'll receive instant notifications and see real-time updates in your dashboard. Track who's attending, declined, or pending, and export guest lists anytime.",
      },
      {
        question: 'Can guests bring plus-ones?',
        answer:
          "Yes! Enable the 'Allow Plus-Ones' option in your RSVP settings. Guests can indicate how many people they're bringing. You can set a maximum limit per guest or require approval for plus-ones.",
      },
      {
        question: 'How do I check guests in at the event?',
        answer:
          'Use our mobile app or web scanner to scan guest QR codes at the entrance. Each ticket/RSVP includes a unique QR code. Scan to instantly mark guests as checked-in, view ticket details, and prevent duplicate entries.',
      },
      {
        question: 'Can I send mass emails to all guests?',
        answer:
          'Yes! Use the communication tools in your event dashboard to send announcements, reminders, or updates to all attendees, specific ticket types, or custom segments. Track open rates and engagement.',
      },
    ],
  },
  {
    category: 'Billing & Plans',
    icon: 'dollar-sign',
    questions: [
      {
        question: 'How much does LiteEvent cost?',
        answer:
          'Free plan: $0 forever for 1 event and 50 guests. Starter plan: $19/month for 5 events and 200 guests per event. Pro plan: $49/month for unlimited events and guests. Annual billing saves 20%. No hidden fees.',
      },
      {
        question: 'Can I upgrade or downgrade my plan?',
        answer:
          "Yes, anytime! Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle. We'll prorate charges when upgrading mid-cycle, and you'll receive credit for unused time when downgrading.",
      },
      {
        question: "What's your refund policy?",
        answer:
          `We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied within 14 days of purchase, contact support for a full refund. Refunds are not available for annual plans after 14 days.`,
      },
      {
        question: 'Do you offer discounts for nonprofits or educational institutions?',
        answer:
          'Yes! Registered nonprofits and educational institutions receive 50% off all paid plans. Contact support@liteevent.com with proof of nonprofit status (501(c)(3) letter) or .edu email for verification.',
      },
    ],
  },
  {
    category: 'Technical Support',
    icon: 'settings',
    questions: [
      {
        question: 'Is there a mobile app?',
        answer:
          'Yes! Download the LiteEvent mobile app for iOS and Android. Manage events, check-in guests, scan tickets, view real-time analytics, and respond to RSVPs on the go. Available for all plan types.',
      },
      {
        question: 'What browsers are supported?',
        answer:
          'LiteEvent works on all modern browsers: Chrome, Firefox, Safari, Edge, and Opera. For the best experience, we recommend using the latest version of Chrome or Safari. Mobile browsers are fully supported.',
      },
      {
        question: 'Can I integrate LiteEvent with other tools?',
        answer:
          'Pro plan includes API access and integrations with popular tools like Zapier, Google Calendar, Mailchimp, Slack, Zoom, and Salesforce. Use webhooks to connect with your existing workflow and automate tasks.',
      },
    ],
  },
  {
    category: 'Privacy & Security',
    icon: 'shield',
    questions: [
      {
        question: 'How is my data protected?',
        answer:
          'We use bank-level encryption (SSL/TLS) to protect data in transit and at rest. All payment information is processed by PCI-compliant payment processors (Stripe). We never store credit card details on our servers.',
      },
      {
        question: 'Is LiteEvent GDPR compliant?',
        answer:
          'Yes! We are fully GDPR compliant. You own your data and can export or delete it anytime. We provide tools for guest consent management, data access requests, and right to be forgotten. See our Privacy Policy for details.',
      },
      {
        question: 'Can I export my event data?',
        answer:
          'Absolutely! Export guest lists, RSVP data, ticket sales, and analytics in CSV or JSON format anytime. Your data is portable and you can take it with you if you decide to leave LiteEvent.',
      },
    ],
  },
];

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.accordionItem}>
      <Pressable style={styles.accordionHeader} onPress={onToggle}>
        <Text style={styles.accordionQuestion}>{question}</Text>
        <Feather
          name="chevron-down"
          size={20}
          color={Colors.text.muted}
          style={[
            styles.accordionIcon,
            isOpen && { transform: [{ rotate: '180deg' }] },
          ]}
        />
      </Pressable>
      {isOpen && (
        <View style={styles.accordionBody}>
          <Text style={styles.accordionAnswer}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function FAQScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isOpen = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    return openItems[key] || false;
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;

    const query = searchQuery.toLowerCase();

    return FAQ_DATA.map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          q.answer.toLowerCase().includes(query)
      ),
    })).filter((category) => category.questions.length > 0);
  }, [searchQuery]);

  const totalQuestions = FAQ_DATA.reduce((acc, cat) => acc + cat.questions.length, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Feather name="help-circle" size={14} color={Colors.accent.indigo} />
            <Text style={[styles.badgeText, { color: Colors.accent.indigo }]}>Help Center</Text>
          </View>
          <Text style={styles.heroTitle}>Frequently Asked Questions</Text>
          <Text style={styles.heroDesc}>
            Everything you need to know about LiteEvent. Can't find what you're looking for?{' '}
            <Text style={{ color: Colors.accent.indigo, fontWeight: '600' }}>
              Contact support
            </Text>
          </Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color={Colors.text.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for answers..."
              placeholderTextColor={Colors.text.subtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Feather name="x" size={18} color={Colors.text.muted} />
              </Pressable>
            )}
          </View>

          {searchQuery && (
            <Text style={styles.searchResults}>
              Found {filteredData.reduce((acc, cat) => acc + cat.questions.length, 0)} results
            </Text>
          )}
        </View>

        {/* FAQ Categories */}
        {filteredData.length === 0 ? (
          <View style={styles.noResults}>
            <Feather name="search" size={48} color={Colors.text.subtle} />
            <Text style={styles.noResultsTitle}>No results found</Text>
            <Text style={styles.noResultsDesc}>Try a different search term</Text>
            <Pressable style={styles.clearBtn} onPress={() => setSearchQuery('')}>
              <Text style={styles.clearBtnText}>Clear Search</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.categories}>
            {filteredData.map((category, categoryIndex) => (
              <View key={category.category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIconBox}>
                    <Feather name={category.icon as any} size={20} color="#fff" />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>{category.category}</Text>
                    <Text style={styles.categoryCount}>
                      {category.questions.length} question{category.questions.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.questionsContainer}>
                  {category.questions.map((faq, questionIndex) => (
                    <AccordionItem
                      key={questionIndex}
                      question={faq.question}
                      answer={faq.answer}
                      isOpen={isOpen(categoryIndex, questionIndex)}
                      onToggle={() => toggleItem(categoryIndex, questionIndex)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        {!searchQuery && (
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalQuestions}+</Text>
              <Text style={styles.statLabel}>Questions Answered</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{FAQ_DATA.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24/7</Text>
              <Text style={styles.statLabel}>Support Available</Text>
            </View>
          </View>
        )}

        {/* CTA Section */}
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaTitle}>Still have questions?</Text>
          <Text style={styles.ctaDesc}>
            Can't find the answer you're looking for? Our friendly support team is here to help.
          </Text>
          <View style={styles.ctaButtons}>
            <Pressable style={styles.ctaBtn}>
              <Feather name="mail" size={18} color={Colors.accent.indigo} />
              <Text style={styles.ctaBtnText}>Email Support</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.accent.indigo + '20',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent.indigo + '40',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 16,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.input,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
  },
  searchResults: {
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 12,
  },
  noResults: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    alignItems: 'center',
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsDesc: {
    fontSize: 14,
    color: Colors.text.muted,
    marginBottom: 20,
  },
  clearBtn: {
    backgroundColor: Colors.accent.indigo,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  categories: {
    paddingHorizontal: 16,
    gap: 32,
  },
  categorySection: {
    gap: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accent.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text.primary,
  },
  categoryCount: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  questionsContainer: {
    gap: 8,
  },
  accordionItem: {
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accordionQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    paddingRight: 12,
  },
  accordionIcon: {
    marginLeft: 8,
  },
  accordionBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  accordionAnswer: {
    fontSize: 14,
    color: Colors.text.muted,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 32,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.accent.indigo,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  cta: {
    marginHorizontal: 16,
    marginTop: 32,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent.indigo,
  },
});
