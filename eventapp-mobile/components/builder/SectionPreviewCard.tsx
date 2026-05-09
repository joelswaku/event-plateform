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

// /* ══════════════════════════════════════════════════════════════════
//    GALLERY
// ══════════════════════════════════════════════════════════════════ */
// function GalleryBlock({ cfg, theme }: any) {
//   const t  = theme as ThemeDef;
//   const th = cfg._theme ?? 'CLASSIC';
//   const images: string[]            = cfg.images || cfg.media_ids || [];
//   const layout: 'grid' | 'carousel' = cfg.layout ?? 'grid';
//   const [lbIdx, setLbIdx]           = useState<number | null>(null);

//   const PAD       = 20;
//   const GAP       = 6;
//   const COLS      = 2;
//   const MIN_CELLS = 4; // always show at least this many slots
//   const innerW    = SW - PAD * 2;
//   const cellW     = Math.floor((innerW - GAP * (COLS - 1)) / COLS);

//   // Pad with null placeholders so the grid always has MIN_CELLS slots visible
//   const display: (string | null)[] =
//     images.length >= MIN_CELLS
//       ? images
//       : [...images, ...Array(MIN_CELLS - images.length).fill(null)];

//   const Header = () => {
//     if (th === 'FUN') return (
//       <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
//         transition={{ type: 'timing', duration: 300 }}>
//         <Text style={[gl.eyebrowFun, { color: t.accent }]}>✦ Gallery</Text>
//         <Text style={[gl.headingFun, { color: t.text }]}>{cfg.title || 'Our Moments'}</Text>
//       </MotiView>
//     );
//     if (th === 'MODERN') return (
//       <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
//         transition={{ type: 'timing', duration: 300 }}>
//         <View style={[gl.modernBar, { backgroundColor: t.accent }]} />
//         <Text style={[gl.headingModern, { color: t.text }]}>{cfg.title || 'Gallery'}</Text>
//       </MotiView>
//     );
//     if (th === 'MINIMAL') return (
//       <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
//         transition={{ type: 'timing', duration: 300 }} style={{ alignItems: 'center' }}>
//         <Text style={[gl.eyebrowMinimal, { color: t.muted }]}>Gallery</Text>
//         <Text style={[gl.headingMinimal, { color: t.text }]}>{cfg.title || 'Our Moments'}</Text>
//       </MotiView>
//     );
//     return (
//       <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
//         transition={{ type: 'timing', duration: 300 }}>
//         <Text style={[gl.eyebrow, { color: t.muted }]}>GALLERY</Text>
//         <Text style={[gl.heading, { color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle }]}>
//           {cfg.title || 'Our Moments'}
//         </Text>
//         <View style={[gl.ornament, { backgroundColor: t.accent }]} />
//       </MotiView>
//     );
//   };

//   return (
//     <View style={[gl.wrap, { backgroundColor: t.bg }]}>
//       <Header />
//       {layout === 'carousel'
//         ? <GalleryCarouselPreview images={display} accent={t.accent} cellW={innerW} onTap={i => { if (images[i]) setLbIdx(i); }} />
//         : <GalleryGrid images={display} cellW={cellW} gap={GAP} theme={th} accent={t.accent} onTap={i => { if (images[i]) setLbIdx(i); }} />
//       }
//       {lbIdx !== null && (
//         <GalleryLightboxModal images={images} startIndex={lbIdx} accent={t.accent} onClose={() => setLbIdx(null)} />
//       )}
//     </View>
//   );
// }

// /* ── Unified 2-col grid — explicit rows, no flexWrap ────────────── */
// function GalleryGrid({ images, cellW, gap, theme, accent, onTap }: {
//   images: (string | null)[]; cellW: number; gap: number;
//   theme: string; accent: string; onTap: (i: number) => void;
// }) {
//   const getH = (i: number): number => {
//     if (theme === 'MODERN')  return cellW;
//     if (theme === 'MINIMAL') return i % 2 === 0 ? cellW * 1.2  : cellW * 0.85;
//     if (theme === 'FUN')     return i % 3 === 1 ? cellW * 1.25 : cellW * 0.80;
//     const h = [cellW * 1.1, cellW * 0.78, cellW * 0.78, cellW * 1.1, cellW * 0.9, cellW * 1.0];
//     return h[i % h.length];
//   };

