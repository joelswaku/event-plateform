import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

const FILTER_CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'wedding', label: 'Weddings' },
  { id: 'conference', label: 'Conferences' },
  { id: 'birthday', label: 'Birthdays' },
  { id: 'concert', label: 'Concerts' },
  { id: 'festival', label: 'Festivals' },
];

const TEMPLATES = [
  {
    id: '1',
    name: 'Classic Wedding',
    description: 'Elegant and timeless wedding template with romantic design elements.',
    category: 'wedding',
    style: 'ELEGANT',
    tier: 'free',
    sections: 8,
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
  },
  {
    id: '2',
    name: 'Tech Conference',
    description: 'Modern conference template with bold typography and clean layouts.',
    category: 'conference',
    style: 'MODERN',
    tier: 'premium',
    sections: 10,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80',
  },
  {
    id: '3',
    name: 'Birthday Bash',
    description: 'Fun and colorful birthday party template with playful design.',
    category: 'birthday',
    style: 'FUN',
    tier: 'free',
    sections: 6,
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80',
  },
  {
    id: '4',
    name: 'Live Concert',
    description: 'Dynamic concert template with bold visuals and ticket integration.',
    category: 'concert',
    style: 'MODERN',
    tier: 'premium',
    sections: 9,
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80',
  },
  {
    id: '5',
    name: 'Music Festival',
    description: 'Vibrant festival template with lineup showcase and schedule.',
    category: 'festival',
    style: 'FUN',
    tier: 'premium',
    sections: 12,
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&q=80',
  },
  {
    id: '6',
    name: 'Minimal Wedding',
    description: 'Clean and sophisticated wedding template with minimalist aesthetic.',
    category: 'wedding',
    style: 'MINIMAL',
    tier: 'free',
    sections: 7,
    image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80',
  },
  {
    id: '7',
    name: 'Corporate Event',
    description: 'Professional corporate event template with agenda and speakers.',
    category: 'conference',
    style: 'CLASSIC',
    tier: 'premium',
    sections: 11,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80',
  },
  {
    id: '8',
    name: 'Kids Party',
    description: 'Playful and colorful kids birthday party template.',
    category: 'birthday',
    style: 'FUN',
    tier: 'free',
    sections: 5,
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80',
  },
];

