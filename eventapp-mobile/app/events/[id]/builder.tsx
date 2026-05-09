import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar,
  Animated, Alert, SafeAreaView, ActivityIndicator,
  Keyboard, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useBuilderStore }      from '@/store/builder.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { getTemplatesForEventType } from '@/constants/templates';

import BuilderTopBar       from '@/components/builder/BuilderTopBar';
import BuilderCanvas       from '@/components/builder/BuilderCanvas';
import BottomSheetTabs, { TabKey } from '@/components/builder/BottomSheetTabs';
import StylePanel          from '@/components/builder/sheets/StylePanel';
import BlocksPanel         from '@/components/builder/sheets/BlocksPanel';
import LayersPanel         from '@/components/builder/sheets/LayersPanel';
import EditPanel           from '@/components/builder/sheets/EditPanel';
import TemplatePickerModal from '@/components/builder/sheets/TemplatePickerModal';

const SHEET_H = 440;

export default function BuilderScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const builder          = useBuilderStore(s => s.builder);
  const isLoading        = useBuilderStore(s => s.isLoading);
  const saveStatus       = useBuilderStore(s => s.saveStatus);
  const historyIdx       = useBuilderStore(s => s._historyIndex);
  const historyLen       = useBuilderStore(s => s._history.length);
  const fetchBuilder     = useBuilderStore(s => s.fetchBuilder);
  const applyPreset      = useBuilderStore(s => s.applyPreset);
  const publishPage      = useBuilderStore(s => s.publishPage);
  const updateSection    = useBuilderStore(s => s.updateSection);
  const undo             = useBuilderStore(s => s.undo);
  const redo             = useBuilderStore(s => s.redo);

  const { isSubscribed } = useSubscriptionStore();
  const isPremium = isSubscribed;

  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < historyLen - 1;

  const [selectedSectionId,  setSelectedSectionId]  = useState<string | null>(null);
  const [activeTab,          setActiveTab]           = useState<TabKey | null>(null);
  const [showTemplatePicker, setShowTemplatePicker]  = useState(false);
  const [publishLoading,     setPublishLoading]      = useState(false);
  const [kbOffset,           setKbOffset]            = useState(0);
  const defaultApplied = useRef(false);

  /* Push the bottom sheet above the keyboard */
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => setKbOffset(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKbOffset(0),
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  const sheetAnim = useRef(new Animated.Value(SHEET_H)).current;

  useEffect(() => {
    if (eventId) fetchBuilder(eventId);
  }, [eventId]);

  // Auto-apply first template when builder loads with no sections
  useEffect(() => {
    if (defaultApplied.current) return;
    if (!isLoading && builder && builder.sections.length === 0 && builder.event) {
      defaultApplied.current = true;
      const templates = getTemplatesForEventType(builder.event.event_type);
      if (templates.length > 0) {
        const t = templates[0];
        applyPreset(eventId, t.sections.map(sec => ({
          type:   sec.type,
          config: {
            ...sec.config,
            ...(sec.type === 'HERO'    && t.assets.hero_image     ? { background_image: t.assets.hero_image }     : {}),
            ...(sec.type === 'GALLERY' && t.assets.gallery_images ? { images: t.assets.gallery_images }           : {}),
          },
        })));
      }
    }
  }, [isLoading, builder?.sections.length]);

  const sections = useMemo(
    () => [...(builder?.sections ?? [])].sort((a: any, b: any) => (a.position_order ?? 0) - (b.position_order ?? 0)),
    [builder?.sections],
  );

  const selectedSection = useMemo(
    () => sections.find((s: any) => s.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  );

  const currentStyle = (sections[0]?.config?._theme as string) ?? 'CLASSIC';

  const openSheet = (tab: TabKey) => {
    setActiveTab(tab);
    Animated.spring(sheetAnim, {
      toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200, mass: 1,
    }).start();
  };

  const closeSheet = () => {
    Animated.spring(sheetAnim, {
      toValue: SHEET_H, useNativeDriver: true, damping: 20, stiffness: 200,
    }).start(() => setActiveTab(null));
  };

  const handleTabChange = useCallback((tab: TabKey) => {
    if (tab === 'edit' && !selectedSectionId) return;
    if (activeTab === tab) { closeSheet(); return; }
    if (activeTab !== null) { setActiveTab(tab); return; }
    openSheet(tab);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [activeTab, selectedSectionId]);

  const handleSectionSelect = useCallback((sec: any) => {
    setSelectedSectionId(sec.id);
    if (activeTab !== 'edit') openSheet('edit');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [activeTab]);

  const handleStyleSelect = useCallback((style: string) => {
    sections.forEach((sec: any) => {
      updateSection(eventId, sec.id, { config: { ...(sec.config ?? {}), _theme: style } });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [sections, eventId]);

  const handlePublish = useCallback(async () => {
    setPublishLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const ok = await publishPage(eventId);
      Alert.alert(
        ok ? 'Published!' : 'Error',
        ok ? 'Your event page is now live.' : 'Failed to publish. Please try again.',
      );
    } finally {
      setPublishLoading(false);
    }
  }, [eventId]);

  if (!builder && isLoading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#6c6fee" />
        <Text style={s.loadingTxt}>Loading builder…</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#16181c" />

      <SafeAreaView style={{ backgroundColor: '#16181c' }}>
        <BuilderTopBar
          eventId={eventId}
          saveStatus={saveStatus}
          onTemplates={() => setShowTemplatePicker(true)}
          onPublish={handlePublish}
          publishLoading={publishLoading}
          eventTitle={builder?.event?.title}
        />
      </SafeAreaView>

      <View style={{ flex: 1, backgroundColor: '#1a1b1f' }}>
        <BuilderCanvas
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSectionSelect={handleSectionSelect}
          eventId={eventId}
          event={builder?.event ?? null}
          isLoading={isLoading}
        />
      </View>

      <SafeAreaView style={{ backgroundColor: '#16181c' }}>
        <BottomSheetTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          hasSelection={!!selectedSectionId}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => { undo(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          onRedo={() => { redo(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        />
      </SafeAreaView>

      {activeTab !== null && <Pressable style={s.backdrop} onPress={closeSheet} />}

      {activeTab !== null && (
        <Animated.View style={[s.sheet, { transform: [{ translateY: sheetAnim }], bottom: kbOffset }]}>
          <Pressable style={s.handleWrap} onPress={closeSheet}>
            <View style={s.handle} />
          </Pressable>

          <View style={{ flex: 1 }}>
            {activeTab === 'style' && (
              <StylePanel
                currentStyle={currentStyle}
                isPremium={isPremium}
                onStyleSelect={handleStyleSelect}
                onUpgrade={() => { closeSheet(); router.push('/profile/upgrade'); }}
              />
            )}
            {activeTab === 'blocks' && (
              <BlocksPanel eventId={eventId} onClose={closeSheet} />
            )}
            {activeTab === 'layers' && (
              <LayersPanel
                eventId={eventId}
                sections={sections}
                selectedSectionId={selectedSectionId}
                onSectionSelect={(sec: any) => handleSectionSelect(sec)}
              />
            )}
            {activeTab === 'edit' && (
              <EditPanel
                eventId={eventId}
                section={selectedSection}
                onDeselect={() => { setSelectedSectionId(null); closeSheet(); }}
              />
            )}
          </View>
        </Animated.View>
      )}

      <TemplatePickerModal
        visible={showTemplatePicker}
        eventId={eventId}
        eventType={builder?.event?.event_type}
        isPremium={isPremium}
        onClose={() => setShowTemplatePicker(false)}
        onUpgrade={() => { setShowTemplatePicker(false); router.push('/profile/upgrade'); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#0e0f11' },
  loading:    { flex: 1, backgroundColor: '#0e0f11', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10 },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    height: SHEET_H, backgroundColor: '#1a1b1f',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    zIndex: 20, overflow: 'hidden',
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
});