//   const radius = theme === 'MODERN' ? 0 : theme === 'FUN' ? 14 : 8;

//   const rows: (string | null)[][] = [];
//   for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));

//   return (
//     <View style={{ gap }}>
//       {rows.map((row, rowIdx) => (
//         <MotiView
//           key={rowIdx}
//           from={{ opacity: 0, translateY: 8 }}
//           animate={{ opacity: 1, translateY: 0 }}
//           transition={{ type: 'timing', duration: 280, delay: rowIdx * 60 }}
//           style={{ flexDirection: 'row', gap }}
//         >
//           {row.map((uri, colIdx) => {
//             const imgIdx = rowIdx * 2 + colIdx;
//             const cellH  = getH(imgIdx);
//             const isPlaceholder = uri === null;
//             return (
//               <View
//                 key={colIdx}
//                 style={[
//                   gl.cell,
//                   { width: cellW, height: cellH, borderRadius: radius },
//                   isPlaceholder && { backgroundColor: `${accent}12`, borderWidth: 1, borderColor: `${accent}25`, borderStyle: 'dashed' },
//                   !isPlaceholder && theme === 'FUN' && {
//                     shadowColor: accent, shadowOffset: { width: 3, height: 3 },
//                     shadowOpacity: 0.4, shadowRadius: 0,
//                   },
//                 ]}
//               >
//                 {isPlaceholder ? (
//                   <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
//                     <Feather name="image" size={16} color={`${accent}40`} />
//                   </View>
//                 ) : (
//                   <Pressable style={StyleSheet.absoluteFill} onPress={() => onTap(imgIdx)} onLongPress={() => downloadImageToLibrary(uri!)} delayLongPress={500}>
//                     <Image source={{ uri: uri! }} style={[StyleSheet.absoluteFill, { borderRadius: radius }]} resizeMode="cover" />
//                     <View style={gl.tapHint} pointerEvents="none">
//                       <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.75)" />
//                     </View>
//                   </Pressable>
//                 )}
//               </View>
//             );
//           })}
//         </MotiView>
//       ))}
//     </View>
//   );
// }

// /* ── Carousel ──────────────────────────────────────────────────── */
// function GalleryCarouselPreview({ images, accent, cellW, onTap }: {
//   images: (string | null)[]; accent: string; cellW: number; onTap: (i: number) => void;
// }) {
//   const [current, setCurrent] = useState(0);
//   const scrollRef = useRef<ScrollView>(null);
//   const cellH = Math.round(cellW * 0.65);

//   const goTo = (idx: number) => {
//     const c = Math.max(0, Math.min(idx, images.length - 1));
//     scrollRef.current?.scrollTo({ x: c * cellW, animated: true });
//     setCurrent(c);
//   };

//   return (
//     <View>
//       <View style={{ borderRadius: 10, overflow: 'hidden' }}>
//         <ScrollView
//           ref={scrollRef}
//           horizontal
//           pagingEnabled
//           showsHorizontalScrollIndicator={false}
//           onMomentumScrollEnd={e => setCurrent(Math.round(e.nativeEvent.contentOffset.x / cellW))}
//         >
//           {images.map((uri, i) => (
//             <View key={i} style={{ width: cellW, height: cellH }}>
//               {uri ? (
//                 <Pressable style={StyleSheet.absoluteFill} onPress={() => onTap(i)} onLongPress={() => downloadImageToLibrary(uri)} delayLongPress={500}>
//                   <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
//                 </Pressable>
//               ) : (
//                 <View style={[StyleSheet.absoluteFill, { backgroundColor: `${accent}10`, alignItems: 'center', justifyContent: 'center' }]}>
//                   <Feather name="image" size={20} color={`${accent}40`} />
//                 </View>
//               )}
//             </View>
//           ))}
//         </ScrollView>
//       </View>

