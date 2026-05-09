/**
 * eventapp-mobile/components/builder/SectionPreviewCard.tsx
 *
 * PIXEL-PERFECT match to web SharedEventRenderer sections.
 * Each section × each theme renders identically to the web builder.
 *
 * Matches all 7 photos:
 *  Image 1: MODERN Hero — dark bg, city image, uppercase bold title, JOIN NOW
 *  Image 2: CLASSIC/ELEGANT About — cream bg, serif heading, body text
 *  Image 3: CLASSIC Schedule — light bg, SCHEDULE heading, time/title/location rows
 *  Image 4: MODERN Tickets — dark bg, "Get Your Tickets", price range, countdown, tier cards
 *  Image 5: CLASSIC FAQ — light bg, "Frequently Asked Questions", question rows
 *  Image 6: CLASSIC Gallery — light bg, image grid
 *  Image 7: ELEGANT About + Schedule — ivory bg, large serif, AGENDA label
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, Animated, Dimensions, ScrollView,
  Pressable, Alert, Platform, Modal, StatusBar,
} from 'react-native';
import { Feather }        from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView }       from 'moti';
import * as MediaLibrary  from 'expo-media-library';
import { Paths, File as FSFile } from 'expo-file-system';

const SW = Dimensions.get('window').width;

/* ══════════════════════════════════════════════════════════════════
   THEME SYSTEM — exact mirror of web styleThemes.js
══════════════════════════════════════════════════════════════════ */
interface ThemeDef {
  bg: string; bgAlt: string; dark: string; darkSurface: string;
  accent: string; accentDim: string; text: string; muted: string;
  border: string; isDark: boolean;
  fontWeightHeading: '300' | '400' | '700' | '800' | '900';
  headingTransform: 'none' | 'uppercase';
  headingStyle: 'normal' | 'italic';
  radius: number;
}

const THEMES: Record<string, ThemeDef> = {
  CLASSIC: {
    bg: '#FAF9F6', bgAlt: '#FFFFFF', dark: '#1C1917', darkSurface: '#0F0E0C',
    accent: '#C9A96E', accentDim: 'rgba(201,169,110,0.18)', text: '#1C1917', muted: '#78716C',
    border: '#E7E5E4', isDark: false,
    fontWeightHeading: '400', headingTransform: 'none', headingStyle: 'normal', radius: 0,
  },
  ELEGANT: {
    bg: '#FDF5EF', bgAlt: '#FFFCF9', dark: '#271A14', darkSurface: '#180F0A',
    accent: '#B87355', accentDim: 'rgba(184,115,85,0.16)', text: '#271A14', muted: '#8C7B6E',
    border: '#EDE0D8', isDark: false,
    fontWeightHeading: '300', headingTransform: 'none', headingStyle: 'italic', radius: 0,
  },
  MODERN: {
    bg: '#F4F4F8', bgAlt: '#FFFFFF', dark: '#0A0A14', darkSurface: '#06060E',
    accent: '#5B5FED', accentDim: 'rgba(91,95,237,0.12)', text: '#0F0F1A', muted: '#6B6B80',
    border: '#E0E0EC', isDark: false,
    fontWeightHeading: '900', headingTransform: 'uppercase', headingStyle: 'normal', radius: 3,
  },
  MINIMAL: {
    bg: '#F9F9F9', bgAlt: '#FFFFFF', dark: '#111111', darkSurface: '#080808',
    accent: '#888888', accentDim: 'rgba(136,136,136,0.12)', text: '#222222', muted: '#888888',
    border: '#E5E5E5', isDark: false,
    fontWeightHeading: '300', headingTransform: 'none', headingStyle: 'normal', radius: 0,
  },
  LUXURY: {
    bg: '#0D0C0A', bgAlt: '#111009', dark: '#0D0C0A', darkSurface: '#060504',
    accent: '#D4AF6F', accentDim: 'rgba(212,175,111,0.15)', text: '#EDE8DF', muted: '#9A8A72',
    border: 'rgba(212,175,111,0.18)', isDark: true,
    fontWeightHeading: '300', headingTransform: 'uppercase', headingStyle: 'italic', radius: 0,
  },
  FUN: {
    bg: '#FFFBF0', bgAlt: '#FFFFFF', dark: '#1C1407', darkSurface: '#1C1407',
    accent: '#F59E0B', accentDim: 'rgba(245,158,11,0.15)', text: '#1C2333', muted: '#6B7280',
    border: '#FDE68A', isDark: false,
    fontWeightHeading: '800', headingTransform: 'none', headingStyle: 'normal', radius: 12,
  },
};

function getTheme(cfg?: Record<string, any>): ThemeDef {
  return THEMES[cfg?._theme ?? ''] ?? THEMES.CLASSIC;
}

/* ── Hero default backgrounds per theme ─────────────────────────── */
const HERO_BG: Record<string, string[]> = {
  CLASSIC: ['#1a1611', '#2d2416'],
  ELEGANT: ['#1a0f0a', '#271a14'],
  MODERN:  ['#06060e', '#0a0a14'],
  MINIMAL: ['#111111', '#1a1a1a'],
  LUXURY:  ['#060504', '#0d0c0a'],
  FUN:     ['#1c1407', '#2d2b08'],
};

/* ── Badge colour per section type ─────────────────────────────── */
const BADGE_COLOR: Record<string, string> = {
  HERO: '#6c6fee', ABOUT: '#3ecf8e', GALLERY: '#f59e0b', FAQ: '#f43f5e',
  CTA: '#8b5cf6', SPEAKERS: '#06b6d4', VENUE: '#c9a96e', COUNTDOWN: '#ef4444',
  TICKETS: '#22c55e', COUPLE: '#ec4899', STORY: '#f97316', SCHEDULE: '#64748b',
  REGISTRY: '#a78bfa', DONATIONS: '#10b981',
};

/* ══════════════════════════════════════════════════════════════════
   ROOT CARD
══════════════════════════════════════════════════════════════════ */
interface Section {
  id: string; section_type: string; title?: string; body?: string;
  config?: Record<string, any>; is_visible?: boolean;
}
interface Props { section: Section; selected: boolean; event?: any; }

export default function SectionPreviewCard({ section, selected, event }: Props) {
  const type       = section.section_type;
  const badgeColor = BADGE_COLOR[type] ?? '#6c6fee';
  const cfg        = section.config ?? {};
  const theme      = getTheme(cfg);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[
        r.card,
        { backgroundColor: theme.bg },
        selected
          ? { borderColor: badgeColor, borderWidth: 2 }
          : { borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', borderWidth: 1 },
      ]}>
        <SectionContent type={type} cfg={cfg} title={section.title} body={section.body} event={event} theme={theme} />

        {/* Badge — top right, exact web style */}
        <View style={[r.badge, { backgroundColor: '#6c6fee' }]}>
          <Text style={r.badgeTxt}>{type}</Text>
        </View>

        {/* Hidden */}
        {section.is_visible === false && (
          <View style={r.hidden}>
            <Feather name="eye-off" size={13} color="rgba(255,255,255,0.6)" />
            <Text style={r.hiddenTxt}>HIDDEN</Text>
          </View>
        )}

        {/* Selection ring */}
        {selected && <View style={[r.ring, { borderColor: badgeColor }]} pointerEvents="none" />}
      </View>
    </Animated.View>
  );
}

function SectionContent({ type, cfg, title, body, event, theme }: any) {
  switch (type) {
    case 'HERO':      return <HeroBlock      cfg={cfg} title={title} body={body} theme={theme} />;
    case 'ABOUT':     return <AboutBlock     cfg={cfg} title={title} body={body} theme={theme} />;
    case 'STORY':     return <StoryBlock     cfg={cfg} title={title} body={body} theme={theme} />;
    case 'COUPLE':    return <CoupleBlock    cfg={cfg} theme={theme} />;
    case 'COUNTDOWN': return <CountdownBlock cfg={cfg} event={event} theme={theme} />;
    case 'SCHEDULE':  return <ScheduleBlock  cfg={cfg} title={title} theme={theme} />;
    case 'VENUE':     return <VenueBlock     cfg={cfg} title={title} theme={theme} />;
    case 'GALLERY':   return <GalleryBlock   cfg={cfg} theme={theme} />;
    case 'SPEAKERS':  return <SpeakersBlock  cfg={cfg} theme={theme} />;
    case 'TICKETS':   return <TicketsBlock   cfg={cfg} event={event} theme={theme} />;
    case 'FAQ':       return <FAQBlock       cfg={cfg} title={title} theme={theme} />;
    case 'CTA':       return <CTABlock       cfg={cfg} title={title} body={body} theme={theme} />;
    case 'DONATIONS': return <DonationsBlock cfg={cfg} title={title} theme={theme} />;
    case 'REGISTRY':  return <RegistryBlock  cfg={cfg} title={title} theme={theme} />;
    default:          return <GenericBlock   title={title} body={body} theme={theme} type={type} />;
  }
}

/* ══════════════════════════════════════════════════════════════════
   HERO — Image 1 exact match
   MODERN: dark bg, uppercase huge title, LEFT aligned, JOIN NOW border btn
   CLASSIC/ELEGANT: full-bleed image, centered serif title, ornament
══════════════════════════════════════════════════════════════════ */
function HeroBlock({ cfg, title, body, theme }: any) {
  const t         = theme as ThemeDef;
  const bg        = cfg.background_image as string | undefined;
  const eyebrow   = cfg.eyebrow || 'OPENING NIGHT';
  const headT     = title || 'Welcome to our event';
  const subT      = body  || 'Add your event subtitle here';
  const ctaTxt    = cfg.cta_text || 'JOIN NOW';
  const isCentered = cfg.headline_align !== 'left';
  const gradColors = HERO_BG[cfg._theme ?? 'CLASSIC'] ?? HERO_BG.CLASSIC;

  return (
    <View style={hb.wrap}>
      {/* Background */}
      {bg
        ? <Image source={{ uri: bg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <LinearGradient colors={gradColors as any} style={StyleSheet.absoluteFill} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} />
      }

      {/* Overlays — match web */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      {/* Accent top line */}
      <View style={[hb.accentLine, { backgroundColor: t.accent, opacity: 0.35 }]} />

      <View style={[hb.content, isCentered && { alignItems: 'center' }]}>
        {/* Eyebrow */}
        <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 320 }}>
          <Text style={[hb.eyebrow, { color: t.accent, textAlign: isCentered ? 'center' : 'left' }]}>
            {eyebrow}
          </Text>
        </MotiView>

        {/* Heading */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 340, delay: 60 }}>
          <Text style={[
            hb.title,
            {
              fontWeight: t.fontWeightHeading,
              textTransform: t.headingTransform,
              fontStyle: t.headingStyle,
              textAlign: isCentered ? 'center' : 'left',
              letterSpacing: t.headingTransform === 'uppercase' ? -1 : 2,
            },
          ]}>
            {headT}
          </Text>
        </MotiView>

        {/* Ornament — CLASSIC/ELEGANT only */}
        {(cfg._theme === 'CLASSIC' || cfg._theme === 'ELEGANT' || !cfg._theme) && (
          <View style={[hb.ornamentRow, isCentered && { alignSelf: 'center' }]}>
            <View style={[hb.ornamentLine, { backgroundColor: t.accent }]} />
            <Text style={[hb.ornamentDot, { color: t.accent }]}>◆</Text>
            <View style={[hb.ornamentLine, { backgroundColor: t.accent }]} />
          </View>
        )}

        {/* Subtitle */}
        <Text style={[hb.sub, { textAlign: isCentered ? 'center' : 'left' }]}>{subT}</Text>

        {/* CTA button */}
        {cfg.show_cta !== false && (
          <View style={[
            hb.cta,
            cfg._theme === 'MODERN'
              ? { backgroundColor: 'transparent', borderColor: t.accent, borderWidth: 1.5 }
              : { backgroundColor: t.accent, borderWidth: 0 },
          ]}>
            <Text style={[hb.ctaTxt, { color: '#fff', letterSpacing: cfg._theme === 'MODERN' ? 2 : 0.5 }]}>
              {ctaTxt}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const hb = StyleSheet.create({
  wrap:        { height: 240, overflow: 'hidden' },
  accentLine:  { position: 'absolute', top: 0, left: 0, right: 0, height: 1, zIndex: 2 },
  content:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, gap: 8, zIndex: 3 },
  eyebrow:     { fontSize: 8, fontWeight: '600', letterSpacing: 4, textTransform: 'uppercase' },
  title:       { fontSize: 30, color: '#fff', lineHeight: 36 },
  ornamentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
  ornamentLine:{ height: 1, width: 28, opacity: 0.6 },
  ornamentDot: { fontSize: 8 },
  sub:         { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 19 },
  cta: {
    alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 9,
    borderRadius: 4, marginTop: 4,
  },
  ctaTxt:      { fontSize: 11, fontWeight: '700' },
});

/* ══════════════════════════════════════════════════════════════════
   ABOUT — Images 2, 7 exact match
   CLASSIC: centered, "ABOUT" eyebrow, ornament, serif heading
   ELEGANT: left label col + right content col, horizontal rule
   MODERN:  left label + thick accent border + UPPERCASE heading
   MINIMAL: ultra-centered, light weight, extreme spacing
══════════════════════════════════════════════════════════════════ */
function AboutBlock({ cfg, title, body, theme }: any) {
  const t = theme as ThemeDef;
  const th = cfg._theme ?? 'CLASSIC';
  const headT = title || 'About this event';
  const bodyT = body  || 'Tell guests about this event.';

  if (th === 'MODERN') {
    return (
      <View style={[ab.wrap, { backgroundColor: t.bg }, ab.modernWrap]}>
        <MotiView from={{ opacity: 0, translateX: -8 }} animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 300 }}>
          <View style={ab.modernLeft}>
            <View style={[ab.modernBar, { backgroundColor: t.accent }]} />
            <Text style={[ab.modernEyebrow, { color: t.accent }]}>About</Text>
          </View>
        </MotiView>
        <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 320, delay: 60 }} style={{ flex: 1 }}>
          <View style={[ab.modernRight, { borderLeftColor: t.accent }]}>
            <Text style={[ab.modernTitle, { color: t.text, fontWeight: t.fontWeightHeading }]}>
              {headT.toUpperCase()}
            </Text>
            <Text style={[ab.modernBody, { color: t.muted }]} numberOfLines={3}>{bodyT}</Text>
          </View>
        </MotiView>
      </View>
    );
  }

  if (th === 'ELEGANT') {
    return (
      <View style={[ab.wrap, { backgroundColor: t.bg }, ab.elegantWrap]}>
        <MotiView from={{ opacity: 0, translateX: -6 }} animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 300 }}>
          <View style={ab.elegantLeft}>
            <Text style={[ab.elegantEyebrow, { color: t.muted }]}>ABOUT</Text>
            <View style={[ab.elegantRule, { backgroundColor: t.accent }]} />
          </View>
        </MotiView>
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 340, delay: 80 }} style={{ flex: 1 }}>
          <View style={ab.elegantRight}>
            <Text style={[ab.elegantTitle, { color: t.text, fontStyle: t.headingStyle }]}>{headT}</Text>
            <Text style={[ab.elegantBody, { color: t.muted }]} numberOfLines={4}>{bodyT}</Text>
          </View>
        </MotiView>
      </View>
    );
  }

  if (th === 'MINIMAL') {
    return (
      <View style={[ab.wrap, { backgroundColor: t.bg, paddingVertical: 32 }]}>
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 320 }}>
          <Text style={[ab.minimalEyebrow, { color: t.muted }]}>ABOUT</Text>
          <Text style={[ab.minimalTitle, { color: t.text }]}>{headT}</Text>
          <Text style={[ab.minimalBody, { color: t.muted }]} numberOfLines={3}>{bodyT}</Text>
        </MotiView>
      </View>
    );
  }

  // CLASSIC / LUXURY / FUN — centered with ornament
  return (
    <View style={[ab.wrap, { backgroundColor: t.bg, alignItems: 'center' }]}>
      <View style={[ab.topBorder, { backgroundColor: t.border }]} />
      <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }} style={{ alignItems: 'center', width: '100%' }}>
        <Text style={[ab.classicEyebrow, { color: t.muted }]}>ABOUT</Text>
        <Text style={[ab.classicTitle, { color: t.text, fontStyle: t.headingStyle, fontWeight: t.fontWeightHeading }]}
          numberOfLines={3}>
          {headT}
        </Text>
        <View style={ab.ornRow}>
          <View style={[ab.ornLine, { backgroundColor: t.accent, opacity: 0.5 }]} />
          <Text style={[ab.ornDot, { color: t.accent }]}>✦</Text>
          <View style={[ab.ornLine, { backgroundColor: t.accent, opacity: 0.5 }]} />
        </View>
      </MotiView>
      <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 320, delay: 80 }}>
        <Text style={[ab.classicBody, { color: t.muted }]} numberOfLines={3}>{bodyT}</Text>
      </MotiView>
    </View>
  );
}