function TemplateCard({ template }: { template: typeof TEMPLATES[0] }) {
  const isFree = template.tier === 'free';

  return (
    <View style={styles.templateCard}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: template.image }} style={styles.templateImage} />
        {!isFree && (
          <View style={styles.premiumBadge}>
            <Feather name="crown" size={12} color="#fff" />
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.templateInfo}>
        <View style={styles.badges}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{template.category}</Text>
          </View>
          <View style={styles.styleBadge}>
            <Text style={styles.styleText}>{template.style}</Text>
          </View>
        </View>

        <Text style={styles.templateName}>{template.name}</Text>
        <Text style={styles.templateDesc}>{template.description}</Text>

        <View style={styles.templateMeta}>
          <View style={styles.metaItem}>
            <Feather name="layout" size={14} color={Colors.text.muted} />
            <Text style={styles.metaText}>{template.sections} sections</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.templateActions}>
          <Pressable style={styles.previewBtn}>
            <Feather name="eye" size={16} color={Colors.text.primary} />
            <Text style={styles.previewBtnText}>Preview</Text>
          </Pressable>
          <Pressable
            style={[
              styles.useBtn,
              !isFree && { backgroundColor: Colors.accent.indigo },
            ]}
          >
            <Feather name={isFree ? 'check' : 'crown'} size={16} color="#fff" />
            <Text style={styles.useBtnText}>{isFree ? 'Use Free' : 'Use Template'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function TemplatesScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredTemplates =
    activeFilter === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeFilter);

  const freeTemplates = filteredTemplates.filter((t) => t.tier === 'free');
  const premiumTemplates = filteredTemplates.filter((t) => t.tier === 'premium');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Templates</Text>
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
            <Feather name="layout" size={14} color={Colors.accent.violet} />
            <Text style={[styles.badgeText, { color: Colors.accent.violet }]}>
              {TEMPLATES.length}+ Professional Templates
            </Text>
          </View>
          <Text style={styles.heroTitle}>
            Beautiful Templates{'\n'}
            <Text style={{ color: Colors.accent.indigo }}>for Every Event</Text>
          </Text>
          <Text style={styles.heroDesc}>
            Choose from our curated collection of professionally designed templates. Customize
            colors, layouts, and sections to match your event perfectly.
          </Text>
        </View>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_CATEGORIES.map((filter) => (
            <Pressable
              key={filter.id}
              onPress={() => setActiveFilter(filter.id)}
              style={[
                styles.filterBtn,
                activeFilter === filter.id && styles.filterBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.id && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Free Templates Section */}
        {freeTemplates.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.freeBadge}>
                <Feather name="check" size={14} color={Colors.accent.emerald} />
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
              <Text style={styles.sectionTitle}>Free Templates</Text>
            </View>
            <View style={styles.templatesGrid}>
              {freeTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </View>
          </View>
        )}

        {/* Premium Templates Section */}
        {premiumTemplates.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.premiumSectionBadge}>
                <Feather name="crown" size={14} color="#fff" />
                <Text style={styles.premiumSectionText}>PREMIUM</Text>
              </View>
              <Text style={styles.sectionTitle}>Premium Templates</Text>
            </View>

            {/* Unlock Card */}
            <View style={styles.unlockCard}>
              <Feather name="zap" size={24} color={Colors.accent.indigo} />
              <Text style={styles.unlockTitle}>Unlock Premium Templates</Text>
              <Text style={styles.unlockDesc}>
                Get access to all premium templates with advanced designs and exclusive features.
                Start from just $19/month.
              </Text>
              <Pressable style={styles.unlockBtn}>
                <Text style={styles.unlockBtnText}>View Pricing</Text>
                <Feather name="arrow-right" size={16} color={Colors.accent.indigo} />
              </Pressable>
            </View>

            <View style={styles.templatesGrid}>
              {premiumTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </View>
          </View>
        )}

        {/* CTA */}
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaTitle}>Ready to create your event?</Text>
          <Text style={styles.ctaDesc}>
            Choose a template and customize it to match your event perfectly.
          </Text>
          <Pressable style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Get Started Free</Text>
          </Pressable>
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
    backgroundColor: Colors.accent.violet + '20',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent.violet + '40',
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
    lineHeight: 40,
  },
  heroDesc: {
    fontSize: 16,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  filterScroll: {
    marginTop: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  filterBtnActive: {
    backgroundColor: Colors.accent.indigo,
    borderColor: Colors.accent.indigo,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.muted,
  },
  filterTextActive: {
    color: '#fff',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.accent.emerald + '20',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent.emerald + '40',
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accent.emerald,
  },
  premiumSectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.accent.amber,
    borderRadius: 10,
  },
  premiumSectionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text.primary,
  },
  unlockCard: {
    backgroundColor: Colors.accent.indigo + '15',
    borderWidth: 1,
    borderColor: Colors.accent.indigo + '40',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  unlockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  unlockDesc: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent.indigo,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  unlockBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  templatesGrid: {
    gap: 16,
  },
  templateCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  templateImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent.amber,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  premiumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  templateInfo: {
    padding: 16,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: Colors.accent.indigo + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent.indigo + '40',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent.indigo,
    textTransform: 'capitalize',
  },
  styleBadge: {
    backgroundColor: Colors.bg.elevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  styleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.muted,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  templateDesc: {
    fontSize: 13,
    color: Colors.text.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  templateMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bg.elevated,
    paddingVertical: 12,
    borderRadius: 10,
  },
  previewBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  useBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent.emerald,
    paddingVertical: 12,
    borderRadius: 10,
  },
  useBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
  ctaBtn: {
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