//       {images.length > 1 && (
//         <View style={gl.arrowRow}>
//           <Pressable style={[gl.arrowBtn, { opacity: current === 0 ? 0.3 : 1 }]} onPress={() => goTo(current - 1)} disabled={current === 0}>
//             <Feather name="chevron-left" size={16} color="#fff" />
//           </Pressable>
//           <View style={gl.dots}>
//             {images.map((_, i) => (
//               <Pressable key={i} onPress={() => goTo(i)}>
//                 <View style={[gl.dot, { backgroundColor: i === current ? accent : `${accent}40`, width: i === current ? 18 : 6 }]} />
//               </Pressable>
//             ))}
//           </View>
//           <Pressable style={[gl.arrowBtn, { opacity: current === images.length - 1 ? 0.3 : 1 }]} onPress={() => goTo(current + 1)} disabled={current === images.length - 1}>
//             <Feather name="chevron-right" size={16} color="#fff" />
//           </Pressable>
//         </View>
//       )}
//     </View>
//   );
// }

// /* ── Lightbox modal ────────────────────────────────────────────── */
// function GalleryLightboxModal({ images, startIndex, accent, onClose }: {
//   images: string[]; startIndex: number; accent: string; onClose: () => void;
// }) {
//   const [current, setCurrent] = useState(startIndex);
//   const scrollRef = useRef<ScrollView>(null);
//   const LW = SW;
//   const LH = LW * 1.1;

//   useEffect(() => {
//     setTimeout(() => scrollRef.current?.scrollTo({ x: startIndex * LW, animated: false }), 50);
//   }, []);

//   return (
//     <Modal visible transparent animationType="fade" onRequestClose={onClose}>
//       <View style={lb.root}>
//         <Pressable style={lb.closeBtn} onPress={onClose} hitSlop={16}>
//           <Feather name="x" size={20} color="#fff" />
//         </Pressable>
//         <Text style={lb.counter}>{current + 1} / {images.length}</Text>

//         <ScrollView
//           ref={scrollRef}
//           horizontal
//           pagingEnabled
//           showsHorizontalScrollIndicator={false}
//           onMomentumScrollEnd={e => setCurrent(Math.round(e.nativeEvent.contentOffset.x / LW))}
//           style={{ flex: 1 }}
//         >
//           {images.map((uri, i) => (
//             <View key={i} style={{ width: LW, height: LH, alignItems: 'center', justifyContent: 'center' }}>
//               <Image source={{ uri }} style={{ width: LW, height: LH }} resizeMode="contain" />
//             </View>
//           ))}
//         </ScrollView>

//         {images.length > 1 && (
//           <View style={[gl.dots, { marginBottom: 32 }]}>
//             {images.map((_, i) => (
//               <View key={i} style={[gl.dot, { backgroundColor: i === current ? accent : 'rgba(255,255,255,0.3)', width: i === current ? 18 : 6 }]} />
//             ))}
//           </View>
//         )}
//       </View>
//     </Modal>
//   );
// }

// const lb = StyleSheet.create({
//   root:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
//   closeBtn: {
//     position: 'absolute', top: 56, right: 20, zIndex: 10,
//     width: 40, height: 40, borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.12)',
//     alignItems: 'center', justifyContent: 'center',
//   },
//   counter: { position: 'absolute', top: 64, alignSelf: 'center', fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
// });

// const gl = StyleSheet.create({
//   wrap:    { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 16, gap: 14 },
//   eyebrow:  { fontSize: 9, fontWeight: '500', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 },
//   heading:  { fontSize: 24, letterSpacing: 0, lineHeight: 30, marginBottom: 4 },
//   ornament: { height: 2, width: 32, borderRadius: 2, marginTop: 6, marginBottom: 4 },
//   modernBar:      { height: 2, width: 32, borderRadius: 2, marginBottom: 8 },
//   headingModern:  { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 },
//   eyebrowMinimal: { fontSize: 8, fontWeight: '400', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 6 },
//   headingMinimal: { fontSize: 24, fontWeight: '300', letterSpacing: 0.5 },
//   eyebrowFun: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
//   headingFun: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
//   cell: { overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.08)' },
//   tapHint: {
//     position: 'absolute', bottom: 6, right: 6,
//     width: 20, height: 20, borderRadius: 10,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     alignItems: 'center', justifyContent: 'center',
//   },
//   empty:    { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
//   emptyTxt: { fontSize: 11 },
//   arrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
//   arrowBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
//   dots:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
//   dot:      { height: 6, borderRadius: 3 },
// });

