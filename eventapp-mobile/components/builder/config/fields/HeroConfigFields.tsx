import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  StyleSheet, Image, PanResponder, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBuilderStore } from '@/store/builder.store';
import { pickAndUploadImage } from '@/lib/imageUpload';
import type { BuilderSection } from '@/types';

const BG  = '#1a1b1f';
const MT  = '#555a66';
const TX  = 'rgba(255,255,255,0.85)';
const BD  = 'rgba(255,255,255,0.1)';
const ACC = '#6c6fee';

interface Props {
  section: BuilderSection;
  eventId: string;
  iosKeyboardInsets?: boolean;
  onOverlayPreviewChange?: (opacity: number) => void;
  onOverlayPreviewCommit?: (opacity: number) => void;
}

// Standalone slider — Animated.Value drives fill/thumb so no re-renders while dragging
function OpacitySlider({
  value,
  onChange,
  onRelease,
  onSlidingChange,
}: {
  value: number;
  onChange: (v: number) => void;
  onRelease: (v: number) => void;
  onSlidingChange: (isSliding: boolean) => void;
}) {
  const trackWidthRef = useRef(1);
  const isSlidingRef = useRef(false);

  // Animated.Value keeps the control fluid without re-rendering the panel.
  const animPx = useRef(new Animated.Value(0)).current;
  const liveValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onReleaseRef = useRef(onRelease);
  const onSlidingChangeRef = useRef(onSlidingChange);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onReleaseRef.current = onRelease; }, [onRelease]);
  useEffect(() => { onSlidingChangeRef.current = onSlidingChange; }, [onSlidingChange]);

  // Sync animPx when track lays out or value prop changes externally
  const syncAnim = (pct: number, width: number) => {
    animPx.setValue((pct / 100) * width);
  };

  // Keep the native thumb correct if another Hero section is selected.
  useEffect(() => {
    if (isSlidingRef.current) return;
    liveValueRef.current = value;
    syncAnim(value, trackWidthRef.current);
  }, [value]);

  const clamp = (x: number) =>
    Math.round(Math.max(0, Math.min(100, (x / trackWidthRef.current) * 100)));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture:  () => true,
      onPanResponderGrant: (e) => {
        isSlidingRef.current = true;
        onSlidingChangeRef.current(true);
        // Jump fill to tap position immediately
        const pct = clamp(e.nativeEvent.locationX);
        liveValueRef.current = pct;
        animPx.setValue((pct / 100) * trackWidthRef.current);
        onChangeRef.current(pct);
      },
      onPanResponderMove: (e) => {
        const pct = clamp(e.nativeEvent.locationX);
        liveValueRef.current = pct;
        animPx.setValue((pct / 100) * trackWidthRef.current);
        onChangeRef.current(pct);
      },
      onPanResponderRelease: () => {
        isSlidingRef.current = false;
        onSlidingChangeRef.current(false);
        onReleaseRef.current(liveValueRef.current);
      },
      onPanResponderTerminate: () => {
        isSlidingRef.current = false;
        onSlidingChangeRef.current(false);
        onReleaseRef.current(liveValueRef.current);
      },
      // Keep the active horizontal drag inside the control instead of letting
      // the sheet ScrollView or Android's native responder take over.
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  return (
    <View
      style={s.sliderHitArea}
      onLayout={(e) => {
        trackWidthRef.current = e.nativeEvent.layout.width;
        syncAnim(liveValueRef.current, trackWidthRef.current);
      }}
      {...panResponder.panHandlers}
    >
      <View style={s.track} pointerEvents="none" />
      <Animated.View style={[s.trackFill, { width: animPx }]} />
      <Animated.View
        style={[
          s.thumb,
          {
            transform: [{ translateX: Animated.subtract(animPx, 10) }],
          },
        ]}
      />
    </View>
  );
}

