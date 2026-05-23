import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, Image,
  ScrollView, StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useBuilderStore } from '@/store/builder.store';
import {
  STYLE_TEMPLATES, TEMPLATE_CATEGORIES, CATEGORY_ORDER,
  getTemplatesForEventType, canAccessTemplate,
} from '@/constants/templates';
import type { StyleTemplate } from '@/constants/templates';

const STYLE_ACCENT: Record<string, string> = {
  CLASSIC: '#c9a96e', ELEGANT: '#e2d9c9', MODERN: '#6c6fee',
  MINIMAL: '#d4d0c8', LUXURY: '#C9A96E', FUN: '#F59E0B',
};

type FilterKey = 'FOR_YOU' | 'ALL' | string;

interface Props {
  visible: boolean;
  eventId: string;
  eventType?: string;
  isPremium: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function TemplatePickerModal({ visible, eventId, eventType, isPremium, onClose, onUpgrade }: Props) {
  const applyPreset = useBuilderStore((s) => s.applyPreset);
  const [applying, setApplying] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');

  const allTemplates = useMemo(
    () => eventType ? getTemplatesForEventType(eventType) : STYLE_TEMPLATES,
    [eventType],
  );

  const forYouCount = useMemo(
    () => eventType
      ? allTemplates.filter(t => t.eventTypes?.includes(eventType.toLowerCase())).length
      : 0,
    [allTemplates, eventType],
  );

  useEffect(() => {
    if (visible) setActiveFilter(forYouCount > 0 ? 'FOR_YOU' : 'ALL');
  }, [visible, forYouCount]);

  const filters = useMemo(() => [
    { key: 'FOR_YOU', label: `For You (${forYouCount})` },
    { key: 'ALL',     label: `All (${allTemplates.length})` },
    ...CATEGORY_ORDER.map(k => ({
      key: k,
      label: `${TEMPLATE_CATEGORIES[k].emoji} ${TEMPLATE_CATEGORIES[k].label.split(' ')[0]}`,
    })),
  ], [allTemplates.length, forYouCount]);

  const filtered = useMemo(() => {
    if (activeFilter === 'FOR_YOU')
      return allTemplates.filter(t => eventType && t.eventTypes?.includes(eventType.toLowerCase()));
    if (activeFilter === 'ALL') return allTemplates;
    return allTemplates.filter(t => t.category === activeFilter);
  }, [allTemplates, activeFilter, eventType]);

  const plan = isPremium ? 'premium' : 'free';

  const handleApply = async (t: StyleTemplate) => {
    if (!canAccessTemplate(t, plan)) { onUpgrade(); return; }
    Alert.alert(
      'Apply Template',
      `Replace all sections with "${t.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          style: 'destructive',
          onPress: async () => {
            setApplying(t.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const sections = t.sections.map((sec) => ({
              type: sec.type,
              config: {
                ...sec.config,
                ...(sec.type === 'HERO'    && t.assets.hero_image     ? { background_image: t.assets.hero_image }     : {}),
                ...(sec.type === 'GALLERY' && t.assets.gallery_images ? { images: t.assets.gallery_images }           : {}),
              },
            }));
            await applyPreset(eventId, sections);
            setApplying(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <Text style={s.title}>Templates</Text>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.pillsScroll}
          contentContainerStyle={s.pillsContent}
        >
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[s.pill, activeFilter === f.key && s.pillActive]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text style={[s.pillTxt, activeFilter === f.key && s.pillTxtActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 14, marginBottom: 12 }}
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyTxt}>No templates for this filter</Text>
            </View>
          }
          renderItem={({ item: t }) => {
            const accent  = STYLE_ACCENT[t.style] ?? '#6c6fee';
            const locked  = !canAccessTemplate(t, plan);
            const loading = applying === t.id;
            return (
              <TouchableOpacity
                style={[s.card, { flex: 1 }]}
                onPress={() => handleApply(t)}
                activeOpacity={0.85}
                disabled={!!applying}
              >
                <View style={[s.cover, { backgroundColor: accent + '22' }]}>
                  {t.assets.cover_image ? (
                    <Image source={{ uri: t.assets.cover_image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : null}
                  <View style={s.coverOverlay} />
                  {loading && (
                    <View style={s.loadingOverlay}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                  {locked ? (
                    <View style={s.lockBadge}><Text style={s.lockTxt}>🔒 Pro</Text></View>
                  ) : (
                    <View style={[s.freeBadge, { backgroundColor: accent }]}>
                      <Text style={s.freeTxt}>{t.tier === 'free' ? 'Free' : 'Pro'}</Text>
                    </View>
                  )}
                </View>
                <View style={s.info}>
                  <Text style={s.name} numberOfLines={1}>{t.name}</Text>
                  <View style={[s.stylePill, { backgroundColor: accent + '20' }]}>
                    <Text style={[s.styleTxt, { color: accent }]}>{t.style}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {!isPremium && (
          <TouchableOpacity style={s.upgradeBanner} onPress={onUpgrade} activeOpacity={0.85}>
            <Text style={s.upgradeTxt}>✦ Upgrade for all premium templates</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const ACC = '#6c6fee';

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0e0f11' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  title:         { fontSize: 17, fontWeight: '800', color: '#fff' },
  closeBtn:      { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:      { fontSize: 14, color: '#8b8f9a' },
  pillsScroll:   { flexGrow: 0, flexShrink: 0, height: 52 },
  pillsContent:  { paddingHorizontal: 14, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  pill:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'transparent' },
  pillActive:    { backgroundColor: `${ACC}22`, borderColor: `${ACC}66` },
  pillTxt:       { fontSize: 11, fontWeight: '600', color: '#555a66' },
  pillTxtActive: { color: ACC },
  card:          { backgroundColor: '#1e2026', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cover:         { height: 140, position: 'relative' },
  coverOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  loadingOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  lockBadge:     { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(245,158,11,0.9)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  lockTxt:       { fontSize: 9, fontWeight: '800', color: '#1c1407' },
  freeBadge:     { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  freeTxt:       { fontSize: 9, fontWeight: '800', color: '#fff' },
  info:          { padding: 10, gap: 5 },
  name:          { fontSize: 12, fontWeight: '700', color: '#fff' },
  stylePill:     { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  styleTxt:      { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  upgradeBanner: { margin: 14, padding: 14, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  upgradeTxt:    { fontSize: 12, fontWeight: '700', color: '#f59e0b', textAlign: 'center' },
  empty:         { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTxt:      { fontSize: 12, color: '#555a66', textAlign: 'center', lineHeight: 20 },
});