/**
 * IN SectionPreviewCard.tsx
 *
 * Find and replace the ENTIRE GalleryBlock function + all its
 * sub-components (GalleryGridFun, GalleryGridModern, GalleryGridMinimal,
 * GalleryGridClassic, GalleryCarouselPreview, GalleryLightboxModal)
 * AND the "const gl = StyleSheet.create({...})" block for gallery.
 *
 * Replace with this entire block.
 *
 * ─────────────────────────────────────────────────────────────────
 * Each theme now matches the web SharedSections.jsx exactly:
 *
 *  FUN     → 2-col, rounded-2xl (16px), NEOBRUTALISM: solid 4px
 *             offset shadow in accent color, alternating portrait/landscape
 *             (i%3===1 → tall 4:5, others → wide 4:3)
 *             bg: #FFFBF0, accent: #F59E0B
 *
 *  MODERN  → tight 3-col square grid, NO border-radius, NO gap shadow
 *             bg: slightly off-white (#F4F4F8 alt)
 *
 *  MINIMAL → 2-col, NO radius, alternating 4:5 / 4:3, clean no decor
 *
 *  CLASSIC → 2-col masonry columns, small radius (6px), alternating heights
 *  ELEGANT → same as CLASSIC
 *  LUXURY  → same as CLASSIC but on dark bg
 * ─────────────────────────────────────────────────────────────────
 */

