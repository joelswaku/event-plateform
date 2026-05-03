import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Linking, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useDrawerStore } from '@/store/drawer.store';
import { Colors } from '@/constants/colors';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 48) / 2;

const TEMPLATES = [
  {
    id: 'modern', name: 'Modern', category: 'Popular',
    desc: 'Clean design with bold typography',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
    accent: Colors.accent.indigo,
    tag: 'Most Used', free: false,
  },
  {
    id: 'bold', name: 'Bold', category: 'Entertainment',
    desc: 'High-contrast, eye-catching layout',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
    accent: Colors.accent.amber,
    tag: 'Trending', free: false,
  },
  {
    id: 'elegant', name: 'Elegant', category: 'Life Events',
    desc: 'Sophisticated gold and dark theme',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
    accent: Colors.accent.gold,
    tag: 'Premium', free: false,
  },
  {
    id: 'festival', name: 'Festival', category: 'Entertainment',
    desc: 'Vibrant colors for lively events',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80',
    accent: Colors.accent.emerald,
    tag: 'New', free: false,
  },
  {
    id: 'classic', name: 'Classic', category: 'All Events',
    desc: 'Timeless layout — free for everyone',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80',
    accent: '#C9A96E',
    tag: 'Free', free: true,
  },
  {
    id: 'corporate', name: 'Corporate', category: 'Business',
    desc: 'Professional and polished look',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
    accent: '#64748b',
    tag: null, free: false,
  },
];

const FEATURES = [
  { icon: 'layout'     as const, label: 'Drag & Drop Sections', sub: 'Reorder and customize every section'    },
  { icon: 'image'      as const, label: 'Cover Images',          sub: 'Upload your own brand visuals'          },
  { icon: 'type'       as const, label: 'Custom Typography',     sub: 'Choose fonts that match your brand'     },
  { icon: 'credit-card'as const, label: 'Ticket Tiers',          sub: 'Free, paid, VIP — all in one page'     },
  { icon: 'globe'      as const, label: 'Custom Slug',           sub: 'Share a branded link to your event'    },
  { icon: 'smartphone' as const, label: 'Mobile Optimized',      sub: 'Looks perfect on every device'         },
];