export default function HeroConfigFields({
  section,
  eventId,
  iosKeyboardInsets,
  onOverlayPreviewChange,
  onOverlayPreviewCommit,
}: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);

  const cfgRef   = useRef<Record<string, unknown>>(section.config ?? {});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [title,   setTitle]   = useState(section.title ?? '');
  const [body,    setBody]    = useState(section.body  ?? '');
  const [bgImage, setBgImage] = useState(String(cfgRef.current.background_image ?? ''));
  const [align,   setAlign]   = useState(String(cfgRef.current.headline_align   ?? 'center'));
  const [donationStyle, setDonationStyle] = useState(String(cfgRef.current.hero_donation_style ?? 'button'));
  const [opacity, setOpacity] = useState(Number(cfgRef.current.overlay_opacity  ?? 40));
  const [isSlidingOpacity, setIsSlidingOpacity] = useState(false);

  useEffect(() => {
    const c = section.config ?? {};
    cfgRef.current = c;
    setTitle(section.title ?? '');
    setBody(section.body   ?? '');
    setBgImage(String(c.background_image ?? ''));
    setAlign(String(c.headline_align   ?? 'center'));
    setDonationStyle(String(c.hero_donation_style ?? 'button'));
    setOpacity(Number(c.overlay_opacity ?? 40));
  }, [section.id]);

  const saveTopLevel = (key: 'title' | 'body', value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, section.id, { [key]: value });
    }, 400);
  };

  const saveConfig = (key: string, value: unknown) => {
    cfgRef.current = { ...cfgRef.current, [key]: value };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, section.id, { config: cfgRef.current });
    }, 400);
  };

  const handlePickImage = async () => {
    const url = await pickAndUploadImage(eventId);
    if (url) { setBgImage(url); saveConfig('background_image', url); }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={!isSlidingOpacity}
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
      showsVerticalScrollIndicator={false}
    >
      <Field label="Section Title">
        <TextInput
          style={s.input} value={title}
          onChangeText={v => { setTitle(v); saveTopLevel('title', v); }}
          placeholder="Event title"
          placeholderTextColor={MT}
        />
      </Field>

      <Field label="Body Text">
        <TextInput
          style={[s.input, s.textarea]} value={body}
          onChangeText={v => { setBody(v); saveTopLevel('body', v); }}
          placeholder="A short description..."
          placeholderTextColor={MT}
          multiline numberOfLines={3}
        />
      </Field>

      <Field label="Background Image">
        <Pressable style={s.imgPicker} onPress={handlePickImage}>
          {bgImage
            ? <Image source={{ uri: bgImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <View style={s.imgEmpty}>
                <Feather name="image" size={20} color={MT} />
                <Text style={s.imgHint}>Tap to upload image</Text>
              </View>}
          <View style={s.imgOverlay}>
            <Feather name="camera" size={14} color="rgba(255,255,255,0.7)" />
          </View>
        </Pressable>
      </Field>

      <Field label="Text Alignment">
        <View style={s.segRow}>
          {(['left', 'center', 'right'] as const).map((v) => {
            const icon = v === 'left' ? 'align-left' : v === 'center' ? 'align-center' : 'align-right';
            const active = align === v;
            return (
              <Pressable
                key={v}
                style={[s.segBtn, active && s.segBtnActive]}
                onPress={() => { setAlign(v); saveConfig('headline_align', v); }}
              >
                <Feather name={icon as any} size={16} color={active ? ACC : MT} />
                <Text style={[s.segLabel, active && s.segLabelActive]}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Hero Donation Style">
        <View style={s.donationStyleGrid}>
          {[
            ['none', 'None'],
            ['button', 'Curved actions'],
            ['summary', 'Small summary'],
            ['full', 'Full card'],
          ].map(([value, label]) => {
            const active = donationStyle === value;
            return (
              <Pressable
                key={value}
                style={[s.donationStyleBtn, active && s.donationStyleBtnActive]}
                onPress={() => { setDonationStyle(value); saveConfig('hero_donation_style', value); }}
              >
                <Text style={[s.donationStyleLabel, active && s.donationStyleLabelActive]}>{label}</Text>
                {value === 'button' && <Text style={[s.donationStyleHint, active && s.donationStyleHintActive]}>Recommended</Text>}
              </Pressable>
            );
          })}
        </View>
        <Text style={s.fieldHint}>Curved actions keeps the hero clean with Donate and Share below the event details.</Text>
      </Field>

      <Field label={`Overlay Opacity: ${opacity}%`}>
        <OpacitySlider
          value={opacity}
          onChange={(value) => {
            setOpacity(value);
            onOverlayPreviewChange?.(value);
          }}
          onRelease={(value) => {
            onOverlayPreviewCommit?.(value);
            saveConfig('overlay_opacity', value);
          }}
          onSlidingChange={setIsSlidingOpacity}
        />
      </Field>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  scroll:  { padding: 16, gap: 16 },
  field:   { gap: 8 },
  label:   { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BD,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: TX,
  },
  textarea: { minHeight: 72, textAlignVertical: 'top' },

  imgPicker: {
    height: 120, borderRadius: 12, borderWidth: 1, borderColor: BD,
    backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  imgEmpty:   { alignItems: 'center', gap: 6 },
  imgHint:    { fontSize: 12, color: MT },
  imgOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },

  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: BD, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  segBtnActive:   { borderColor: `${ACC}60`, backgroundColor: `${ACC}18` },
  segLabel:       { fontSize: 12, fontWeight: '600', color: MT },
  segLabelActive: { color: ACC },

  donationStyleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  donationStyleBtn: {
    width: '48%', minHeight: 48, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: BD, backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center', gap: 2,
  },
  donationStyleBtnActive: { borderColor: `${ACC}70`, backgroundColor: `${ACC}1c` },
  donationStyleLabel: { fontSize: 12, fontWeight: '700', color: MT },
  donationStyleLabelActive: { color: '#d9daff' },
  donationStyleHint: { fontSize: 9, fontWeight: '600', color: MT },
  donationStyleHintActive: { color: `${ACC}cc` },
  fieldHint: { fontSize: 10, lineHeight: 14, color: MT, marginTop: -2 },

  sliderHitArea: {
    height: 36, justifyContent: 'center', position: 'relative',
  },
  track: {
    position: 'absolute', left: 0, right: 0, top: 15.5, height: 5,
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 99,
  },
  trackFill: {
    position: 'absolute', left: 0, top: 15.5, height: 5, borderRadius: 99,
    backgroundColor: ACC,
  },
  thumb: {
    position: 'absolute', left: 0, width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff', top: 8, borderWidth: 3, borderColor: ACC,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
});