/* ══════════════════════════════════════════════════════════════════
   GALLERY BLOCK
══════════════════════════════════════════════════════════════════ */
function GalleryBlock({ cfg, theme }: any) {
  const t  = theme as ThemeDef;
  const th = cfg._theme ?? 'CLASSIC';
  const images: string[]             = cfg.images || cfg.media_ids || [];
  const layout: 'grid' | 'carousel' = cfg.layout ?? 'grid';
  const [lbIdx, setLbIdx]            = useState<number | null>(null);

  // Compute exact pixel cell width — no floats, no flex ambiguity
  const H_PAD  = 20;                          // wrap paddingHorizontal
  const innerW = SW - H_PAD * 2;             // total usable width

  /* ── Headers ─────────────────────────────────────────────────── */
  const FunHeader = () => (
    <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }} style={{ alignItems: 'center' }}>
      <Text style={[gh.eyebrowFun, { color: t.accent }]}>✦ Gallery</Text>
      <Text style={[gh.headingFun, { color: t.text }]}>
        {cfg.title || 'Our Moments'}
      </Text>
    </MotiView>
  );

  const ModernHeader = () => (
    <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}>
      <View style={[gh.modernBar, { backgroundColor: t.accent }]} />
      <Text style={[gh.headingModern, { color: t.text }]}>
        {cfg.title || 'Gallery'}
      </Text>
    </MotiView>
  );

  const MinimalHeader = () => (
    <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }} style={{ alignItems: 'center' }}>
      <Text style={[gh.eyebrowMinimal, { color: t.muted }]}>Gallery</Text>
      <Text style={[gh.headingMinimal, { color: t.text }]}>
        {cfg.title || 'Our Moments'}
      </Text>
    </MotiView>
  );

  const ClassicHeader = () => (
    <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}>
      <Text style={[gh.eyebrow, { color: t.muted }]}>GALLERY</Text>
      <Text style={[gh.heading, {
        color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle,
      }]}>
        {cfg.title || 'Our Moments'}
      </Text>
      <View style={[gh.ornament, { backgroundColor: t.accent }]} />
    </MotiView>
  );

  const Header = th === 'FUN'     ? FunHeader
    : th === 'MODERN'  ? ModernHeader
    : th === 'MINIMAL' ? MinimalHeader
    : ClassicHeader;

  const Empty = () => (
    <View style={gh.empty}>
      <Feather name="image" size={24} color={`${t.accent}50`} />
      <Text style={[gh.emptyTxt, { color: t.muted }]}>No images yet</Text>
    </View>
  );

  return (
    <View style={[gh.wrap, { backgroundColor: t.bg }]}>
      <Header />

      {images.length === 0
        ? <Empty />
        : layout === 'carousel'
          ? <GalleryCarouselPreview images={images} accent={t.accent} innerW={innerW} onTap={setLbIdx} />
          : th === 'FUN'
            ? <GalleryGridFun     images={images} accent={t.accent} innerW={innerW} onTap={setLbIdx} />
            : th === 'MODERN'
              ? <GalleryGridModern  images={images} innerW={innerW} onTap={setLbIdx} />
              : th === 'MINIMAL'
                ? <GalleryGridMinimal images={images} innerW={innerW} onTap={setLbIdx} />
                : <GalleryGridClassic images={images} innerW={innerW} onTap={setLbIdx} />
      }

      {lbIdx !== null && (
        <GalleryLightboxModal
          images={images}
          startIndex={lbIdx}
          accent={t.accent}
          onClose={() => setLbIdx(null)}
        />
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FUN GRID — Exact match to web FUN GallerySection
   Web code:
     grid-cols-2 gap-4
     i%3===1 → aspectRatio "1/1.3"  (portrait,  tall)
     others  → aspectRatio "4/3"    (landscape, wide)
     boxShadow: "4px 4px 0px var(--t-accent)" ← NEO-BRUTALISM
     rounded-2xl (≈ borderRadius 20)
══════════════════════════════════════════════════════════════════ */
function GalleryGridFun({ images, accent, innerW, onTap }: {
  images: string[]; accent: string; innerW: number; onTap: (i: number) => void;
}) {
  const GAP   = 14;
  const COLS  = 2;
  const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);

  // Pair into rows of 2
  const rows: string[][] = [];
  for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));

  return (
    <View style={{ gap: GAP }}>
      {rows.map((row, rowIdx) => (
        <MotiView
          key={rowIdx}
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: rowIdx * 70 }}
          style={{ flexDirection: 'row', gap: GAP }}
        >
          {row.map((uri, colIdx) => {
            const imgIdx    = rowIdx * 2 + colIdx;
            const isPortrait = imgIdx % 3 === 1;            // matches web i%3===1
            // 4:3 → cellW * 0.75,  1:1.3 → cellW * 1.3
            const cellH = isPortrait
              ? Math.round(cellW * 1.3)
              : Math.round(cellW * 0.75);

            return (
              <Pressable
                key={colIdx}
                style={[
                  gf.cell,
                  {
                    width:  cellW,
                    height: cellH,
                    // NEO-BRUTALISM: solid 4px offset shadow in accent color
                    shadowColor:   accent,
                    shadowOffset:  { width: 4, height: 4 },
                    shadowOpacity: 1,
                    shadowRadius:  0,
                    // Android elevation doesn't do offset; use border instead
                    elevation: 0,
                  },
                ]}
                onPress={() => onTap(imgIdx)}
                onLongPress={() => downloadImageToLibrary(uri)}
                delayLongPress={500}
              >
                <Image
                  source={{ uri }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                  resizeMode="cover"
                />
                {/* Hover zoom hint */}
                <View style={gf.hint} pointerEvents="none">
                  <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.9)" />
                </View>
              </Pressable>
            );
          })}
        </MotiView>
      ))}
    </View>
  );
}

const gf = StyleSheet.create({
  cell: {
    borderRadius:    16,
    overflow:        'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  hint: {
    position:        'absolute',
    bottom:          8, right: 8,
    width:           22, height: 22,
    borderRadius:    11,
    backgroundColor: 'rgba(0,0,0,0.40)',
    alignItems:      'center', justifyContent: 'center',
  },
});