export default function BuilderScreen() {
  const router     = useRouter();
  const openDrawer = useDrawerStore(s => s.open);
  const [selected, setSelected] = useState<string | null>(null);

  const openWebBuilder = () => {
    Linking.openURL('http://localhost:3000/events/create');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.menuBtn} onPress={openDrawer} hitSlop={10}>
            <Feather name="menu" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.title}>Event Builder</Text>
            <Text style={styles.sub}>Design your event page</Text>
          </View>
          <Pressable
            style={styles.createBtn}
            onPress={() => router.push('/events/create' as never)}
          >
            <Feather name="plus" size={16} color="#fff" />
          </Pressable>
        </View>

        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <LinearGradient
            colors={[`${Colors.accent.indigo}25`, `${Colors.accent.violet}15`, 'transparent']}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
          {/* Mock page preview */}
          <View style={styles.mockDevice}>
            <View style={styles.mockBar} />
            <View style={styles.mockHero}>
              <LinearGradient colors={[Colors.accent.indigo, Colors.accent.violet]} style={StyleSheet.absoluteFill} />
              <View style={styles.mockHeroContent}>
                <View style={styles.mockHeroTag} />
                <View style={styles.mockHeroTitle} />
                <View style={styles.mockHeroSub} />
                <View style={styles.mockHeroBtn} />
              </View>
            </View>
            <View style={styles.mockBody}>
              <View style={styles.mockBodyLine} />
              <View style={[styles.mockBodyLine, { width: '60%' }]} />
              <View style={styles.mockBodyGrid}>
                {[0,1,2].map(i => <View key={i} style={styles.mockBodyChip} />)}
              </View>
            </View>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Build event pages{'\n'}in minutes</Text>
            <Text style={styles.heroSub}>Pick a template, customize with your brand, and publish.</Text>
          </View>
        </View>

        {/* Template picker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choose a Template</Text>
            <Text style={styles.sectionCount}>{TEMPLATES.length} templates</Text>
          </View>

          <View style={styles.templateGrid}>
            {TEMPLATES.map(t => {
              const isSelected = selected === t.id;
              return (
                <Pressable
                  key={t.id}
                  style={[
                    styles.templateCard,
                    isSelected && { borderColor: t.accent, borderWidth: 2 },
                  ]}
                  onPress={() => setSelected(isSelected ? null : t.id)}
                >
                  {/* Preview area — real image */}
                  <View style={styles.templatePreviewArea}>
                    <Image
                      source={{ uri: t.image }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                    {/* Overlay so tags stay readable */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.55)']}
                      style={StyleSheet.absoluteFill}
                    />
                    {t.tag && (
                      <View style={[
                        styles.templateTag,
                        t.free
                          ? { backgroundColor: Colors.accent.emerald }
                          : { backgroundColor: t.accent },
                      ]}>
                        <Text style={styles.templateTagText}>{t.tag}</Text>
                      </View>
                    )}
                    {isSelected && (
                      <View style={styles.selectedCheck}>
                        <Feather name="check" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                  {/* Info */}
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{t.name}</Text>
                    <Text style={styles.templateDesc}>{t.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's included</Text>
          <View style={styles.featureList}>
            {FEATURES.map(f => (
              <View key={f.label} style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <Feather name={f.icon} size={15} color={Colors.accent.indigo} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <Pressable
            style={[styles.ctaBtn, !selected && styles.ctaBtnDisabled]}
            onPress={() => selected && router.push('/events/create' as never)}
          >
            <LinearGradient
              colors={selected
                ? [Colors.accent.indigo, Colors.accent.violet]
                : [Colors.bg.elevated, Colors.bg.elevated]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <Feather name="edit-3" size={17} color={selected ? '#fff' : Colors.text.subtle} />
            <Text style={[styles.ctaBtnText, !selected && { color: Colors.text.subtle }]}>
              {selected
                ? `Start with ${TEMPLATES.find(t => t.id === selected)?.name ?? selected}`
                : 'Select a template first'}
            </Text>
          </Pressable>

          <Pressable style={styles.webBtn} onPress={openWebBuilder}>
            <Feather name="external-link" size={15} color={Colors.text.muted} />
            <Text style={styles.webBtnText}>Open full builder in browser</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: 16, paddingBottom: 110, gap: 20 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  menuBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  title:     { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  sub:       { fontSize: 12, color: Colors.text.muted, marginTop: 1 },
  createBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.accent.indigo,
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero banner
  heroBanner: {
    borderRadius: 20, padding: 20, gap: 16,
    borderWidth: 1, borderColor: `${Colors.accent.indigo}20`,
    backgroundColor: Colors.bg.card, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
  },
  mockDevice: {
    width: 90, height: 130, borderRadius: 10,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    overflow: 'hidden', flexShrink: 0,
  },
  mockBar:  { height: 8, backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  mockHero: { height: 55, overflow: 'hidden', position: 'relative' },
  mockHeroContent: { padding: 6, gap: 3, flex: 1 },
  mockHeroTag:   { height: 5, width: 30, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  mockHeroTitle: { height: 7, width: 56, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.85)' },
  mockHeroSub:   { height: 4, width: 44, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)' },
  mockHeroBtn:   { height: 10, width: 36, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.7)', marginTop: 4 },
  mockBody: { padding: 6, gap: 4 },
  mockBodyLine: { height: 5, borderRadius: 2, backgroundColor: Colors.border.DEFAULT },
  mockBodyGrid: { flexDirection: 'row', gap: 3, marginTop: 2 },
  mockBodyChip: { height: 8, flex: 1, borderRadius: 3, backgroundColor: Colors.border.DEFAULT },
  heroText: { flex: 1, gap: 6 },
  heroTitle: { fontSize: 17, fontWeight: '900', color: '#fff', lineHeight: 22, letterSpacing: -0.3 },
  heroSub:   { fontSize: 11, color: Colors.text.muted, lineHeight: 16 },

  // Section
  section:       { gap: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },
  sectionCount:  { fontSize: 11, color: Colors.text.subtle, fontWeight: '600' },

  // Template grid
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  templateCard: {
    width: CARD_W, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    backgroundColor: Colors.bg.card,
  },
  templatePreviewArea: {
    height: 110, position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },
  templateTag: {
    position: 'absolute', top: 8, right: 8,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 99, opacity: 0.9,
  },
  templateTagText: { fontSize: 8, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
  selectedCheck: {
    position: 'absolute', top: 8, left: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  templateInfo: { padding: 10, gap: 3 },
  templateName: { fontSize: 13, fontWeight: '800', color: '#fff' },
  templateDesc: { fontSize: 10, color: Colors.text.muted, lineHeight: 14 },

  // Features
  featureList: { gap: 2 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  featureIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: `${Colors.accent.indigo}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontSize: 13, fontWeight: '700', color: '#fff' },
  featureSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },

  // CTA
  ctaSection: { gap: 10 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
  },
  ctaBtnDisabled: { borderColor: Colors.border.subtle },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  webBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 12,
  },
  webBtnText: { fontSize: 12, color: Colors.text.muted, fontWeight: '600' },
});
