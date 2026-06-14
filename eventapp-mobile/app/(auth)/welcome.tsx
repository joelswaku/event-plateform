"use client";

import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, Dimensions,
  ImageBackground, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');

/* ── Slides config ─────────────────────────────────────────────── */
const SLIDES = [
  {
    id:       '1',
    image:    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&q=80',
    eyebrow:  'EVENT CREATION',
    title:    'Bring Your\nEvents to Life',
    body:     'Design stunning event pages, sell tickets, and manage everything — all from one beautiful platform.',
    accent:   '#6366f1',
    grad:     ['#1e0a4a', '#0a0a1f'] as const,
    icon:     'calendar' as const,
  },
  {
    id:       '2',
    image:    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80',
    eyebrow:  'GUEST MANAGEMENT',
    title:    'Every Guest\nFeels Special',
    body:     'Invite guests, manage RSVPs, sell tickets, and check in attendees with a QR scanner — effortlessly.',
    accent:   '#10b981',
    grad:     ['#022c22', '#07070f'] as const,
    icon:     'users' as const,
  },
  {
    id:       '3',
    image:    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&q=80',
    eyebrow:  'TICKET SALES',
    title:    'Sell More\nTickets Faster',
    body:     'Flexible pricing tiers, early bird deals, and smooth checkout — maximize revenue with zero hassle.',
    accent:   '#f59e0b',
    grad:     ['#3a2008', '#0a0a0a'] as const,
    icon:     'credit-card' as const,
  },
  {
    id:       '4',
    image:    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80',
    eyebrow:  'REAL-TIME INSIGHTS',
    title:    'Track Every\nMoment',
    body:     'Live analytics, sales tracking, and attendance reports — stay informed and make data-driven decisions.',
    accent:   '#8b5cf6',
    grad:     ['#2a0a4a', '#0a0a0a'] as const,
    icon:     'trending-up' as const,
  },
  {
    id:       '5',
    image:    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80',
    eyebrow:  'YOUR PLATFORM',
    title:    'Plan. Sell.\nCelebrate.',
    body:     'From intimate gatherings to grand celebrations — LiteEvent gives you the tools to make every event unforgettable.',
    accent:   '#f43f5e',
    grad:     ['#3b0a0a', '#0a0a0a'] as const,
    icon:     'star' as const,
  },
];

/* ── Slide component ────────────────────────────────────────────── */
function Slide({ item }: { item: typeof SLIDES[0] }) {
  return (
    <View style={{ width: W, height: H, overflow: 'hidden' }}>
      {/* Full-bleed background image */}
      <ImageBackground
        source={{ uri: item.image }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        key={item.id}
      />
      {/* Heavy dark gradient overlay — image visible at top, darkens to solid at bottom */}
      <LinearGradient
        colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.78)', '#07070f']}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle accent tint at top */}
      <LinearGradient
        colors={[item.accent + '28', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: H * 0.45 }]}
      />
    </View>
  );
}

/* ── Dot indicator ──────────────────────────────────────────────── */
function Dots({ count, active, accent }: { count: number; active: number; accent: string }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i === active
              ? { width: 22, backgroundColor: accent }
              : { width: 6, backgroundColor: 'rgba(255,255,255,0.28)' },
          ]}
        />
      ))}
    </View>
  );
}

/* ── Welcome screen ─────────────────────────────────────────────── */
export default function WelcomeScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const listRef  = useRef<FlatList>(null);
  const [active, setActive] = useState(0);

  const current = SLIDES[active];

  const onScroll = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setActive(Math.max(0, Math.min(SLIDES.length - 1, idx)));
  }, []);

  const onMomentumScrollEnd = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setActive(Math.max(0, Math.min(SLIDES.length - 1, idx)));
  }, []);

  const goNext = () => {
    if (active < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: active + 1, animated: true });
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Sliding images ── */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item }) => <Slide item={item} />}
        style={StyleSheet.absoluteFill}
        getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
        removeClippedSubviews={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        decelerationRate="fast"
        snapToInterval={W}
        snapToAlignment="center"
        bounces={false}
      />

      {/* ── Content overlay (fixed, not scrolling) ── */}
      <SafeAreaView style={s.overlay} edges={['top', 'bottom']} pointerEvents="box-none">

        {/* Logo / brand mark */}
        <View style={[s.logoWrap, { marginTop: insets.top > 0 ? 0 : 12 }]} pointerEvents="none">
          <LinearGradient
            colors={[current.accent, current.accent + 'aa']}
            style={s.logoCircle}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Feather name="zap" size={18} color="#fff" />
          </LinearGradient>
          <Text style={s.brandName}>LiteEvent</Text>
        </View>

        {/* Spacer — pushes content to bottom */}
        <View style={{ flex: 1 }} pointerEvents="box-none" />

        {/* Text content */}
        <View style={s.textBlock} pointerEvents="none">
          <View style={[s.eyebrowPill, { borderColor: current.accent + '50', backgroundColor: current.accent + '18' }]}>
            <Feather name={current.icon} size={10} color={current.accent} />
            <Text style={[s.eyebrow, { color: current.accent }]}>{current.eyebrow}</Text>
          </View>

          <Text style={s.title}>{current.title}</Text>
          <Text style={s.body}>{current.body}</Text>
        </View>

        {/* Dots */}
        <View pointerEvents="none">
          <Dots count={SLIDES.length} active={active} accent={current.accent} />
        </View>

        {/* CTA buttons */}
        <View style={[s.ctaBlock, { paddingBottom: Math.max(insets.bottom, 20) }]} pointerEvents="box-none">
          {/* Primary: sign up */}
          <Pressable
            style={({ pressed }) => [s.signupBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => router.push('/(auth)/register')}
            pointerEvents="auto"
          >
            <LinearGradient
              colors={[current.accent, current.accent + 'cc']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.gradBtn}
            >
              <Text style={s.signupTxt}>Create Free Account</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </LinearGradient>
          </Pressable>

          {/* Secondary: log in */}
          <Pressable
            style={({ pressed }) => [s.loginBtn, { opacity: pressed ? 0.75 : 1 }]}
            onPress={() => router.push('/(auth)/login')}
            pointerEvents="auto"
          >
            <Text style={s.loginTxt}>
              Already have an account?{' '}
              <Text style={[s.loginLink, { color: current.accent }]}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#07070f' },
  overlay: { flex: 1, position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },

  /* logo */
  logoWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 20 : 4 },
  logoCircle: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brandName:  { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },

  /* text */
  textBlock:  { paddingHorizontal: 28, marginBottom: 20 },
  eyebrowPill:{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, marginBottom: 14 },
  eyebrow:    { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: {
    fontSize:    38,
    fontWeight:  '900',
    color:       '#fff',
    lineHeight:  44,
    letterSpacing: -1.2,
    marginBottom: 12,
  },
  body: {
    fontSize:   14,
    color:      'rgba(255,255,255,0.58)',
    lineHeight: 22,
    fontWeight: '500',
  },

  /* dots */
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 28, marginBottom: 28 },
  dot:  { height: 6, borderRadius: 99, transition: 'all 0.3s' },

  /* cta */
  ctaBlock:  { paddingHorizontal: 20, gap: 4 },
  signupBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 4 },
  gradBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
               paddingVertical: 17, borderRadius: 16 },
  signupTxt: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },

  loginBtn:  { paddingVertical: 14, alignItems: 'center' },
  loginTxt:  { fontSize: 14, color: 'rgba(255,255,255,0.42)', fontWeight: '500' },
  loginLink: { fontWeight: '800' },
});