/* ══════════════════════════════════════════════════════════════════
   MODERN GRID — tight 3-col square grid, NO radius
   Web: grid-cols-2 gap-4 sm:grid-cols-3, square aspect, no shadow
══════════════════════════════════════════════════════════════════ */
function GalleryGridModern({ images, innerW, onTap }: {
  images: string[]; innerW: number; onTap: (i: number) => void;
}) {
  const GAP   = 2;
  const COLS  = 3;
  const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);

  const rows: string[][] = [];
  for (let i = 0; i < images.length; i += COLS) rows.push(images.slice(i, i + COLS));

  return (
    <View style={{ gap: GAP }}>
      {rows.map((row, rowIdx) => (
        <MotiView
          key={rowIdx}
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 220, delay: rowIdx * 40 }}
          style={{ flexDirection: 'row', gap: GAP }}
        >
          {row.map((uri, colIdx) => (
            <Pressable
              key={colIdx}
              style={{ width: cellW, height: cellW, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.08)' }}
              onPress={() => onTap(rowIdx * COLS + colIdx)}
              onLongPress={() => downloadImageToLibrary(uri)}
              delayLongPress={500}
            >
              <Image
                source={{ uri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <View style={gf.hint} pointerEvents="none">
                <Feather name="maximize-2" size={8} color="rgba(255,255,255,0.7)" />
              </View>
            </Pressable>
          ))}
        </MotiView>
      ))}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MINIMAL GRID — 2-col, NO radius, alternating 4:5 / 4:3
   Web: grid-cols-2 gap-4 sm:gap-6, i%2===0 → "4/5", else "4/3"
══════════════════════════════════════════════════════════════════ */
function GalleryGridMinimal({ images, innerW, onTap }: {
  images: string[]; innerW: number; onTap: (i: number) => void;
}) {
  const GAP   = 16;
  const COLS  = 2;
  const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);

  const rows: string[][] = [];
  for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));

  return (
    <View style={{ gap: GAP }}>
      {rows.map((row, rowIdx) => (
        <MotiView
          key={rowIdx}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 280, delay: rowIdx * 60 }}
          style={{ flexDirection: 'row', gap: GAP }}
        >
          {row.map((uri, colIdx) => {
            const imgIdx = rowIdx * 2 + colIdx;
            // i%2===0 → 4:5 portrait, else 4:3 landscape
            const cellH = imgIdx % 2 === 0
              ? Math.round(cellW * 1.25)
              : Math.round(cellW * 0.75);

            return (
              <Pressable
                key={colIdx}
                style={{ width: cellW, height: cellH, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)' }}
                onPress={() => onTap(imgIdx)}
                onLongPress={() => downloadImageToLibrary(uri)}
                delayLongPress={500}
              >
                <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <View style={gf.hint} pointerEvents="none">
                  <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.7)" />
                </View>
              </Pressable>
            );
          })}
        </MotiView>
      ))}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CLASSIC / ELEGANT / LUXURY — 2-col masonry, borderRadius 8
   Web: columns-2 gap-3, masonry-style (alternating heights)
══════════════════════════════════════════════════════════════════ */
function GalleryGridClassic({ images, innerW, onTap }: {
  images: string[]; innerW: number; onTap: (i: number) => void;
}) {
  const GAP   = 6;
  const COLS  = 2;
  const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);
  // Masonry alternating heights
  const HEIGHTS = [
    Math.round(cellW * 1.1),
    Math.round(cellW * 0.78),
    Math.round(cellW * 0.78),
    Math.round(cellW * 1.1),
    Math.round(cellW * 0.9),
    Math.round(cellW * 1.0),
  ];

  const rows: string[][] = [];
  for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));

  return (
    <View style={{ gap: GAP }}>
      {rows.map((row, rowIdx) => (
        <MotiView
          key={rowIdx}
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 270, delay: rowIdx * 50 }}
          style={{ flexDirection: 'row', gap: GAP }}
        >
          {row.map((uri, colIdx) => {
            const imgIdx = rowIdx * 2 + colIdx;
            const cellH  = HEIGHTS[imgIdx % HEIGHTS.length];

            return (
              <Pressable
                key={colIdx}
                style={{ width: cellW, height: cellH, borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)' }}
                onPress={() => onTap(imgIdx)}
                onLongPress={() => downloadImageToLibrary(uri)}
                delayLongPress={500}
              >
                <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <View style={gf.hint} pointerEvents="none">
                  <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.75)" />
                </View>
              </Pressable>
            );
          })}
        </MotiView>
      ))}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CAROUSEL — horizontal paging with prev/next + dots