const ab = StyleSheet.create({
  wrap:   { padding: 20, minHeight: 130 },
  topBorder: { position: 'absolute', top: 0, left: '25%', right: '25%', height: 1 },

  /* MODERN */
  modernWrap:    { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  modernLeft:    { width: 60, gap: 6, paddingTop: 4 },
  modernBar:     { height: 2, width: 28 },
  modernEyebrow: { fontSize: 8, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase' },
  modernRight:   { flex: 1, borderLeftWidth: 3, paddingLeft: 12, gap: 8 },
  modernTitle:   { fontSize: 22, letterSpacing: -0.5, lineHeight: 26 },
  modernBody:    { fontSize: 13, lineHeight: 19 },

  /* ELEGANT */
  elegantWrap:   { flexDirection: 'row', gap: 14 },
  elegantLeft:   { width: 56, gap: 8, paddingTop: 2 },
  elegantEyebrow:{ fontSize: 8, fontWeight: '600', letterSpacing: 3, color: '#8C7B6E', textTransform: 'uppercase' },
  elegantRule:   { height: 1, width: 28, opacity: 0.5 },
  elegantRight:  { flex: 1, gap: 10 },
  elegantTitle:  { fontSize: 26, fontWeight: '300', letterSpacing: 0.5, lineHeight: 32 },
  elegantBody:   { fontSize: 14, lineHeight: 21 },

  /* MINIMAL */
  minimalEyebrow:{ fontSize: 8, fontWeight: '400', letterSpacing: 5, color: '#888', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 },
  minimalTitle:  { fontSize: 26, fontWeight: '300', letterSpacing: 0.5, textAlign: 'center', lineHeight: 32, color: '#222' },
  minimalBody:   { fontSize: 14, textAlign: 'center', lineHeight: 21, marginTop: 10, paddingHorizontal: 16 },

  /* CLASSIC */
  classicEyebrow:{ fontSize: 9, fontWeight: '400', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6 },
  classicTitle:  { fontSize: 26, letterSpacing: 1, lineHeight: 32, textAlign: 'center' },
  classicBody:   { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  ornRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  ornLine:       { height: 1, width: 24 },
  ornDot:        { fontSize: 9 },
});

/* ══════════════════════════════════════════════════════════════════
   SCHEDULE — Image 3 + 7 exact match
   CLASSIC: light bg, "SCHEDULE" eyebrow + heading, time/title rows
   Each row: small time left, bold title, muted location
══════════════════════════════════════════════════════════════════ */
function ScheduleBlock({ cfg, title, theme }: any) {
  const t  = theme as ThemeDef;
  const th = cfg._theme ?? 'CLASSIC';
  const items: any[] = cfg.items || cfg.schedule_items || [];
  const eyebrow = th === 'ELEGANT' ? 'AGENDA' : 'SCHEDULE';

  return (
    <View style={[sb.wrap, { backgroundColor: t.bg }]}>
      <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}>
        <Text style={[sb.eyebrow, { color: t.muted, letterSpacing: th === 'MODERN' ? 3 : 4 }]}>
          {eyebrow}
        </Text>
        <Text style={[
          sb.heading,
          {
            color: t.text,
            fontWeight: t.fontWeightHeading,
            fontStyle: t.headingStyle,
            textTransform: t.headingTransform,
            fontSize: th === 'ELEGANT' ? 28 : th === 'MODERN' ? 24 : 26,
          },
        ]}>
          {title || 'Schedule'}
        </Text>
      </MotiView>

      {items.length === 0 ? (
        <Text style={[sb.empty, { color: t.muted }]}>No schedule items yet</Text>
      ) : (
        items.slice(0, 5).map((item: any, i: number) => (
          <View key={i} style={[sb.row, { borderBottomColor: t.border }]}>
            {/* Time column */}
            <Text style={[sb.time, { color: t.muted }]} numberOfLines={1}>
              {item.time || ''}
            </Text>
            {/* Content */}
            <View style={sb.rowContent}>
              <Text style={[sb.itemTitle, { color: t.text }]} numberOfLines={1}>
                {item.title || item.name || `Item ${i + 1}`}
              </Text>
              {item.location ? (
                <Text style={[sb.location, { color: t.muted }]} numberOfLines={1}>{item.location}</Text>
              ) : null}
              {/* Separator line — matches web */}
              {i < items.length - 1 && (
                <View style={[sb.separator, { backgroundColor: t.accent, opacity: 0.25 }]} />
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const sb = StyleSheet.create({
  wrap:      { paddingHorizontal: 20, paddingVertical: 22, gap: 0 },
  eyebrow:   { fontSize: 9, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 4 },
  heading:   { letterSpacing: 0, lineHeight: 30, marginBottom: 16 },
  row:       { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, gap: 16 },
  time:      { fontSize: 10, fontWeight: '500', width: 54, paddingTop: 2, letterSpacing: 0.3 },
  rowContent:{ flex: 1, gap: 2 },
  itemTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  location:  { fontSize: 12, fontWeight: '400', lineHeight: 17 },
  separator: { height: 1, marginTop: 8 },
  empty:     { fontSize: 12, paddingVertical: 16 },
});

/* ══════════════════════════════════════════════════════════════════
   TICKETS — Image 4 exact match
   MODERN theme: dark bg, "SECURE YOUR SPOT", "Get Your Tickets",
   price range, "N people viewing now", countdown, tier cards
══════════════════════════════════════════════════════════════════ */
function TicketsBlock({ cfg, event, theme }: any) {
  const t  = theme as ThemeDef;
  const th = cfg._theme ?? 'CLASSIC';

  const tickets: any[] = cfg.ticket_types || cfg.tickets || cfg.items || [];
  const minPrice = tickets.reduce((min: number, tk: any) => tk.price > 0 ? Math.min(min, tk.price) : min, Infinity);
  const maxPrice = tickets.reduce((max: number, tk: any) => Math.max(max, tk.price ?? 0), 0);
  const priceRange = tickets.length > 0
    ? (minPrice === Infinity ? 'Free' : minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} – $${maxPrice}`)
    : '$49 – $199';

  // Countdown
  const [diff, setDiff] = useState(calcDiff(event?.starts_at_utc || event?.starts_at));
  useEffect(() => {
    const iso = event?.starts_at_utc || event?.starts_at;
    if (!iso) return;
    const t = setInterval(() => setDiff(calcDiff(iso)), 1000);
    return () => clearInterval(t);
  }, [event?.starts_at_utc]);

  const isDark = th === 'MODERN' || th === 'LUXURY';

  const TIER_STYLES: Record<string, any> = {
    FREE:     { bg: '#166534', accent: '#22c55e', label: '🎁 FREE' },
    PAID:     { bg: '#7c2d12', accent: '#f97316', label: '12 LEFT' },
    VIP:      { bg: '#713f12', accent: '#D4AF6F', label: '⭐ VIP'  },
    STANDARD: { bg: '#1e1b4b', accent: '#6c6fee', label: 'STANDARD' },
  };

  return (
    <View style={[tb.wrap, { backgroundColor: isDark ? (th === 'LUXURY' ? '#0D0C0A' : '#111827') : t.bg }]}>
      {/* Eyebrow */}
      <View style={tb.eyebrowRow}>
        <View style={[tb.eyebrowDot, { backgroundColor: '#ef4444' }]} />
        <Text style={[tb.eyebrow, { color: isDark ? '#9ca3af' : t.muted }]}>SECURE YOUR SPOT</Text>
      </View>

      {/* Main heading */}
      <Text style={[tb.heading, { color: isDark ? '#fff' : t.text, fontWeight: t.fontWeightHeading }]}>
        {(cfg.title || 'Get Your\nTickets').toUpperCase()}
      </Text>

      {/* Price range */}
      <Text style={[tb.price, { color: isDark ? t.accent : t.accent }]}>{priceRange}</Text>

      {/* Live viewers pill */}
      <View style={[tb.viewersPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : t.accentDim }]}>
        <View style={[tb.viewerDot, { backgroundColor: '#22c55e' }]} />
        <Text style={[tb.viewersTxt, { color: isDark ? 'rgba(255,255,255,0.6)' : t.muted }]}>
          {Math.floor(Math.random() * 40 + 10)} people viewing now
        </Text>
      </View>

      {/* Countdown */}
      {diff && (
        <View style={tb.cntSection}>
          <Text style={[tb.cntLabel, { color: isDark ? 'rgba(255,255,255,0.4)' : t.muted }]}>EVENT STARTS IN</Text>
          <View style={tb.cntRow}>
            {[
              { v: diff.h, l: 'HOURS' },
              { v: diff.m, l: 'MIN'   },
              { v: diff.s, l: 'SEC'   },
            ].map((u, i) => (
              <React.Fragment key={u.l}>
                {i > 0 && <Text style={[tb.cntColon, { color: isDark ? '#374151' : t.border }]}>:</Text>}
                <View style={[tb.cntBox, { borderColor: isDark ? '#374151' : t.border, backgroundColor: isDark ? '#1f2937' : t.bgAlt }]}>
                  <Text style={[tb.cntNum, { color: isDark ? '#fff' : t.text }]}>
                    {String(u.v ?? 0).padStart(2, '0')}
                  </Text>
                  <Text style={[tb.cntUnit, { color: isDark ? '#6b7280' : t.muted }]}>{u.l}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      {/* Tier cards — Image 4 style */}
      {tickets.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tb.tiersScroll}>
          {tickets.slice(0, 4).map((tk: any, i: number) => {
            const tStyle = TIER_STYLES[tk.kind] ?? TIER_STYLES.STANDARD;
            return (
              <View key={i} style={[tb.tierCard, { backgroundColor: tStyle.bg }]}>
                <View style={[tb.tierBadge, { backgroundColor: tStyle.accent }]}>
                  <Text style={tb.tierBadgeTxt}>{tStyle.label}</Text>
                </View>
                <Text style={tb.tierName} numberOfLines={2}>{tk.name || `Tier ${i + 1}`}</Text>
                <Text style={[tb.tierPrice, { color: tStyle.accent }]}>
                  {tk.kind === 'FREE' || tk.price === 0 ? 'Free' : `$${tk.price}`}
                </Text>
                {(tk.benefits || tk.features || []).slice(0, 3).map((b: string, j: number) => (
                  <View key={j} style={tb.tierBenefitRow}>
                    <Feather name="check-circle" size={10} color={tStyle.accent} />
                    <Text style={tb.tierBenefitTxt} numberOfLines={1}>{b}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={[tb.noTickets, { color: isDark ? '#6b7280' : t.muted }]}>No ticket types yet</Text>
      )}
    </View>
  );
}

function calcDiff(iso?: string) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s/86400), h: Math.floor((s%86400)/3600), m: Math.floor((s%3600)/60), s: s%60 };
}

const tb = StyleSheet.create({
  wrap:        { padding: 18, gap: 10 },
  eyebrowRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrowDot:  { width: 8, height: 8, borderRadius: 4 },
  eyebrow:     { fontSize: 9, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  heading:     { fontSize: 28, letterSpacing: -0.5, lineHeight: 32, color: '#fff' },
  price:       { fontSize: 16, fontWeight: '700' },
  viewersPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  viewerDot:   { width: 6, height: 6, borderRadius: 3 },
  viewersTxt:  { fontSize: 11, fontWeight: '600' },
  cntSection:  { gap: 6 },
  cntLabel:    { fontSize: 9, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  cntRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cntColon:    { fontSize: 20, fontWeight: '300', marginBottom: 14 },
  cntBox:      { width: 70, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, gap: 3 },
  cntNum:      { fontSize: 26, fontWeight: '700', letterSpacing: -1 },
  cntUnit:     { fontSize: 7, fontWeight: '700', letterSpacing: 1.5 },
  tiersScroll: { marginTop: 4 },
  tierCard:    { width: 120, borderRadius: 12, padding: 12, marginRight: 10, gap: 6, minHeight: 160 },
  tierBadge:   { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tierBadgeTxt:{ fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tierName:    { fontSize: 15, fontWeight: '800', color: '#fff', lineHeight: 19 },
  tierPrice:   { fontSize: 13, fontWeight: '700' },
  tierBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tierBenefitTxt: { fontSize: 10, color: 'rgba(255,255,255,0.6)', flex: 1 },
  noTickets:   { fontSize: 12, paddingVertical: 16 },
});

/* ══════════════════════════════════════════════════════════════════
   FAQ — Image 5 exact match
   CLASSIC: light bg, "FAQ" eyebrow, "Frequently Asked Questions" serif,
   question rows with chevron-down
══════════════════════════════════════════════════════════════════ */
function FAQBlock({ cfg, title, theme }: any) {
  const t = theme as ThemeDef;
  const items: any[] = cfg.items || [];

  return (
    <View style={[fq.wrap, { backgroundColor: t.bg }]}>
      <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}>
        <Text style={[fq.eyebrow, { color: t.muted }]}>FAQ</Text>
        <Text style={[fq.heading, { color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle }]}>
          {title || 'Frequently Asked\nQuestions'}
        </Text>
      </MotiView>
      {items.length === 0 ? (
        <Text style={[fq.empty, { color: t.muted }]}>No questions added yet</Text>
      ) : (
        items.slice(0, 4).map((item: any, i: number) => (
          <MotiView key={i}
            from={{ opacity: 0, translateX: -6 }} animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 260, delay: i * 50 }}>
            <View style={[fq.row, { borderBottomColor: t.border }]}>
              <Text style={[fq.q, { color: t.text }]} numberOfLines={1}>{item.question || `Question ${i + 1}`}</Text>
              <Feather name="chevron-down" size={14} color={t.muted} />
            </View>
          </MotiView>
        ))
      )}
    </View>
  );
}

const fq = StyleSheet.create({
  wrap:    { paddingHorizontal: 20, paddingVertical: 22 },
  eyebrow: { fontSize: 9, fontWeight: '500', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  heading: { fontSize: 26, letterSpacing: 0, lineHeight: 32, marginBottom: 16 },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  q:       { fontSize: 13, flex: 1, marginRight: 12 },
  empty:   { fontSize: 12, paddingVertical: 8 },
});

/* ══════════════════════════════════════════════════════════════════
   GALLERY — Image 6 exact match
   CLASSIC: light bg, "GALLERY" eyebrow + heading, image grid
══════════════════════════════════════════════════════════════════ */
function GalleryBlock({ cfg, theme }: any) {
  const t  = theme as ThemeDef;
  const th = cfg._theme ?? 'CLASSIC';
  const images: string[] = cfg.images || cfg.media_ids || [];
  const layout: 'grid' | 'carousel' = cfg.layout ?? 'grid';
  const [lbIdx, setLbIdx] = useState<number | null>(null);
  const hPad = 20;
  const innerW = SW - hPad * 2;

  const Header = () => {
    if (th === 'FUN') return (
      <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300 }}>
        <Text style={[gl.eyebrowFun, { color: t.accent }]}>✦ Gallery</Text>
        <Text style={[gl.headingFun, { color: t.text }]}>{cfg.title || 'Our Moments'}</Text>
      </MotiView>
    );
    if (th === 'MODERN') return (
      <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300 }}>
        <View style={[gl.modernBar, { backgroundColor: t.accent }]} />
        <Text style={[gl.headingModern, { color: t.text }]}>{cfg.title || 'Gallery'}</Text>
      </MotiView>
    );
    if (th === 'MINIMAL') return (
      <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300 }} style={{ alignItems: 'center' }}>
        <Text style={[gl.eyebrowMinimal, { color: t.muted }]}>Gallery</Text>
        <Text style={[gl.headingMinimal, { color: t.text }]}>{cfg.title || 'Our Moments'}</Text>
      </MotiView>
    );
    // CLASSIC / ELEGANT / LUXURY
    return (
      <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300 }}>
        <Text style={[gl.eyebrow, { color: t.muted }]}>GALLERY</Text>
        <Text style={[gl.heading, { color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle }]}>
          {cfg.title || 'Our Moments'}
        </Text>
        <View style={[gl.ornament, { backgroundColor: t.accent }]} />
      </MotiView>
    );
  };

  const emptyNode = (
    <View style={gl.empty}>
      <Feather name="image" size={24} color={`${t.accent}50`} />
      <Text style={[gl.emptyTxt, { color: t.muted }]}>No images yet</Text>
    </View>
  );

  return (
    <View style={[gl.wrap, { backgroundColor: t.bg }]}>
      <Header />
      {images.length === 0 ? emptyNode
        : layout === 'carousel' ? (
          <GalleryCarouselPreview images={images} accent={t.accent} innerW={innerW} onTap={setLbIdx} />
        ) : th === 'FUN' ? (
          <GalleryGridFun images={images} accent={t.accent} innerW={innerW} onTap={setLbIdx} />
        ) : th === 'MODERN' ? (
          <GalleryGridModern images={images} innerW={innerW} onTap={setLbIdx} />
        ) : th === 'MINIMAL' ? (
          <GalleryGridMinimal images={images} innerW={innerW} onTap={setLbIdx} />
        ) : (
          <GalleryGridClassic images={images} innerW={innerW} onTap={setLbIdx} />
        )
      }
      {lbIdx !== null && (
        <GalleryLightboxModal images={images} startIndex={lbIdx} accent={t.accent} onClose={() => setLbIdx(null)} />
      )}
    </View>
  );
}

/* ── FUN: 2-col, mixed aspect ratios, bold offset accent shadow ── */
function GalleryGridFun({ images, accent, innerW, onTap }: {
  images: string[]; accent: string; innerW: number; onTap: (i: number) => void;
}) {
  const gap  = 8;
  const cols = 2;
  const cellW = (innerW - gap * (cols - 1)) / cols;

  return (
    <View style={[gl.grid, { gap }]}>
      {images.map((uri, i) => {
        const isPortrait = i % 3 === 1;
        const cellH = isPortrait ? cellW * 1.3 : cellW * 0.75;
        return (
          <MotiView key={i} from={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 260, delay: i * 40 }} style={{ width: cellW }}>
            {/* Offset accent shadow layer */}
            <View style={{ width: cellW, height: cellH + 4 }}>
              <View style={[gl.funShadow, { width: cellW, height: cellH, backgroundColor: accent, top: 4, left: 4, borderRadius: 16 }]} />
              <Pressable style={[gl.funCell, { width: cellW, height: cellH }]}
                onPress={() => onTap(i)} onLongPress={() => downloadImageToLibrary(uri)} delayLongPress={500}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <View style={gl.tapHint} pointerEvents="none">
                  <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.8)" />
                </View>
              </Pressable>
            </View>
          </MotiView>
        );
      })}
    </View>
  );
}

/* ── MODERN: tight 3-col square grid, no radius ─────────────────── */
function GalleryGridModern({ images, innerW, onTap }: {
  images: string[]; innerW: number; onTap: (i: number) => void;
}) {
  const gap   = 2;
  const cols  = 3;
  const cellW = (innerW - gap * (cols - 1)) / cols;

  return (
    <View style={[gl.grid, { gap }]}>
      {images.map((uri, i) => (
        <MotiView key={i} from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 220, delay: i * 25 }} style={{ width: cellW }}>
          <Pressable style={[gl.cell, { width: cellW, height: cellW, borderRadius: 0 }]}
            onPress={() => onTap(i)} onLongPress={() => downloadImageToLibrary(uri)} delayLongPress={500}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={gl.tapHint} pointerEvents="none">
              <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.7)" />
            </View>
          </Pressable>
        </MotiView>
      ))}
    </View>
  );
}

/* ── MINIMAL: 2-col, alternating portrait/landscape, no radius ── */
function GalleryGridMinimal({ images, innerW, onTap }: {
  images: string[]; innerW: number; onTap: (i: number) => void;
}) {
  const gap   = 6;
  const cols  = 2;
  const cellW = (innerW - gap * (cols - 1)) / cols;

  return (
    <View style={[gl.grid, { gap }]}>
      {images.map((uri, i) => {
        const cellH = i % 2 === 0 ? cellW * 1.25 : cellW * 0.75;
        return (
          <MotiView key={i} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 280, delay: i * 50 }} style={{ width: cellW }}>
            <Pressable style={[gl.cell, { width: cellW, height: cellH, borderRadius: 0 }]}
              onPress={() => onTap(i)} onLongPress={() => downloadImageToLibrary(uri)} delayLongPress={500}>
              <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={gl.tapHint} pointerEvents="none">
                <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.7)" />
              </View>
            </Pressable>
          </MotiView>
        );
      })}
    </View>
  );
}

/* ── CLASSIC / ELEGANT / LUXURY: masonry-style alternating heights */
function GalleryGridClassic({ images, innerW, onTap }: {
  images: string[]; innerW: number; onTap: (i: number) => void;
}) {
  const gap   = 5;
  const cols  = 2;
  const cellW = (innerW - gap * (cols - 1)) / cols;
  // Masonry illusion: alternate tall/short across rows
  const heights = [cellW * 1.1, cellW * 0.75, cellW * 0.75, cellW * 1.1, cellW * 0.9, cellW * 1.0];

  return (
    <View style={[gl.grid, { gap }]}>
      {images.map((uri, i) => {
        const cellH = heights[i % heights.length];
        return (
          <MotiView key={i} from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 270, delay: i * 40 }} style={{ width: cellW }}>
            <Pressable style={[gl.cell, { width: cellW, height: cellH, borderRadius: 6 }]}
              onPress={() => onTap(i)} onLongPress={() => downloadImageToLibrary(uri)} delayLongPress={500}>
              <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={gl.tapHint} pointerEvents="none">
                <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.7)" />
              </View>
            </Pressable>
          </MotiView>
        );
      })}
    </View>
  );
}

/* ── Gallery carousel ──────────────────────────────────────────── */
function GalleryCarouselPreview({ images, accent, innerW, onTap }: {
  images: string[]; accent: string; innerW: number; onTap: (i: number) => void;
}) {
  const [current, setCurrent] = useState(0);
  const slideW = innerW;
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, images.length - 1));
    scrollRef.current?.scrollTo({ x: clamped * slideW, animated: true });
    setCurrent(clamped);
  };

  return (
    <View>
      <View style={{ overflow: 'hidden', borderRadius: 10 }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / slideW);
            setCurrent(idx);
          }}
          style={{ width: slideW }}
        >
          {images.map((uri, i) => (
            <Pressable
              key={i}
              style={{ width: slideW, height: slideW * 0.65 }}
              onPress={() => onTap(i)}
              onLongPress={() => downloadImageToLibrary(uri)}
              delayLongPress={500}
            >
              <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>

        {/* Prev / Next arrows */}
        {current > 0 && (
          <Pressable style={[gl.arrow, gl.arrowL]} onPress={() => goTo(current - 1)} hitSlop={8}>
            <Feather name="chevron-left" size={16} color="#fff" />
          </Pressable>
        )}
        {current < images.length - 1 && (
          <Pressable style={[gl.arrow, gl.arrowR]} onPress={() => goTo(current + 1)} hitSlop={8}>
            <Feather name="chevron-right" size={16} color="#fff" />
          </Pressable>
        )}
      </View>

      {/* Dot indicators */}
      <View style={gl.dots}>
        {images.map((_, i) => (
          <Pressable key={i} onPress={() => goTo(i)} hitSlop={6}>
            <View style={[gl.dot, { backgroundColor: i === current ? accent : 'rgba(0,0,0,0.2)', transform: [{ scale: i === current ? 1.3 : 1 }] }]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ── Lightbox modal ────────────────────────────────────────────── */
function GalleryLightboxModal({ images, startIndex, accent, onClose }: {
  images: string[]; startIndex: number; accent: string; onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(images.length - 1, i + 1));

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={gl.lb}>
        {/* Close */}
        <Pressable style={gl.lbClose} onPress={onClose} hitSlop={12}>
          <Feather name="x" size={20} color="#fff" />
        </Pressable>

        {/* Counter */}
        <View style={gl.lbCounter}>
          <Text style={gl.lbCounterTxt}>{idx + 1} / {images.length}</Text>
        </View>

        {/* Image */}
        <Image
          source={{ uri: images[idx] }}
          style={gl.lbImage}
          resizeMode="contain"
        />

        {/* Prev / Next */}
        {idx > 0 && (
          <Pressable style={[gl.lbArrow, gl.lbArrowL]} onPress={prev} hitSlop={12}>
            <Feather name="chevron-left" size={28} color="#fff" />
          </Pressable>
        )}
        {idx < images.length - 1 && (
          <Pressable style={[gl.lbArrow, gl.lbArrowR]} onPress={next} hitSlop={12}>
            <Feather name="chevron-right" size={28} color="#fff" />
          </Pressable>
        )}

        {/* Download */}
        <Pressable
          style={[gl.lbDl, { backgroundColor: accent }]}
          onPress={() => downloadImageToLibrary(images[idx])}
          hitSlop={8}
        >
          <Feather name="download" size={16} color="#fff" />
        </Pressable>

        {/* Dots */}
        {images.length > 1 && (
          <View style={gl.lbDots}>
            {images.map((_, i) => (
              <Pressable key={i} onPress={() => setIdx(i)} hitSlop={6}>
                <View style={[gl.dot, { backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.35)', transform: [{ scale: i === idx ? 1.3 : 1 }] }]} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const gl = StyleSheet.create({
  wrap:    { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 16 },
  // CLASSIC header
  eyebrow: { fontSize: 9, fontWeight: '500', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 },
  heading: { fontSize: 26, letterSpacing: 0, marginBottom: 8 },
  ornament: { width: 32, height: 2, marginBottom: 14, borderRadius: 1 },
  // FUN header
  eyebrowFun:  { fontSize: 10, fontWeight: '700', letterSpacing: 4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 },
  headingFun:  { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  // MODERN header
  modernBar:   { width: 32, height: 3, marginBottom: 8, borderRadius: 1 },
  headingModern: { fontSize: 26, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, marginBottom: 12 },
  // MINIMAL header
  eyebrowMinimal: { fontSize: 10, letterSpacing: 8, textTransform: 'uppercase', marginBottom: 6 },
  headingMinimal: { fontSize: 24, fontWeight: '300', marginBottom: 14 },
  // grids
  grid:    { flexDirection: 'row', flexWrap: 'wrap' },
  cell:    { overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)' },
  // FUN cell with offset shadow
  funShadow: { position: 'absolute' },
  funCell:   { overflow: 'hidden', borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)' },
  tapHint: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 4, padding: 3 },
  empty:   { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
  emptyTxt:{ fontSize: 11 },
  // carousel
  arrow:   {
    position: 'absolute', top: '50%', marginTop: -18,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  arrowL:  { left: 8 },
  arrowR:  { right: 8 },
  dots:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 },
  dot:     { width: 6, height: 6, borderRadius: 3 },
  // lightbox
  lb:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  lbClose: { position: 'absolute', top: 48, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  lbCounter: { position: 'absolute', top: 54, alignSelf: 'center' },
  lbCounterTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  lbImage: { width: SW, height: SW * 1.1 },
  lbArrow: { position: 'absolute', top: '50%', marginTop: -28, width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  lbArrowL: { left: 12 },
  lbArrowR: { right: 12 },
  lbDl:    { position: 'absolute', bottom: 52, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  lbDots:  { position: 'absolute', bottom: 24, flexDirection: 'row', gap: 7, alignItems: 'center' },
});

/* ── Image download helper ──────────────────────────────────────── */
async function downloadImageToLibrary(uri: string) {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo library access to save images.');
      return;
    }
    const filename = uri.split('/').pop()?.split('?')[0] ?? `img_${Date.now()}.jpg`;
    const dest = new FSFile(Paths.cache, filename);
    const res = await fetch(uri);
    const buf = await res.arrayBuffer();
    dest.write(new Uint8Array(buf));
    await MediaLibrary.saveToLibraryAsync(dest.uri);
    Alert.alert('Saved', 'Image saved to your photo library.');
  } catch {
    Alert.alert('Error', 'Could not save image. Please try again.');
  }
}

/* ══════════════════════════════════════════════════════════════════
   STORY / COUPLE / COUNTDOWN / VENUE / SPEAKERS / CTA / DONATIONS / REGISTRY
══════════════════════════════════════════════════════════════════ */
function StoryBlock({ cfg, title, body, theme }: any) {
  const t = theme as ThemeDef;
  return (
    <View style={[gen.wrap, { backgroundColor: t.bg, flexDirection: 'row' }]}>
      <View style={[gen.storyBar, { backgroundColor: t.accent }]} />
      <View style={{ flex: 1, paddingVertical: 18, paddingRight: 16, gap: 6 }}>
        <Text style={[gen.title, { color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle }]}>
          {title || 'Our Story'}
        </Text>
        <Text style={[gen.body, { color: t.muted }]} numberOfLines={3}>{body || 'Share the story behind this event.'}</Text>
      </View>
    </View>
  );
}

function CoupleBlock({ cfg, theme }: any) {
  const t = theme as ThemeDef;
  const p1 = cfg.bride_name  || cfg.person1_name || 'Person 1';
  const p2 = cfg.groom_name  || cfg.person2_name || 'Person 2';
  const i1 = cfg.person1_image as string | undefined;
  const i2 = cfg.person2_image as string | undefined;

  return (
    <View style={[gen.couple, { backgroundColor: t.bg }]}>
      <CoupleAvatar img={i1} name={p1} accent={t.accent} />
      <Text style={[gen.heart, { color: t.accent }]}>♥</Text>
      <CoupleAvatar img={i2} name={p2} accent={t.accent} />
    </View>
  );
}

function CoupleAvatar({ img, name, accent, size = 56 }: any) {
  const initials = (name as string).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[gen.avatar, { width: size, height: size, borderRadius: size/2, backgroundColor: `${accent}20`, borderColor: `${accent}50` }]}>
      {img
        ? <Image source={{ uri: img }} style={[StyleSheet.absoluteFill, { borderRadius: size/2 }]} resizeMode="cover" />
        : <Text style={[gen.avatarTxt, { color: accent, fontSize: size * 0.28 }]}>{initials}</Text>
      }
    </View>
  );
}

function CountdownBlock({ cfg, event, theme }: any) {
  const t  = theme as ThemeDef;
  const iso = cfg.event_date || cfg.starts_at || event?.starts_at_utc || event?.starts_at;
  const [diff, setDiff] = useState(calcDiff(iso));
  useEffect(() => {
    if (!iso) return;
    const timer = setInterval(() => setDiff(calcDiff(iso)), 1000);
    return () => clearInterval(timer);
  }, [iso]);

  const units = [
    { l: 'DAYS', v: diff?.d },
    { l: 'HRS',  v: diff?.h },
    { l: 'MIN',  v: diff?.m },
    { l: 'SEC',  v: diff?.s },
  ];

  return (
    <View style={[gen.wrap, { backgroundColor: t.bg, flexDirection: 'row', gap: 8, paddingVertical: 18 }]}>
      {units.map(u => (
        <View key={u.l} style={[gen.cntBox, { borderColor: `${t.accent}40`, backgroundColor: `${t.accent}12` }]}>
          <Text style={[gen.cntNum, { color: t.accent }]}>{String(u.v ?? 0).padStart(2,'0')}</Text>
          <Text style={[gen.cntLbl, { color: t.muted }]}>{u.l}</Text>
        </View>
      ))}
    </View>
  );
}

function VenueBlock({ cfg, title, theme }: any) {
  const t = theme as ThemeDef;
  const name = cfg.venue_name || title || 'Venue';
  const address = [cfg.venue_address, cfg.city].filter(Boolean).join(', ');
  return (
    <View style={[gen.wrap, { backgroundColor: t.bg, flexDirection: 'row', alignItems: 'center', paddingVertical: 20 }]}>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={[gen.title, { color: t.text, fontWeight: t.fontWeightHeading }]}>{name}</Text>
        {address ? <Text style={[gen.body, { color: t.muted }]} numberOfLines={2}>{address}</Text> : null}
      </View>
      <View style={[gen.venueIcon, { backgroundColor: `${t.accent}18` }]}>
        <Feather name="map-pin" size={22} color={t.accent} />
      </View>
    </View>
  );
}

function SpeakersBlock({ cfg, theme }: any) {
  const t = theme as ThemeDef;
  const items: any[] = cfg.speakers || cfg.items || [];
  return (
    <View style={[gen.wrap, { backgroundColor: t.bg, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 18 }]}>
      {items.length === 0
        ? <Text style={[gen.body, { color: t.muted }]}>No speakers added</Text>
        : items.slice(0, 4).map((spk: any, i: number) => (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <View style={[gen.avatar, { width: 48, height: 48, borderRadius: 24, backgroundColor: `${t.accent}18`, borderColor: `${t.accent}50` }]}>
                {spk.image
                  ? <Image source={{ uri: spk.image }} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} resizeMode="cover" />
                  : <Feather name="user" size={18} color={t.accent} />
                }
              </View>
              <Text style={[gen.body, { color: t.muted, maxWidth: 60, textAlign: 'center' }]} numberOfLines={1}>{spk.name || `Speaker ${i+1}`}</Text>
            </View>
          ))
      }
    </View>
  );
}

function CTABlock({ cfg, title, body, theme }: any) {
  const t = theme as ThemeDef;
  return (
    <View style={[gen.wrap, { backgroundColor: t.bg, alignItems: 'center', paddingVertical: 24 }]}>
      <Text style={[gen.title, { color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle, textAlign: 'center' }]}>{title || 'Join us'}</Text>
      {body ? <Text style={[gen.body, { color: t.muted, textAlign: 'center' }]} numberOfLines={2}>{body}</Text> : null}
      <View style={[gen.btn, { backgroundColor: t.accent, marginTop: 10 }]}>
        <Text style={gen.btnTxt}>{cfg.button_text || 'Get Started'}</Text>
      </View>
    </View>
  );
}

function DonationsBlock({ cfg, title, theme }: any) {
  const t = theme as ThemeDef;
  return (
    <View style={[gen.wrap, { backgroundColor: t.bg, alignItems: 'center', paddingVertical: 20 }]}>
      <Text style={[gen.title, { color: t.text, textAlign: 'center' }]}>{title || 'Support This Event'}</Text>
      <View style={[gen.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: t.accent, marginTop: 10 }]}>
        <Feather name="heart" size={13} color={t.accent} />
        <Text style={[gen.btnTxt, { color: t.accent }]}>Donate</Text>
      </View>
    </View>
  );
}

function RegistryBlock({ cfg, title, theme }: any) {
  const t = theme as ThemeDef;
  const items: any[] = cfg.items || [];
  return (
    <View style={[gen.wrap, { backgroundColor: t.bg, paddingVertical: 18 }]}>
      <Text style={[gen.title, { color: t.text }]}>{title || 'Registry'}</Text>
      {items.slice(0, 2).map((item: any, i: number) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Feather name="external-link" size={12} color={t.accent} />
          <Text style={[gen.body, { color: t.muted }]} numberOfLines={1}>{item.name || item.store || `Registry ${i+1}`}</Text>
        </View>
      ))}
    </View>
  );
}

function GenericBlock({ title, body, theme, type }: any) {
  const t = theme as ThemeDef;
  const accent = BADGE_COLOR[type] ?? t.accent;
  return (
    <View style={[gen.wrap, { backgroundColor: t.bg, paddingVertical: 18 }]}>
      <View style={[gen.accentBar, { backgroundColor: accent }]} />
      <Text style={[gen.title, { color: t.text }]}>{title || type}</Text>
      {body ? <Text style={[gen.body, { color: t.muted }]} numberOfLines={2}>{body}</Text> : null}
    </View>
  );
}

/* Shared generic styles */
const gen = StyleSheet.create({
  wrap:     { padding: 18, minHeight: 88 },
  storyBar: { width: 4, borderRadius: 2, margin: 16 },
  accentBar:{ height: 2, width: 36, borderRadius: 2, marginBottom: 8 },
  title:    { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  body:     { fontSize: 12, lineHeight: 18 },
  btn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 99 },
  btnTxt:   { fontSize: 13, fontWeight: '800', color: '#fff' },
  avatar:   { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarTxt:{ fontWeight: '900' },
  heart:    { fontSize: 24 },
  couple:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 24 },
  cntBox:   { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, gap: 3 },
  cntNum:   { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  cntLbl:   { fontSize: 7, fontWeight: '800', letterSpacing: 1 },
  venueIcon:{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

/* Root card styles */
const r = StyleSheet.create({
  card:    { overflow: 'hidden', position: 'relative' },
  badge:   { position: 'absolute', top: 10, right: 10, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, zIndex: 3 },
  badgeTxt:{ fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.8, textTransform: 'uppercase' },
  ring:    { ...StyleSheet.absoluteFillObject, borderWidth: 2, zIndex: 4 },
  hidden:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, zIndex: 5 },
  hiddenTxt:{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
});












// /**
//  * eventapp-mobile/components/builder/SectionPreviewCard.tsx
//  *
//  * Renders each section with REAL data + theme styling, matching the
//  * web builder canvas exactly (Images 1, 2, 4):
//  *
//  * ✅ HERO      — real bg image, "YOU ARE INVITED", real title, subtitle, JOIN NOW btn
//  * ✅ ABOUT     — "ABOUT" eyebrow, real bold heading, real body text (Image 2)
//  * ✅ SCHEDULE  — "SCHEDULE" heading + real time/title rows (Image 4: 9:00 AM / Registration)
//  * ✅ COUPLE    — two avatars + heart
//  * ✅ COUNTDOWN — live ticking boxes
//  * ✅ VENUE     — name + address + pin icon
//  * ✅ GALLERY   — real image grid
//  * ✅ SPEAKERS  — avatars + names
//  * ✅ TICKETS   — tier cards
//  * ✅ FAQ       — question rows
//  * ✅ CTA/STORY/DONATIONS/REGISTRY — real text
//  *
//  * Theme-aware: reads _theme from config, applies matching
//  * bg/text/accent colors so MODERN looks different from CLASSIC.
//  *
//  * Animated: fade+slide in on mount, scale on selection change.
//  */

// import React, { useEffect, useRef } from 'react';
// import {
//   View, Text, Image, StyleSheet, Animated, Dimensions,
// } from 'react-native';
// import { Feather }        from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';

// const SW = Dimensions.get('window').width;

// /* ── Theme definitions — mirrors web STYLE_THEMES ───────────────── */
// const THEMES: Record<string, { bg: string; dark: boolean; accent: string; text: string; muted: string }> = {
//   CLASSIC: { bg: '#FAF9F6', dark: false, accent: '#C9A96E', text: '#1C1917', muted: '#78716C' },
//   ELEGANT: { bg: '#FDF5EF', dark: false, accent: '#B87355', text: '#271A14', muted: '#8C7B6E' },
//   MODERN:  { bg: '#0e0f11', dark: true,  accent: '#6366f1', text: '#f0f1f3', muted: '#8b8f9a' },
//   MINIMAL: { bg: '#F9F9F9', dark: false, accent: '#888888', text: '#222222', muted: '#888888' },
//   LUXURY:  { bg: '#0D0C0A', dark: true,  accent: '#D4AF6F', text: '#EDE8DF', muted: '#9A8A72' },
//   FUN:     { bg: '#FFFBF0', dark: false, accent: '#F59E0B', text: '#1C2333', muted: '#6B7280' },
// };

// const DEFAULT_THEME = THEMES.MODERN;

// /* ── Per-type badge accent colours ──────────────────────────────── */
// const BADGE_COLOR: Record<string, string> = {
//   HERO: '#6c6fee', ABOUT: '#3ecf8e', GALLERY: '#f59e0b', FAQ: '#f43f5e',
//   CTA: '#8b5cf6', SPEAKERS: '#06b6d4', VENUE: '#c9a96e', COUNTDOWN: '#ef4444',
//   TICKETS: '#22c55e', COUPLE: '#ec4899', STORY: '#f97316', SCHEDULE: '#64748b',
//   REGISTRY: '#a78bfa', DONATIONS: '#10b981',
// };

// function getTheme(cfg?: Record<string, any>) {
//   const key = cfg?._theme as string | undefined;
//   return THEMES[key ?? ''] ?? DEFAULT_THEME;
// }

// /* ══════════════════════════════════════════════════════════════════
//    ROOT CARD — animated wrapper
// ══════════════════════════════════════════════════════════════════ */
// interface Section {
//   id: string; section_type: string; title?: string; body?: string;
//   config?: Record<string, any>; is_visible?: boolean;
// }
// interface Props { section: Section; selected: boolean; event?: any; }

// export default function SectionPreviewCard({ section, selected, event }: Props) {
//   const type      = section.section_type;
//   const badgeColor = BADGE_COLOR[type] ?? '#6c6fee';
//   const cfg       = section.config ?? {};
//   const theme     = getTheme(cfg);

//   /* entrance animation */
//   const fadeAnim  = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(12)).current;
//   const scaleAnim = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim,  { toValue: 1, duration: 280, useNativeDriver: true }),
//       Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
//     ]).start();
//   }, []);

//   /* scale pulse when selected changes */
//   useEffect(() => {
//     Animated.sequence([
//       Animated.timing(scaleAnim, { toValue: selected ? 0.985 : 1.005, duration: 100, useNativeDriver: true }),
//       Animated.timing(scaleAnim, { toValue: 1,                         duration: 120, useNativeDriver: true }),
//     ]).start();
//   }, [selected]);

//   return (
//     <Animated.View
//       style={[
//         { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
//       ]}
//     >
//       <View
//         style={[
//           s.card,
//           { backgroundColor: theme.bg },
//           selected ? { borderColor: badgeColor, borderWidth: 2 } : { borderColor: 'rgba(0,0,0,0.08)', borderWidth: 1 },
//         ]}
//       >
//         {/* Content */}
//         <SectionContent
//           type={type} cfg={cfg} title={section.title}
//           body={section.body} event={event} theme={theme}
//         />

//         {/* Type badge — top right pill, matches web exactly */}
//         <View style={[s.badge, { backgroundColor: badgeColor }]}>
//           <Text style={s.badgeTxt}>{type}</Text>
//         </View>

//         {/* Hidden overlay */}
//         {section.is_visible === false && (
//           <View style={s.hiddenOverlay}>
//             <Feather name="eye-off" size={14} color="rgba(255,255,255,0.6)" />
//             <Text style={s.hiddenTxt}>HIDDEN</Text>
//           </View>
//         )}

//         {/* Selection ring */}
//         {selected && <View style={[s.ring, { borderColor: badgeColor }]} pointerEvents="none" />}
//       </View>
//     </Animated.View>
//   );
// }

// /* ── Router ──────────────────────────────────────────────────────── */
// function SectionContent({ type, cfg, title, body, event, theme }: any) {
//   switch (type) {
//     case 'HERO':      return <HeroSection      cfg={cfg} title={title} body={body} theme={theme} />;
//     case 'ABOUT':     return <AboutSection     cfg={cfg} title={title} body={body} theme={theme} />;
//     case 'STORY':     return <StorySection     cfg={cfg} title={title} body={body} theme={theme} />;
//     case 'COUPLE':    return <CoupleSection    cfg={cfg} theme={theme} />;
//     case 'COUNTDOWN': return <CountdownSection cfg={cfg} event={event} theme={theme} />;
//     case 'SCHEDULE':  return <ScheduleSection  cfg={cfg} title={title} theme={theme} />;
//     case 'VENUE':     return <VenueSection     cfg={cfg} title={title} theme={theme} />;
//     case 'GALLERY':   return <GallerySection   cfg={cfg} theme={theme} />;
//     case 'SPEAKERS':  return <SpeakersSection  cfg={cfg} theme={theme} />;
//     case 'TICKETS':   return <TicketsSection   cfg={cfg} theme={theme} />;
//     case 'FAQ':       return <FAQSection       cfg={cfg} title={title} theme={theme} />;
//     case 'CTA':       return <CTASection       cfg={cfg} title={title} body={body} theme={theme} />;
//     case 'DONATIONS': return <DonationsSection cfg={cfg} title={title} theme={theme} />;
//     case 'REGISTRY':  return <RegistrySection  cfg={cfg} title={title} theme={theme} />;
//     default:          return <GenericSection   title={title} body={body} theme={theme} type={type} />;
//   }
// }

// /* ══════════════════════════════════════════════════════════════════
//    HERO — full bleed image + gradient + real text (Image 1 match)
// ══════════════════════════════════════════════════════════════════ */
// function HeroSection({ cfg, title, body, theme }: any) {
//   const bg      = cfg.background_image as string | undefined;
//   const headT   = title || 'Welcome to our event';
//   const subT    = body  || 'Add your event subtitle here';
//   const ctaTxt  = cfg.cta_text || 'JOIN NOW';
//   const accent  = theme.accent;

//   return (
//     <View style={hero.wrap}>
//       {bg
//         ? <Image source={{ uri: bg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
//         : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1b2e' }]} />
//       }
//       <LinearGradient
//         colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.82)']}
//         style={StyleSheet.absoluteFill}
//         start={{ x: 0, y: 0.1 }} end={{ x: 0, y: 1 }}
//       />
//       <View style={hero.content}>
//         <Text style={hero.eyebrow}>YOU ARE INVITED</Text>
//         {/* Accent bar — matches web MODERN hero */}
//         <View style={[hero.accentBar, { backgroundColor: accent }]} />
//         <Text style={hero.title}>{headT.toUpperCase()}</Text>
//         <Text style={hero.sub}>{subT}</Text>
//         {cfg.show_cta !== false && (
//           <View style={[hero.cta, { borderColor: accent }]}>
//             <Text style={[hero.ctaTxt, { color: '#fff' }]}>{ctaTxt}</Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// }

// const hero = StyleSheet.create({
//   wrap:      { height: 220 },
//   content:   { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, gap: 7, alignItems: 'flex-start' },
//   eyebrow:   { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 2.5, textTransform: 'uppercase' },
//   accentBar: { height: 2, width: 40, borderRadius: 2 },
//   title:     { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 29 },
//   sub:       { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
//   cta:       { marginTop: 4, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 6, borderWidth: 1.5 },
//   ctaTxt:    { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    ABOUT — matches web Image 2: "ABOUT" eyebrow + bold heading
// ══════════════════════════════════════════════════════════════════ */
// function AboutSection({ cfg, title, body, theme }: any) {
//   const accent = theme.accent;
//   return (
//     <View style={[ab.wrap, { backgroundColor: theme.bg }]}>
//       <View style={[ab.accentBar, { backgroundColor: accent }]} />
//       <Text style={[ab.eyebrow, { color: accent }]}>ABOUT</Text>
//       <Text style={[ab.title, { color: theme.text }]}>{(title || 'About this event').toUpperCase()}</Text>
//       <Text style={[ab.body, { color: theme.muted }]} numberOfLines={4}>
//         {body || 'Tell guests about this event.'}
//       </Text>
//     </View>
//   );
// }

// const ab = StyleSheet.create({
//   wrap:     { padding: 20, gap: 8, minHeight: 130 },
//   accentBar:{ height: 2, width: 36, borderRadius: 2, marginBottom: 2 },
//   eyebrow:  { fontSize: 9, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
//   title:    { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, lineHeight: 27 },
//   body:     { fontSize: 13, lineHeight: 20, marginTop: 4 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    SCHEDULE — matches web Image 4: "SCHEDULE" heading + time rows
//    9:00 AM / Registration & Welcome / Main Hall
// ══════════════════════════════════════════════════════════════════ */
// function ScheduleSection({ cfg, title, theme }: any) {
//   const items: any[] = cfg.items || cfg.schedule_items || [];
//   const accent = theme.accent;

//   return (
//     <View style={[sc.wrap, { backgroundColor: theme.bg }]}>
//       <View style={[sc.accentBar, { backgroundColor: accent }]} />
//       <Text style={[sc.heading, { color: theme.text }]}>
//         {(title || 'SCHEDULE').toUpperCase()}
//       </Text>

//       {items.length === 0 ? (
//         <Text style={[sc.empty, { color: theme.muted }]}>No schedule items yet</Text>
//       ) : (
//         items.slice(0, 5).map((item: any, i: number) => (
//           <View key={i} style={[sc.row, { borderBottomColor: theme.dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]}>
//             {item.time ? (
//               <Text style={[sc.time, { color: accent }]}>{item.time}</Text>
//             ) : null}
//             <Text style={[sc.itemTitle, { color: theme.text }]} numberOfLines={1}>
//               {item.title || item.name || `Item ${i + 1}`}
//             </Text>
//             {item.location ? (
//               <Text style={[sc.location, { color: theme.muted }]} numberOfLines={1}>{item.location}</Text>
//             ) : null}
//           </View>
//         ))
//       )}
//     </View>
//   );
// }

// const sc = StyleSheet.create({
//   wrap:      { paddingHorizontal: 20, paddingVertical: 18, gap: 0 },
//   accentBar: { height: 2, width: 36, borderRadius: 2, marginBottom: 8 },
//   heading:   { fontSize: 20, fontWeight: '900', letterSpacing: -0.3, marginBottom: 12 },
//   row:       { paddingVertical: 10, borderBottomWidth: 1, gap: 2 },
//   time:      { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
//   itemTitle: { fontSize: 15, fontWeight: '700' },
//   location:  { fontSize: 12 },
//   empty:     { fontSize: 12, paddingVertical: 16 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    STORY
// ══════════════════════════════════════════════════════════════════ */
// function StorySection({ cfg, title, body, theme }: any) {
//   return (
//     <View style={[st.wrap, { backgroundColor: theme.bg }]}>
//       <View style={[st.bar, { backgroundColor: theme.accent }]} />
//       <View style={st.content}>
//         <Text style={[st.title, { color: theme.text }]}>{title || 'Our Story'}</Text>
//         <Text style={[st.body, { color: theme.muted }]} numberOfLines={3}>
//           {body || 'Share the story behind this event.'}
//         </Text>
//       </View>
//     </View>
//   );
// }

// const st = StyleSheet.create({
//   wrap:    { flexDirection: 'row', minHeight: 90 },
//   bar:     { width: 4, borderRadius: 2, margin: 14 },
//   content: { flex: 1, paddingVertical: 14, paddingRight: 14, gap: 6 },
//   title:   { fontSize: 16, fontWeight: '800' },
//   body:    { fontSize: 13, lineHeight: 19 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    COUPLE
// ══════════════════════════════════════════════════════════════════ */
// function CoupleSection({ cfg, theme }: any) {
//   const accent = theme.accent;
//   const p1 = cfg.bride_name  || cfg.person1_name || 'Person 1';
//   const p2 = cfg.groom_name  || cfg.person2_name || 'Person 2';
//   const i1 = cfg.person1_image as string | undefined;
//   const i2 = cfg.person2_image as string | undefined;

//   return (
//     <View style={[co.wrap, { backgroundColor: theme.bg }]}>
//       <Avatar img={i1} name={p1} accent={accent} size={60} />
//       <Text style={[co.heart, { color: accent }]}>♥</Text>
//       <Avatar img={i2} name={p2} accent={accent} size={60} />
//     </View>
//   );
// }

// function Avatar({ img, name, accent, size }: any) {
//   const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
//   return (
//     <View style={[co.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
//       {img
//         ? <Image source={{ uri: img }} style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]} resizeMode="cover" />
//         : <Text style={[co.initials, { color: accent, fontSize: size * 0.3 }]}>{initials}</Text>
//       }
//     </View>
//   );
// }

// const co = StyleSheet.create({
//   wrap:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 24 },
//   avatar:  { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
//   initials:{ fontWeight: '900' },
//   heart:   { fontSize: 26 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    COUNTDOWN — live ticking DAYS / HRS / MIN / SEC
// ══════════════════════════════════════════════════════════════════ */
// function CountdownSection({ cfg, event, theme }: any) {
//   const iso = cfg.event_date || cfg.starts_at || event?.starts_at_utc || event?.starts_at;
//   const [diff, setDiff] = React.useState(calcDiff(iso));

//   React.useEffect(() => {
//     if (!iso) return;
//     const t = setInterval(() => setDiff(calcDiff(iso)), 1000);
//     return () => clearInterval(t);
//   }, [iso]);

//   const accent = theme.accent;
//   const units = [
//     { l: 'DAYS', v: diff ? String(diff.d).padStart(2,'0') : '--' },
//     { l: 'HRS',  v: diff ? String(diff.h).padStart(2,'0') : '--' },
//     { l: 'MIN',  v: diff ? String(diff.m).padStart(2,'0') : '--' },
//     { l: 'SEC',  v: diff ? String(diff.s).padStart(2,'0') : '--' },
//   ];

//   return (
//     <View style={[cnt.wrap, { backgroundColor: theme.bg }]}>
//       {units.map(u => (
//         <View key={u.l} style={[cnt.box, { borderColor: `${accent}45`, backgroundColor: `${accent}14` }]}>
//           <Text style={[cnt.num, { color: accent }]}>{u.v}</Text>
//           <Text style={[cnt.lbl, { color: theme.muted }]}>{u.l}</Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// function calcDiff(iso?: string) {
//   if (!iso) return null;
//   const ms = new Date(iso).getTime() - Date.now();
//   if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
//   const sec = Math.floor(ms / 1000);
//   return { d: Math.floor(sec/86400), h: Math.floor((sec%86400)/3600), m: Math.floor((sec%3600)/60), s: sec%60 };
// }

// const cnt = StyleSheet.create({
//   wrap: { flexDirection: 'row', gap: 8, padding: 16 },
//   box:  { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, borderWidth: 1, gap: 4 },
//   num:  { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
//   lbl:  { fontSize: 7, fontWeight: '800', letterSpacing: 1 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    VENUE
// ══════════════════════════════════════════════════════════════════ */
// function VenueSection({ cfg, title, theme }: any) {
//   const name    = cfg.venue_name    || title || 'Venue';
//   const address = cfg.venue_address || cfg.address || '';
//   const city    = cfg.city          || '';
//   const full    = [address, city].filter(Boolean).join(', ');
//   const accent  = theme.accent;

//   return (
//     <View style={[ve.wrap, { backgroundColor: theme.bg }]}>
//       <View style={ve.info}>
//         <Text style={[ve.name, { color: theme.text }]}>{name}</Text>
//         {full ? <Text style={[ve.addr, { color: theme.muted }]} numberOfLines={2}>{full}</Text> : null}
//       </View>
//       <View style={[ve.pin, { backgroundColor: `${accent}18` }]}>
//         <Feather name="map-pin" size={22} color={accent} />
//       </View>
//     </View>
//   );
// }

// const ve = StyleSheet.create({
//   wrap: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14, minHeight: 88 },
//   info: { flex: 1, gap: 5 },
//   name: { fontSize: 17, fontWeight: '800' },
//   addr: { fontSize: 12, lineHeight: 18 },
//   pin:  { width: 54, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
// });

// /* ══════════════════════════════════════════════════════════════════
//    GALLERY
// ══════════════════════════════════════════════════════════════════ */
// function GallerySection({ cfg, theme }: any) {
//   const images: string[] = cfg.images || cfg.media_ids || [];
//   const cellW = (SW - 6) / 3;

//   if (images.length === 0) {
//     return (
//       <View style={[ga.empty, { backgroundColor: theme.bg }]}>
//         <Feather name="image" size={26} color={`${theme.accent}50`} />
//         <Text style={[ga.emptyTxt, { color: theme.muted }]}>No images yet</Text>
//       </View>
//     );
//   }
//   return (
//     <View style={[ga.grid, { backgroundColor: theme.bg }]}>
//       {images.slice(0, 6).map((uri, i) => (
//         <View key={i} style={[ga.cell, { width: cellW, height: cellW }]}>
//           <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
//         </View>
//       ))}
//     </View>
//   );
// }

// const ga = StyleSheet.create({
//   grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 3, padding: 3 },
//   cell:    { borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.08)' },
//   empty:   { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
//   emptyTxt:{ fontSize: 11 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    SPEAKERS
// ══════════════════════════════════════════════════════════════════ */
// function SpeakersSection({ cfg, theme }: any) {
//   const items: any[] = cfg.speakers || cfg.items || [];
//   const accent = theme.accent;

//   if (items.length === 0) {
//     return (
//       <View style={[sp.empty, { backgroundColor: theme.bg }]}>
//         <Feather name="users" size={22} color={`${accent}50`} />
//         <Text style={[sp.emptyTxt, { color: theme.muted }]}>No speakers added</Text>
//       </View>
//     );
//   }
//   return (
//     <View style={[sp.row, { backgroundColor: theme.bg }]}>
//       {items.slice(0, 4).map((spk: any, i: number) => (
//         <View key={i} style={sp.item}>
//           <View style={[sp.avatar, { borderColor: `${accent}55`, backgroundColor: `${accent}18` }]}>
//             {spk.image
//               ? <Image source={{ uri: spk.image }} style={[StyleSheet.absoluteFill, { borderRadius: 26 }]} resizeMode="cover" />
//               : <Feather name="user" size={20} color={accent} />
//             }
//           </View>
//           <Text style={[sp.name, { color: theme.muted }]} numberOfLines={1}>{spk.name || `Speaker ${i+1}`}</Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// const sp = StyleSheet.create({
//   row:     { flexDirection: 'row', justifyContent: 'space-around', padding: 18, minHeight: 100 },
//   item:    { alignItems: 'center', gap: 7, flex: 1 },
//   avatar:  { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
//   name:    { fontSize: 10, fontWeight: '600', maxWidth: 64, textAlign: 'center' },
//   empty:   { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
//   emptyTxt:{ fontSize: 11 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    TICKETS
// ══════════════════════════════════════════════════════════════════ */
// function TicketsSection({ cfg, theme }: any) {
//   const items: any[] = cfg.ticket_types || cfg.tickets || cfg.items || [];
//   const accent = theme.accent;

//   if (items.length === 0) {
//     return (
//       <View style={[tk.empty, { backgroundColor: theme.bg }]}>
//         <Feather name="tag" size={22} color={`${accent}50`} />
//         <Text style={[tk.emptyTxt, { color: theme.muted }]}>No ticket types yet</Text>
//       </View>
//     );
//   }
//   return (
//     <View style={[tk.row, { backgroundColor: theme.bg }]}>
//       {items.slice(0, 3).map((t: any, i: number) => (
//         <View key={i} style={[tk.card, { borderColor: `${accent}45` }]}>
//           <Text style={[tk.name, { color: accent }]} numberOfLines={1}>{t.name || `Tier ${i+1}`}</Text>
//           <Text style={[tk.price, { color: theme.text }]}>
//             {t.kind === 'FREE' || t.price === 0 ? 'Free' : `$${t.price ?? '--'}`}
//           </Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// const tk = StyleSheet.create({
//   row:     { flexDirection: 'row', gap: 8, padding: 16 },
//   card:    { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center', gap: 4 },
//   name:    { fontSize: 11, fontWeight: '800', textAlign: 'center' },
//   price:   { fontSize: 14, fontWeight: '900' },
//   empty:   { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
//   emptyTxt:{ fontSize: 11 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    FAQ
// ══════════════════════════════════════════════════════════════════ */
// function FAQSection({ cfg, title, theme }: any) {
//   const items: any[] = cfg.items || [];
//   return (
//     <View style={[fq.wrap, { backgroundColor: theme.bg }]}>
//       <Text style={[fq.heading, { color: theme.text }]}>{title || 'FAQ'}</Text>
//       {items.slice(0, 3).map((item: any, i: number) => (
//         <View key={i} style={[fq.row, { borderBottomColor: theme.dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]}>
//           <Text style={[fq.q, { color: theme.muted }]} numberOfLines={1}>{item.question || `Question ${i+1}`}</Text>
//           <Feather name="chevron-down" size={13} color={theme.muted} />
//         </View>
//       ))}
//     </View>
//   );
// }

// const fq = StyleSheet.create({
//   wrap:    { padding: 16, gap: 4, minHeight: 80 },
//   heading: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
//   row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
//   q:       { fontSize: 12, flex: 1 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    CTA / DONATIONS / REGISTRY / GENERIC
// ══════════════════════════════════════════════════════════════════ */
// function CTASection({ cfg, title, body, theme }: any) {
//   const accent = theme.accent;
//   return (
//     <View style={[gen.wrap, { backgroundColor: theme.bg, alignItems: 'center' }]}>
//       <Text style={[gen.title, { color: theme.text, textAlign: 'center' }]}>{title || 'Join us'}</Text>
//       {body ? <Text style={[gen.body, { color: theme.muted, textAlign: 'center' }]} numberOfLines={2}>{body}</Text> : null}
//       <View style={[gen.btn, { backgroundColor: accent }]}>
//         <Text style={gen.btnTxt}>{cfg.button_text || 'Get Started'}</Text>
//       </View>
//     </View>
//   );
// }

// function DonationsSection({ cfg, title, theme }: any) {
//   const accent = theme.accent;
//   return (
//     <View style={[gen.wrap, { backgroundColor: theme.bg, alignItems: 'center' }]}>
//       <Text style={[gen.title, { color: theme.text, textAlign: 'center' }]}>{title || 'Support This Event'}</Text>
//       <View style={[gen.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: accent }]}>
//         <Feather name="heart" size={13} color={accent} />
//         <Text style={[gen.btnTxt, { color: accent }]}>Donate</Text>
//       </View>
//     </View>
//   );
// }

// function RegistrySection({ cfg, title, theme }: any) {
//   const items: any[] = cfg.items || [];
//   return (
//     <View style={[gen.wrap, { backgroundColor: theme.bg }]}>
//       <Text style={[gen.title, { color: theme.text }]}>{title || 'Registry'}</Text>
//       {items.slice(0, 2).map((item: any, i: number) => (
//         <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
//           <Feather name="external-link" size={12} color={theme.accent} />
//           <Text style={{ fontSize: 12, color: theme.muted }} numberOfLines={1}>{item.name || item.store || `Registry ${i+1}`}</Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// function GenericSection({ title, body, theme, type }: any) {
//   const accent = BADGE_COLOR[type] ?? theme.accent;
//   return (
//     <View style={[gen.wrap, { backgroundColor: theme.bg }]}>
//       <View style={[gen.accentBar, { backgroundColor: accent }]} />
//       <Text style={[gen.title, { color: theme.text }]}>{title || type}</Text>
//       {body ? <Text style={[gen.body, { color: theme.muted }]} numberOfLines={2}>{body}</Text> : null}
//     </View>
//   );
// }

// const gen = StyleSheet.create({
//   wrap:     { padding: 18, gap: 8, minHeight: 88 },
//   accentBar:{ height: 2, width: 36, borderRadius: 2, marginBottom: 4 },
//   title:    { fontSize: 16, fontWeight: '800' },
//   body:     { fontSize: 13, lineHeight: 19 },
//   btn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 99, marginTop: 4 },
//   btnTxt:   { fontSize: 13, fontWeight: '800', color: '#fff' },
// });

// /* ══════════════════════════════════════════════════════════════════
//    ROOT CARD STYLES
// ══════════════════════════════════════════════════════════════════ */
// const s = StyleSheet.create({
//   card: {
//     overflow: 'hidden',
//     position: 'relative',
//   },
//   badge: {
//     position: 'absolute', top: 10, right: 10,
//     paddingHorizontal: 8, paddingVertical: 3,
//     borderRadius: 6, zIndex: 3,
//   },
//   badgeTxt: {
//     fontSize: 9, fontWeight: '800', color: '#fff',
//     letterSpacing: 0.8, textTransform: 'uppercase',
//   },
//   ring: {
//     ...StyleSheet.absoluteFillObject,
//     borderWidth: 2, zIndex: 4,
//   },
//   hiddenOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     alignItems: 'center', justifyContent: 'center',
//     flexDirection: 'row', gap: 6, zIndex: 5,
//   },
//   hiddenTxt: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
// });













// /**
//  * eventapp-mobile/components/builder/SectionPreviewCard.tsx
//  *
//  * REBUILT — renders each section with its REAL data, exactly matching
//  * the web builder canvas (Image 1 + Image 2):
//  *
//  *  • HERO      — real background image + real title + subtitle
//  *  • ABOUT     — real title + real body text
//  *  • STORY     — orange accent bar + real body
//  *  • COUPLE    — two avatar circles + heart
//  *  • COUNTDOWN — live boxes: DAYS / HRS / MIN / SEC from real date
//  *  • SCHEDULE  — bullet rows from real items
//  *  • VENUE     — real venue name + address + map-pin icon
//  *  • GALLERY   — real image thumbnails grid
//  *  • SPEAKERS  — avatar circles + names
//  *  • TICKETS   — tier cards with price
//  *  • FAQ       — accordion-style rows
//  *  • CTA       — title + button
//  *  • DONATIONS — title + donate button
//  *  • REGISTRY  — title + link rows
//  *
//  * Section type badge top-right — matches web HERO / ABOUT / SCHEDULE badges.
//  * Selected state — indigo ring, matches web selected section highlight.
//  */

// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, Image, StyleSheet, Dimensions,
// } from 'react-native';
// import { Feather } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';

// const SW = Dimensions.get('window').width;

// /* ── Per-type accent colours ─────────────────────────────────────── */
// const ACCENT: Record<string, string> = {
//   HERO:      '#6c6fee',
//   ABOUT:     '#3ecf8e',
//   GALLERY:   '#f59e0b',
//   FAQ:       '#f43f5e',
//   CTA:       '#8b5cf6',
//   SPEAKERS:  '#06b6d4',
//   VENUE:     '#c9a96e',
//   COUNTDOWN: '#ef4444',
//   TICKETS:   '#22c55e',
//   COUPLE:    '#ec4899',
//   STORY:     '#f97316',
//   SCHEDULE:  '#64748b',
//   REGISTRY:  '#a78bfa',
//   DONATIONS: '#10b981',
// };

// interface Section {
//   id:           string;
//   section_type: string;
//   title?:       string;
//   body?:        string;
//   config?:      Record<string, any>;
//   is_visible?:  boolean;
// }

// interface Props {
//   section:  Section;
//   selected: boolean;
//   event?:   any;
// }

// /* ══════════════════════════════════════════════════════════════════
//    ROOT CARD
// ══════════════════════════════════════════════════════════════════ */
// export default function SectionPreviewCard({ section, selected, event }: Props) {
//   const type   = section.section_type;
//   const accent = ACCENT[type] ?? '#6c6fee';
//   const cfg    = section.config ?? {};

//   return (
//     <View style={[
//       s.card,
//       selected && { borderColor: accent, borderWidth: 2 },
//       !selected && { borderColor: 'rgba(255,255,255,0.07)', borderWidth: 1 },
//     ]}>

//       {/* Left accent strip — matches web section left border */}
//       <View style={[s.strip, { backgroundColor: accent }]} />

//       {/* Section content */}
//       <SectionContent
//         type={type}
//         accent={accent}
//         cfg={cfg}
//         title={section.title}
//         body={section.body}
//         event={event}
//         selected={selected}
//       />

//       {/* Type badge — top right, exactly like web "HERO" "ABOUT" pills */}
//       <View style={[s.badge, { backgroundColor: accent }]}>
//         <Text style={s.badgeTxt}>{type}</Text>
//       </View>

//       {/* Hidden overlay */}
//       {section.is_visible === false && (
//         <View style={s.hiddenOverlay}>
//           <Feather name="eye-off" size={14} color="rgba(255,255,255,0.5)" />
//           <Text style={s.hiddenTxt}>HIDDEN</Text>
//         </View>
//       )}

//       {/* Selected editing ring */}
//       {selected && (
//         <View style={[s.editRing, { borderColor: accent }]} pointerEvents="none" />
//       )}
//     </View>
//   );
// }

// /* ══════════════════════════════════════════════════════════════════
//    SECTION CONTENT ROUTER
// ══════════════════════════════════════════════════════════════════ */
// function SectionContent({ type, accent, cfg, title, body, event, selected }: {
//   type: string; accent: string; cfg: Record<string, any>;
//   title?: string; body?: string; event?: any; selected: boolean;
// }) {
//   switch (type) {
//     case 'HERO':      return <HeroPreview accent={accent} cfg={cfg} title={title} body={body} />;
//     case 'ABOUT':     return <AboutPreview accent={accent} title={title} body={body} />;
//     case 'STORY':     return <StoryPreview accent={accent} title={title} body={body} />;
//     case 'COUPLE':    return <CouplePreview accent={accent} cfg={cfg} />;
//     case 'COUNTDOWN': return <CountdownPreview accent={accent} cfg={cfg} event={event} />;
//     case 'SCHEDULE':  return <SchedulePreview accent={accent} cfg={cfg} />;
//     case 'VENUE':     return <VenuePreview accent={accent} cfg={cfg} title={title} />;
//     case 'GALLERY':   return <GalleryPreview accent={accent} cfg={cfg} />;
//     case 'SPEAKERS':  return <SpeakersPreview accent={accent} cfg={cfg} />;
//     case 'TICKETS':   return <TicketsPreview accent={accent} cfg={cfg} />;
//     case 'FAQ':       return <FAQPreview accent={accent} cfg={cfg} title={title} />;
//     case 'CTA':       return <CTAPreview accent={accent} title={title} body={body} />;
//     case 'DONATIONS': return <DonationsPreview accent={accent} title={title} />;
//     case 'REGISTRY':  return <RegistryPreview accent={accent} cfg={cfg} title={title} />;
//     default:          return <GenericPreview accent={accent} type={type} title={title} body={body} />;
//   }
// }

// /* ══════════════════════════════════════════════════════════════════
//    HERO — real background image + title + subtitle
//    Matches web: full-bleed image, dark gradient, centered text
// ══════════════════════════════════════════════════════════════════ */
// function HeroPreview({ accent, cfg, title, body }: any) {
//   const bg    = cfg.background_image as string | undefined;
//   const headT = title  || 'Welcome to our event';
//   const subT  = body   || 'Add your event subtitle here';

//   return (
//     <View style={h.wrap}>
//       {/* Background */}
//       {bg
//         ? <Image source={{ uri: bg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
//         : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1b2e' }]} />
//       }

//       {/* Dark overlay — matches web overlay_opacity */}
//       <LinearGradient
//         colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.8)']}
//         style={StyleSheet.absoluteFill}
//         start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
//       />

//       {/* Text — matches web hero: small eyebrow + large title + subtitle */}
//       <View style={h.content}>
//         <Text style={h.eyebrow}>YOU ARE INVITED</Text>
//         <Text style={h.title}>{headT}</Text>
//         <Text style={h.sub}>{subT}</Text>
//         {/* Diamond divider */}
//         <View style={h.divRow}>
//           <View style={h.divLine} />
//           <Text style={[h.diamond, { color: accent }]}>◆</Text>
//           <View style={h.divLine} />
//         </View>
//       </View>
//     </View>
//   );
// }

// const h = StyleSheet.create({
//   wrap:    { height: 200 },
//   content: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, alignItems: 'center', gap: 6 },
//   eyebrow: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 2.5, textTransform: 'uppercase' },
//   title:   { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 28 },
//   sub:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
//   divRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
//   divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
//   diamond: { fontSize: 8 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    ABOUT — real title + body text
//    Matches web: centered ABOUT eyebrow + big heading + body
// ══════════════════════════════════════════════════════════════════ */
// function AboutPreview({ accent, title, body }: any) {
//   return (
//     <View style={ab.wrap}>
//       <Text style={[ab.eyebrow, { color: accent }]}>ABOUT</Text>
//       <Text style={ab.title}>{title || 'About this event'}</Text>
//       <View style={[ab.dot, { backgroundColor: accent }]} />
//       <Text style={ab.body} numberOfLines={3}>
//         {body || 'Tell guests about this event.'}
//       </Text>
//     </View>
//   );
// }

// const ab = StyleSheet.create({
//   wrap:   { padding: 18, alignItems: 'center', gap: 8, minHeight: 120 },
//   eyebrow:{ fontSize: 9, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
//   title:  { fontSize: 20, fontWeight: '800', color: '#f0f1f3', textAlign: 'center' },
//   dot:    { width: 6, height: 6, borderRadius: 3 },
//   body:   { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    STORY — orange left bar + title + body
// ══════════════════════════════════════════════════════════════════ */
// function StoryPreview({ accent, title, body }: any) {
//   return (
//     <View style={st.wrap}>
//       <View style={[st.bar, { backgroundColor: accent }]} />
//       <View style={st.content}>
//         <Text style={st.title}>{title || 'Our Story'}</Text>
//         <Text style={st.body} numberOfLines={3}>
//           {body || 'Share the story behind this event.'}
//         </Text>
//       </View>
//     </View>
//   );
// }

// const st = StyleSheet.create({
//   wrap:    { flexDirection: 'row', minHeight: 90 },
//   bar:     { width: 4, borderRadius: 2, margin: 14 },
//   content: { flex: 1, paddingVertical: 14, paddingRight: 14, gap: 6 },
//   title:   { fontSize: 15, fontWeight: '800', color: '#f0f1f3' },
//   body:    { fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    COUPLE — two avatar circles + heart — matches web CoupleSection
// ══════════════════════════════════════════════════════════════════ */
// function CouplePreview({ accent, cfg }: any) {
//   const p1img = cfg.person1_image as string | undefined;
//   const p2img = cfg.person2_image as string | undefined;
//   const p1    = cfg.bride_name  || cfg.person1_name || 'Person 1';
//   const p2    = cfg.groom_name  || cfg.person2_name || 'Person 2';

//   return (
//     <View style={cp.wrap}>
//       <AvatarCircle img={p1img} name={p1} accent={accent} size={56} />
//       <View style={cp.heartWrap}>
//         <Text style={[cp.heart, { color: accent }]}>♥</Text>
//       </View>
//       <AvatarCircle img={p2img} name={p2} accent={accent} size={56} />
//     </View>
//   );
// }

// function AvatarCircle({ img, name, accent, size }: {
//   img?: string; name: string; accent: string; size: number;
// }) {
//   const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
//   return (
//     <View style={[cp.avatar, { width: size, height: size, borderRadius: size / 2, borderColor: `${accent}50`, backgroundColor: `${accent}22` }]}>
//       {img
//         ? <Image source={{ uri: img }} style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]} resizeMode="cover" />
//         : <Text style={[cp.initials, { color: accent, fontSize: size * 0.3 }]}>{initials}</Text>
//       }
//     </View>
//   );
// }

// const cp = StyleSheet.create({
//   wrap:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 24 },
//   avatar:   { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
//   initials: { fontWeight: '800' },
//   heartWrap:{ padding: 4 },
//   heart:    { fontSize: 24 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    COUNTDOWN — live DAYS / HRS / MIN / SEC boxes
//    Matches web countdown section boxes
// ══════════════════════════════════════════════════════════════════ */
// function CountdownPreview({ accent, cfg, event }: any) {
//   const iso = cfg.event_date || cfg.starts_at || event?.starts_at_utc || event?.starts_at;
//   const [diff, setDiff] = useState(calcDiff(iso));

//   useEffect(() => {
//     if (!iso) return;
//     const t = setInterval(() => setDiff(calcDiff(iso)), 1000);
//     return () => clearInterval(t);
//   }, [iso]);

//   const units = [
//     { label: 'DAYS', val: diff ? String(diff.d).padStart(2, '0') : '--' },
//     { label: 'HRS',  val: diff ? String(diff.h).padStart(2, '0') : '--' },
//     { label: 'MIN',  val: diff ? String(diff.m).padStart(2, '0') : '--' },
//     { label: 'SEC',  val: diff ? String(diff.s).padStart(2, '0') : '--' },
//   ];

//   return (
//     <View style={cd.wrap}>
//       {units.map(u => (
//         <View key={u.label} style={[cd.box, { borderColor: `${accent}40`, backgroundColor: `${accent}12` }]}>
//           <Text style={[cd.num, { color: accent }]}>{u.val}</Text>
//           <Text style={cd.lbl}>{u.label}</Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// function calcDiff(iso?: string) {
//   if (!iso) return null;
//   const ms = new Date(iso).getTime() - Date.now();
//   if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
//   const s = Math.floor(ms / 1000);
//   return {
//     d: Math.floor(s / 86400),
//     h: Math.floor((s % 86400) / 3600),
//     m: Math.floor((s % 3600) / 60),
//     s: s % 60,
//   };
// }

// const cd = StyleSheet.create({
//   wrap: { flexDirection: 'row', gap: 8, padding: 14 },
//   box:  { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, borderWidth: 1, gap: 4 },
//   num:  { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
//   lbl:  { fontSize: 7, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    SCHEDULE — bullet rows from real items
// ══════════════════════════════════════════════════════════════════ */
// function SchedulePreview({ accent, cfg }: any) {
//   const items: any[] = cfg.items || cfg.schedule_items || [];

//   if (items.length === 0) {
//     return (
//       <View style={sc.wrap}>
//         <Text style={sc.empty}>No schedule items yet</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={sc.wrap}>
//       {items.slice(0, 4).map((item: any, i: number) => (
//         <View key={i} style={sc.row}>
//           <View style={[sc.dot, { backgroundColor: accent }]} />
//           <View style={sc.info}>
//             {item.time ? <Text style={sc.time}>{item.time}</Text> : null}
//             <Text style={sc.title} numberOfLines={1}>{item.title || item.name || `Item ${i + 1}`}</Text>
//           </View>
//         </View>
//       ))}
//     </View>
//   );
// }

// const sc = StyleSheet.create({
//   wrap:  { padding: 14, gap: 10, minHeight: 80 },
//   row:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
//   dot:   { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
//   info:  { flex: 1, gap: 1 },
//   time:  { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
//   title: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
//   empty: { fontSize: 12, color: 'rgba(255,255,255,0.2)', padding: 14 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    VENUE — real name + address + map pin icon
//    Matches web VenueSection layout
// ══════════════════════════════════════════════════════════════════ */
// function VenuePreview({ accent, cfg, title }: any) {
//   const name    = cfg.venue_name    || title || 'Venue';
//   const address = cfg.venue_address || cfg.address || '';
//   const city    = cfg.city          || '';
//   const full    = [address, city].filter(Boolean).join(', ');

//   return (
//     <View style={ve.wrap}>
//       <View style={ve.info}>
//         <Text style={ve.name}>{name}</Text>
//         {full ? <Text style={ve.addr} numberOfLines={2}>{full}</Text> : null}
//       </View>
//       <View style={[ve.iconWrap, { backgroundColor: `${accent}20` }]}>
//         <Feather name="map-pin" size={22} color={accent} />
//       </View>
//     </View>
//   );
// }

// const ve = StyleSheet.create({
//   wrap:     { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, minHeight: 80 },
//   info:     { flex: 1, gap: 5 },
//   name:     { fontSize: 16, fontWeight: '800', color: '#f0f1f3' },
//   addr:     { fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 18 },
//   iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
// });

// /* ══════════════════════════════════════════════════════════════════
//    GALLERY — real image thumbnails in a grid
// ══════════════════════════════════════════════════════════════════ */
// function GalleryPreview({ accent, cfg }: any) {
//   const images: string[] = cfg.images || cfg.media_ids || [];
//   const cellW = (SW - 32 - 8) / 3;

//   if (images.length === 0) {
//     return (
//       <View style={ga.empty}>
//         <Feather name="image" size={28} color={`${accent}40`} />
//         <Text style={ga.emptyTxt}>No images yet</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={ga.grid}>
//       {images.slice(0, 6).map((uri, i) => (
//         <View key={i} style={[ga.cell, { width: cellW, height: cellW }]}>
//           <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
//         </View>
//       ))}
//     </View>
//   );
// }

// const ga = StyleSheet.create({
//   grid:     { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 4 },
//   cell:     { borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)' },
//   empty:    { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
//   emptyTxt: { fontSize: 11, color: 'rgba(255,255,255,0.2)' },
// });

// /* ══════════════════════════════════════════════════════════════════
//    SPEAKERS — avatar circles + names
// ══════════════════════════════════════════════════════════════════ */
// function SpeakersPreview({ accent, cfg }: any) {
//   const speakers: any[] = cfg.speakers || cfg.items || [];

//   if (speakers.length === 0) {
//     return (
//       <View style={sp.empty}>
//         <Feather name="users" size={24} color={`${accent}40`} />
//         <Text style={sp.emptyTxt}>No speakers added</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={sp.row}>
//       {speakers.slice(0, 4).map((spk: any, i: number) => (
//         <View key={i} style={sp.item}>
//           <View style={[sp.avatar, { borderColor: `${accent}50`, backgroundColor: `${accent}18` }]}>
//             {spk.image
//               ? <Image source={{ uri: spk.image }} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} resizeMode="cover" />
//               : <Feather name="user" size={20} color={accent} />
//             }
//           </View>
//           <Text style={sp.name} numberOfLines={1}>{spk.name || `Speaker ${i + 1}`}</Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// const sp = StyleSheet.create({
//   row:     { flexDirection: 'row', justifyContent: 'space-around', padding: 16, minHeight: 100 },
//   item:    { alignItems: 'center', gap: 6, flex: 1 },
//   avatar:  { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
//   name:    { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)', maxWidth: 64, textAlign: 'center' },
//   empty:   { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
//   emptyTxt:{ fontSize: 11, color: 'rgba(255,255,255,0.2)' },
// });

// /* ══════════════════════════════════════════════════════════════════
//    TICKETS — tier cards
// ══════════════════════════════════════════════════════════════════ */
// function TicketsPreview({ accent, cfg }: any) {
//   const tickets: any[] = cfg.ticket_types || cfg.tickets || cfg.items || [];

//   if (tickets.length === 0) {
//     return (
//       <View style={tk.empty}>
//         <Feather name="tag" size={24} color={`${accent}40`} />
//         <Text style={tk.emptyTxt}>No ticket types yet</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={tk.row}>
//       {tickets.slice(0, 3).map((t: any, i: number) => (
//         <View key={i} style={[tk.card, { borderColor: `${accent}40` }]}>
//           <Text style={[tk.name, { color: accent }]} numberOfLines={1}>{t.name || `Tier ${i + 1}`}</Text>
//           <Text style={tk.price}>
//             {t.kind === 'FREE' || t.price === 0 ? 'Free' : `$${t.price ?? '--'}`}
//           </Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// const tk = StyleSheet.create({
//   row:     { flexDirection: 'row', gap: 8, padding: 14 },
//   card:    { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)' },
//   name:    { fontSize: 11, fontWeight: '800', textAlign: 'center' },
//   price:   { fontSize: 13, fontWeight: '900', color: '#f0f1f3' },
//   empty:   { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
//   emptyTxt:{ fontSize: 11, color: 'rgba(255,255,255,0.2)' },
// });

// /* ══════════════════════════════════════════════════════════════════
//    FAQ — accordion-style rows
// ══════════════════════════════════════════════════════════════════ */
// function FAQPreview({ accent, cfg, title }: any) {
//   const items: any[] = cfg.items || [];
//   return (
//     <View style={fq.wrap}>
//       <Text style={fq.heading}>{title || 'FAQ'}</Text>
//       {items.length === 0
//         ? <Text style={fq.empty}>No questions added</Text>
//         : items.slice(0, 3).map((item: any, i: number) => (
//             <View key={i} style={[fq.row, { borderBottomColor: 'rgba(255,255,255,0.07)' }]}>
//               <Text style={fq.question} numberOfLines={1}>{item.question || `Question ${i + 1}`}</Text>
//               <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.3)" />
//             </View>
//           ))
//       }
//     </View>
//   );
// }

// const fq = StyleSheet.create({
//   wrap:    { padding: 14, gap: 6, minHeight: 80 },
//   heading: { fontSize: 14, fontWeight: '800', color: '#f0f1f3', marginBottom: 4 },
//   row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
//   question:{ fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 },
//   empty:   { fontSize: 11, color: 'rgba(255,255,255,0.2)' },
// });

// /* ══════════════════════════════════════════════════════════════════
//    CTA
// ══════════════════════════════════════════════════════════════════ */
// function CTAPreview({ accent, title, body }: any) {
//   return (
//     <View style={cta.wrap}>
//       <Text style={cta.title}>{title || 'Join us'}</Text>
//       {body ? <Text style={cta.body} numberOfLines={2}>{body}</Text> : null}
//       <View style={[cta.btn, { backgroundColor: accent }]}>
//         <Text style={cta.btnTxt}>{body ? 'Get Started' : 'RSVP Now'}</Text>
//       </View>
//     </View>
//   );
// }

// const cta = StyleSheet.create({
//   wrap:  { padding: 18, alignItems: 'center', gap: 10, minHeight: 100 },
//   title: { fontSize: 18, fontWeight: '800', color: '#f0f1f3', textAlign: 'center' },
//   body:  { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
//   btn:   { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 99, marginTop: 4 },
//   btnTxt:{ fontSize: 13, fontWeight: '800', color: '#fff' },
// });

// /* ══════════════════════════════════════════════════════════════════
//    DONATIONS
// ══════════════════════════════════════════════════════════════════ */
// function DonationsPreview({ accent, title }: any) {
//   return (
//     <View style={dn.wrap}>
//       <Text style={dn.title}>{title || 'Support This Event'}</Text>
//       <View style={[dn.btn, { borderColor: accent }]}>
//         <Feather name="heart" size={13} color={accent} />
//         <Text style={[dn.btnTxt, { color: accent }]}>Donate</Text>
//       </View>
//     </View>
//   );
// }

// const dn = StyleSheet.create({
//   wrap:  { padding: 18, alignItems: 'center', gap: 12, minHeight: 90 },
//   title: { fontSize: 16, fontWeight: '800', color: '#f0f1f3', textAlign: 'center' },
//   btn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 99, borderWidth: 1.5 },
//   btnTxt:{ fontSize: 13, fontWeight: '700' },
// });

// /* ══════════════════════════════════════════════════════════════════
//    REGISTRY
// ══════════════════════════════════════════════════════════════════ */
// function RegistryPreview({ accent, cfg, title }: any) {
//   const items: any[] = cfg.items || [];
//   return (
//     <View style={rg.wrap}>
//       <Text style={rg.title}>{title || 'Registry'}</Text>
//       {items.slice(0, 3).map((item: any, i: number) => (
//         <View key={i} style={rg.row}>
//           <Feather name="external-link" size={12} color={accent} />
//           <Text style={rg.link} numberOfLines={1}>{item.name || item.store || `Registry ${i + 1}`}</Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// const rg = StyleSheet.create({
//   wrap:  { padding: 14, gap: 8, minHeight: 80 },
//   title: { fontSize: 14, fontWeight: '800', color: '#f0f1f3' },
//   row:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
//   link:  { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
// });

// /* ══════════════════════════════════════════════════════════════════
//    GENERIC — fallback for unknown types
// ══════════════════════════════════════════════════════════════════ */
// function GenericPreview({ accent, type, title, body }: any) {
//   return (
//     <View style={gn.wrap}>
//       <View style={[gn.accentBar, { backgroundColor: accent }]} />
//       <Text style={gn.title}>{title || type}</Text>
//       {body ? <Text style={gn.body} numberOfLines={2}>{body}</Text> : null}
//     </View>
//   );
// }

// const gn = StyleSheet.create({
//   wrap:     { padding: 14, gap: 7, minHeight: 80 },
//   accentBar:{ height: 3, width: 40, borderRadius: 2, marginBottom: 4 },
//   title:    { fontSize: 14, fontWeight: '700', color: '#f0f1f3' },
//   body:     { fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 18 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    ROOT CARD STYLES
// ══════════════════════════════════════════════════════════════════ */
// const s = StyleSheet.create({
//   card: {
//     backgroundColor: '#16181c',
//     marginHorizontal: 0,
//     overflow: 'hidden',
//     position: 'relative',
//   },

//   /* Left accent strip */
//   strip: {
//     position:  'absolute',
//     left:      0,
//     top:       0,
//     bottom:    0,
//     width:     3,
//     zIndex:    2,
//   },

//   /* Type badge — top right, solid colour, matches web */
//   badge: {
//     position:       'absolute',
//     top:            10,
//     right:          10,
//     paddingHorizontal: 8,
//     paddingVertical:   3,
//     borderRadius:   6,
//     zIndex:         3,
//   },
//   badgeTxt: {
//     fontSize:      9,
//     fontWeight:    '800',
//     color:         '#fff',
//     letterSpacing: 0.8,
//     textTransform: 'uppercase',
//   },

//   /* Selected ring */
//   editRing: {
//     ...StyleSheet.absoluteFillObject,
//     borderWidth: 2,
//     borderRadius: 0,
//     zIndex: 4,
//   },

//   /* Hidden overlay */
//   hiddenOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0,0,0,0.65)',
//     alignItems:      'center',
//     justifyContent:  'center',
//     flexDirection:   'row',
//     gap:             6,
//     zIndex:          5,
//   },
//   hiddenTxt: {
//     fontSize:   11,
//     fontWeight: '800',
//     color:      'rgba(255,255,255,0.6)',
//     letterSpacing: 1,
//   },
// });













// // import React from 'react';
// // import { View, Text, Image, StyleSheet } from 'react-native';

// // const CARD_BG = '#1e2026';
// // const BD      = 'rgba(255,255,255,0.07)';
// // const MUTED   = '#555a66';
// // const TEXT    = 'rgba(255,255,255,0.75)';
// // const ACC     = '#6c6fee';

// // const SECTION_ACCENT: Record<string, string> = {
// //   HERO: '#6c6fee', ABOUT: '#3ecf8e', GALLERY: '#f59e0b', FAQ: '#f43f5e',
// //   CTA: '#8b5cf6', SPEAKERS: '#06b6d4', VENUE: '#c9a96e', COUNTDOWN: '#ef4444',
// //   TICKETS: '#22c55e', COUPLE: '#ec4899', STORY: '#f97316', SCHEDULE: '#64748b',
// //   REGISTRY: '#a78bfa', DONATIONS: '#10b981',
// // };

// // interface Section {
// //   id: string;
// //   section_type: string;
// //   title?: string;
// //   body?: string;
// //   config?: Record<string, any>;
// //   is_visible?: boolean;
// // }

// // interface Props {
// //   section: Section;
// //   selected: boolean;
// //   event?: any;
// // }

// // export default function SectionPreviewCard({ section, selected, event }: Props) {
// //   const type   = section.section_type;
// //   const accent = SECTION_ACCENT[type] ?? ACC;
// //   const cfg    = section.config ?? {};

// //   return (
// //     <View style={[s.card, selected && { borderColor: accent, borderWidth: 2 }]}>
// //       {/* Color strip */}
// //       <View style={[s.strip, { backgroundColor: accent }]} />

// //       {/* Content */}
// //       <View style={s.body}>
// //         <SectionBody type={type} accent={accent} cfg={cfg} event={event} />
// //       </View>

// //       {/* Type label */}
// //       <View style={[s.typePill, { backgroundColor: accent + '20' }]}>
// //         <Text style={[s.typeLabel, { color: accent }]}>{type}</Text>
// //       </View>

// //       {/* Editing badge */}
// //       {selected && (
// //         <View style={[s.editBadge, { backgroundColor: accent }]}>
// //           <Text style={s.editTxt}>✏ EDITING</Text>
// //         </View>
// //       )}

// //       {/* Hidden overlay */}
// //       {section.is_visible === false && (
// //         <View style={s.hiddenOverlay}>
// //           <Text style={s.hiddenTxt}>👁 HIDDEN</Text>
// //         </View>
// //       )}
// //     </View>
// //   );
// // }

// // // ── Per-type previews ─────────────────────────────────────────────────────────

// // function SectionBody({ type, accent, cfg, event }: {
// //   type: string; accent: string; cfg: Record<string, any>; event?: any;
// // }) {
// //   if (type === 'HERO') {
// //     const bg = cfg.background_image as string | undefined;
// //     return (
// //       <View style={sh.heroWrap}>
// //         {bg
// //           ? <Image source={{ uri: bg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
// //           : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0e0f11' }]} />}
// //         <View style={sh.heroDark} />
// //         <View style={sh.heroContent}>
// //           <View style={[sh.bar, { width: '65%', backgroundColor: '#fff', opacity: 0.85 }]} />
// //           <View style={[sh.bar, { width: '42%', backgroundColor: accent, marginTop: 5 }]} />
// //           <View style={[sh.btnPlaceholder, { backgroundColor: accent, marginTop: 10 }]} />
// //         </View>
// //       </View>
// //     );
// //   }

// //   if (type === 'COUNTDOWN') {
// //     const iso = cfg.event_date || cfg.starts_at || event?.starts_at_utc;
// //     const diff = iso ? Math.max(0, new Date(iso).getTime() - Date.now()) : 0;
// //     const days = iso ? Math.floor(diff / 86400000) : '--';
// //     const hrs  = iso ? Math.floor((diff % 86400000) / 3600000) : '--';
// //     const min  = iso ? Math.floor((diff % 3600000) / 60000) : '--';
// //     const sec  = iso ? Math.floor((diff % 60000) / 1000) : '--';
// //     return (
// //       <View style={sh.cntWrap}>
// //         {[{ v: days, l: 'DAYS' }, { v: hrs, l: 'HRS' }, { v: min, l: 'MIN' }, { v: sec, l: 'SEC' }].map(it => (
// //           <View key={it.l} style={[sh.cntBox, { backgroundColor: accent + '14', borderColor: accent + '35' }]}>
// //             <Text style={[sh.cntNum, { color: accent }]}>
// //               {typeof it.v === 'number' ? String(it.v).padStart(2, '0') : it.v}
// //             </Text>
// //             <Text style={sh.cntLbl}>{it.l}</Text>
// //           </View>
// //         ))}
// //       </View>
// //     );
// //   }

// //   if (type === 'GALLERY') {
// //     const imgs: string[] = cfg.images ?? [];
// //     return (
// //       <View style={sh.galleryGrid}>
// //         {[0, 1, 2, 3, 4, 5].map(i => (
// //           <View key={i} style={sh.galleryCell}>
// //             {imgs[i]
// //               ? <Image source={{ uri: imgs[i] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
// //               : <View style={[StyleSheet.absoluteFill, { backgroundColor: accent + '18' }]} />}
// //           </View>
// //         ))}
// //       </View>
// //     );
// //   }

// //   if (type === 'VENUE') {
// //     return (
// //       <View style={sh.venueRow}>
// //         <View style={{ flex: 1, gap: 5 }}>
// //           <Text style={sh.venueTitle} numberOfLines={1}>{cfg.venue_name || cfg.name || 'Venue'}</Text>
// //           <Placeholder w="70%" />
// //           <Placeholder w="55%" />
// //         </View>
// //         <View style={[sh.venueIcon, { backgroundColor: accent + '20' }]}>
// //           <Text style={{ fontSize: 20 }}>📍</Text>
// //         </View>
// //       </View>
// //     );
// //   }

// //   if (type === 'SCHEDULE') {
// //     return (
// //       <View style={sh.schedWrap}>
// //         {[0, 1, 2].map(i => (
// //           <View key={i} style={sh.schedRow}>
// //             <View style={[sh.schedDot, { backgroundColor: i === 0 ? accent : MUTED + '66' }]} />
// //             <View style={[sh.schedLine, { width: `${55 + i * 12}%` }]} />
// //           </View>
// //         ))}
// //       </View>
// //     );
// //   }

// //   if (type === 'SPEAKERS') {
// //     return (
// //       <View style={sh.speakersRow}>
// //         {[0, 1, 2].map(i => (
// //           <View key={i} style={sh.speakerItem}>
// //             <View style={[sh.speakerAvatar, { backgroundColor: accent + '20', borderColor: accent + '40' }]} />
// //             <Placeholder w="80%" />
// //           </View>
// //         ))}
// //       </View>
// //     );
// //   }

// //   if (type === 'TICKETS') {
// //     return (
// //       <View style={sh.ticketsRow}>
// //         {[0, 1, 2].map(i => (
// //           <View key={i} style={[sh.ticket, { borderColor: accent + '50', backgroundColor: accent + '0c' }]}>
// //             <Text style={{ fontSize: 14 }}>🎟</Text>
// //             <Placeholder w="70%" />
// //           </View>
// //         ))}
// //       </View>
// //     );
// //   }

// //   if (type === 'COUPLE') {
// //     return (
// //       <View style={sh.coupleRow}>
// //         <View style={[sh.coupleAvatar, { backgroundColor: accent + '20' }]}>
// //           <Text style={{ fontSize: 18 }}>👤</Text>
// //         </View>
// //         <Text style={[sh.coupleHeart, { color: accent }]}>♥</Text>
// //         <View style={[sh.coupleAvatar, { backgroundColor: accent + '20' }]}>
// //           <Text style={{ fontSize: 18 }}>👤</Text>
// //         </View>
// //       </View>
// //     );
// //   }

// //   // Generic fallback: ABOUT, FAQ, CTA, STORY, REGISTRY, DONATIONS, etc.
// //   return (
// //     <View style={sh.generic}>
// //       <View style={[sh.accentBar, { backgroundColor: accent }]} />
// //       <Placeholder w="85%" />
// //       <Placeholder w="68%" />
// //       <Placeholder w="74%" />
// //     </View>
// //   );
// // }

// // function Placeholder({ w }: { w: string }) {
// //   return <View style={[sh.placeholderLine, { width: w as any }]} />;
// // }

// // // ── Styles ────────────────────────────────────────────────────────────────────

// // const s = StyleSheet.create({
// //   card: {
// //     borderRadius: 14, borderWidth: 1, borderColor: BD,
// //     backgroundColor: CARD_BG, overflow: 'hidden',
// //     flexDirection: 'row', position: 'relative',
// //   },
// //   strip:     { width: 3 },
// //   body:      { flex: 1 },
// //   typePill:  { position: 'absolute', top: 7, right: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
// //   typeLabel: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
// //   editBadge: { position: 'absolute', top: 7, left: 10, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
// //   editTxt:   { fontSize: 8, fontWeight: '900', color: '#fff' },
// //   hiddenOverlay: {
// //     ...StyleSheet.absoluteFillObject,
// //     backgroundColor: 'rgba(0,0,0,0.55)',
// //     alignItems: 'center', justifyContent: 'center',
// //   },
// //   hiddenTxt: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
// // });

// // const sh = StyleSheet.create({
// //   // Hero
// //   heroWrap:    { height: 160, justifyContent: 'flex-end' },
// //   heroDark:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)' },
// //   heroContent: { padding: 14 },
// //   bar:         { height: 5, borderRadius: 3 },
// //   btnPlaceholder: { height: 22, width: 80, borderRadius: 6 },

// //   // Countdown
// //   cntWrap: { flexDirection: 'row', gap: 8, padding: 14 },
// //   cntBox:  { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, gap: 2 },
// //   cntNum:  { fontSize: 20, fontWeight: '900' },
// //   cntLbl:  { fontSize: 7, fontWeight: '800', color: MUTED, letterSpacing: 1 },

// //   // Gallery
// //   galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 6, gap: 3, height: 120 },
// //   galleryCell: { width: '31.5%', aspectRatio: 1, borderRadius: 4, overflow: 'hidden' },

// //   // Venue
// //   venueRow:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, minHeight: 90 },
// //   venueTitle: { fontSize: 12, fontWeight: '700', color: TEXT, marginBottom: 3 },
// //   venueIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

// //   // Schedule
// //   schedWrap: { padding: 14, gap: 12, minHeight: 90 },
// //   schedRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
// //   schedDot:  { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
// //   schedLine: { height: 3, borderRadius: 2, backgroundColor: MUTED, opacity: 0.35 },

// //   // Speakers
// //   speakersRow:   { flexDirection: 'row', justifyContent: 'space-around', padding: 14, minHeight: 100 },
// //   speakerItem:   { alignItems: 'center', gap: 6 },
// //   speakerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1 },

// //   // Tickets
// //   ticketsRow: { flexDirection: 'row', gap: 8, padding: 14, minHeight: 90 },
// //   ticket:     { flex: 1, borderRadius: 8, borderWidth: 1, padding: 10, alignItems: 'center', gap: 6 },

// //   // Couple
// //   coupleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 20, minHeight: 100 },
// //   coupleAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
// //   coupleHeart:  { fontSize: 22 },

// //   // Generic
// //   generic:         { padding: 14, gap: 7, minHeight: 90 },
// //   accentBar:       { height: 3, width: '45%', borderRadius: 2, marginBottom: 4 },
// //   placeholderLine: { height: 4, borderRadius: 2, backgroundColor: MUTED, opacity: 0.3 },
// // });