══════════════════════════════════════════════════════════════════ */
function GalleryCarouselPreview({ images, accent, innerW, onTap }: {
  images: string[]; accent: string; innerW: number; onTap: (i: number) => void;
}) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const cellH = Math.round(innerW * 0.60);

  const goTo = (idx: number) => {
    const c = Math.max(0, Math.min(idx, images.length - 1));
    scrollRef.current?.scrollTo({ x: c * innerW, animated: true });
    setCurrent(c);
  };

  return (
    <View>
      <View style={{ borderRadius: 12, overflow: 'hidden' }}>
        <ScrollView
          ref={scrollRef}
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            setCurrent(Math.round(e.nativeEvent.contentOffset.x / innerW));
          }}
        >
          {images.map((uri, i) => (
            <Pressable key={i} onPress={() => onTap(i)}>
              <Image source={{ uri }} style={{ width: innerW, height: cellH }} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {images.length > 1 && (
        <View style={gc.nav}>
          <Pressable style={[gc.navBtn, { opacity: current === 0 ? 0.3 : 1 }]} onPress={() => goTo(current - 1)}>
            <Feather name="chevron-left" size={16} color="#fff" />
          </Pressable>
          <View style={gc.dots}>
            {images.map((_, i) => (
              <Pressable key={i} onPress={() => goTo(i)}>
                <View style={[gc.dot, { backgroundColor: i === current ? accent : `${accent}40`, width: i === current ? 18 : 6 }]} />
              </Pressable>
            ))}
          </View>
          <Pressable style={[gc.navBtn, { opacity: current === images.length - 1 ? 0.3 : 1 }]} onPress={() => goTo(current + 1)}>
            <Feather name="chevron-right" size={16} color="#fff" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const gc = StyleSheet.create({
  nav:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  dots:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  dot:    { height: 6, borderRadius: 3 },
});

/* ══════════════════════════════════════════════════════════════════
   LIGHTBOX MODAL
══════════════════════════════════════════════════════════════════ */
function GalleryLightboxModal({ images, startIndex, accent, onClose }: {
  images: string[]; startIndex: number; accent: string; onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: startIndex * SW, animated: false });
    }, 60);
  }, []);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={lb.root}>
        <Pressable style={lb.closeBtn} onPress={onClose} hitSlop={16}>
          <Feather name="x" size={20} color="#fff" />
        </Pressable>
        <Text style={lb.counter}>{current + 1} / {images.length}</Text>

        <ScrollView
          ref={scrollRef}
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => setCurrent(Math.round(e.nativeEvent.contentOffset.x / SW))}
          style={{ flex: 1 }}
        >
          {images.map((uri, i) => (
            <View key={i} style={{ width: SW, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={{ uri }} style={{ width: SW, height: SW * 1.1 }} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View style={[gc.dots, { marginBottom: 40 }]}>
            {images.map((_, i) => (
              <View key={i} style={[gc.dot, {
                backgroundColor: i === current ? accent : 'rgba(255,255,255,0.35)',
                width: i === current ? 18 : 6,
              }]} />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const lb = StyleSheet.create({
  root:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', justifyContent: 'center' },
  closeBtn: {
    position: 'absolute', top: 56, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  counter: {
    position: 'absolute', top: 64, alignSelf: 'center',
    fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600',
  },
});

/* ══════════════════════════════════════════════════════════════════
   GALLERY SHARED HEADER STYLES
══════════════════════════════════════════════════════════════════ */
const gh = StyleSheet.create({
  wrap:    { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 16, gap: 14 },

  /* CLASSIC / ELEGANT / LUXURY */
  eyebrow:  { fontSize: 9,  fontWeight: '500', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 },
  heading:  { fontSize: 24, letterSpacing: 0, lineHeight: 30, marginBottom: 4 },
  ornament: { height: 2, width: 32, borderRadius: 2, marginTop: 6, marginBottom: 4 },

  /* MODERN */
  modernBar:     { height: 2, width: 32, borderRadius: 2, marginBottom: 8 },
  headingModern: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 },

  /* MINIMAL */
  eyebrowMinimal: { fontSize: 8, fontWeight: '400', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 6 },
  headingMinimal: { fontSize: 24, fontWeight: '300', letterSpacing: 0.5 },

  /* FUN — centered bold */
  eyebrowFun: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5, marginBottom: 2, textAlign: 'center' },
  headingFun: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' },

  /* Empty */
  empty:    { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
  emptyTxt: { fontSize: 11 },
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

