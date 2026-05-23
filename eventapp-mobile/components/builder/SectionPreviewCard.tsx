/**
 * eventapp-mobile/components/builder/SectionPreviewCard.tsx
 *
 * COMPLETE REWRITE — every theme × every section matches the web
 * SharedSections.jsx and HeroSection.jsx pixel-for-pixel.
 *
 * Theme design tokens (from web styleThemes.js + SharedSections):
 *
 * CLASSIC  bg:#FAF9F6  accent:#C9A96E  text:#1C1917  muted:#78716C
 *          heading: weight 400, normal, letterSpacing 0.06em, Georgia-ish
 *          ornament: ◆ divider, centered eyebrows
 *
 * ELEGANT  bg:#FDF5EF  accent:#B87355  text:#271A14  muted:#8C7B6E
 *          heading: weight 300, italic, letterSpacing 0.08em
 *          left-border accents on schedule rows
 *
 * MODERN   bg:#F4F4F8  accent:#5B5FED  text:#0F0F1A  muted:#6B6B80
 *          heading: weight 900, UPPERCASE, letterSpacing -0.03em
 *          thick accent top-bar on cards
 *
 * MINIMAL  bg:#F9F9F9  accent:#888888  text:#222222  muted:#888888
 *          heading: weight 300, letterSpacing 0.04em, extreme whitespace
 *          no decorations, pure typography
 *
 * LUXURY   bg:#0D0C0A  accent:#D4AF6F  text:#EDE8DF  muted:#9A8A72
 *          heading: weight 200, italic, UPPERCASE, letterSpacing 0.12em
 *          gold left-border rows, dark surfaces
 *
 * FUN      bg:#FFFBF0  accent:#F59E0B  text:#1C2333  muted:#6B7280
 *          heading: weight 800, letterSpacing -0.01em
 *          neobrutalism: 2px border + 5px solid offset shadow (#1a1a1a)
 *          chunky cards with pastel bg fills
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, Animated, Dimensions,
  ScrollView, Pressable, Modal,
} from 'react-native';
import { Feather }        from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView }       from 'moti';

const SW = Dimensions.get('window').width;

/* ══════════════════════════════════════════════════════════════════
   THEME TOKENS — mirrors web lib/styleThemes.js exactly
══════════════════════════════════════════════════════════════════ */
interface T {
  bg: string; bgAlt: string; surface: string;
  accent: string; accentDim: string;
  text: string; muted: string; border: string;
  isDark: boolean;
  hw: '200'|'300'|'400'|'700'|'800'|'900';  // heading fontWeight
  ht: 'none'|'uppercase';                    // heading textTransform
  hi: 'normal'|'italic';                     // heading fontStyle
  hls: number;                               // heading letterSpacing
  radius: number;                            // card borderRadius
}

const THEMES: Record<string, T> = {
  CLASSIC: {
    bg:'#FAF9F6', bgAlt:'#FFFFFF', surface:'#F0EDE8',
    accent:'#C9A96E', accentDim:'rgba(201,169,110,0.18)',
    text:'#1C1917', muted:'#78716C', border:'#E7E5E4',
    isDark:false, hw:'400', ht:'none', hi:'normal', hls:1.5, radius:0,
  },
  ELEGANT: {
    bg:'#FDF5EF', bgAlt:'#FFFCF9', surface:'#F5EBE2',
    accent:'#B87355', accentDim:'rgba(184,115,85,0.16)',
    text:'#271A14', muted:'#8C7B6E', border:'#EDE0D8',
    isDark:false, hw:'300', ht:'none', hi:'italic', hls:2, radius:0,
  },
  MODERN: {
    bg:'#F4F4F8', bgAlt:'#FFFFFF', surface:'#EBEBF2',
    accent:'#5B5FED', accentDim:'rgba(91,95,237,0.12)',
    text:'#0F0F1A', muted:'#6B6B80', border:'#E0E0EC',
    isDark:false, hw:'900', ht:'uppercase', hi:'normal', hls:-0.8, radius:3,
  },
  MINIMAL: {
    bg:'#F9F9F9', bgAlt:'#FFFFFF', surface:'#F0F0F0',
    accent:'#888888', accentDim:'rgba(136,136,136,0.12)',
    text:'#222222', muted:'#888888', border:'#E5E5E5',
    isDark:false, hw:'300', ht:'none', hi:'normal', hls:1, radius:0,
  },
  LUXURY: {
    bg:'#0D0C0A', bgAlt:'#111009', surface:'#1A1914',
    accent:'#D4AF6F', accentDim:'rgba(212,175,111,0.15)',
    text:'#EDE8DF', muted:'#9A8A72', border:'rgba(212,175,111,0.18)',
    isDark:true, hw:'200', ht:'uppercase', hi:'italic', hls:3, radius:0,
  },
  FUN: {
    bg:'#FFFBF0', bgAlt:'#FFFFFF', surface:'#FEF3C7',
    accent:'#F59E0B', accentDim:'rgba(245,158,11,0.15)',
    text:'#1C2333', muted:'#6B7280', border:'#FDE68A',
    isDark:false, hw:'800', ht:'none', hi:'normal', hls:-0.3, radius:12,
  },
};

const FUN_PASTEL = ['#FEF3C7','#DBEAFE','#D1FAE5','#FCE7F3'];
const FUN_SHADOW_COLOR = '#1a1a1a';

function getTheme(cfg?: Record<string,any>): T {
  return THEMES[cfg?._theme ?? ''] ?? THEMES.CLASSIC;
}

const BADGE_COLOR: Record<string,string> = {
  HERO:'#6c6fee', ABOUT:'#3ecf8e', GALLERY:'#f59e0b', FAQ:'#f43f5e',
  CTA:'#8b5cf6', SPEAKERS:'#06b6d4', VENUE:'#c9a96e', COUNTDOWN:'#ef4444',
  TICKETS:'#22c55e', COUPLE:'#ec4899', STORY:'#f97316', SCHEDULE:'#64748b',
  REGISTRY:'#a78bfa', DONATIONS:'#10b981',
};

/* ── Hero default bg per theme ─────────────────────────────────── */
const HERO_GRAD: Record<string,[string,string]> = {
  CLASSIC:['#1a1611','#2d2416'],
  ELEGANT:['#1a0f0a','#271a14'],
  MODERN: ['#06060e','#0a0a14'],
  MINIMAL:['#111111','#1a1a1a'],
  LUXURY: ['#060504','#0d0c0a'],
  FUN:    ['#1c1407','#2d2b08'],
};

/* ══════════════════════════════════════════════════════════════════
   ROOT CARD
══════════════════════════════════════════════════════════════════ */
interface Sec {
  id:string; section_type:string; title?:string; body?:string;
  config?:Record<string,any>; is_visible?:boolean;
}
interface Props { section:Sec; selected:boolean; event?:any; }

export default function SectionPreviewCard({ section, selected, event }: Props) {
  const type      = section.section_type;
  const badgeColor = BADGE_COLOR[type] ?? '#6c6fee';
  const cfg       = section.config ?? {};
  const theme     = getTheme(cfg);

  const fadeY = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeY,  { toValue:1, duration:280, useNativeDriver:true }),
      Animated.timing(slideY, { toValue:0, duration:280, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity:fadeY, transform:[{translateY:slideY}] }}>
      <View style={[
        r.card, { backgroundColor:theme.bg },
        selected
          ? { borderColor:badgeColor, borderWidth:2 }
          : { borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', borderWidth:1 },
      ]}>
        <SectionContent type={type} cfg={cfg} title={section.title} body={section.body} event={event} t={theme} />
        <View style={[r.badge,{backgroundColor:'#6c6fee'}]}>
          <Text style={r.badgeTxt}>{type}</Text>
        </View>
        {section.is_visible===false && (
          <View style={r.hidden}>
            <Feather name="eye-off" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={r.hiddenTxt}>HIDDEN</Text>
          </View>
        )}
        {selected && <View style={[r.ring,{borderColor:badgeColor}]} pointerEvents="none" />}
      </View>
    </Animated.View>
  );
}

function SectionContent({ type,cfg,title,body,event,t }: any) {
  switch(type) {
    case 'HERO':      return <HeroBlock      cfg={cfg} title={title} body={body} t={t} event={event}/>;
    case 'ABOUT':     return <AboutBlock     cfg={cfg} title={title} body={body} t={t}/>;
    case 'STORY':     return <StoryBlock     cfg={cfg} title={title} body={body} t={t}/>;
    case 'COUPLE':    return <CoupleBlock    cfg={cfg} t={t}/>;
    case 'COUNTDOWN': return <CountdownBlock cfg={cfg} event={event} t={t}/>;
    case 'SCHEDULE':  return <ScheduleBlock  cfg={cfg} title={title} t={t} event={event}/>;
    case 'VENUE':     return <VenueBlock     cfg={cfg} title={title} t={t} event={event}/>;
    case 'GALLERY':   return <GalleryBlock   cfg={cfg} t={t}/>;
    case 'SPEAKERS':  return <SpeakersBlock  cfg={cfg} t={t} event={event}/>;
    case 'TICKETS':   return <TicketsBlock   cfg={cfg} event={event} t={t}/>;
    case 'FAQ':       return <FAQBlock       cfg={cfg} title={title} t={t}/>;
    case 'CTA':       return <CTABlock       cfg={cfg} title={title} body={body} t={t}/>;
    case 'STORY':     return <StoryBlock     cfg={cfg} title={title} body={body} t={t}/>;
    case 'DONATIONS': return <DonationsBlock cfg={cfg} title={title} t={t}/>;
    case 'REGISTRY':  return <RegistryBlock  cfg={cfg} title={title} t={t}/>;
    default:          return <GenericBlock   title={title} body={body} t={t} type={type}/>;
  }
}

/* ── Shared helpers ───────────────────────────────────────────── */
function Eyebrow({ text, t, center=false }: { text:string; t:T; center?:boolean }) {
  const th = (t as any);
  const isFun  = th === THEMES.FUN || t.accent==='#F59E0B';
  const isMin  = t.hw==='300' && t.ht==='none' && !isFun;
  return (
    <Text style={[
      ey.base,
      center && {textAlign:'center'},
      isFun  && {fontSize:11, fontWeight:'700', letterSpacing:2},
      isMin  && {letterSpacing:5, fontSize:9, color:t.muted},
      {color: isFun ? t.accent : t.muted},
    ]}>{text}</Text>
  );
}
const ey = StyleSheet.create({ base:{fontSize:10, fontWeight:'600', textTransform:'uppercase', letterSpacing:4, marginBottom:4}});

function Heading({ text, t, center=false, style={} }: { text:string; t:T; center?:boolean; style?:any }) {
  const th = cfg => ({
    fontWeight: t.hw as any,
    textTransform: t.ht as any,
    fontStyle: t.hi as any,
    letterSpacing: t.hls,
    color: t.text,
    textAlign: center ? 'center' as const : 'left' as const,
  });
  return <Text style={[hd.base, th(null), style]}>{text}</Text>;
}
const hd = StyleSheet.create({ base:{fontSize:22, lineHeight:27, marginBottom:4}});

function Ornament({ t, center=false }: { t:T; center?:boolean }) {
  // Only CLASSIC and ELEGANT use ornaments
  return (
    <View style={[orn.row, center && {alignSelf:'center'}]}>
      <View style={[orn.line, {backgroundColor:t.accent}]} />
      <Text style={[orn.dot, {color:t.accent}]}>◆</Text>
      <View style={[orn.line, {backgroundColor:t.accent}]} />
    </View>
  );
}
const orn = StyleSheet.create({
  row:{flexDirection:'row',alignItems:'center',gap:8,marginVertical:6,alignSelf:'flex-start'},
  line:{height:1,width:24,opacity:0.5},
  dot:{fontSize:8},
});

function FunCard({ children, index=0, style={} }: { children:React.ReactNode; index?:number; style?:any }) {
  return (
    <View style={[fc.outer, style]}>
      <View style={fc.shadow} />
      <View style={[fc.card, {backgroundColor:FUN_PASTEL[index % FUN_PASTEL.length]}]}>
        {children}
      </View>
    </View>
  );
}
const fc = StyleSheet.create({
  outer: { position:'relative', marginBottom:4 },
  shadow:{ position:'absolute', top:5, left:5, right:-5, bottom:-5, backgroundColor:FUN_SHADOW_COLOR, borderRadius:16 },
  card:  { borderRadius:16, borderWidth:2, borderColor:FUN_SHADOW_COLOR, padding:14, overflow:'hidden' },
});

/* ══════════════════════════════════════════════════════════════════
   HERO
   CLASSIC/ELEGANT: centered text, ornament, ◆ divider, font-weight 400/300
   MODERN:  left-aligned, UPPERCASE 900, left accent bar, border CTA
   MINIMAL: light weight 300, letterSpacing 0.04em, minimal overlay
   LUXURY:  UPPERCASE italic 200, gold accent line top+bottom
   FUN:     extrabold 800, center, full image with heavy overlay
══════════════════════════════════════════════════════════════════ */
const MODULE_CHIPS = [
  { key: 'allow_rsvp',       label: 'RSVP',      color: '#10b981' },
  { key: 'allow_ticketing',  label: 'Ticketing',  color: '#f59e0b' },
  { key: 'allow_qr_checkin', label: 'QR',         color: '#06b6d4' },
  { key: 'allow_donations',  label: 'Donations',  color: '#f43f5e' },
];

function HeroBlock({ cfg, title, body, t, event }: any) {
  const th       = cfg._theme ?? 'CLASSIC';
  const bg       = cfg.background_image as string|undefined;
  const eyebrow  = cfg.eyebrow || (th==='FUN' ? "Let's Celebrate!" : th==='MODERN' ? 'OPENING NIGHT' : 'YOU ARE INVITED');
  const headT    = title || 'Welcome to our event';
  const subT     = body  || 'Add your event subtitle here';
  const ctaTxt   = cfg.cta_text || (th==='MODERN' ? 'JOIN NOW' : th==='FUN' ? "I'm Coming!" : 'RSVP Now');
  const centered = cfg.headline_align !== 'left';
  const gradC    = HERO_GRAD[th] ?? HERO_GRAD.CLASSIC;

  // Per-theme heading styles matching web HEADING_STYLE (letterSpacing/lineHeight as em→px at fontSize)
  const headStyle: any = {
    MODERN:  { fontWeight:'900', textTransform:'uppercase', letterSpacing:-0.78, fontSize:26, lineHeight:25 },
    FUN:     { fontWeight:'800', letterSpacing:-0.26, fontSize:26, lineHeight:26 },
    MINIMAL: { fontWeight:'300', letterSpacing:0.96, fontSize:24, lineHeight:29 },
    LUXURY:  { fontWeight:'200', textTransform:'uppercase', fontStyle:'italic', letterSpacing:2.64, fontSize:22, lineHeight:25 },
    ELEGANT: { fontWeight:'300', fontStyle:'italic', letterSpacing:1.92, fontSize:24, lineHeight:29 },
    CLASSIC: { fontWeight:'400', letterSpacing:1.44, fontSize:24, lineHeight:28 },
  }[th] ?? { fontWeight:'400', fontSize:24, lineHeight:28 };

  // Overlay opacity from config (web default is 50)
  const overlayOpacity = ((cfg.overlay_opacity ?? 50) / 100);

  return (
    <View style={hro.wrap}>
      {bg
        ? <Image source={{uri:bg}} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <LinearGradient colors={gradC} style={StyleSheet.absoluteFill} start={{x:0.3,y:0}} end={{x:0.7,y:1}} />
      }

      {/* Main overlay */}
      <View style={[StyleSheet.absoluteFill, {backgroundColor:`rgba(0,0,0,${overlayOpacity})`}]} />

      {/* LUXURY: top+bottom gold accent lines */}
      {th==='LUXURY' && <>
        <View style={[hro.luxLine, {top:0, opacity:0.35}]} />
        <View style={[hro.luxLine, {bottom:0, opacity:0.25}]} />
        {/* Extra dark-to-transparent gradient for LUXURY */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)','rgba(0,0,0,0)','rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
          start={{x:0,y:0}} end={{x:0,y:1}}
        />
      </>}

      {/* CLASSIC/ELEGANT: top+bottom gradient like web */}
      {(th==='CLASSIC'||th==='ELEGANT') && (
        <LinearGradient
          colors={['rgba(0,0,0,0.35)','rgba(0,0,0,0)','rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
          start={{x:0,y:0}} end={{x:0,y:1}}
        />
      )}

      <View style={[hro.content, centered && {alignItems:'center'}]}>
        {/* MODERN: left accent bar */}
        {th==='MODERN' && <View style={[hro.modernBar,{backgroundColor:t.accent}]} />}

        {/* Eyebrow — per-theme size/weight/spacing matching web HeroSection */}
        <Text style={[hro.eyebrow, {
          color: t.accent,
          // 0.7rem themes: FUN/CLASSIC/ELEGANT; 0.65rem: LUXURY/MODERN; 0.6rem: MINIMAL
          fontSize: th==='MINIMAL' ? 9 : (th==='LUXURY'||th==='MODERN') ? 10 : 11,
          letterSpacing: th==='LUXURY' ? 5.5 : th==='MINIMAL' ? 5.8 : th==='MODERN' ? 3 : 4.4,
          fontWeight: th==='MODERN' ? '700' : th==='MINIMAL' ? '400' : th==='LUXURY' ? '500' : '600',
          textAlign: centered ? 'center' : 'left',
        }]}>{eyebrow}</Text>

        {/* Heading */}
        <Text style={[hro.title, headStyle, {color:'#fff', textAlign:centered?'center':'left'}]}>
          {headT}
        </Text>

        {/* Ornament — CLASSIC/ELEGANT only */}
        {(th==='CLASSIC'||th==='ELEGANT') && (
          <View style={[hro.ornRow, centered && {alignSelf:'center'}]}>
            <View style={[hro.ornLine,{backgroundColor:t.accent}]} />
            <Text style={[hro.ornDot,{color:t.accent}]}>◆</Text>
            <View style={[hro.ornLine,{backgroundColor:t.accent}]} />
          </View>
        )}

        {/* Subtitle */}
        <Text style={[hro.sub, {
          textAlign:centered?'center':'left',
          fontStyle: th==='ELEGANT'||th==='LUXURY' ? 'italic' : 'normal',
          fontWeight: th==='MINIMAL' ? '300' : '400',
        }]}>{subT}</Text>

        {/* CTA */}
        {cfg.show_cta!==false && (
          <View style={[
            hro.cta,
            { borderRadius: t.radius || 6 },
            th==='MODERN'
              ? {borderWidth:1.5, borderColor:t.accent, backgroundColor:'transparent'}
              : th==='FUN'
                ? {backgroundColor:t.accent, borderWidth:2, borderColor:FUN_SHADOW_COLOR}
                : {backgroundColor:t.accent},
          ]}>
            <Text style={[hro.ctaTxt, {
              color:'#fff',
              letterSpacing: th==='MODERN' ? 2 : 0.5,
              fontWeight: th==='FUN' ? '800' : '700',
            }]}>{ctaTxt}</Text>
          </View>
        )}

        {/* Active module chips */}
        {event && (() => {
          const active = MODULE_CHIPS.filter(m => !!(event as any)[m.key]);
          if (!active.length) return null;
          return (
            <View style={hro.chipsRow}>
              {active.map(m => (
                <View key={m.key} style={[hro.chip, { backgroundColor: `${m.color}22`, borderColor: `${m.color}44` }]}>
                  <View style={[hro.chipDot, { backgroundColor: m.color }]} />
                  <Text style={[hro.chipTxt, { color: m.color }]}>{m.label}</Text>
                </View>
              ))}
            </View>
          );
        })()}
      </View>
    </View>
  );
}
const hro = StyleSheet.create({
  wrap:      {height:250, overflow:'hidden'},
  luxLine:   {position:'absolute',left:0,right:0,height:1,backgroundColor:'#D4AF6F'},
  modernBar: {height:2,width:32,borderRadius:2,marginBottom:8},
  content:   {position:'absolute',bottom:0,left:0,right:0,padding:20,gap:8,zIndex:3},
  eyebrow:   {fontSize:8, textTransform:'uppercase'},
  title:     {color:'#fff', lineHeight:29},
  ornRow:    {flexDirection:'row',alignItems:'center',gap:8,marginVertical:4},
  ornLine:   {height:1,width:24,opacity:0.55},
  ornDot:    {fontSize:8},
  sub:       {fontSize:13,color:'rgba(255,255,255,0.65)',lineHeight:19},
  cta:       {alignSelf:'flex-start',paddingHorizontal:18,paddingVertical:9,marginTop:4},
  ctaTxt:    {fontSize:11,color:'#fff'},
  chipsRow:  {flexDirection:'row',flexWrap:'wrap',gap:4,marginTop:2},
  chip:      {flexDirection:'row',alignItems:'center',gap:3,paddingHorizontal:7,paddingVertical:3,borderRadius:99,borderWidth:1},
  chipDot:   {width:4,height:4,borderRadius:2},
  chipTxt:   {fontSize:9,fontWeight:'700',letterSpacing:0.3},
});

/* ══════════════════════════════════════════════════════════════════
   ABOUT
   CLASSIC:  centered, ornament divider, eyebrow above heading
   ELEGANT:  left eyebrow col + right heading col, horizontal rule
   MODERN:   left label + thick accent left-border + UPPERCASE heading
   MINIMAL:  ultra-centered, extreme whitespace, no decorations
   LUXURY:   dark bg, gold accent left-border, italic heading
   FUN:      neobrutalism card, bold heading, ✦ eyebrow
══════════════════════════════════════════════════════════════════ */
function AboutBlock({ cfg, title, body, t }: any) {
  const th    = cfg._theme ?? 'CLASSIC';
  const headT = title || 'About this event';
  const bodyT = body  || 'Tell guests about this event.';

  if (th==='MODERN') return (
    <View style={[ab.wrap,{backgroundColor:t.bg,flexDirection:'row',gap:14}]}>
      <View style={{width:56,gap:6,paddingTop:4}}>
        <View style={[ab.modernBar,{backgroundColor:t.accent}]} />
        <Text style={[ab.modernEyebrow,{color:t.accent}]}>About</Text>
      </View>
      <View style={[ab.modernRight,{borderLeftColor:t.accent}]}>
        <Text style={{fontSize:18,fontWeight:'900',textTransform:'uppercase',letterSpacing:-0.5,color:t.text}}>{headT}</Text>
        <Text style={[ab.body,{color:t.muted}]} numberOfLines={3}>{bodyT}</Text>
      </View>
    </View>
  );

  if (th==='ELEGANT') return (
    <View style={[ab.wrap,{backgroundColor:t.bg,flexDirection:'row',gap:14}]}>
      <View style={{width:56,gap:8,paddingTop:2}}>
        <Text style={{fontSize:8,fontWeight:'600',letterSpacing:3,textTransform:'uppercase',color:t.muted}}>About</Text>
        <View style={{height:1,width:28,backgroundColor:t.accent,opacity:0.5}} />
      </View>
      <View style={{flex:1,gap:10}}>
        <Text style={{fontSize:22,fontWeight:'300',fontStyle:'italic',letterSpacing:2,color:t.text,lineHeight:28}}>{headT}</Text>
        <Text style={[ab.body,{color:t.muted}]} numberOfLines={4}>{bodyT}</Text>
      </View>
    </View>
  );

  if (th==='MINIMAL') return (
    <View style={[ab.wrap,{backgroundColor:t.bg,alignItems:'center'}]}>
      <Text style={{fontSize:8,fontWeight:'400',letterSpacing:5,textTransform:'uppercase',color:t.muted,marginBottom:8}}>About</Text>
      <Text style={{fontSize:22,fontWeight:'300',letterSpacing:1,textAlign:'center',color:t.text,lineHeight:28}}>{headT}</Text>
      <Text style={[ab.body,{color:t.muted,textAlign:'center',marginTop:10,paddingHorizontal:8}]} numberOfLines={3}>{bodyT}</Text>
    </View>
  );

  if (th==='LUXURY') return (
    <View style={[ab.wrap,{backgroundColor:t.bg,flexDirection:'row'}]}>
      <View style={[ab.luxBorder,{backgroundColor:t.accent}]} />
      <View style={{flex:1,paddingLeft:14,gap:8}}>
        <Text style={{fontSize:8,fontWeight:'500',letterSpacing:4,textTransform:'uppercase',color:t.accent}}>About</Text>
        <Text style={{fontSize:20,fontWeight:'200',fontStyle:'italic',textTransform:'uppercase',letterSpacing:3,color:t.text,lineHeight:26}}>{headT}</Text>
        <Text style={[ab.body,{color:t.muted}]} numberOfLines={3}>{bodyT}</Text>
      </View>
    </View>
  );

  if (th==='FUN') return (
    <View style={[ab.wrap,{backgroundColor:t.bg}]}>
      <Text style={{fontSize:11,fontWeight:'700',letterSpacing:2,textTransform:'uppercase',color:t.accent,marginBottom:6}}>✦ About</Text>
      <FunCard index={0}>
        <Text style={{fontSize:18,fontWeight:'800',letterSpacing:-0.3,color:'#1a1a1a',marginBottom:6}}>{headT}</Text>
        <Text style={{fontSize:13,color:'#555',lineHeight:19}} numberOfLines={3}>{bodyT}</Text>
      </FunCard>
    </View>
  );

  // CLASSIC default
  return (
    <View style={[ab.wrap,{backgroundColor:t.bg,alignItems:'center'}]}>
      <View style={[ab.topBorder,{backgroundColor:t.border}]} />
      <Eyebrow text="About" t={t} center />
      <Heading text={headT} t={t} center style={{marginTop:4}} />
      <Ornament t={t} center />
      <Text style={[ab.body,{color:t.muted,textAlign:'center',paddingHorizontal:8}]} numberOfLines={3}>{bodyT}</Text>
    </View>
  );
}
const ab = StyleSheet.create({
  wrap:        {padding:20,minHeight:130,gap:8},
  topBorder:   {position:'absolute',top:0,left:'25%',right:'25%',height:1},
  modernBar:   {height:2,width:28},
  modernEyebrow:{fontSize:8,fontWeight:'700',letterSpacing:2.5,textTransform:'uppercase'},
  modernRight: {flex:1,borderLeftWidth:3,paddingLeft:12,gap:8},
  luxBorder:   {width:3,borderRadius:2},
  body:        {fontSize:13,lineHeight:19},
});

/* ══════════════════════════════════════════════════════════════════
   SCHEDULE
   CLASSIC:  centered heading, ornament, bullet rows time|title|location
   ELEGANT:  "Programme" label, left-border rows, italic titles
   MODERN:   UPPERCASE heading, card grid with accent top-border
   MINIMAL:  clean list, no borders, extreme whitespace
   LUXURY:   dark bg, gold left-border per row
   FUN:      "✦ Agenda" label, neobrutalism cards with pastel bg
══════════════════════════════════════════════════════════════════ */
function ScheduleBlock({ cfg, title, t, event }: any) {
  const th    = cfg._theme ?? 'CLASSIC';
  const items: any[] = event?.schedule_items ?? cfg.items ?? cfg.schedule_items ?? [];
  const label = th==='ELEGANT' ? 'PROGRAMME' : th==='FUN' ? "✦ Agenda" : 'SCHEDULE';
  const head  = title || (th==='FUN' ? "What's Happening" : 'Schedule');

  if (th==='MODERN') return (
    <View style={[sc.wrap,{backgroundColor:t.bg}]}>
      <View style={[sc.modernAccentBar,{backgroundColor:t.accent}]} />
      <Text style={{fontSize:18,fontWeight:'900',textTransform:'uppercase',letterSpacing:-0.5,color:t.text,marginBottom:14}}>{head}</Text>
      {items.length===0
        ? <Text style={{fontSize:12,color:t.muted}}>No items yet</Text>
        : items.slice(0,4).map((item:any,i:number)=>(
          <View key={i} style={[sc.modernCard,{borderTopColor:t.accent}]}>
            <Text style={{fontSize:9,fontWeight:'700',textTransform:'uppercase',letterSpacing:2,color:t.accent,marginBottom:4}}>{item.time||item.starts_at||'—'}</Text>
            <Text style={{fontSize:14,fontWeight:'900',color:t.text}} numberOfLines={1}>{item.title||`Item ${i+1}`}</Text>
            {item.location && <Text style={{fontSize:11,color:t.muted}} numberOfLines={1}>{item.location}</Text>}
          </View>
        ))
      }
    </View>
  );

  if (th==='FUN') return (
    <View style={[sc.wrap,{backgroundColor:t.bg}]}>
      <Text style={{fontSize:11,fontWeight:'700',letterSpacing:2,textTransform:'uppercase',color:t.accent}}>✦ Agenda</Text>
      <Text style={{fontSize:20,fontWeight:'800',letterSpacing:-0.3,color:t.text,marginBottom:8}}>{head}</Text>
      {items.length===0
        ? <Text style={{fontSize:12,color:t.muted}}>No items yet</Text>
        : items.slice(0,3).map((item:any,i:number)=>(
          <View key={i} style={sc.funRow}>
            <View style={sc.funShadow} />
            <View style={[sc.funCard,{backgroundColor:FUN_PASTEL[i%FUN_PASTEL.length]}]}>
              <View style={[sc.funTimeBadge,{backgroundColor:t.accent}]}>
                <Text style={{fontSize:9,fontWeight:'900',color:'#fff',textTransform:'uppercase'}}>Time</Text>
                <Text style={{fontSize:11,fontWeight:'900',color:'#fff'}}>{item.time||item.starts_at||'—'}</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:14,fontWeight:'800',color:'#1a1a1a'}} numberOfLines={1}>{item.title||`Item ${i+1}`}</Text>
                {item.location && <Text style={{fontSize:11,color:'#555'}} numberOfLines={1}>{item.location}</Text>}
              </View>
            </View>
          </View>
        ))
      }
    </View>
  );

  if (th==='LUXURY') return (
    <View style={[sc.wrap,{backgroundColor:t.bg}]}>
      <Text style={{fontSize:8,fontWeight:'400',letterSpacing:5,textTransform:'uppercase',color:t.accent,marginBottom:6}}>Schedule</Text>
      <Text style={{fontSize:20,fontWeight:'200',fontStyle:'italic',textTransform:'uppercase',letterSpacing:3,color:t.text,marginBottom:14}}>{head}</Text>
      {items.slice(0,4).map((item:any,i:number)=>(
        <View key={i} style={[sc.luxRow,{borderBottomColor:t.border,borderLeftColor:t.accent}]}>
          <Text style={{fontSize:10,fontWeight:'500',letterSpacing:1,color:t.accent,width:52}} numberOfLines={1}>{item.time||'—'}</Text>
          <View style={{flex:1,gap:2}}>
            <Text style={{fontSize:14,fontWeight:'200',fontStyle:'italic',letterSpacing:1.5,color:t.text}} numberOfLines={1}>{item.title||`Item ${i+1}`}</Text>
            {item.location && <Text style={{fontSize:11,color:t.muted}} numberOfLines={1}>{item.location}</Text>}
          </View>
        </View>
      ))}
    </View>
  );

  // CLASSIC / ELEGANT / MINIMAL
  return (
    <View style={[sc.wrap,{backgroundColor:t.bg}]}>
      <Eyebrow text={label} t={t} />
      <Heading text={head} t={t} style={{marginBottom:10}} />
      {(th==='CLASSIC'||th==='ELEGANT') && <Ornament t={t} />}
      {items.length===0
        ? <Text style={{fontSize:12,color:t.muted,paddingVertical:10}}>No schedule items yet</Text>
        : items.slice(0,4).map((item:any,i:number)=>(
          <View key={i} style={[sc.row,{borderBottomColor:t.border},
            th==='ELEGANT' && sc.elegantRow,
          ]}>
            <Text style={[sc.time,{color:t.accent}]}>{item.time||item.starts_at||''}</Text>
            <View style={{flex:1,gap:2}}>
              <Text style={[sc.itemTitle,{color:t.text,fontStyle:th==='ELEGANT'?'italic':'normal'}]} numberOfLines={1}>{item.title||`Item ${i+1}`}</Text>
              {item.location && <Text style={[sc.location,{color:t.muted}]} numberOfLines={1}>{item.location}</Text>}
            </View>
          </View>
        ))
      }
    </View>
  );
}
const sc = StyleSheet.create({
  wrap:           {paddingHorizontal:20,paddingVertical:20,gap:0},
  modernAccentBar:{height:2,width:32,borderRadius:2,marginBottom:8},
  modernCard:     {paddingVertical:12,paddingHorizontal:12,borderTopWidth:3,marginBottom:8,backgroundColor:'rgba(0,0,0,0.03)'},
  funRow:         {position:'relative',marginBottom:12},
  funShadow:      {position:'absolute',top:5,left:5,right:-5,bottom:-5,backgroundColor:FUN_SHADOW_COLOR,borderRadius:16},
  funCard:        {borderRadius:16,borderWidth:2,borderColor:FUN_SHADOW_COLOR,padding:12,flexDirection:'row',alignItems:'center',gap:12},
  funTimeBadge:   {borderRadius:10,padding:8,minWidth:52,alignItems:'center',gap:2},
  luxRow:         {flexDirection:'row',gap:14,paddingVertical:12,borderBottomWidth:1,borderLeftWidth:3,paddingLeft:14,marginBottom:4},
  row:            {flexDirection:'row',paddingVertical:11,borderBottomWidth:1,gap:14},
  elegantRow:     {borderLeftWidth:3,paddingLeft:12},
  time:           {fontSize:10,fontWeight:'600',width:52,paddingTop:2,letterSpacing:0.3},
  itemTitle:      {fontSize:14,fontWeight:'700',lineHeight:19},
  location:       {fontSize:11,lineHeight:16},
});

/* ══════════════════════════════════════════════════════════════════
   FAQ
   CLASSIC/ELEGANT: centered heading + question rows with chevron
   MODERN: uppercase heading + question rows
   MINIMAL: light weight heading + minimal rows
   LUXURY: dark bg, gold accent, question rows
   FUN: neobrutalism cards per question
══════════════════════════════════════════════════════════════════ */
function FAQBlock({ cfg, title, t }: any) {
  const th    = cfg._theme ?? 'CLASSIC';
  const items: any[] = cfg.items || [];
  const head  = title || (th==='FUN' ? 'Got Questions?' : 'Frequently Asked\nQuestions');

  const Row = ({ item, i }: any) => {
    if (th==='FUN') return (
      <View style={[fq.funRow,{marginBottom:10,position:'relative'}]}>
        <View style={fq.funShadow} />
        <View style={[fq.funCard,{backgroundColor:FUN_PASTEL[i%FUN_PASTEL.length]}]}>
          <Text style={{fontSize:13,fontWeight:'700',flex:1,color:'#1a1a1a'}} numberOfLines={1}>{item.question||`Question ${i+1}`}</Text>
          <Feather name="chevron-down" size={14} color={t.accent} />
        </View>
      </View>
    );
    return (
      <View style={[fq.row,{borderBottomColor:t.border}]}>
        <Text style={[fq.q,{color:t.text,fontStyle:th==='ELEGANT'?'italic':'normal'}]} numberOfLines={1}>{item.question||`Question ${i+1}`}</Text>
        <Feather name="chevron-down" size={14} color={t.muted} />
      </View>
    );
  };

  return (
    <View style={[fq.wrap,{backgroundColor:t.bg}]}>
      {th==='FUN' && <Text style={{fontSize:11,fontWeight:'700',letterSpacing:2,textTransform:'uppercase',color:t.accent,marginBottom:6}}>FAQ</Text>}
      {th!=='FUN' && <Eyebrow text="FAQ" t={t} />}
      <Heading text={head} t={t} style={{fontSize:th==='MINIMAL'?20:22,marginBottom:12}} />
      {items.length===0
        ? <Text style={{fontSize:12,color:t.muted}}>No questions yet</Text>
        : items.slice(0,4).map((item:any,i:number) => <Row key={i} item={item} i={i} />)
      }
    </View>
  );
}
const fq = StyleSheet.create({
  wrap:    {paddingHorizontal:20,paddingVertical:20},
  row:     {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:13,borderBottomWidth:1},
  q:       {fontSize:13,flex:1,marginRight:12},
  funRow:  {position:'relative'},
  funShadow:{position:'absolute',top:4,left:4,right:-4,bottom:-4,backgroundColor:FUN_SHADOW_COLOR,borderRadius:12},
  funCard: {borderRadius:12,borderWidth:2,borderColor:FUN_SHADOW_COLOR,padding:12,flexDirection:'row',alignItems:'center',gap:8},
});

/* ══════════════════════════════════════════════════════════════════
   VENUE
   MODERN: minimal centered, "Location" eyebrow
   Others: eyebrow + heading + venue name + address + map-pin icon
══════════════════════════════════════════════════════════════════ */
function VenueBlock({ cfg, title, t, event }: any) {
  const th      = cfg._theme ?? 'CLASSIC';
  const name    = cfg.venue_name    || event?.venue_name    || title || 'Venue';
  const address = cfg.venue_address || event?.venue_address || cfg.address || '';
  const city    = [
    cfg.city    || event?.city,
    cfg.state   || event?.state,
    cfg.zip_code || event?.zip_code,
    cfg.country || event?.country,
  ].filter(Boolean).join(', ');
  const full    = [address,city].filter(Boolean).join(', ');

  if (th==='MODERN') return (
    <View style={[ve.wrap,{backgroundColor:t.bg}]}>
      <Text style={{fontSize:8,fontWeight:'700',letterSpacing:4,textTransform:'uppercase',color:t.muted,marginBottom:4}}>Location</Text>
      <Text style={{fontSize:18,fontWeight:'900',textTransform:'uppercase',letterSpacing:-0.5,color:t.text,marginBottom:8}}>{name}</Text>
      {full ? <Text style={{fontSize:12,color:t.muted,lineHeight:18}} numberOfLines={2}>{full}</Text> : null}
      <Text style={{fontSize:12,color:t.accent,marginTop:8}}>→ Get Directions</Text>
    </View>
  );

  if (th==='LUXURY') return (
    <View style={[ve.wrap,{backgroundColor:t.bg,flexDirection:'row',gap:0}]}>
      <View style={[ve.luxBorder,{backgroundColor:t.accent}]} />
      <View style={{flex:1,paddingLeft:14,gap:6}}>
        <Text style={{fontSize:8,fontWeight:'500',letterSpacing:4,textTransform:'uppercase',color:t.accent}}>Venue & Directions</Text>
        <Text style={{fontSize:18,fontWeight:'200',fontStyle:'italic',textTransform:'uppercase',letterSpacing:3,color:t.text}}>{name}</Text>
        {full ? <Text style={{fontSize:12,color:t.muted,lineHeight:18}} numberOfLines={2}>{full}</Text> : null}
      </View>
    </View>
  );

  if (th==='FUN') return (
    <View style={[ve.wrap,{backgroundColor:t.bg}]}>
      <Text style={{fontSize:11,fontWeight:'700',letterSpacing:2,textTransform:'uppercase',color:t.accent,marginBottom:8}}>✦ Venue</Text>
      <FunCard index={2}>
        <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
          <View style={{width:44,height:44,borderRadius:12,backgroundColor:t.accent,alignItems:'center',justifyContent:'center'}}>
            <Feather name="map-pin" size={20} color="#fff" />
          </View>
          <View style={{flex:1,gap:3}}>
            <Text style={{fontSize:15,fontWeight:'800',color:'#1a1a1a'}}>{name}</Text>
            {full ? <Text style={{fontSize:12,color:'#555'}} numberOfLines={2}>{full}</Text> : null}
          </View>
        </View>
      </FunCard>
    </View>
  );

  // CLASSIC / ELEGANT / MINIMAL
  return (
    <View style={[ve.wrap,{backgroundColor:t.bg,flexDirection:'row',alignItems:'center'}]}>
      <View style={{flex:1,gap:5}}>
        <Eyebrow text="Venue & Directions" t={t} />
        <Text style={{fontSize:16,fontWeight:t.hw as any,fontStyle:t.hi,color:t.text}}>{name}</Text>
        {full ? <Text style={{fontSize:12,color:t.muted,lineHeight:18}} numberOfLines={2}>{full}</Text> : null}
      </View>
      <View style={[ve.pin,{backgroundColor:`${t.accent}18`}]}>
        <Feather name="map-pin" size={22} color={t.accent} />
      </View>
    </View>
  );
}
const ve = StyleSheet.create({
  wrap:     {padding:18,minHeight:88,gap:6},
  luxBorder:{width:3,borderRadius:2},
  pin:      {width:52,height:52,borderRadius:14,alignItems:'center',justifyContent:'center'},
});

/* ══════════════════════════════════════════════════════════════════
   COUNTDOWN — live ticking DAYS/HRS/MIN/SEC boxes
   FUN: neobrutalism boxes with offset shadow
   LUXURY: gold bordered dark boxes
   Others: standard bordered boxes with accent numbers
══════════════════════════════════════════════════════════════════ */
function buildTextCountdownMobile(d: ReturnType<typeof calcDiff>) {
  if (!d) return null;
  const parts: string[] = [];
  if (d.d > 0) parts.push(`${d.d} day${d.d !== 1 ? 's' : ''}`);
  if (d.h > 0) parts.push(`${d.h} hr${d.h !== 1 ? 's' : ''}`);
  if (d.m > 0) parts.push(`${d.m} min`);
  if (parts.length === 0) parts.push(`${d.s} sec`);
  return parts.join(' · ');
}

function CountdownBlock({ cfg, event, t }: any) {
  const th           = cfg._theme ?? 'CLASSIC';
  const displayStyle = cfg.display_style ?? 'blocks';
  const iso          = event?.starts_at_utc || event?.starts_at;
  const [diff, setDiff] = useState(calcDiff(iso));

  useEffect(()=>{
    if(!iso) return;
    const timer = setInterval(()=>setDiff(calcDiff(iso)),1000);
    return ()=>clearInterval(timer);
  },[iso]);

  const units = [
    {l:'DAYS',v:diff?.d},{l:'HRS',v:diff?.h},{l:'MIN',v:diff?.m},{l:'SEC',v:diff?.s},
  ];

  if (displayStyle === 'flip') {
    return (
      <View style={{padding:16,backgroundColor:t.bg,gap:10}}>
        {diff ? <Eyebrow text="Event starts in" t={t} /> : null}
        {!diff && iso ? (
          <HappeningNowMobile iso={iso} t={t} />
        ) : (
          <View style={{flexDirection:'row',gap:4}}>
            {units.map(u=>(
              <View key={u.l} style={{flex:1,borderRadius:8,overflow:'hidden',backgroundColor:'rgba(0,0,0,0.55)',alignItems:'center',paddingTop:10,paddingBottom:8}}>
                <Text style={{fontSize:26,fontWeight:'900',color:'#fff',letterSpacing:-1,lineHeight:28,marginBottom:6}}>
                  {String(u.v??0).padStart(2,'0')}
                </Text>
                <View style={{height:1,backgroundColor:'rgba(255,255,255,0.12)',width:'100%',marginBottom:6}}/>
                <Text style={{fontSize:7,fontWeight:'700',color:t.accent,letterSpacing:1.5}}>{u.l}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (displayStyle === 'minimal') {
    return (
      <View style={{padding:16,backgroundColor:t.bg,gap:6}}>
        {diff ? <Eyebrow text="Event starts in" t={t} /> : null}
        {!diff && iso ? (
          <HappeningNowMobile iso={iso} t={t} />
        ) : (
          <View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap'}}>
            {units.map((u,i)=>(
              <React.Fragment key={u.l}>
                <View style={{alignItems:'center',minWidth:36}}>
                  <Text style={{fontSize:28,fontWeight:'700',color:t.text,letterSpacing:-0.5,lineHeight:30}}>
                    {String(u.v??0).padStart(2,'0')}
                  </Text>
                  <Text style={{fontSize:7,color:t.muted,letterSpacing:1.2,fontWeight:'600',marginTop:2}}>{u.l}</Text>
                </View>
                {i<3 && <Text style={{fontSize:22,color:t.muted,marginHorizontal:2,marginBottom:14,opacity:0.5}}>:</Text>}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (displayStyle === 'text') {
    const txt = diff ? buildTextCountdownMobile(diff) : null;
    return (
      <View style={{padding:16,backgroundColor:t.bg,gap:8}}>
        {diff ? <Eyebrow text="Event starts in" t={t} /> : null}
        {!diff && iso ? (
          <HappeningNowMobile iso={iso} t={t} />
        ) : txt ? (
          <Text style={{fontSize:20,fontWeight:'700',color:t.accent,letterSpacing:-0.3}}>{txt}</Text>
        ) : (
          <Text style={{fontSize:13,fontStyle:'italic',color:t.muted}}>No event date set</Text>
        )}
      </View>
    );
  }

  const Box = ({v,l}:{v?:number;l:string}) => {
    const num = String(v??0).padStart(2,'0');
    if (th==='FUN') return (
      <View style={{flex:1,alignItems:'center',position:'relative',paddingBottom:4,paddingRight:4}}>
        <View style={{position:'absolute',top:4,left:4,right:-4,bottom:0,backgroundColor:FUN_SHADOW_COLOR,borderRadius:12}} />
        <View style={{width:'100%',paddingVertical:12,borderRadius:12,borderWidth:2,borderColor:FUN_SHADOW_COLOR,backgroundColor:t.accent,alignItems:'center',gap:2}}>
          <Text style={{fontSize:22,fontWeight:'900',color:'#fff',letterSpacing:-0.5}}>{num}</Text>
          <Text style={{fontSize:7,fontWeight:'900',color:'rgba(255,255,255,0.8)',letterSpacing:1.5}}>{l}</Text>
        </View>
      </View>
    );
    if (th==='LUXURY') return (
      <View style={{flex:1,alignItems:'center',paddingVertical:12,borderWidth:1,borderColor:t.border,backgroundColor:t.surface,gap:3}}>
        <Text style={{fontSize:22,fontWeight:'200',fontStyle:'italic',color:t.accent,letterSpacing:1}}>{num}</Text>
        <Text style={{fontSize:7,fontWeight:'500',color:t.muted,letterSpacing:2,textTransform:'uppercase'}}>{l}</Text>
      </View>
    );
    return (
      <View style={{flex:1,alignItems:'center',paddingVertical:12,borderRadius:t.radius||10,borderWidth:1,borderColor:`${t.accent}35`,backgroundColor:`${t.accent}10`,gap:3}}>
        <Text style={{fontSize:22,fontWeight:'900',color:t.accent,letterSpacing:-0.5}}>{num}</Text>
        <Text style={{fontSize:7,fontWeight:'700',color:t.muted,letterSpacing:1.5}}>{l}</Text>
      </View>
    );
  };

  if (!diff && iso) {
    return (
      <View style={{padding:16,backgroundColor:t.bg}}>
        <HappeningNowMobile iso={iso} t={t} />
      </View>
    );
  }

  return (
    <View style={{padding:16,backgroundColor:t.bg,gap:10}}>
      <Eyebrow text="Event starts in" t={t} />
      <View style={{flexDirection:'row',gap:8}}>
        {units.map(u=><Box key={u.l} {...u} />)}
      </View>
    </View>
  );
}

function calcDiff(iso?:string) {
  if(!iso) return null;
  const ms = new Date(iso).getTime()-Date.now();
  if(ms<=0) return null; // event has started — callers handle this as "Happening Now"
  const s = Math.floor(ms/1000);
  return {d:Math.floor(s/86400),h:Math.floor((s%86400)/3600),m:Math.floor((s%3600)/60),s:s%60};
}

function calcElapsed(iso?:string): number {
  if(!iso) return 0;
  return Math.max(0, Date.now() - new Date(iso).getTime());
}

function formatElapsedMobile(ms: number): string {
  if(ms<=0) return 'just started';
  const s=Math.floor(ms/1000), m=Math.floor(s/60), h=Math.floor(m/60), d=Math.floor(h/24);
  if(d>0) return `${d}d ${h%24}h ago`;
  if(h>0) return `${h}h ${m%60}m ago`;
  if(m>0) return `${m}m ${s%60}s ago`;
  return 'just started';
}

function HappeningNowMobile({ iso, t }: { iso?: string; t: any }) {
  const [elapsed, setElapsed] = React.useState(() => calcElapsed(iso));
  const dotOpacity = React.useRef(new Animated.Value(1)).current;
  const ring1 = React.useRef(new Animated.Value(0)).current;
  const ring2 = React.useRef(new Animated.Value(0)).current;
  const ring3 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if(!iso) return;
    const id = setInterval(() => setElapsed(calcElapsed(iso)), 1000);
    return () => clearInterval(id);
  }, [iso]);

  React.useEffect(() => {
    // Dot pulse
    Animated.loop(Animated.sequence([
      Animated.timing(dotOpacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      Animated.timing(dotOpacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
    ])).start();
    // Expanding rings staggered
    const makeRing = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
        ])
      );
    makeRing(ring1, 0).start();
    makeRing(ring2, 700).start();
    makeRing(ring3, 1400).start();
  }, []);

  const ringStyle = (anim: Animated.Value) => ({
    position: 'absolute' as const,
    width: 56, height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: t.accent,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 4.5] }) }],
  });

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20, gap: 12 }}>
      {/* Pulse rings */}
      <View style={{ position: 'absolute', top: 20, alignItems: 'center', justifyContent: 'center', width: '100%', height: 56 }}>
        <Animated.View style={ringStyle(ring1)} />
        <Animated.View style={ringStyle(ring2)} />
        <Animated.View style={ringStyle(ring3)} />
      </View>

      {/* Live badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 99,
        backgroundColor: `${t.accent}18`,
        borderWidth: 1, borderColor: `${t.accent}44`,
      }}>
        <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent, opacity: dotOpacity }} />
        <Text style={{ fontSize: 10, fontWeight: '800', color: t.accent, letterSpacing: 2, textTransform: 'uppercase' }}>Live Now</Text>
      </View>

      {/* Main text */}
      <Text style={{ fontSize: 26, fontWeight: '700', color: '#fff', textAlign: 'center', marginTop: 4 }}>
        Happening Now
      </Text>

      {/* Elapsed */}
      <Text style={{ fontSize: 12, color: t.muted, textAlign: 'center' }}>
        Started {formatElapsedMobile(elapsed)}
      </Text>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   GALLERY — all themes (see separate GalleryBlock breakdown above)
   FUN:     2-col, rounded-2xl, neobrutalism 4px solid offset shadow
   MODERN:  3-col square, no radius, no gap
   MINIMAL: 2-col, alt 4:5/4:3, no radius
   CLASSIC/ELEGANT/LUXURY: 2-col masonry, radius 8
══════════════════════════════════════════════════════════════════ */
function GalleryBlock({ cfg, t }: any) {
  const th     = cfg._theme ?? 'CLASSIC';
  const images: string[] = cfg.images || cfg.media_ids || [];
  const layout: 'grid'|'carousel' = cfg.layout ?? 'grid';
  const [lbIdx, setLbIdx] = useState<number|null>(null);

  const PAD    = 20;
  const innerW = SW - PAD*2;

  const GHeader = () => {
    if (th==='FUN') return (
      <View style={{alignItems:'center'}}>
        <Text style={{fontSize:11,fontWeight:'800',letterSpacing:2,textTransform:'uppercase',color:t.accent,marginBottom:2}}>✦ Gallery</Text>
        <Text style={{fontSize:22,fontWeight:'900',letterSpacing:-0.5,color:t.text}}>{cfg.title||'Our Moments'}</Text>
      </View>
    );
    if (th==='MODERN') return (
      <View>
        <View style={{height:2,width:32,borderRadius:2,backgroundColor:t.accent,marginBottom:8}} />
        <Text style={{fontSize:20,fontWeight:'900',textTransform:'uppercase',letterSpacing:-0.5,color:t.text}}>{cfg.title||'Gallery'}</Text>
      </View>
    );
    if (th==='MINIMAL') return (
      <View style={{alignItems:'center'}}>
        <Text style={{fontSize:8,fontWeight:'400',letterSpacing:5,textTransform:'uppercase',color:t.muted,marginBottom:6}}>Gallery</Text>
        <Text style={{fontSize:22,fontWeight:'300',letterSpacing:1,color:t.text}}>{cfg.title||'Our Moments'}</Text>
      </View>
    );
    if (th==='LUXURY') return (
      <View>
        <Text style={{fontSize:8,fontWeight:'400',letterSpacing:5,textTransform:'uppercase',color:t.accent,marginBottom:4}}>Gallery</Text>
        <Text style={{fontSize:22,fontWeight:'200',fontStyle:'italic',textTransform:'uppercase',letterSpacing:3,color:t.text}}>{cfg.title||'Our Moments'}</Text>
      </View>
    );
    // CLASSIC/ELEGANT
    return (
      <View>
        <Eyebrow text="Gallery" t={t} />
        <Heading text={cfg.title||'Our Moments'} t={t} />
        <Ornament t={t} />
      </View>
    );
  };

  const Empty = () => (
    <View style={{alignItems:'center',justifyContent:'center',height:80,gap:6}}>
      <Feather name="image" size={24} color={`${t.accent}50`} />
      <Text style={{fontSize:11,color:t.muted}}>No images yet</Text>
    </View>
  );

  return (
    <View style={{paddingHorizontal:20,paddingTop:22,paddingBottom:20,backgroundColor:t.bg,gap:16}}>
      <GHeader />
      {images.length===0 ? <Empty />
       : layout==='carousel' ? <GalleryCarousel images={images} accent={t.accent} W={innerW} />
       : th==='FUN'     ? <GalleryFun     images={images} accent={t.accent} W={innerW} />
       : th==='MODERN'  ? <GalleryModern  images={images} W={innerW} />
       : th==='MINIMAL' ? <GalleryMinimal images={images} W={innerW} />
       : <GalleryClassic images={images} W={innerW} />
      }
      {lbIdx!==null && <GalleryLightbox images={images} start={lbIdx} accent={t.accent} onClose={()=>setLbIdx(null)} />}
    </View>
  );
}

function GalleryFun({images,accent,W}:{images:string[];accent:string;W:number}) {
  const GAP=16,SHADOW=4,RADIUS=20;
  const cW=Math.floor((W-GAP)/2);
  const rows:string[][]=[];
  for(let i=0;i<images.length;i+=2) rows.push(images.slice(i,i+2));
  return (
    <View style={{gap:GAP+SHADOW}}>
      {rows.map((row,ri)=>(
        <View key={ri} style={{flexDirection:'row',gap:GAP}}>
          {row.map((uri,ci)=>{
            const idx=ri*2+ci;
            const H=idx%3===1 ? Math.round(cW*1.3) : Math.round(cW*0.75);
            return (
              <View key={ci} style={{width:cW+SHADOW,height:H+SHADOW}}>
                {/* Solid offset shadow */}
                <View style={{position:'absolute',top:SHADOW,left:SHADOW,width:cW,height:H,borderRadius:RADIUS,backgroundColor:accent}} />
                {/* Image card */}
                <View style={{position:'absolute',top:0,left:0,width:cW,height:H,borderRadius:RADIUS,overflow:'hidden',backgroundColor:'#e5e7eb'}}>
                  <Image source={{uri}} style={StyleSheet.absoluteFill} resizeMode="cover" />
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function GalleryModern({images,W}:{images:string[];W:number}) {
  const GAP=2,COLS=3;
  const cW=Math.floor((W-GAP*(COLS-1))/COLS);
  const rows:string[][]=[];
  for(let i=0;i<images.length;i+=COLS) rows.push(images.slice(i,i+COLS));
  return (
    <View style={{gap:GAP}}>
      {rows.map((row,ri)=>(
        <View key={ri} style={{flexDirection:'row',gap:GAP}}>
          {row.map((uri,ci)=>(
            <View key={ci} style={{width:cW,height:cW,backgroundColor:'#e5e7eb',overflow:'hidden'}}>
              <Image source={{uri}} style={StyleSheet.absoluteFill} resizeMode="cover" />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function GalleryMinimal({images,W}:{images:string[];W:number}) {
  const GAP=16,COLS=2;
  const cW=Math.floor((W-GAP)/2);
  const rows:string[][]=[];
  for(let i=0;i<images.length;i+=2) rows.push(images.slice(i,i+2));
  return (
    <View style={{gap:GAP}}>
      {rows.map((row,ri)=>(
        <View key={ri} style={{flexDirection:'row',gap:GAP}}>
          {row.map((uri,ci)=>{
            const idx=ri*2+ci;
            const H=idx%2===0 ? Math.round(cW*1.25) : Math.round(cW*0.75);
            return (
              <View key={ci} style={{width:cW,height:H,backgroundColor:'#e5e7eb',overflow:'hidden'}}>
                <Image source={{uri}} style={StyleSheet.absoluteFill} resizeMode="cover" />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function GalleryClassic({images,W}:{images:string[];W:number}) {
  const GAP=6,COLS=2;
  const cW=Math.floor((W-GAP)/2);
  const H=[cW*1.1,cW*0.78,cW*0.78,cW*1.1,cW*0.95,cW*1.0];
  const rows:string[][]=[];
  for(let i=0;i<images.length;i+=2) rows.push(images.slice(i,i+2));
  return (
    <View style={{gap:GAP}}>
      {rows.map((row,ri)=>(
        <View key={ri} style={{flexDirection:'row',gap:GAP}}>
          {row.map((uri,ci)=>{
            const idx=ri*2+ci;
            return (
              <View key={ci} style={{width:cW,height:Math.round(H[idx%H.length]),borderRadius:8,overflow:'hidden',backgroundColor:'#e5e7eb'}}>
                <Image source={{uri}} style={StyleSheet.absoluteFill} resizeMode="cover" />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function GalleryCarousel({images,accent,W}:{images:string[];accent:string;W:number}) {
  const [cur,setCur]=useState(0);
  const ref=useRef<ScrollView>(null);
  const H=Math.round(W*0.6);
  return (
    <View>
      <View style={{borderRadius:10,overflow:'hidden'}}>
        <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e=>setCur(Math.round(e.nativeEvent.contentOffset.x/W))}>
          {images.map((uri,i)=>(
            <Image key={i} source={{uri}} style={{width:W,height:H}} resizeMode="cover" />
          ))}
        </ScrollView>
      </View>
      {images.length>1 && (
        <View style={{flexDirection:'row',justifyContent:'center',gap:5,marginTop:10}}>
          {images.map((_,i)=>(
            <View key={i} style={{height:6,borderRadius:3,width:i===cur?18:6,backgroundColor:i===cur?accent:`${accent}45`}} />
          ))}
        </View>
      )}
    </View>
  );
}

function GalleryLightbox({images,start,accent,onClose}:{images:string[];start:number;accent:string;onClose:()=>void}) {
  const [cur,setCur]=useState(start);
  const ref=useRef<ScrollView>(null);
  useEffect(()=>{setTimeout(()=>ref.current?.scrollTo({x:start*SW,animated:false}),80);},[]);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.96)',justifyContent:'center'}}>
        <Pressable style={{position:'absolute',top:56,right:20,zIndex:10,width:40,height:40,borderRadius:20,backgroundColor:'rgba(255,255,255,0.12)',alignItems:'center',justifyContent:'center'}} onPress={onClose}>
          <Feather name="x" size={20} color="#fff" />
        </Pressable>
        <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e=>setCur(Math.round(e.nativeEvent.contentOffset.x/SW))} style={{flex:1}}>
          {images.map((uri,i)=>(
            <View key={i} style={{width:SW,height:SW*1.1,alignItems:'center',justifyContent:'center'}}>
              <Image source={{uri}} style={{width:SW,height:SW*1.1}} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
        <View style={{flexDirection:'row',justifyContent:'center',gap:5,marginBottom:32}}>
          {images.map((_,i)=>(
            <View key={i} style={{height:6,borderRadius:3,width:i===cur?18:6,backgroundColor:i===cur?accent:'rgba(255,255,255,0.3)'}} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

/* ── Remaining blocks (Story/Couple/Speakers/Tickets/CTA/Donations/Registry) ─
   All theme-aware using the same token system
────────────────────────────────────────────────────────────────────────────── */
function StoryBlock({ cfg, title, body, t }: any) {
  const th    = cfg._theme ?? 'CLASSIC';
  const img   = cfg.story_image as string | undefined;
  const quote = cfg.quote as string | undefined;
  const lbl   = title || 'Our Story';
  const txt   = body  || 'Share the story behind this event.';

  // ── LUXURY ──────────────────────────────────────────────────────────────
  if (th === 'LUXURY') return (
    <View style={{ backgroundColor: '#0D0C0A' }}>
      {/* Image with gradient overlay */}
      <View style={{ height: 180, width: '100%', backgroundColor: '#1a1916', overflow: 'hidden' }}>
        {img
          ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 32, color: t.accent, opacity: 0.3 }}>◆</Text>
            </View>}
        {/* gradient overlay */}
        <LinearGradient colors={['transparent', 'rgba(13,12,10,0.95)']} style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', padding: 16 }]}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: t.accent, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>Our Story</Text>
          <Text style={{ fontSize: 20, fontWeight: '200', fontStyle: 'italic', color: '#fff', textTransform: 'uppercase', letterSpacing: 1.5 }}>{lbl}</Text>
        </LinearGradient>
      </View>
      {/* Body text */}
      <View style={{ padding: 16, gap: 10 }}>
        <Text style={{ fontSize: 13, lineHeight: 22, color: 'rgba(237,232,223,0.6)', fontWeight: '300' }} numberOfLines={4}>{txt}</Text>
        {quote && (
          <View style={{ borderLeftWidth: 1, borderLeftColor: t.accent, paddingLeft: 12, marginTop: 4 }}>
            <Text style={{ fontSize: 13, fontStyle: 'italic', color: t.accent, lineHeight: 20 }}>&ldquo;{quote}&rdquo;</Text>
          </View>
        )}
      </View>
    </View>
  );

  // ── MODERN ──────────────────────────────────────────────────────────────
  if (th === 'MODERN') return (
    <View style={{ backgroundColor: t.bg, padding: 16 }}>
      <View style={{ height: 3, width: 40, backgroundColor: t.accent, marginBottom: 10 }} />
      <Text style={{ fontSize: 20, fontWeight: '900', color: t.text, letterSpacing: -0.5, textTransform: 'uppercase', marginBottom: 10 }}>{lbl}</Text>
      {img && (
        <View style={{ height: 140, borderRadius: 0, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          <Image source={{ uri: img }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, backgroundColor: t.accent, opacity: 0.15 }} />
        </View>
      )}
      <Text style={{ fontSize: 13, lineHeight: 20, color: t.muted }} numberOfLines={3}>{txt}</Text>
      {quote && (
        <Text style={{ fontSize: 15, fontWeight: '900', color: t.accent, marginTop: 10, letterSpacing: -0.3 }}>&ldquo;{quote}&rdquo;</Text>
      )}
    </View>
  );

  // ── MINIMAL ─────────────────────────────────────────────────────────────
  if (th === 'MINIMAL') return (
    <View style={{ backgroundColor: t.bg, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 10, fontWeight: '500', color: t.muted, letterSpacing: 3, textTransform: 'uppercase' }}>Our Story</Text>
      <Text style={{ fontSize: 20, fontWeight: '300', color: t.text, letterSpacing: 0.5 }}>{lbl}</Text>
      <View style={{ height: 1, backgroundColor: t.border, width: 32, opacity: 0.4 }} />
      <Text style={{ fontSize: 13, lineHeight: 24, fontWeight: '300', color: t.muted }} numberOfLines={4}>{txt}</Text>
      {quote && (
        <View style={{ paddingTop: 8, paddingBottom: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.border }}>
          <Text style={{ fontSize: 14, fontStyle: 'italic', color: t.text, textAlign: 'center', lineHeight: 21 }}>&ldquo;{quote}&rdquo;</Text>
        </View>
      )}
      {img && (
        <View style={{ height: 100, overflow: 'hidden', marginTop: 4 }}>
          <Image source={{ uri: img }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </View>
      )}
    </View>
  );

  // ── ELEGANT ─────────────────────────────────────────────────────────────
  if (th === 'ELEGANT') return (
    <View style={{ backgroundColor: t.bg, padding: 20, gap: 12, alignItems: 'center' }}>
      <Text style={{ fontSize: 9, fontWeight: '600', color: t.muted, letterSpacing: 2.5, textTransform: 'uppercase' }}>Our Story</Text>
      <Text style={{ fontSize: 20, fontWeight: '300', fontStyle: 'italic', color: t.text, textAlign: 'center', letterSpacing: 0.5 }}>{lbl}</Text>
      <Text style={{ fontSize: 12, color: t.accent, letterSpacing: 4 }}>◆</Text>
      {img && (
        <View style={{ height: 130, width: '100%', overflow: 'hidden', borderWidth: 1, borderColor: `${t.accent}33` }}>
          <Image source={{ uri: img }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </View>
      )}
      <Text style={{ fontSize: 13, lineHeight: 21, fontStyle: 'italic', fontWeight: '300', color: t.muted, textAlign: 'center' }} numberOfLines={3}>{txt}</Text>
      {quote && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
          <Text style={{ fontSize: 11, fontStyle: 'italic', color: t.accent }}>&ldquo;{quote}&rdquo;</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
        </View>
      )}
    </View>
  );

  // ── FUN ─────────────────────────────────────────────────────────────────
  if (th === 'FUN') return (
    <View style={{ backgroundColor: t.bg, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: t.accent, letterSpacing: 2, textTransform: 'uppercase' }}>✦ Our Story</Text>
      <Text style={{ fontSize: 20, fontWeight: '900', color: t.text, letterSpacing: -0.5, marginBottom: 2 }}>{lbl}</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {img && (
          <View style={{ width: 90, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#1a1a1a', shadowColor: '#1a1a1a', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 }}>
            <Image source={{ uri: img }} style={{ width: '100%', height: '100%', minHeight: 110 }} resizeMode="cover" />
          </View>
        )}
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={{ fontSize: 12, lineHeight: 18, color: t.muted }} numberOfLines={3}>{txt}</Text>
          {quote && (
            <View style={{ borderRadius: 10, padding: 8, backgroundColor: t.accent, borderWidth: 1.5, borderColor: '#1a1a1a' }}>
              <Text style={{ fontSize: 11, fontStyle: 'italic', fontWeight: '700', color: '#fff' }}>&ldquo;{quote}&rdquo;</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // ── CLASSIC (default) ────────────────────────────────────────────────────
  return (
    <View style={{ backgroundColor: t.bg, flexDirection: 'row' }}>
      {/* Accent image strip or left bar */}
      {img ? (
        <View style={{ width: 100, overflow: 'hidden' }}>
          <Image source={{ uri: img }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={{ position: 'absolute', inset: 0, borderRightWidth: 1, borderColor: `${t.accent}33` }} />
        </View>
      ) : (
        <View style={{ width: 4, margin: 16, borderRadius: 2, backgroundColor: t.accent }} />
      )}
      <View style={{ flex: 1, padding: 16, gap: 6 }}>
        <Text style={{ fontSize: 10, fontWeight: '600', color: t.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Our Story</Text>
        <Text style={{ fontSize: 15, fontWeight: t.hw as any, fontStyle: t.hi, color: t.text }}>{lbl}</Text>
        <Text style={{ fontSize: 12, lineHeight: 18, color: t.muted }} numberOfLines={3}>{txt}</Text>
        {quote && (
          <Text style={{ fontSize: 12, fontStyle: 'italic', color: t.muted, marginTop: 4, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: t.accent }} numberOfLines={2}>&ldquo;{quote}&rdquo;</Text>
        )}
      </View>
    </View>
  );
}

function CoupleBlock({ cfg, t }: any) {
  const p1=cfg.bride_name||cfg.person1_name||'Person 1';
  const p2=cfg.groom_name||cfg.person2_name||'Person 2';
  const i1=cfg.person1_image as string|undefined;
  const i2=cfg.person2_image as string|undefined;
  const Av=({img,name,size=60}:{img?:string;name:string;size?:number})=>{
    const initials=(name).split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase();
    return (
      <View style={{width:size,height:size,borderRadius:size/2,backgroundColor:`${t.accent}20`,borderWidth:2,borderColor:`${t.accent}50`,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        {img ? <Image source={{uri:img}} style={[StyleSheet.absoluteFill,{borderRadius:size/2}]} resizeMode="cover" />
              : <Text style={{fontWeight:'900',color:t.accent,fontSize:size*0.28}}>{initials}</Text>}
      </View>
    );
  };
  return (
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:18,paddingVertical:24,backgroundColor:t.bg}}>
      <Av img={i1} name={p1} />
      <Text style={{fontSize:24,color:t.accent}}>♥</Text>
      <Av img={i2} name={p2} />
    </View>
  );
}

function SpeakersBlock({ cfg, t, event }: any) {
  // Prefer live event.speakers from the store; fall back to config items for static previews
  const items: any[] = event?.speakers?.length ? event.speakers
    : cfg.speakers?.length ? cfg.speakers
    : cfg.items?.length    ? cfg.items
    : [];

  const mock = [
    { full_name: 'Speaker One',   title: 'Role / Company', avatar_url: '' },
    { full_name: 'Speaker Two',   title: 'Role / Company', avatar_url: '' },
    { full_name: 'Speaker Three', title: 'Role / Company', avatar_url: '' },
  ];
  const display = items.length > 0 ? items : mock;

  const isFun   = t.accent === '#F59E0B';
  const avatarR = isFun ? 8 : 999;

  return (
    <View style={{ paddingVertical: 18, backgroundColor: t.bg, gap: 10 }}>
      <View style={{ paddingHorizontal: 18 }}>
        <Eyebrow text="Speakers" t={t} center />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, gap: 14 }}
      >
        {display.map((spk: any, i: number) => {
          const name     = spk.full_name || spk.name || `Speaker ${i + 1}`;
          const role     = spk.title || spk.role || '';
          const imgUri   = spk.avatar_url || spk.image || '';
          const initial  = name[0]?.toUpperCase() ?? 'S';

          return (
            <View key={spk.id || i} style={{ alignItems: 'center', gap: 8, width: 100 }}>
              <View style={{
                width: 68, height: 68, borderRadius: avatarR,
                backgroundColor: `${t.accent}18`,
                borderWidth: 2, borderColor: `${t.accent}40`,
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {imgUri
                  ? <Image source={{ uri: imgUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <Text style={{ fontSize: 22, fontWeight: '700', color: t.accent }}>{initial}</Text>}
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.text, textAlign: 'center' }} numberOfLines={2}>
                {name}
              </Text>
              {role ? (
                <Text style={{ fontSize: 10, color: t.accent, textAlign: 'center', marginTop: -4 }} numberOfLines={1}>
                  {role}
                </Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TicketsBlock({ cfg, event, t }: any) {
  const items:any[]=cfg.ticket_types||cfg.tickets||cfg.items||[];
  const th=cfg._theme??'CLASSIC';
  const isDark=th==='LUXURY'||th==='MODERN';
  return (
    <View style={{padding:18,backgroundColor:isDark?(th==='LUXURY'?t.bg:'#111827'):t.bg,gap:10}}>
      <Text style={{fontSize:9,fontWeight:'700',letterSpacing:2,textTransform:'uppercase',color:th==='FUN'?t.accent:t.muted}}>
        {th==='FUN'?'🎟 Tickets':'TICKETS'}
      </Text>
      <Text style={{fontSize:20,fontWeight:t.hw as any,textTransform:t.ht,fontStyle:t.hi,color:isDark?'#fff':t.text}}>
        Get Your Tickets
      </Text>
      {items.length===0
        ? <Text style={{fontSize:12,color:t.muted}}>No ticket types yet</Text>
        : (
          <View style={{flexDirection:'row',gap:8}}>
            {items.slice(0,3).map((tk:any,i:number)=>(
              th==='FUN'
                ? <View key={i} style={{flex:1,position:'relative',paddingBottom:5,paddingRight:5}}>
                    <View style={{position:'absolute',top:5,left:5,right:-5,bottom:0,backgroundColor:FUN_SHADOW_COLOR,borderRadius:12}} />
                    <View style={{flex:1,borderRadius:12,borderWidth:2,borderColor:FUN_SHADOW_COLOR,padding:10,backgroundColor:FUN_PASTEL[i%FUN_PASTEL.length],gap:4}}>
                      <Text style={{fontSize:11,fontWeight:'900',color:'#1a1a1a'}} numberOfLines={1}>{tk.name||`Tier ${i+1}`}</Text>
                      <Text style={{fontSize:14,fontWeight:'900',color:t.accent}}>{tk.kind==='FREE'||tk.price===0?'Free':`$${tk.price??'—'}`}</Text>
                    </View>
                  </View>
                : <View key={i} style={{flex:1,borderRadius:t.radius||10,borderWidth:1,borderColor:`${t.accent}40`,padding:10,alignItems:'center',gap:4,backgroundColor:isDark?'rgba(255,255,255,0.05)':'transparent'}}>
                    <Text style={{fontSize:11,fontWeight:'800',color:t.accent,textAlign:'center'}} numberOfLines={1}>{tk.name||`Tier ${i+1}`}</Text>
                    <Text style={{fontSize:14,fontWeight:'900',color:isDark?'#fff':t.text}}>{tk.kind==='FREE'||tk.price===0?'Free':`$${tk.price??'—'}`}</Text>
                  </View>
            ))}
          </View>
        )
      }
    </View>
  );
}

function CTABlock({ cfg, title, body, t }: any) {
  const th=cfg._theme??'CLASSIC';
  const ctaTxt=cfg.button_text||(th==='FUN'?"I'm Coming!":'RSVP Now');
  if(th==='FUN') return (
    <View style={{padding:20,backgroundColor:t.bg,alignItems:'center',gap:12}}>
      <Text style={{fontSize:22,fontWeight:'900',letterSpacing:-0.3,color:t.text,textAlign:'center'}}>{title||'Join Us!'}</Text>
      {body && <Text style={{fontSize:13,color:t.muted,textAlign:'center'}} numberOfLines={2}>{body}</Text>}
      <View style={{position:'relative',marginTop:4}}>
        <View style={{position:'absolute',top:5,left:5,right:-5,bottom:-5,backgroundColor:FUN_SHADOW_COLOR,borderRadius:99}} />
        <View style={{paddingHorizontal:24,paddingVertical:12,borderRadius:99,borderWidth:2,borderColor:FUN_SHADOW_COLOR,backgroundColor:t.accent}}>
          <Text style={{fontSize:14,fontWeight:'900',color:'#fff'}}>{ctaTxt}</Text>
        </View>
      </View>
    </View>
  );
  return (
    <View style={{padding:20,backgroundColor:t.bg,alignItems:'center',gap:10}}>
      <Heading text={title||'Join us'} t={t} center />
      {body && <Text style={{fontSize:13,color:t.muted,textAlign:'center'}} numberOfLines={2}>{body}</Text>}
      <View style={{paddingHorizontal:22,paddingVertical:10,borderRadius:t.radius||99,backgroundColor:t.accent,marginTop:4}}>
        <Text style={{fontSize:13,fontWeight:'800',color:'#fff'}}>{ctaTxt}</Text>
      </View>
    </View>
  );
}

function DonationsBlock({ cfg, title, t }: any) {
  return (
    <View style={{padding:20,backgroundColor:t.bg,alignItems:'center',gap:10}}>
      <Heading text={title||'Support This Event'} t={t} center />
      <View style={{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:20,paddingVertical:10,borderRadius:99,borderWidth:1.5,borderColor:t.accent}}>
        <Feather name="heart" size={13} color={t.accent} />
        <Text style={{fontSize:13,fontWeight:'700',color:t.accent}}>Donate</Text>
      </View>
    </View>
  );
}

function RegistryBlock({ cfg, title, t }: any) {
  const items:any[]=cfg.items||[];
  return (
    <View style={{padding:18,backgroundColor:t.bg,gap:8}}>
      <Heading text={title||'Registry'} t={t} />
      {items.slice(0,2).map((item:any,i:number)=>(
        <View key={i} style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:4}}>
          <Feather name="external-link" size={12} color={t.accent} />
          <Text style={{fontSize:12,color:t.muted}} numberOfLines={1}>{item.name||item.store||`Registry ${i+1}`}</Text>
        </View>
      ))}
    </View>
  );
}

function GenericBlock({ title, body, t, type }: any) {
  const accent=BADGE_COLOR[type]??t.accent;
  return (
    <View style={{padding:18,backgroundColor:t.bg,gap:7,minHeight:80}}>
      <View style={{height:2,width:32,borderRadius:2,backgroundColor:accent,marginBottom:4}} />
      <Text style={{fontSize:15,fontWeight:'700',color:t.text}}>{title||type}</Text>
      {body && <Text style={{fontSize:12,color:t.muted,lineHeight:18}} numberOfLines={2}>{body}</Text>}
    </View>
  );
}

/* ── Root card styles ─────────────────────────────────────────── */
const r = StyleSheet.create({
  card:     {overflow:'hidden',position:'relative'},
  badge:    {position:'absolute',top:10,right:10,paddingHorizontal:9,paddingVertical:3,borderRadius:99,zIndex:3},
  badgeTxt: {fontSize:9,fontWeight:'800',color:'#fff',letterSpacing:0.8,textTransform:'uppercase'},
  ring:     {...StyleSheet.absoluteFillObject,borderWidth:2,zIndex:4},
  hidden:   {...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.65)',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6,zIndex:5},
  hiddenTxt:{fontSize:11,fontWeight:'800',color:'rgba(255,255,255,0.6)',letterSpacing:1},
});

// Helper to pass cfg to heading
function cfg(...args: any[]) { return null; }


























// /**
//  * eventapp-mobile/components/builder/SectionPreviewCard.tsx
//  *
//  * PIXEL-PERFECT match to web SharedEventRenderer sections.
//  * Each section × each theme renders identically to the web builder.
//  *
//  * Matches all 7 photos:
//  *  Image 1: MODERN Hero — dark bg, city image, uppercase bold title, JOIN NOW
//  *  Image 2: CLASSIC/ELEGANT About — cream bg, serif heading, body text
//  *  Image 3: CLASSIC Schedule — light bg, SCHEDULE heading, time/title/location rows
//  *  Image 4: MODERN Tickets — dark bg, "Get Your Tickets", price range, countdown, tier cards
//  *  Image 5: CLASSIC FAQ — light bg, "Frequently Asked Questions", question rows
//  *  Image 6: CLASSIC Gallery — light bg, image grid
//  *  Image 7: ELEGANT About + Schedule — ivory bg, large serif, AGENDA label
//  */

// import React, { useEffect, useRef, useState } from 'react';
// import {
//   View, Text, Image, StyleSheet, Animated, Dimensions, ScrollView,
//   Pressable, Alert, Platform, Modal, StatusBar,
// } from 'react-native';
// import { Feather }        from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { MotiView }       from 'moti';
// import * as MediaLibrary  from 'expo-media-library';
// import { Paths, File as FSFile } from 'expo-file-system';

// const SW = Dimensions.get('window').width;

// /* ══════════════════════════════════════════════════════════════════
//    THEME SYSTEM — exact mirror of web styleThemes.js
// ══════════════════════════════════════════════════════════════════ */
// interface ThemeDef {
//   bg: string; bgAlt: string; dark: string; darkSurface: string;
//   accent: string; accentDim: string; text: string; muted: string;
//   border: string; isDark: boolean;
//   fontWeightHeading: '300' | '400' | '700' | '800' | '900';
//   headingTransform: 'none' | 'uppercase';
//   headingStyle: 'normal' | 'italic';
//   radius: number;
// }

// const THEMES: Record<string, ThemeDef> = {
//   CLASSIC: {
//     bg: '#FAF9F6', bgAlt: '#FFFFFF', dark: '#1C1917', darkSurface: '#0F0E0C',
//     accent: '#C9A96E', accentDim: 'rgba(201,169,110,0.18)', text: '#1C1917', muted: '#78716C',
//     border: '#E7E5E4', isDark: false,
//     fontWeightHeading: '400', headingTransform: 'none', headingStyle: 'normal', radius: 0,
//   },
//   ELEGANT: {
//     bg: '#FDF5EF', bgAlt: '#FFFCF9', dark: '#271A14', darkSurface: '#180F0A',
//     accent: '#B87355', accentDim: 'rgba(184,115,85,0.16)', text: '#271A14', muted: '#8C7B6E',
//     border: '#EDE0D8', isDark: false,
//     fontWeightHeading: '300', headingTransform: 'none', headingStyle: 'italic', radius: 0,
//   },
//   MODERN: {
//     bg: '#F4F4F8', bgAlt: '#FFFFFF', dark: '#0A0A14', darkSurface: '#06060E',
//     accent: '#5B5FED', accentDim: 'rgba(91,95,237,0.12)', text: '#0F0F1A', muted: '#6B6B80',
//     border: '#E0E0EC', isDark: false,
//     fontWeightHeading: '900', headingTransform: 'uppercase', headingStyle: 'normal', radius: 3,
//   },
//   MINIMAL: {
//     bg: '#F9F9F9', bgAlt: '#FFFFFF', dark: '#111111', darkSurface: '#080808',
//     accent: '#888888', accentDim: 'rgba(136,136,136,0.12)', text: '#222222', muted: '#888888',
//     border: '#E5E5E5', isDark: false,
//     fontWeightHeading: '300', headingTransform: 'none', headingStyle: 'normal', radius: 0,
//   },
//   LUXURY: {
//     bg: '#0D0C0A', bgAlt: '#111009', dark: '#0D0C0A', darkSurface: '#060504',
//     accent: '#D4AF6F', accentDim: 'rgba(212,175,111,0.15)', text: '#EDE8DF', muted: '#9A8A72',
//     border: 'rgba(212,175,111,0.18)', isDark: true,
//     fontWeightHeading: '300', headingTransform: 'uppercase', headingStyle: 'italic', radius: 0,
//   },
//   FUN: {
//     bg: '#FFFBF0', bgAlt: '#FFFFFF', dark: '#1C1407', darkSurface: '#1C1407',
//     accent: '#F59E0B', accentDim: 'rgba(245,158,11,0.15)', text: '#1C2333', muted: '#6B7280',
//     border: '#FDE68A', isDark: false,
//     fontWeightHeading: '800', headingTransform: 'none', headingStyle: 'normal', radius: 12,
//   },
// };

// function getTheme(cfg?: Record<string, any>): ThemeDef {
//   return THEMES[cfg?._theme ?? ''] ?? THEMES.CLASSIC;
// }

// /* ── Hero default backgrounds per theme ─────────────────────────── */
// const HERO_BG: Record<string, string[]> = {
//   CLASSIC: ['#1a1611', '#2d2416'],
//   ELEGANT: ['#1a0f0a', '#271a14'],
//   MODERN:  ['#06060e', '#0a0a14'],
//   MINIMAL: ['#111111', '#1a1a1a'],
//   LUXURY:  ['#060504', '#0d0c0a'],
//   FUN:     ['#1c1407', '#2d2b08'],
// };

// /* ── Badge colour per section type ─────────────────────────────── */
// const BADGE_COLOR: Record<string, string> = {
//   HERO: '#6c6fee', ABOUT: '#3ecf8e', GALLERY: '#f59e0b', FAQ: '#f43f5e',
//   CTA: '#8b5cf6', SPEAKERS: '#06b6d4', VENUE: '#c9a96e', COUNTDOWN: '#ef4444',
//   TICKETS: '#22c55e', COUPLE: '#ec4899', STORY: '#f97316', SCHEDULE: '#64748b',
//   REGISTRY: '#a78bfa', DONATIONS: '#10b981',
// };

// /* ══════════════════════════════════════════════════════════════════
//    ROOT CARD
// ══════════════════════════════════════════════════════════════════ */
// interface Section {
//   id: string; section_type: string; title?: string; body?: string;
//   config?: Record<string, any>; is_visible?: boolean;
// }
// interface Props { section: Section; selected: boolean; event?: any; }

// export default function SectionPreviewCard({ section, selected, event }: Props) {
//   const type       = section.section_type;
//   const badgeColor = BADGE_COLOR[type] ?? '#6c6fee';
//   const cfg        = section.config ?? {};
//   const theme      = getTheme(cfg);

//   const fadeAnim  = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(10)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
//       Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
//     ]).start();
//   }, []);

//   return (
//     <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
//       <View style={[
//         r.card,
//         { backgroundColor: theme.bg },
//         selected
//           ? { borderColor: badgeColor, borderWidth: 2 }
//           : { borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', borderWidth: 1 },
//       ]}>
//         <SectionContent type={type} cfg={cfg} title={section.title} body={section.body} event={event} theme={theme} />

//         {/* Badge — top right, exact web style */}
//         <View style={[r.badge, { backgroundColor: '#6c6fee' }]}>
//           <Text style={r.badgeTxt}>{type}</Text>
//         </View>

//         {/* Hidden */}
//         {section.is_visible === false && (
//           <View style={r.hidden}>
//             <Feather name="eye-off" size={13} color="rgba(255,255,255,0.6)" />
//             <Text style={r.hiddenTxt}>HIDDEN</Text>
//           </View>
//         )}

//         {/* Selection ring */}
//         {selected && <View style={[r.ring, { borderColor: badgeColor }]} pointerEvents="none" />}
//       </View>
//     </Animated.View>
//   );
// }

// function SectionContent({ type, cfg, title, body, event, theme }: any) {
//   switch (type) {
//     case 'HERO':      return <HeroBlock      cfg={cfg} title={title} body={body} theme={theme} />;
//     case 'ABOUT':     return <AboutBlock     cfg={cfg} title={title} body={body} theme={theme} />;
//     case 'STORY':     return <StoryBlock     cfg={cfg} title={title} body={body} theme={theme} />;
//     case 'COUPLE':    return <CoupleBlock    cfg={cfg} theme={theme} />;
//     case 'COUNTDOWN': return <CountdownBlock cfg={cfg} event={event} theme={theme} />;
//     case 'SCHEDULE':  return <ScheduleBlock  cfg={cfg} title={title} theme={theme} />;
//     case 'VENUE':     return <VenueBlock     cfg={cfg} title={title} theme={theme} />;
//     case 'GALLERY':   return <GalleryBlock   cfg={cfg} theme={theme} />;
//     case 'SPEAKERS':  return <SpeakersBlock  cfg={cfg} theme={theme} />;
//     case 'TICKETS':   return <TicketsBlock   cfg={cfg} event={event} theme={theme} />;
//     case 'FAQ':       return <FAQBlock       cfg={cfg} title={title} theme={theme} />;
//     case 'CTA':       return <CTABlock       cfg={cfg} title={title} body={body} theme={theme} />;
//     case 'DONATIONS': return <DonationsBlock cfg={cfg} title={title} theme={theme} />;
//     case 'REGISTRY':  return <RegistryBlock  cfg={cfg} title={title} theme={theme} />;
//     default:          return <GenericBlock   title={title} body={body} theme={theme} type={type} />;
//   }
// }

// /* ══════════════════════════════════════════════════════════════════
//    HERO — Image 1 exact match
//    MODERN: dark bg, uppercase huge title, LEFT aligned, JOIN NOW border btn
//    CLASSIC/ELEGANT: full-bleed image, centered serif title, ornament
// ══════════════════════════════════════════════════════════════════ */
// function HeroBlock({ cfg, title, body, theme }: any) {
//   const t         = theme as ThemeDef;
//   const bg        = cfg.background_image as string | undefined;
//   const eyebrow   = cfg.eyebrow || 'OPENING NIGHT';
//   const headT     = title || 'Welcome to our event';
//   const subT      = body  || 'Add your event subtitle here';
//   const ctaTxt    = cfg.cta_text || 'JOIN NOW';
//   const isCentered = cfg.headline_align !== 'left';
//   const gradColors = HERO_BG[cfg._theme ?? 'CLASSIC'] ?? HERO_BG.CLASSIC;

//   return (
//     <View style={hb.wrap}>
//       {/* Background */}
//       {bg
//         ? <Image source={{ uri: bg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
//         : <LinearGradient colors={gradColors as any} style={StyleSheet.absoluteFill} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} />
//       }

//       {/* Overlays — match web */}
//       <LinearGradient
//         colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
//         style={StyleSheet.absoluteFill}
//         start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
//       />
//       {/* Accent top line */}
//       <View style={[hb.accentLine, { backgroundColor: t.accent, opacity: 0.35 }]} />

//       <View style={[hb.content, isCentered && { alignItems: 'center' }]}>
//         {/* Eyebrow */}
//         <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}
//           transition={{ type: 'timing', duration: 320 }}>
//           <Text style={[hb.eyebrow, { color: t.accent, textAlign: isCentered ? 'center' : 'left' }]}>
//             {eyebrow}
//           </Text>
//         </MotiView>

//         {/* Heading */}
//         <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}
//           transition={{ type: 'timing', duration: 340, delay: 60 }}>
//           <Text style={[
//             hb.title,
//             {
//               fontWeight: t.fontWeightHeading,
//               textTransform: t.headingTransform,
//               fontStyle: t.headingStyle,
//               textAlign: isCentered ? 'center' : 'left',
//               letterSpacing: t.headingTransform === 'uppercase' ? -1 : 2,
//             },
//           ]}>
//             {headT}
//           </Text>
//         </MotiView>

//         {/* Ornament — CLASSIC/ELEGANT only */}
//         {(cfg._theme === 'CLASSIC' || cfg._theme === 'ELEGANT' || !cfg._theme) && (
//           <View style={[hb.ornamentRow, isCentered && { alignSelf: 'center' }]}>
//             <View style={[hb.ornamentLine, { backgroundColor: t.accent }]} />
//             <Text style={[hb.ornamentDot, { color: t.accent }]}>◆</Text>
//             <View style={[hb.ornamentLine, { backgroundColor: t.accent }]} />
//           </View>
//         )}

//         {/* Subtitle */}
//         <Text style={[hb.sub, { textAlign: isCentered ? 'center' : 'left' }]}>{subT}</Text>

//         {/* CTA button */}
//         {cfg.show_cta !== false && (
//           <View style={[
//             hb.cta,
//             cfg._theme === 'MODERN'
//               ? { backgroundColor: 'transparent', borderColor: t.accent, borderWidth: 1.5 }
//               : { backgroundColor: t.accent, borderWidth: 0 },
//           ]}>
//             <Text style={[hb.ctaTxt, { color: '#fff', letterSpacing: cfg._theme === 'MODERN' ? 2 : 0.5 }]}>
//               {ctaTxt}
//             </Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// }

// const hb = StyleSheet.create({
//   wrap:        { height: 240, overflow: 'hidden' },
//   accentLine:  { position: 'absolute', top: 0, left: 0, right: 0, height: 1, zIndex: 2 },
//   content:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, gap: 8, zIndex: 3 },
//   eyebrow:     { fontSize: 8, fontWeight: '600', letterSpacing: 4, textTransform: 'uppercase' },
//   title:       { fontSize: 30, color: '#fff', lineHeight: 36 },
//   ornamentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
//   ornamentLine:{ height: 1, width: 28, opacity: 0.6 },
//   ornamentDot: { fontSize: 8 },
//   sub:         { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 19 },
//   cta: {
//     alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 9,
//     borderRadius: 4, marginTop: 4,
//   },
//   ctaTxt:      { fontSize: 11, fontWeight: '700' },
// });

// /* ══════════════════════════════════════════════════════════════════
//    ABOUT — Images 2, 7 exact match
//    CLASSIC: centered, "ABOUT" eyebrow, ornament, serif heading
//    ELEGANT: left label col + right content col, horizontal rule
//    MODERN:  left label + thick accent border + UPPERCASE heading
//    MINIMAL: ultra-centered, light weight, extreme spacing
// ══════════════════════════════════════════════════════════════════ */
// function AboutBlock({ cfg, title, body, theme }: any) {
//   const t = theme as ThemeDef;
//   const th = cfg._theme ?? 'CLASSIC';
//   const headT = title || 'About this event';
//   const bodyT = body  || 'Tell guests about this event.';

//   if (th === 'MODERN') {
//     return (
//       <View style={[ab.wrap, { backgroundColor: t.bg }, ab.modernWrap]}>
//         <MotiView from={{ opacity: 0, translateX: -8 }} animate={{ opacity: 1, translateX: 0 }}
//           transition={{ type: 'timing', duration: 300 }}>
//           <View style={ab.modernLeft}>
//             <View style={[ab.modernBar, { backgroundColor: t.accent }]} />
//             <Text style={[ab.modernEyebrow, { color: t.accent }]}>About</Text>
//           </View>
//         </MotiView>
//         <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}
//           transition={{ type: 'timing', duration: 320, delay: 60 }} style={{ flex: 1 }}>
//           <View style={[ab.modernRight, { borderLeftColor: t.accent }]}>
//             <Text style={[ab.modernTitle, { color: t.text, fontWeight: t.fontWeightHeading }]}>
//               {headT.toUpperCase()}
//             </Text>
//             <Text style={[ab.modernBody, { color: t.muted }]} numberOfLines={3}>{bodyT}</Text>
//           </View>
//         </MotiView>
//       </View>
//     );
//   }

//   if (th === 'ELEGANT') {
//     return (
//       <View style={[ab.wrap, { backgroundColor: t.bg }, ab.elegantWrap]}>
//         <MotiView from={{ opacity: 0, translateX: -6 }} animate={{ opacity: 1, translateX: 0 }}
//           transition={{ type: 'timing', duration: 300 }}>
//           <View style={ab.elegantLeft}>
//             <Text style={[ab.elegantEyebrow, { color: t.muted }]}>ABOUT</Text>
//             <View style={[ab.elegantRule, { backgroundColor: t.accent }]} />
//           </View>
//         </MotiView>
//         <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}
//           transition={{ type: 'timing', duration: 340, delay: 80 }} style={{ flex: 1 }}>
//           <View style={ab.elegantRight}>
//             <Text style={[ab.elegantTitle, { color: t.text, fontStyle: t.headingStyle }]}>{headT}</Text>
//             <Text style={[ab.elegantBody, { color: t.muted }]} numberOfLines={4}>{bodyT}</Text>
//           </View>
//         </MotiView>
//       </View>
//     );
//   }

//   if (th === 'MINIMAL') {
//     return (
//       <View style={[ab.wrap, { backgroundColor: t.bg, paddingVertical: 32 }]}>
//         <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}
//           transition={{ type: 'timing', duration: 320 }}>
//           <Text style={[ab.minimalEyebrow, { color: t.muted }]}>ABOUT</Text>
//           <Text style={[ab.minimalTitle, { color: t.text }]}>{headT}</Text>
//           <Text style={[ab.minimalBody, { color: t.muted }]} numberOfLines={3}>{bodyT}</Text>
//         </MotiView>
//       </View>
//     );
//   }

//   // CLASSIC / LUXURY / FUN — centered with ornament
//   return (
//     <View style={[ab.wrap, { backgroundColor: t.bg, alignItems: 'center' }]}>
//       <View style={[ab.topBorder, { backgroundColor: t.border }]} />
//       <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}
//         transition={{ type: 'timing', duration: 300 }} style={{ alignItems: 'center', width: '100%' }}>
//         <Text style={[ab.classicEyebrow, { color: t.muted }]}>ABOUT</Text>
//         <Text style={[ab.classicTitle, { color: t.text, fontStyle: t.headingStyle, fontWeight: t.fontWeightHeading }]}
//           numberOfLines={3}>
//           {headT}
//         </Text>
//         <View style={ab.ornRow}>
//           <View style={[ab.ornLine, { backgroundColor: t.accent, opacity: 0.5 }]} />
//           <Text style={[ab.ornDot, { color: t.accent }]}>✦</Text>
//           <View style={[ab.ornLine, { backgroundColor: t.accent, opacity: 0.5 }]} />
//         </View>
//       </MotiView>
//       <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
//         transition={{ type: 'timing', duration: 320, delay: 80 }}>
//         <Text style={[ab.classicBody, { color: t.muted }]} numberOfLines={3}>{bodyT}</Text>
//       </MotiView>
//     </View>
//   );
// }

// const ab = StyleSheet.create({
//   wrap:   { padding: 20, minHeight: 130 },
//   topBorder: { position: 'absolute', top: 0, left: '25%', right: '25%', height: 1 },

//   /* MODERN */
//   modernWrap:    { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
//   modernLeft:    { width: 60, gap: 6, paddingTop: 4 },
//   modernBar:     { height: 2, width: 28 },
//   modernEyebrow: { fontSize: 8, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase' },
//   modernRight:   { flex: 1, borderLeftWidth: 3, paddingLeft: 12, gap: 8 },
//   modernTitle:   { fontSize: 22, letterSpacing: -0.5, lineHeight: 26 },
//   modernBody:    { fontSize: 13, lineHeight: 19 },

//   /* ELEGANT */
//   elegantWrap:   { flexDirection: 'row', gap: 14 },
//   elegantLeft:   { width: 56, gap: 8, paddingTop: 2 },
//   elegantEyebrow:{ fontSize: 8, fontWeight: '600', letterSpacing: 3, color: '#8C7B6E', textTransform: 'uppercase' },
//   elegantRule:   { height: 1, width: 28, opacity: 0.5 },
//   elegantRight:  { flex: 1, gap: 10 },
//   elegantTitle:  { fontSize: 26, fontWeight: '300', letterSpacing: 0.5, lineHeight: 32 },
//   elegantBody:   { fontSize: 14, lineHeight: 21 },

//   /* MINIMAL */
//   minimalEyebrow:{ fontSize: 8, fontWeight: '400', letterSpacing: 5, color: '#888', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 },
//   minimalTitle:  { fontSize: 26, fontWeight: '300', letterSpacing: 0.5, textAlign: 'center', lineHeight: 32, color: '#222' },
//   minimalBody:   { fontSize: 14, textAlign: 'center', lineHeight: 21, marginTop: 10, paddingHorizontal: 16 },

//   /* CLASSIC */
//   classicEyebrow:{ fontSize: 9, fontWeight: '400', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6 },
//   classicTitle:  { fontSize: 26, letterSpacing: 1, lineHeight: 32, textAlign: 'center' },
//   classicBody:   { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
//   ornRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
//   ornLine:       { height: 1, width: 24 },
//   ornDot:        { fontSize: 9 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    SCHEDULE — Image 3 + 7 exact match
//    CLASSIC: light bg, "SCHEDULE" eyebrow + heading, time/title rows
//    Each row: small time left, bold title, muted location
// ══════════════════════════════════════════════════════════════════ */
// function ScheduleBlock({ cfg, title, theme }: any) {
//   const t  = theme as ThemeDef;
//   const th = cfg._theme ?? 'CLASSIC';
//   const items: any[] = cfg.items || cfg.schedule_items || [];
//   const eyebrow = th === 'ELEGANT' ? 'AGENDA' : 'SCHEDULE';

//   return (
//     <View style={[sb.wrap, { backgroundColor: t.bg }]}>
//       <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}
//         transition={{ type: 'timing', duration: 300 }}>
//         <Text style={[sb.eyebrow, { color: t.muted, letterSpacing: th === 'MODERN' ? 3 : 4 }]}>
//           {eyebrow}
//         </Text>
//         <Text style={[
//           sb.heading,
//           {
//             color: t.text,
//             fontWeight: t.fontWeightHeading,
//             fontStyle: t.headingStyle,
//             textTransform: t.headingTransform,
//             fontSize: th === 'ELEGANT' ? 28 : th === 'MODERN' ? 24 : 26,
//           },
//         ]}>
//           {title || 'Schedule'}
//         </Text>
//       </MotiView>

//       {items.length === 0 ? (
//         <Text style={[sb.empty, { color: t.muted }]}>No schedule items yet</Text>
//       ) : (
//         items.slice(0, 5).map((item: any, i: number) => (
//           <View key={i} style={[sb.row, { borderBottomColor: t.border }]}>
//             {/* Time column */}
//             <Text style={[sb.time, { color: t.muted }]} numberOfLines={1}>
//               {item.time || ''}
//             </Text>
//             {/* Content */}
//             <View style={sb.rowContent}>
//               <Text style={[sb.itemTitle, { color: t.text }]} numberOfLines={1}>
//                 {item.title || item.name || `Item ${i + 1}`}
//               </Text>
//               {item.location ? (
//                 <Text style={[sb.location, { color: t.muted }]} numberOfLines={1}>{item.location}</Text>
//               ) : null}
//               {/* Separator line — matches web */}
//               {i < items.length - 1 && (
//                 <View style={[sb.separator, { backgroundColor: t.accent, opacity: 0.25 }]} />
//               )}
//             </View>
//           </View>
//         ))
//       )}
//     </View>
//   );
// }

// const sb = StyleSheet.create({
//   wrap:      { paddingHorizontal: 20, paddingVertical: 22, gap: 0 },
//   eyebrow:   { fontSize: 9, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 4 },
//   heading:   { letterSpacing: 0, lineHeight: 30, marginBottom: 16 },
//   row:       { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, gap: 16 },
//   time:      { fontSize: 10, fontWeight: '500', width: 54, paddingTop: 2, letterSpacing: 0.3 },
//   rowContent:{ flex: 1, gap: 2 },
//   itemTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
//   location:  { fontSize: 12, fontWeight: '400', lineHeight: 17 },
//   separator: { height: 1, marginTop: 8 },
//   empty:     { fontSize: 12, paddingVertical: 16 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    TICKETS — Image 4 exact match
//    MODERN theme: dark bg, "SECURE YOUR SPOT", "Get Your Tickets",
//    price range, "N people viewing now", countdown, tier cards
// ══════════════════════════════════════════════════════════════════ */
// function TicketsBlock({ cfg, event, theme }: any) {
//   const t  = theme as ThemeDef;
//   const th = cfg._theme ?? 'CLASSIC';

//   const tickets: any[] = cfg.ticket_types || cfg.tickets || cfg.items || [];
//   const minPrice = tickets.reduce((min: number, tk: any) => tk.price > 0 ? Math.min(min, tk.price) : min, Infinity);
//   const maxPrice = tickets.reduce((max: number, tk: any) => Math.max(max, tk.price ?? 0), 0);
//   const priceRange = tickets.length > 0
//     ? (minPrice === Infinity ? 'Free' : minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} – $${maxPrice}`)
//     : '$49 – $199';

//   // Countdown
//   const [diff, setDiff] = useState(calcDiff(event?.starts_at_utc || event?.starts_at));
//   useEffect(() => {
//     const iso = event?.starts_at_utc || event?.starts_at;
//     if (!iso) return;
//     const t = setInterval(() => setDiff(calcDiff(iso)), 1000);
//     return () => clearInterval(t);
//   }, [event?.starts_at_utc]);

//   const isDark = th === 'MODERN' || th === 'LUXURY';

//   const TIER_STYLES: Record<string, any> = {
//     FREE:     { bg: '#166534', accent: '#22c55e', label: '🎁 FREE' },
//     PAID:     { bg: '#7c2d12', accent: '#f97316', label: '12 LEFT' },
//     VIP:      { bg: '#713f12', accent: '#D4AF6F', label: '⭐ VIP'  },
//     STANDARD: { bg: '#1e1b4b', accent: '#6c6fee', label: 'STANDARD' },
//   };

//   return (
//     <View style={[tb.wrap, { backgroundColor: isDark ? (th === 'LUXURY' ? '#0D0C0A' : '#111827') : t.bg }]}>
//       {/* Eyebrow */}
//       <View style={tb.eyebrowRow}>
//         <View style={[tb.eyebrowDot, { backgroundColor: '#ef4444' }]} />
//         <Text style={[tb.eyebrow, { color: isDark ? '#9ca3af' : t.muted }]}>SECURE YOUR SPOT</Text>
//       </View>

//       {/* Main heading */}
//       <Text style={[tb.heading, { color: isDark ? '#fff' : t.text, fontWeight: t.fontWeightHeading }]}>
//         {(cfg.title || 'Get Your\nTickets').toUpperCase()}
//       </Text>

//       {/* Price range */}
//       <Text style={[tb.price, { color: isDark ? t.accent : t.accent }]}>{priceRange}</Text>

//       {/* Live viewers pill */}
//       <View style={[tb.viewersPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : t.accentDim }]}>
//         <View style={[tb.viewerDot, { backgroundColor: '#22c55e' }]} />
//         <Text style={[tb.viewersTxt, { color: isDark ? 'rgba(255,255,255,0.6)' : t.muted }]}>
//           {Math.floor(Math.random() * 40 + 10)} people viewing now
//         </Text>
//       </View>

//       {/* Countdown */}
//       {diff && (
//         <View style={tb.cntSection}>
//           <Text style={[tb.cntLabel, { color: isDark ? 'rgba(255,255,255,0.4)' : t.muted }]}>EVENT STARTS IN</Text>
//           <View style={tb.cntRow}>
//             {[
//               { v: diff.h, l: 'HOURS' },
//               { v: diff.m, l: 'MIN'   },
//               { v: diff.s, l: 'SEC'   },
//             ].map((u, i) => (
//               <React.Fragment key={u.l}>
//                 {i > 0 && <Text style={[tb.cntColon, { color: isDark ? '#374151' : t.border }]}>:</Text>}
//                 <View style={[tb.cntBox, { borderColor: isDark ? '#374151' : t.border, backgroundColor: isDark ? '#1f2937' : t.bgAlt }]}>
//                   <Text style={[tb.cntNum, { color: isDark ? '#fff' : t.text }]}>
//                     {String(u.v ?? 0).padStart(2, '0')}
//                   </Text>
//                   <Text style={[tb.cntUnit, { color: isDark ? '#6b7280' : t.muted }]}>{u.l}</Text>
//                 </View>
//               </React.Fragment>
//             ))}
//           </View>
//         </View>
//       )}

//       {/* Tier cards — Image 4 style */}
//       {tickets.length > 0 ? (
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tb.tiersScroll}>
//           {tickets.slice(0, 4).map((tk: any, i: number) => {
//             const tStyle = TIER_STYLES[tk.kind] ?? TIER_STYLES.STANDARD;
//             return (
//               <View key={i} style={[tb.tierCard, { backgroundColor: tStyle.bg }]}>
//                 <View style={[tb.tierBadge, { backgroundColor: tStyle.accent }]}>
//                   <Text style={tb.tierBadgeTxt}>{tStyle.label}</Text>
//                 </View>
//                 <Text style={tb.tierName} numberOfLines={2}>{tk.name || `Tier ${i + 1}`}</Text>
//                 <Text style={[tb.tierPrice, { color: tStyle.accent }]}>
//                   {tk.kind === 'FREE' || tk.price === 0 ? 'Free' : `$${tk.price}`}
//                 </Text>
//                 {(tk.benefits || tk.features || []).slice(0, 3).map((b: string, j: number) => (
//                   <View key={j} style={tb.tierBenefitRow}>
//                     <Feather name="check-circle" size={10} color={tStyle.accent} />
//                     <Text style={tb.tierBenefitTxt} numberOfLines={1}>{b}</Text>
//                   </View>
//                 ))}
//               </View>
//             );
//           })}
//         </ScrollView>
//       ) : (
//         <Text style={[tb.noTickets, { color: isDark ? '#6b7280' : t.muted }]}>No ticket types yet</Text>
//       )}
//     </View>
//   );
// }

// function calcDiff(iso?: string) {
//   if (!iso) return null;
//   const ms = new Date(iso).getTime() - Date.now();
//   if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
//   const s = Math.floor(ms / 1000);
//   return { d: Math.floor(s/86400), h: Math.floor((s%86400)/3600), m: Math.floor((s%3600)/60), s: s%60 };
// }

// const tb = StyleSheet.create({
//   wrap:        { padding: 18, gap: 10 },
//   eyebrowRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
//   eyebrowDot:  { width: 8, height: 8, borderRadius: 4 },
//   eyebrow:     { fontSize: 9, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
//   heading:     { fontSize: 28, letterSpacing: -0.5, lineHeight: 32, color: '#fff' },
//   price:       { fontSize: 16, fontWeight: '700' },
//   viewersPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
//   viewerDot:   { width: 6, height: 6, borderRadius: 3 },
//   viewersTxt:  { fontSize: 11, fontWeight: '600' },
//   cntSection:  { gap: 6 },
//   cntLabel:    { fontSize: 9, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
//   cntRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   cntColon:    { fontSize: 20, fontWeight: '300', marginBottom: 14 },
//   cntBox:      { width: 70, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, gap: 3 },
//   cntNum:      { fontSize: 26, fontWeight: '700', letterSpacing: -1 },
//   cntUnit:     { fontSize: 7, fontWeight: '700', letterSpacing: 1.5 },
//   tiersScroll: { marginTop: 4 },
//   tierCard:    { width: 120, borderRadius: 12, padding: 12, marginRight: 10, gap: 6, minHeight: 160 },
//   tierBadge:   { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
//   tierBadgeTxt:{ fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
//   tierName:    { fontSize: 15, fontWeight: '800', color: '#fff', lineHeight: 19 },
//   tierPrice:   { fontSize: 13, fontWeight: '700' },
//   tierBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
//   tierBenefitTxt: { fontSize: 10, color: 'rgba(255,255,255,0.6)', flex: 1 },
//   noTickets:   { fontSize: 12, paddingVertical: 16 },
// });

// /* ══════════════════════════════════════════════════════════════════
//    FAQ — Image 5 exact match
//    CLASSIC: light bg, "FAQ" eyebrow, "Frequently Asked Questions" serif,
//    question rows with chevron-down
// ══════════════════════════════════════════════════════════════════ */
// function FAQBlock({ cfg, title, theme }: any) {
//   const t = theme as ThemeDef;
//   const items: any[] = cfg.items || [];

//   return (
//     <View style={[fq.wrap, { backgroundColor: t.bg }]}>
//       <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}
//         transition={{ type: 'timing', duration: 300 }}>
//         <Text style={[fq.eyebrow, { color: t.muted }]}>FAQ</Text>
//         <Text style={[fq.heading, { color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle }]}>
//           {title || 'Frequently Asked\nQuestions'}
//         </Text>
//       </MotiView>
//       {items.length === 0 ? (
//         <Text style={[fq.empty, { color: t.muted }]}>No questions added yet</Text>
//       ) : (
//         items.slice(0, 4).map((item: any, i: number) => (
//           <MotiView key={i}
//             from={{ opacity: 0, translateX: -6 }} animate={{ opacity: 1, translateX: 0 }}
//             transition={{ type: 'timing', duration: 260, delay: i * 50 }}>
//             <View style={[fq.row, { borderBottomColor: t.border }]}>
//               <Text style={[fq.q, { color: t.text }]} numberOfLines={1}>{item.question || `Question ${i + 1}`}</Text>
//               <Feather name="chevron-down" size={14} color={t.muted} />
//             </View>
//           </MotiView>
//         ))
//       )}
//     </View>
//   );
// }

// const fq = StyleSheet.create({
//   wrap:    { paddingHorizontal: 20, paddingVertical: 22 },
//   eyebrow: { fontSize: 9, fontWeight: '500', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
//   heading: { fontSize: 26, letterSpacing: 0, lineHeight: 32, marginBottom: 16 },
//   row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
//   q:       { fontSize: 13, flex: 1, marginRight: 12 },
//   empty:   { fontSize: 12, paddingVertical: 8 },
// });

// // /* ══════════════════════════════════════════════════════════════════
// //    GALLERY
// // ══════════════════════════════════════════════════════════════════ */
// // function GalleryBlock({ cfg, theme }: any) {
// //   const t  = theme as ThemeDef;
// //   const th = cfg._theme ?? 'CLASSIC';
// //   const images: string[]            = cfg.images || cfg.media_ids || [];
// //   const layout: 'grid' | 'carousel' = cfg.layout ?? 'grid';
// //   const [lbIdx, setLbIdx]           = useState<number | null>(null);

// //   const PAD       = 20;
// //   const GAP       = 6;
// //   const COLS      = 2;
// //   const MIN_CELLS = 4; // always show at least this many slots
// //   const innerW    = SW - PAD * 2;
// //   const cellW     = Math.floor((innerW - GAP * (COLS - 1)) / COLS);

// //   // Pad with null placeholders so the grid always has MIN_CELLS slots visible
// //   const display: (string | null)[] =
// //     images.length >= MIN_CELLS
// //       ? images
// //       : [...images, ...Array(MIN_CELLS - images.length).fill(null)];

// //   const Header = () => {
// //     if (th === 'FUN') return (
// //       <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
// //         transition={{ type: 'timing', duration: 300 }}>
// //         <Text style={[gl.eyebrowFun, { color: t.accent }]}>✦ Gallery</Text>
// //         <Text style={[gl.headingFun, { color: t.text }]}>{cfg.title || 'Our Moments'}</Text>
// //       </MotiView>
// //     );
// //     if (th === 'MODERN') return (
// //       <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
// //         transition={{ type: 'timing', duration: 300 }}>
// //         <View style={[gl.modernBar, { backgroundColor: t.accent }]} />
// //         <Text style={[gl.headingModern, { color: t.text }]}>{cfg.title || 'Gallery'}</Text>
// //       </MotiView>
// //     );
// //     if (th === 'MINIMAL') return (
// //       <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
// //         transition={{ type: 'timing', duration: 300 }} style={{ alignItems: 'center' }}>
// //         <Text style={[gl.eyebrowMinimal, { color: t.muted }]}>Gallery</Text>
// //         <Text style={[gl.headingMinimal, { color: t.text }]}>{cfg.title || 'Our Moments'}</Text>
// //       </MotiView>
// //     );
// //     return (
// //       <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
// //         transition={{ type: 'timing', duration: 300 }}>
// //         <Text style={[gl.eyebrow, { color: t.muted }]}>GALLERY</Text>
// //         <Text style={[gl.heading, { color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle }]}>
// //           {cfg.title || 'Our Moments'}
// //         </Text>
// //         <View style={[gl.ornament, { backgroundColor: t.accent }]} />
// //       </MotiView>
// //     );
// //   };

// //   return (
// //     <View style={[gl.wrap, { backgroundColor: t.bg }]}>
// //       <Header />
// //       {layout === 'carousel'
// //         ? <GalleryCarouselPreview images={display} accent={t.accent} cellW={innerW} onTap={i => { if (images[i]) setLbIdx(i); }} />
// //         : <GalleryGrid images={display} cellW={cellW} gap={GAP} theme={th} accent={t.accent} onTap={i => { if (images[i]) setLbIdx(i); }} />
// //       }
// //       {lbIdx !== null && (
// //         <GalleryLightboxModal images={images} startIndex={lbIdx} accent={t.accent} onClose={() => setLbIdx(null)} />
// //       )}
// //     </View>
// //   );
// // }

// // /* ── Unified 2-col grid — explicit rows, no flexWrap ────────────── */
// // function GalleryGrid({ images, cellW, gap, theme, accent, onTap }: {
// //   images: (string | null)[]; cellW: number; gap: number;
// //   theme: string; accent: string; onTap: (i: number) => void;
// // }) {
// //   const getH = (i: number): number => {
// //     if (theme === 'MODERN')  return cellW;
// //     if (theme === 'MINIMAL') return i % 2 === 0 ? cellW * 1.2  : cellW * 0.85;
// //     if (theme === 'FUN')     return i % 3 === 1 ? cellW * 1.25 : cellW * 0.80;
// //     const h = [cellW * 1.1, cellW * 0.78, cellW * 0.78, cellW * 1.1, cellW * 0.9, cellW * 1.0];
// //     return h[i % h.length];
// //   };

// //   const radius = theme === 'MODERN' ? 0 : theme === 'FUN' ? 14 : 8;

// //   const rows: (string | null)[][] = [];
// //   for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));

// //   return (
// //     <View style={{ gap }}>
// //       {rows.map((row, rowIdx) => (
// //         <MotiView
// //           key={rowIdx}
// //           from={{ opacity: 0, translateY: 8 }}
// //           animate={{ opacity: 1, translateY: 0 }}
// //           transition={{ type: 'timing', duration: 280, delay: rowIdx * 60 }}
// //           style={{ flexDirection: 'row', gap }}
// //         >
// //           {row.map((uri, colIdx) => {
// //             const imgIdx = rowIdx * 2 + colIdx;
// //             const cellH  = getH(imgIdx);
// //             const isPlaceholder = uri === null;
// //             return (
// //               <View
// //                 key={colIdx}
// //                 style={[
// //                   gl.cell,
// //                   { width: cellW, height: cellH, borderRadius: radius },
// //                   isPlaceholder && { backgroundColor: `${accent}12`, borderWidth: 1, borderColor: `${accent}25`, borderStyle: 'dashed' },
// //                   !isPlaceholder && theme === 'FUN' && {
// //                     shadowColor: accent, shadowOffset: { width: 3, height: 3 },
// //                     shadowOpacity: 0.4, shadowRadius: 0,
// //                   },
// //                 ]}
// //               >
// //                 {isPlaceholder ? (
// //                   <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
// //                     <Feather name="image" size={16} color={`${accent}40`} />
// //                   </View>
// //                 ) : (
// //                   <Pressable style={StyleSheet.absoluteFill} onPress={() => onTap(imgIdx)} onLongPress={() => downloadImageToLibrary(uri!)} delayLongPress={500}>
// //                     <Image source={{ uri: uri! }} style={[StyleSheet.absoluteFill, { borderRadius: radius }]} resizeMode="cover" />
// //                     <View style={gl.tapHint} pointerEvents="none">
// //                       <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.75)" />
// //                     </View>
// //                   </Pressable>
// //                 )}
// //               </View>
// //             );
// //           })}
// //         </MotiView>
// //       ))}
// //     </View>
// //   );
// // }

// // /* ── Carousel ──────────────────────────────────────────────────── */
// // function GalleryCarouselPreview({ images, accent, cellW, onTap }: {
// //   images: (string | null)[]; accent: string; cellW: number; onTap: (i: number) => void;
// // }) {
// //   const [current, setCurrent] = useState(0);
// //   const scrollRef = useRef<ScrollView>(null);
// //   const cellH = Math.round(cellW * 0.65);

// //   const goTo = (idx: number) => {
// //     const c = Math.max(0, Math.min(idx, images.length - 1));
// //     scrollRef.current?.scrollTo({ x: c * cellW, animated: true });
// //     setCurrent(c);
// //   };

// //   return (
// //     <View>
// //       <View style={{ borderRadius: 10, overflow: 'hidden' }}>
// //         <ScrollView
// //           ref={scrollRef}
// //           horizontal
// //           pagingEnabled
// //           showsHorizontalScrollIndicator={false}
// //           onMomentumScrollEnd={e => setCurrent(Math.round(e.nativeEvent.contentOffset.x / cellW))}
// //         >
// //           {images.map((uri, i) => (
// //             <View key={i} style={{ width: cellW, height: cellH }}>
// //               {uri ? (
// //                 <Pressable style={StyleSheet.absoluteFill} onPress={() => onTap(i)} onLongPress={() => downloadImageToLibrary(uri)} delayLongPress={500}>
// //                   <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
// //                 </Pressable>
// //               ) : (
// //                 <View style={[StyleSheet.absoluteFill, { backgroundColor: `${accent}10`, alignItems: 'center', justifyContent: 'center' }]}>
// //                   <Feather name="image" size={20} color={`${accent}40`} />
// //                 </View>
// //               )}
// //             </View>
// //           ))}
// //         </ScrollView>
// //       </View>

// //       {images.length > 1 && (
// //         <View style={gl.arrowRow}>
// //           <Pressable style={[gl.arrowBtn, { opacity: current === 0 ? 0.3 : 1 }]} onPress={() => goTo(current - 1)} disabled={current === 0}>
// //             <Feather name="chevron-left" size={16} color="#fff" />
// //           </Pressable>
// //           <View style={gl.dots}>
// //             {images.map((_, i) => (
// //               <Pressable key={i} onPress={() => goTo(i)}>
// //                 <View style={[gl.dot, { backgroundColor: i === current ? accent : `${accent}40`, width: i === current ? 18 : 6 }]} />
// //               </Pressable>
// //             ))}
// //           </View>
// //           <Pressable style={[gl.arrowBtn, { opacity: current === images.length - 1 ? 0.3 : 1 }]} onPress={() => goTo(current + 1)} disabled={current === images.length - 1}>
// //             <Feather name="chevron-right" size={16} color="#fff" />
// //           </Pressable>
// //         </View>
// //       )}
// //     </View>
// //   );
// // }

// // /* ── Lightbox modal ────────────────────────────────────────────── */
// // function GalleryLightboxModal({ images, startIndex, accent, onClose }: {
// //   images: string[]; startIndex: number; accent: string; onClose: () => void;
// // }) {
// //   const [current, setCurrent] = useState(startIndex);
// //   const scrollRef = useRef<ScrollView>(null);
// //   const LW = SW;
// //   const LH = LW * 1.1;

// //   useEffect(() => {
// //     setTimeout(() => scrollRef.current?.scrollTo({ x: startIndex * LW, animated: false }), 50);
// //   }, []);

// //   return (
// //     <Modal visible transparent animationType="fade" onRequestClose={onClose}>
// //       <View style={lb.root}>
// //         <Pressable style={lb.closeBtn} onPress={onClose} hitSlop={16}>
// //           <Feather name="x" size={20} color="#fff" />
// //         </Pressable>
// //         <Text style={lb.counter}>{current + 1} / {images.length}</Text>

// //         <ScrollView
// //           ref={scrollRef}
// //           horizontal
// //           pagingEnabled
// //           showsHorizontalScrollIndicator={false}
// //           onMomentumScrollEnd={e => setCurrent(Math.round(e.nativeEvent.contentOffset.x / LW))}
// //           style={{ flex: 1 }}
// //         >
// //           {images.map((uri, i) => (
// //             <View key={i} style={{ width: LW, height: LH, alignItems: 'center', justifyContent: 'center' }}>
// //               <Image source={{ uri }} style={{ width: LW, height: LH }} resizeMode="contain" />
// //             </View>
// //           ))}
// //         </ScrollView>

// //         {images.length > 1 && (
// //           <View style={[gl.dots, { marginBottom: 32 }]}>
// //             {images.map((_, i) => (
// //               <View key={i} style={[gl.dot, { backgroundColor: i === current ? accent : 'rgba(255,255,255,0.3)', width: i === current ? 18 : 6 }]} />
// //             ))}
// //           </View>
// //         )}
// //       </View>
// //     </Modal>
// //   );
// // }

// // const lb = StyleSheet.create({
// //   root:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
// //   closeBtn: {
// //     position: 'absolute', top: 56, right: 20, zIndex: 10,
// //     width: 40, height: 40, borderRadius: 20,
// //     backgroundColor: 'rgba(255,255,255,0.12)',
// //     alignItems: 'center', justifyContent: 'center',
// //   },
// //   counter: { position: 'absolute', top: 64, alignSelf: 'center', fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
// // });

// // const gl = StyleSheet.create({
// //   wrap:    { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 16, gap: 14 },
// //   eyebrow:  { fontSize: 9, fontWeight: '500', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 },
// //   heading:  { fontSize: 24, letterSpacing: 0, lineHeight: 30, marginBottom: 4 },
// //   ornament: { height: 2, width: 32, borderRadius: 2, marginTop: 6, marginBottom: 4 },
// //   modernBar:      { height: 2, width: 32, borderRadius: 2, marginBottom: 8 },
// //   headingModern:  { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 },
// //   eyebrowMinimal: { fontSize: 8, fontWeight: '400', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 6 },
// //   headingMinimal: { fontSize: 24, fontWeight: '300', letterSpacing: 0.5 },
// //   eyebrowFun: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
// //   headingFun: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
// //   cell: { overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.08)' },
// //   tapHint: {
// //     position: 'absolute', bottom: 6, right: 6,
// //     width: 20, height: 20, borderRadius: 10,
// //     backgroundColor: 'rgba(0,0,0,0.45)',
// //     alignItems: 'center', justifyContent: 'center',
// //   },
// //   empty:    { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
// //   emptyTxt: { fontSize: 11 },
// //   arrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
// //   arrowBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
// //   dots:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
// //   dot:      { height: 6, borderRadius: 3 },
// // });

// /**
//  * IN SectionPreviewCard.tsx
//  *
//  * Find and replace the ENTIRE GalleryBlock function + all its
//  * sub-components (GalleryGridFun, GalleryGridModern, GalleryGridMinimal,
//  * GalleryGridClassic, GalleryCarouselPreview, GalleryLightboxModal)
//  * AND the "const gl = StyleSheet.create({...})" block for gallery.
//  *
//  * Replace with this entire block.
//  *
//  * ─────────────────────────────────────────────────────────────────
//  * Each theme now matches the web SharedSections.jsx exactly:
//  *
//  *  FUN     → 2-col, rounded-2xl (16px), NEOBRUTALISM: solid 4px
//  *             offset shadow in accent color, alternating portrait/landscape
//  *             (i%3===1 → tall 4:5, others → wide 4:3)
//  *             bg: #FFFBF0, accent: #F59E0B
//  *
//  *  MODERN  → tight 3-col square grid, NO border-radius, NO gap shadow
//  *             bg: slightly off-white (#F4F4F8 alt)
//  *
//  *  MINIMAL → 2-col, NO radius, alternating 4:5 / 4:3, clean no decor
//  *
//  *  CLASSIC → 2-col masonry columns, small radius (6px), alternating heights
//  *  ELEGANT → same as CLASSIC
//  *  LUXURY  → same as CLASSIC but on dark bg
//  * ─────────────────────────────────────────────────────────────────
//  */

// // /* ══════════════════════════════════════════════════════════════════
// //    GALLERY BLOCK
// // ══════════════════════════════════════════════════════════════════ */
// // function GalleryBlock({ cfg, theme }: any) {
// //   const t  = theme as ThemeDef;
// //   const th = cfg._theme ?? 'CLASSIC';
// //   const images: string[]             = cfg.images || cfg.media_ids || [];
// //   const layout: 'grid' | 'carousel' = cfg.layout ?? 'grid';
// //   const [lbIdx, setLbIdx]            = useState<number | null>(null);

// //   // Compute exact pixel cell width — no floats, no flex ambiguity
// //   const H_PAD  = 20;                          // wrap paddingHorizontal
// //   const innerW = SW - H_PAD * 2;             // total usable width

// //   /* ── Headers ─────────────────────────────────────────────────── */
// //   const FunHeader = () => (
// //     <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
// //       transition={{ type: 'timing', duration: 300 }} style={{ alignItems: 'center' }}>
// //       <Text style={[gh.eyebrowFun, { color: t.accent }]}>✦ Gallery</Text>
// //       <Text style={[gh.headingFun, { color: t.text }]}>
// //         {cfg.title || 'Our Moments'}
// //       </Text>
// //     </MotiView>
// //   );

// //   const ModernHeader = () => (
// //     <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
// //       transition={{ type: 'timing', duration: 300 }}>
// //       <View style={[gh.modernBar, { backgroundColor: t.accent }]} />
// //       <Text style={[gh.headingModern, { color: t.text }]}>
// //         {cfg.title || 'Gallery'}
// //       </Text>
// //     </MotiView>
// //   );

// //   const MinimalHeader = () => (
// //     <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
// //       transition={{ type: 'timing', duration: 300 }} style={{ alignItems: 'center' }}>
// //       <Text style={[gh.eyebrowMinimal, { color: t.muted }]}>Gallery</Text>
// //       <Text style={[gh.headingMinimal, { color: t.text }]}>
// //         {cfg.title || 'Our Moments'}
// //       </Text>
// //     </MotiView>
// //   );

// //   const ClassicHeader = () => (
// //     <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
// //       transition={{ type: 'timing', duration: 300 }}>
// //       <Text style={[gh.eyebrow, { color: t.muted }]}>GALLERY</Text>
// //       <Text style={[gh.heading, {
// //         color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle,
// //       }]}>
// //         {cfg.title || 'Our Moments'}
// //       </Text>
// //       <View style={[gh.ornament, { backgroundColor: t.accent }]} />
// //     </MotiView>
// //   );

// //   const Header = th === 'FUN'     ? FunHeader
// //     : th === 'MODERN'  ? ModernHeader
// //     : th === 'MINIMAL' ? MinimalHeader
// //     : ClassicHeader;

// //   const Empty = () => (
// //     <View style={gh.empty}>
// //       <Feather name="image" size={24} color={`${t.accent}50`} />
// //       <Text style={[gh.emptyTxt, { color: t.muted }]}>No images yet</Text>
// //     </View>
// //   );

// //   return (
// //     <View style={[gh.wrap, { backgroundColor: t.bg }]}>
// //       <Header />

// //       {images.length === 0
// //         ? <Empty />
// //         : layout === 'carousel'
// //           ? <GalleryCarouselPreview images={images} accent={t.accent} innerW={innerW} onTap={setLbIdx} />
// //           : th === 'FUN'
// //             ? <GalleryGridFun     images={images} accent={t.accent} innerW={innerW} onTap={setLbIdx} />
// //             : th === 'MODERN'
// //               ? <GalleryGridModern  images={images} innerW={innerW} onTap={setLbIdx} />
// //               : th === 'MINIMAL'
// //                 ? <GalleryGridMinimal images={images} innerW={innerW} onTap={setLbIdx} />
// //                 : <GalleryGridClassic images={images} innerW={innerW} onTap={setLbIdx} />
// //       }

// //       {lbIdx !== null && (
// //         <GalleryLightboxModal
// //           images={images}
// //           startIndex={lbIdx}
// //           accent={t.accent}
// //           onClose={() => setLbIdx(null)}
// //         />
// //       )}
// //     </View>
// //   );
// // }

// // /* ══════════════════════════════════════════════════════════════════
// //    FUN GRID — Exact match to web FUN GallerySection
// //    Web code:
// //      grid-cols-2 gap-4
// //      i%3===1 → aspectRatio "1/1.3"  (portrait,  tall)
// //      others  → aspectRatio "4/3"    (landscape, wide)
// //      boxShadow: "4px 4px 0px var(--t-accent)" ← NEO-BRUTALISM
// //      rounded-2xl (≈ borderRadius 20)
// // ══════════════════════════════════════════════════════════════════ */
// // function GalleryGridFun({ images, accent, innerW, onTap }: {
// //   images: string[]; accent: string; innerW: number; onTap: (i: number) => void;
// // }) {
// //   const GAP   = 14;
// //   const COLS  = 2;
// //   const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);

// //   // Pair into rows of 2
// //   const rows: string[][] = [];
// //   for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));

// //   return (
// //     <View style={{ gap: GAP }}>
// //       {rows.map((row, rowIdx) => (
// //         <MotiView
// //           key={rowIdx}
// //           from={{ opacity: 0, translateY: 10 }}
// //           animate={{ opacity: 1, translateY: 0 }}
// //           transition={{ type: 'timing', duration: 300, delay: rowIdx * 70 }}
// //           style={{ flexDirection: 'row', gap: GAP }}
// //         >
// //           {row.map((uri, colIdx) => {
// //             const imgIdx    = rowIdx * 2 + colIdx;
// //             const isPortrait = imgIdx % 3 === 1;            // matches web i%3===1
// //             // 4:3 → cellW * 0.75,  1:1.3 → cellW * 1.3
// //             const cellH = isPortrait
// //               ? Math.round(cellW * 1.3)
// //               : Math.round(cellW * 0.75);

// //             return (
// //               <Pressable
// //                 key={colIdx}
// //                 style={[
// //                   gf.cell,
// //                   {
// //                     width:  cellW,
// //                     height: cellH,
// //                     // NEO-BRUTALISM: solid 4px offset shadow in accent color
// //                     shadowColor:   accent,
// //                     shadowOffset:  { width: 4, height: 4 },
// //                     shadowOpacity: 1,
// //                     shadowRadius:  0,
// //                     // Android elevation doesn't do offset; use border instead
// //                     elevation: 0,
// //                   },
// //                 ]}
// //                 onPress={() => onTap(imgIdx)}
// //                 onLongPress={() => downloadImageToLibrary(uri)}
// //                 delayLongPress={500}
// //               >
// //                 <Image
// //                   source={{ uri }}
// //                   style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
// //                   resizeMode="cover"
// //                 />
// //                 {/* Hover zoom hint */}
// //                 <View style={gf.hint} pointerEvents="none">
// //                   <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.9)" />
// //                 </View>
// //               </Pressable>
// //             );
// //           })}
// //         </MotiView>
// //       ))}
// //     </View>
// //   );
// // }

// // const gf = StyleSheet.create({
// //   cell: {
// //     borderRadius:    16,
// //     overflow:        'hidden',
// //     backgroundColor: 'rgba(0,0,0,0.06)',
// //   },
// //   hint: {
// //     position:        'absolute',
// //     bottom:          8, right: 8,
// //     width:           22, height: 22,
// //     borderRadius:    11,
// //     backgroundColor: 'rgba(0,0,0,0.40)',
// //     alignItems:      'center', justifyContent: 'center',
// //   },
// // });

// // /* ══════════════════════════════════════════════════════════════════
// //    MODERN GRID — tight 3-col square grid, NO radius
// //    Web: grid-cols-2 gap-4 sm:grid-cols-3, square aspect, no shadow
// // ══════════════════════════════════════════════════════════════════ */
// // function GalleryGridModern({ images, innerW, onTap }: {
// //   images: string[]; innerW: number; onTap: (i: number) => void;
// // }) {
// //   const GAP   = 2;
// //   const COLS  = 3;
// //   const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);

// //   const rows: string[][] = [];
// //   for (let i = 0; i < images.length; i += COLS) rows.push(images.slice(i, i + COLS));

// //   return (
// //     <View style={{ gap: GAP }}>
// //       {rows.map((row, rowIdx) => (
// //         <MotiView
// //           key={rowIdx}
// //           from={{ opacity: 0 }}
// //           animate={{ opacity: 1 }}
// //           transition={{ type: 'timing', duration: 220, delay: rowIdx * 40 }}
// //           style={{ flexDirection: 'row', gap: GAP }}
// //         >
// //           {row.map((uri, colIdx) => (
// //             <Pressable
// //               key={colIdx}
// //               style={{ width: cellW, height: cellW, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.08)' }}
// //               onPress={() => onTap(rowIdx * COLS + colIdx)}
// //               onLongPress={() => downloadImageToLibrary(uri)}
// //               delayLongPress={500}
// //             >
// //               <Image
// //                 source={{ uri }}
// //                 style={StyleSheet.absoluteFill}
// //                 resizeMode="cover"
// //               />
// //               <View style={gf.hint} pointerEvents="none">
// //                 <Feather name="maximize-2" size={8} color="rgba(255,255,255,0.7)" />
// //               </View>
// //             </Pressable>
// //           ))}
// //         </MotiView>
// //       ))}
// //     </View>
// //   );
// // }

// // /* ══════════════════════════════════════════════════════════════════
// //    MINIMAL GRID — 2-col, NO radius, alternating 4:5 / 4:3
// //    Web: grid-cols-2 gap-4 sm:gap-6, i%2===0 → "4/5", else "4/3"
// // ══════════════════════════════════════════════════════════════════ */
// // function GalleryGridMinimal({ images, innerW, onTap }: {
// //   images: string[]; innerW: number; onTap: (i: number) => void;
// // }) {
// //   const GAP   = 16;
// //   const COLS  = 2;
// //   const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);

// //   const rows: string[][] = [];
// //   for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));

// //   return (
// //     <View style={{ gap: GAP }}>
// //       {rows.map((row, rowIdx) => (
// //         <MotiView
// //           key={rowIdx}
// //           from={{ opacity: 0, translateY: 8 }}
// //           animate={{ opacity: 1, translateY: 0 }}
// //           transition={{ type: 'timing', duration: 280, delay: rowIdx * 60 }}
// //           style={{ flexDirection: 'row', gap: GAP }}
// //         >
// //           {row.map((uri, colIdx) => {
// //             const imgIdx = rowIdx * 2 + colIdx;
// //             // i%2===0 → 4:5 portrait, else 4:3 landscape
// //             const cellH = imgIdx % 2 === 0
// //               ? Math.round(cellW * 1.25)
// //               : Math.round(cellW * 0.75);

// //             return (
// //               <Pressable
// //                 key={colIdx}
// //                 style={{ width: cellW, height: cellH, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)' }}
// //                 onPress={() => onTap(imgIdx)}
// //                 onLongPress={() => downloadImageToLibrary(uri)}
// //                 delayLongPress={500}
// //               >
// //                 <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
// //                 <View style={gf.hint} pointerEvents="none">
// //                   <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.7)" />
// //                 </View>
// //               </Pressable>
// //             );
// //           })}
// //         </MotiView>
// //       ))}
// //     </View>
// //   );
// // }

// // /* ══════════════════════════════════════════════════════════════════
// //    CLASSIC / ELEGANT / LUXURY — 2-col masonry, borderRadius 8
// //    Web: columns-2 gap-3, masonry-style (alternating heights)
// // ══════════════════════════════════════════════════════════════════ */
// // function GalleryGridClassic({ images, innerW, onTap }: {
// //   images: string[]; innerW: number; onTap: (i: number) => void;
// // }) {
// //   const GAP   = 6;
// //   const COLS  = 2;
// //   const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);
// //   // Masonry alternating heights
// //   const HEIGHTS = [
// //     Math.round(cellW * 1.1),
// //     Math.round(cellW * 0.78),
// //     Math.round(cellW * 0.78),
// //     Math.round(cellW * 1.1),
// //     Math.round(cellW * 0.9),
// //     Math.round(cellW * 1.0),
// //   ];

// //   const rows: string[][] = [];
// //   for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));

// //   return (
// //     <View style={{ gap: GAP }}>
// //       {rows.map((row, rowIdx) => (
// //         <MotiView
// //           key={rowIdx}
// //           from={{ opacity: 0, scale: 0.96 }}
// //           animate={{ opacity: 1, scale: 1 }}
// //           transition={{ type: 'timing', duration: 270, delay: rowIdx * 50 }}
// //           style={{ flexDirection: 'row', gap: GAP }}
// //         >
// //           {row.map((uri, colIdx) => {
// //             const imgIdx = rowIdx * 2 + colIdx;
// //             const cellH  = HEIGHTS[imgIdx % HEIGHTS.length];

// //             return (
// //               <Pressable
// //                 key={colIdx}
// //                 style={{ width: cellW, height: cellH, borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)' }}
// //                 onPress={() => onTap(imgIdx)}
// //                 onLongPress={() => downloadImageToLibrary(uri)}
// //                 delayLongPress={500}
// //               >
// //                 <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
// //                 <View style={gf.hint} pointerEvents="none">
// //                   <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.75)" />
// //                 </View>
// //               </Pressable>
// //             );
// //           })}
// //         </MotiView>
// //       ))}
// //     </View>
// //   );
// // }

// // /* ══════════════════════════════════════════════════════════════════
// //    CAROUSEL — horizontal paging with prev/next + dots
// // ══════════════════════════════════════════════════════════════════ */
// // function GalleryCarouselPreview({ images, accent, innerW, onTap }: {
// //   images: string[]; accent: string; innerW: number; onTap: (i: number) => void;
// // }) {
// //   const [current, setCurrent] = useState(0);
// //   const scrollRef = useRef<ScrollView>(null);
// //   const cellH = Math.round(innerW * 0.60);

// //   const goTo = (idx: number) => {
// //     const c = Math.max(0, Math.min(idx, images.length - 1));
// //     scrollRef.current?.scrollTo({ x: c * innerW, animated: true });
// //     setCurrent(c);
// //   };

// //   return (
// //     <View>
// //       <View style={{ borderRadius: 12, overflow: 'hidden' }}>
// //         <ScrollView
// //           ref={scrollRef}
// //           horizontal pagingEnabled
// //           showsHorizontalScrollIndicator={false}
// //           onMomentumScrollEnd={e => {
// //             setCurrent(Math.round(e.nativeEvent.contentOffset.x / innerW));
// //           }}
// //         >
// //           {images.map((uri, i) => (
// //             <Pressable key={i} onPress={() => onTap(i)}>
// //               <Image source={{ uri }} style={{ width: innerW, height: cellH }} resizeMode="cover" />
// //             </Pressable>
// //           ))}
// //         </ScrollView>
// //       </View>

// //       {images.length > 1 && (
// //         <View style={gc.nav}>
// //           <Pressable style={[gc.navBtn, { opacity: current === 0 ? 0.3 : 1 }]} onPress={() => goTo(current - 1)}>
// //             <Feather name="chevron-left" size={16} color="#fff" />
// //           </Pressable>
// //           <View style={gc.dots}>
// //             {images.map((_, i) => (
// //               <Pressable key={i} onPress={() => goTo(i)}>
// //                 <View style={[gc.dot, { backgroundColor: i === current ? accent : `${accent}40`, width: i === current ? 18 : 6 }]} />
// //               </Pressable>
// //             ))}
// //           </View>
// //           <Pressable style={[gc.navBtn, { opacity: current === images.length - 1 ? 0.3 : 1 }]} onPress={() => goTo(current + 1)}>
// //             <Feather name="chevron-right" size={16} color="#fff" />
// //           </Pressable>
// //         </View>
// //       )}
// //     </View>
// //   );
// // }

// // const gc = StyleSheet.create({
// //   nav:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
// //   navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
// //   dots:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
// //   dot:    { height: 6, borderRadius: 3 },
// // });

// // /* ══════════════════════════════════════════════════════════════════
// //    LIGHTBOX MODAL
// // ══════════════════════════════════════════════════════════════════ */
// // function GalleryLightboxModal({ images, startIndex, accent, onClose }: {
// //   images: string[]; startIndex: number; accent: string; onClose: () => void;
// // }) {
// //   const [current, setCurrent] = useState(startIndex);
// //   const scrollRef = useRef<ScrollView>(null);

// //   useEffect(() => {
// //     setTimeout(() => {
// //       scrollRef.current?.scrollTo({ x: startIndex * SW, animated: false });
// //     }, 60);
// //   }, []);

// //   return (
// //     <Modal visible transparent animationType="fade" onRequestClose={onClose}>
// //       <View style={lb.root}>
// //         <Pressable style={lb.closeBtn} onPress={onClose} hitSlop={16}>
// //           <Feather name="x" size={20} color="#fff" />
// //         </Pressable>
// //         <Text style={lb.counter}>{current + 1} / {images.length}</Text>

// //         <ScrollView
// //           ref={scrollRef}
// //           horizontal pagingEnabled
// //           showsHorizontalScrollIndicator={false}
// //           onMomentumScrollEnd={e => setCurrent(Math.round(e.nativeEvent.contentOffset.x / SW))}
// //           style={{ flex: 1 }}
// //         >
// //           {images.map((uri, i) => (
// //             <View key={i} style={{ width: SW, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
// //               <Image source={{ uri }} style={{ width: SW, height: SW * 1.1 }} resizeMode="contain" />
// //             </View>
// //           ))}
// //         </ScrollView>

// //         {images.length > 1 && (
// //           <View style={[gc.dots, { marginBottom: 40 }]}>
// //             {images.map((_, i) => (
// //               <View key={i} style={[gc.dot, {
// //                 backgroundColor: i === current ? accent : 'rgba(255,255,255,0.35)',
// //                 width: i === current ? 18 : 6,
// //               }]} />
// //             ))}
// //           </View>
// //         )}
// //       </View>
// //     </Modal>
// //   );
// // }

// // const lb = StyleSheet.create({
// //   root:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', justifyContent: 'center' },
// //   closeBtn: {
// //     position: 'absolute', top: 56, right: 20, zIndex: 10,
// //     width: 40, height: 40, borderRadius: 20,
// //     backgroundColor: 'rgba(255,255,255,0.12)',
// //     alignItems: 'center', justifyContent: 'center',
// //   },
// //   counter: {
// //     position: 'absolute', top: 64, alignSelf: 'center',
// //     fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600',
// //   },
// // });

// // /* ══════════════════════════════════════════════════════════════════
// //    GALLERY SHARED HEADER STYLES
// // ══════════════════════════════════════════════════════════════════ */
// // const gh = StyleSheet.create({
// //   wrap:    { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 16, gap: 14 },

// //   /* CLASSIC / ELEGANT / LUXURY */
// //   eyebrow:  { fontSize: 9,  fontWeight: '500', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 },
// //   heading:  { fontSize: 24, letterSpacing: 0, lineHeight: 30, marginBottom: 4 },
// //   ornament: { height: 2, width: 32, borderRadius: 2, marginTop: 6, marginBottom: 4 },

// //   /* MODERN */
// //   modernBar:     { height: 2, width: 32, borderRadius: 2, marginBottom: 8 },
// //   headingModern: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 },

// //   /* MINIMAL */
// //   eyebrowMinimal: { fontSize: 8, fontWeight: '400', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 6 },
// //   headingMinimal: { fontSize: 24, fontWeight: '300', letterSpacing: 0.5 },

// //   /* FUN — centered bold */
// //   eyebrowFun: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5, marginBottom: 2, textAlign: 'center' },
// //   headingFun: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' },

// //   /* Empty */
// //   empty:    { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
// //   emptyTxt: { fontSize: 11 },
// // });
// /**
//  * FULL REPLACEMENT for the GalleryBlock section in:
//  * eventapp-mobile/components/builder/SectionPreviewCard.tsx
//  *
//  * Find from:    "function GalleryBlock({ cfg, theme }: any) {"
//  * Find to:      the closing "});" of "const gh = StyleSheet.create({..."
//  * Replace with: this entire file content
//  *
//  * ─── What this fixes ─────────────────────────────────────────────
//  *
//  * FUN theme — web uses:
//  *   grid-cols-2, gap-4, rounded-2xl (≈20px)
//  *   i%3===1 → aspectRatio "1/1.3"  (portrait, tall)
//  *   others  → aspectRatio "4/3"    (landscape, wide)
//  *   boxShadow: "4px 4px 0px var(--t-accent)"  ← solid offset, NEOBRUTALISM
//  *   bg: #FFFBF0 (warm white), accent: #F59E0B (amber)
//  *
//  * React Native can't do CSS box-shadow offsets natively.
//  * Fix: render a solid amber rectangle BEHIND each image cell,
//  * offset by 4px right + 4px down, matching the web exactly.
//  *
//  * MODERN — 3-col square grid, no radius, gap 2px
//  * MINIMAL — 2-col, alternating 4:5 / 4:3, no radius, gap 6
//  * CLASSIC/ELEGANT/LUXURY — 2-col masonry, radius 8, gap 6
//  */

// /* ══════════════════════════════════════════════════════════════════
//    GALLERY BLOCK
// ══════════════════════════════════════════════════════════════════ */
// function GalleryBlock({ cfg, theme }: any) {
//   const t  = theme as ThemeDef;
//   const th = cfg._theme ?? 'CLASSIC';
//   const images: string[]             = cfg.images || cfg.media_ids || [];
//   const layout: 'grid' | 'carousel' = cfg.layout ?? 'grid';
//   const [lbIdx, setLbIdx]           = useState<number | null>(null);

//   const PAD    = 20;
//   const innerW = SW - PAD * 2;

//   /* ── Per-theme header ──────────────────────────────────────────── */
//   const FunHeader = () => (
//     <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
//       transition={{ type: 'timing', duration: 300 }} style={{ alignItems: 'center' }}>
//       <Text style={[gh.eyebrowFun, { color: t.accent }]}>✦ Gallery</Text>
//       <Text style={[gh.headingFun, { color: t.text }]}>{cfg.title || 'Our Moments'}</Text>
//     </MotiView>
//   );

//   const ModernHeader = () => (
//     <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
//       transition={{ type: 'timing', duration: 300 }}>
//       <View style={[gh.modernBar, { backgroundColor: t.accent }]} />
//       <Text style={[gh.headingModern, { color: t.text }]}>{cfg.title || 'Gallery'}</Text>
//     </MotiView>
//   );

//   const MinimalHeader = () => (
//     <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
//       transition={{ type: 'timing', duration: 300 }} style={{ alignItems: 'center' }}>
//       <Text style={[gh.eyebrowMinimal, { color: t.muted }]}>Gallery</Text>
//       <Text style={[gh.headingMinimal, { color: t.text }]}>{cfg.title || 'Our Moments'}</Text>
//     </MotiView>
//   );

//   const ClassicHeader = () => (
//     <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}
//       transition={{ type: 'timing', duration: 300 }}>
//       <Text style={[gh.eyebrow, { color: t.muted }]}>GALLERY</Text>
//       <Text style={[gh.heading, {
//         color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle,
//       }]}>
//         {cfg.title || 'Our Moments'}
//       </Text>
//       <View style={[gh.ornament, { backgroundColor: t.accent }]} />
//     </MotiView>
//   );

//   const Header = th === 'FUN'
//     ? FunHeader : th === 'MODERN'
//     ? ModernHeader : th === 'MINIMAL'
//     ? MinimalHeader : ClassicHeader;

//   const Empty = () => (
//     <View style={gh.empty}>
//       <Feather name="image" size={24} color={`${t.accent}50`} />
//       <Text style={[gh.emptyTxt, { color: t.muted }]}>No images yet</Text>
//     </View>
//   );

//   return (
//     <View style={[gh.wrap, { backgroundColor: t.bg }]}>
//       <Header />

//       {images.length === 0
//         ? <Empty />
//         : layout === 'carousel'
//           ? <GalleryCarouselPreview images={images} accent={t.accent} innerW={innerW} onTap={setLbIdx} />
//           : th === 'FUN'
//             ? <GalleryGridFun     images={images} accent={t.accent} innerW={innerW} onTap={setLbIdx} />
//             : th === 'MODERN'
//               ? <GalleryGridModern  images={images} innerW={innerW} onTap={setLbIdx} />
//               : th === 'MINIMAL'
//                 ? <GalleryGridMinimal images={images} innerW={innerW} onTap={setLbIdx} />
//                 : <GalleryGridClassic images={images} innerW={innerW} onTap={setLbIdx} />
//       }

//       {lbIdx !== null && (
//         <GalleryLightboxModal
//           images={images}
//           startIndex={lbIdx}
//           accent={t.accent}
//           onClose={() => setLbIdx(null)}
//         />
//       )}
//     </View>
//   );
// }

// /* ══════════════════════════════════════════════════════════════════
//    FUN — Neobrutalism exact match to web
//    Web:  grid-cols-2, gap-4 (16px), rounded-2xl (20px)
//          i%3===1 → aspectRatio 1/1.3 (portrait)
//          others  → aspectRatio 4/3   (landscape)
//          boxShadow: "4px 4px 0px var(--t-accent)"

//    React Native trick: render a solid accent View behind each cell,
//    offset 4px right + 4px down = neobrutalism shadow
// ══════════════════════════════════════════════════════════════════ */
// function GalleryGridFun({ images, accent, innerW, onTap }: {
//   images: string[]; accent: string; innerW: number; onTap: (i: number) => void;
// }) {
//   const GAP    = 16;                                          // web gap-4 = 16px
//   const COLS   = 2;
//   const SHADOW = 4;                                           // web: 4px offset
//   const RADIUS = 20;                                          // web: rounded-2xl

//   // Each cell needs SHADOW px of extra space so the shadow isn't clipped
//   const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);

//   const rows: string[][] = [];
//   for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));

//   return (
//     <View style={{ gap: GAP }}>
//       {rows.map((row, rowIdx) => (
//         <MotiView
//           key={rowIdx}
//           from={{ opacity: 0, translateY: 10 }}
//           animate={{ opacity: 1, translateY: 0 }}
//           transition={{ type: 'timing', duration: 280, delay: rowIdx * 70 }}
//           style={{ flexDirection: 'row', gap: GAP }}
//         >
//           {row.map((uri, colIdx) => {
//             const imgIdx     = rowIdx * 2 + colIdx;
//             const isPortrait = imgIdx % 3 === 1;              // web: i%3===1
//             const cellH      = isPortrait
//               ? Math.round(cellW * 1.3)                       // 1/1.3 portrait
//               : Math.round(cellW * 0.75);                     // 4/3 landscape

//             return (
//               /*
//                * Outer container gives room for the 4px shadow offset.
//                * We make it SHADOW px taller and wider than cellW/cellH,
//                * then position the shadow and the image card absolutely.
//                */
//               <Pressable
//                 key={colIdx}
//                 style={{
//                   width:  cellW + SHADOW,
//                   height: cellH + SHADOW,
//                   marginRight: -SHADOW,   // prevent row from being wider
//                   marginBottom: -SHADOW,
//                 }}
//                 onPress={() => onTap(imgIdx)}
//                 onLongPress={() => downloadImageToLibrary(uri)}
//                 delayLongPress={500}
//               >
//                 {/* Neobrutalism solid offset shadow */}
//                 <View
//                   style={{
//                     position:        'absolute',
//                     top:             SHADOW,
//                     left:            SHADOW,
//                     width:           cellW,
//                     height:          cellH,
//                     borderRadius:    RADIUS,
//                     backgroundColor: accent,
//                   }}
//                 />

//                 {/* Image card — sits on top, offset to top-left */}
//                 <View
//                   style={{
//                     position:        'absolute',
//                     top:             0,
//                     left:            0,
//                     width:           cellW,
//                     height:          cellH,
//                     borderRadius:    RADIUS,
//                     overflow:        'hidden',
//                     backgroundColor: '#e5e7eb',
//                   }}
//                 >
//                   <Image
//                     source={{ uri }}
//                     style={StyleSheet.absoluteFill}
//                     resizeMode="cover"
//                   />
//                   {/* Tap hint */}
//                   <View style={gh.tapHint} pointerEvents="none">
//                     <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.85)" />
//                   </View>
//                 </View>
//               </Pressable>
//             );
//           })}
//         </MotiView>
//       ))}
//     </View>
//   );
// }

// /* ══════════════════════════════════════════════════════════════════
//    MODERN — tight 3-col square grid, NO radius, gap 2px
//    Web: grid-cols-2 gap-0.5 sm:grid-cols-3 md:grid-cols-4
//         aspect-square (1:1), no border-radius
// ══════════════════════════════════════════════════════════════════ */
// function GalleryGridModern({ images, innerW, onTap }: {
//   images: string[]; innerW: number; onTap: (i: number) => void;
// }) {
//   const GAP  = 2;
//   const COLS = 3;
//   const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);

//   const rows: string[][] = [];
//   for (let i = 0; i < images.length; i += COLS) rows.push(images.slice(i, i + COLS));

//   return (
//     <View style={{ gap: GAP }}>
//       {rows.map((row, rowIdx) => (
//         <MotiView
//           key={rowIdx}
//           from={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ type: 'timing', duration: 220, delay: rowIdx * 30 }}
//           style={{ flexDirection: 'row', gap: GAP }}
//         >
//           {row.map((uri, colIdx) => (
//             <Pressable
//               key={colIdx}
//               style={[gh.cell, { width: cellW, height: cellW, borderRadius: 0 }]}
//               onPress={() => onTap(rowIdx * COLS + colIdx)}
//               onLongPress={() => downloadImageToLibrary(uri)}
//               delayLongPress={500}
//             >
//               <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
//               <View style={gh.tapHint} pointerEvents="none">
//                 <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.7)" />
//               </View>
//             </Pressable>
//           ))}
//         </MotiView>
//       ))}
//     </View>
//   );
// }

// /* ══════════════════════════════════════════════════════════════════
//    MINIMAL — 2-col, alternating 4:5 / 4:3, NO radius, gap 6
//    Web: grid-cols-2 gap-4, aspect-ratio i%2===0 ? "4/5" : "4/3"
// ══════════════════════════════════════════════════════════════════ */
// function GalleryGridMinimal({ images, innerW, onTap }: {
//   images: string[]; innerW: number; onTap: (i: number) => void;
// }) {
//   const GAP   = 16;
//   const COLS  = 2;
//   const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);

//   const rows: string[][] = [];
//   for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));

//   return (
//     <View style={{ gap: GAP }}>
//       {rows.map((row, rowIdx) => (
//         <MotiView
//           key={rowIdx}
//           from={{ opacity: 0, translateY: 8 }}
//           animate={{ opacity: 1, translateY: 0 }}
//           transition={{ type: 'timing', duration: 260, delay: rowIdx * 50 }}
//           style={{ flexDirection: 'row', gap: GAP }}
//         >
//           {row.map((uri, colIdx) => {
//             const imgIdx  = rowIdx * 2 + colIdx;
//             const cellH   = imgIdx % 2 === 0
//               ? Math.round(cellW * 1.25)   // 4:5 portrait
//               : Math.round(cellW * 0.75);  // 4:3 landscape
//             return (
//               <Pressable
//                 key={colIdx}
//                 style={[gh.cell, { width: cellW, height: cellH, borderRadius: 0 }]}
//                 onPress={() => onTap(imgIdx)}
//                 onLongPress={() => downloadImageToLibrary(uri)}
//                 delayLongPress={500}
//               >
//                 <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
//                 <View style={gh.tapHint} pointerEvents="none">
//                   <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.7)" />
//                 </View>
//               </Pressable>
//             );
//           })}
//         </MotiView>
//       ))}
//     </View>
//   );
// }

// /* ══════════════════════════════════════════════════════════════════
//    CLASSIC / ELEGANT / LUXURY — 2-col masonry alternating heights
//    Web: columns-2 gap-3, break-inside-avoid, varying aspect-ratios
// ══════════════════════════════════════════════════════════════════ */
// function GalleryGridClassic({ images, innerW, onTap }: {
//   images: string[]; innerW: number; onTap: (i: number) => void;
// }) {
//   const GAP   = 6;
//   const COLS  = 2;
//   const cellW = Math.floor((innerW - GAP * (COLS - 1)) / COLS);
//   // Masonry alternating heights — matches web's break-inside columns feel
//   const HEIGHTS = [
//     cellW * 1.1, cellW * 0.78,
//     cellW * 0.78, cellW * 1.1,
//     cellW * 0.95, cellW * 1.0,
//   ];

//   const rows: string[][] = [];
//   for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));

//   return (
//     <View style={{ gap: GAP }}>
//       {rows.map((row, rowIdx) => (
//         <MotiView
//           key={rowIdx}
//           from={{ opacity: 0, scale: 0.97 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ type: 'timing', duration: 270, delay: rowIdx * 45 }}
//           style={{ flexDirection: 'row', gap: GAP }}
//         >
//           {row.map((uri, colIdx) => {
//             const imgIdx = rowIdx * 2 + colIdx;
//             const cellH  = HEIGHTS[imgIdx % HEIGHTS.length];
//             return (
//               <Pressable
//                 key={colIdx}
//                 style={[gh.cell, { width: cellW, height: Math.round(cellH), borderRadius: 8 }]}
//                 onPress={() => onTap(imgIdx)}
//                 onLongPress={() => downloadImageToLibrary(uri)}
//                 delayLongPress={500}
//               >
//                 <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
//                 <View style={gh.tapHint} pointerEvents="none">
//                   <Feather name="maximize-2" size={9} color="rgba(255,255,255,0.7)" />
//                 </View>
//               </Pressable>
//             );
//           })}
//         </MotiView>
//       ))}
//     </View>
//   );
// }

// /* ══════════════════════════════════════════════════════════════════
//    CAROUSEL PREVIEW
// ══════════════════════════════════════════════════════════════════ */
// function GalleryCarouselPreview({ images, accent, innerW, onTap }: {
//   images: string[]; accent: string; innerW: number; onTap: (i: number) => void;
// }) {
//   const [current, setCurrent] = useState(0);
//   const scrollRef = useRef<ScrollView>(null);
//   const slideW = innerW;
//   const slideH = Math.round(innerW * 0.5625); // 16:9

//   const goTo = (idx: number) => {
//     const c = Math.max(0, Math.min(idx, images.length - 1));
//     scrollRef.current?.scrollTo({ x: c * slideW, animated: true });
//     setCurrent(c);
//   };

//   return (
//     <View>
//       <View style={{ borderRadius: 12, overflow: 'hidden' }}>
//         <ScrollView
//           ref={scrollRef}
//           horizontal
//           pagingEnabled
//           showsHorizontalScrollIndicator={false}
//           onMomentumScrollEnd={e => {
//             setCurrent(Math.round(e.nativeEvent.contentOffset.x / slideW));
//           }}
//         >
//           {images.map((uri, i) => (
//             <Pressable key={i} onPress={() => onTap(i)}>
//               <Image source={{ uri }} style={{ width: slideW, height: slideH }} resizeMode="cover" />
//             </Pressable>
//           ))}
//         </ScrollView>
//       </View>

//       {/* Arrows + dots */}
//       {images.length > 1 && (
//         <View style={gh.carouselNav}>
//           <Pressable
//             style={[gh.arrowBtn, current === 0 && { opacity: 0.3 }]}
//             onPress={() => goTo(current - 1)}
//             disabled={current === 0}
//           >
//             <Feather name="chevron-left" size={16} color="#fff" />
//           </Pressable>

//           <View style={gh.dots}>
//             {images.map((_, i) => (
//               <Pressable key={i} onPress={() => goTo(i)}>
//                 <View style={[
//                   gh.dot,
//                   {
//                     width: i === current ? 18 : 6,
//                     backgroundColor: i === current ? accent : `${accent}45`,
//                   },
//                 ]} />
//               </Pressable>
//             ))}
//           </View>

//           <Pressable
//             style={[gh.arrowBtn, current === images.length - 1 && { opacity: 0.3 }]}
//             onPress={() => goTo(current + 1)}
//             disabled={current === images.length - 1}
//           >
//             <Feather name="chevron-right" size={16} color="#fff" />
//           </Pressable>
//         </View>
//       )}
//     </View>
//   );
// }

// /* ══════════════════════════════════════════════════════════════════
//    LIGHTBOX MODAL
// ══════════════════════════════════════════════════════════════════ */
// function GalleryLightboxModal({ images, startIndex, accent, onClose }: {
//   images: string[]; startIndex: number; accent: string; onClose: () => void;
// }) {
//   const [current, setCurrent] = useState(startIndex);
//   const scrollRef              = useRef<ScrollView>(null);
//   const LW = SW;
//   const LH = SW * 1.1;

//   useEffect(() => {
//     setTimeout(() => {
//       scrollRef.current?.scrollTo({ x: startIndex * LW, animated: false });
//     }, 80);
//   }, []);

//   return (
//     <Modal visible transparent animationType="fade" onRequestClose={onClose}>
//       <View style={gh.lbRoot}>
//         {/* Close */}
//         <Pressable style={gh.lbClose} onPress={onClose} hitSlop={16}>
//           <Feather name="x" size={20} color="#fff" />
//         </Pressable>

//         {/* Counter */}
//         <Text style={gh.lbCounter}>{current + 1} / {images.length}</Text>

//         {/* Images */}
//         <ScrollView
//           ref={scrollRef}
//           horizontal pagingEnabled
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

//         {/* Dots */}
//         {images.length > 1 && images.length <= 15 && (
//           <View style={[gh.dots, { marginBottom: 36 }]}>
//             {images.map((_, i) => (
//               <View key={i} style={[
//                 gh.dot,
//                 { width: i === current ? 18 : 6, backgroundColor: i === current ? accent : 'rgba(255,255,255,0.3)' },
//               ]} />
//             ))}
//           </View>
//         )}
//       </View>
//     </Modal>
//   );
// }

// /* ── Gallery styles ──────────────────────────────────────────────── */
// const gh = StyleSheet.create({
//   wrap: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20, gap: 16 },

//   /* CLASSIC header */
//   eyebrow:  { fontSize: 9,  fontWeight: '500', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 },
//   heading:  { fontSize: 24, letterSpacing: 0, lineHeight: 30, marginBottom: 4 },
//   ornament: { height: 2, width: 32, borderRadius: 2, marginTop: 6 },

//   /* MODERN header */
//   modernBar:     { height: 2, width: 32, borderRadius: 2, marginBottom: 8 },
//   headingModern: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 },

//   /* MINIMAL header */
//   eyebrowMinimal: { fontSize: 8, fontWeight: '400', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 6 },
//   headingMinimal: { fontSize: 24, fontWeight: '300', letterSpacing: 0.5 },

//   /* FUN header — centered bold */
//   eyebrowFun: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2, textAlign: 'center' },
//   headingFun: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' },

//   /* Image cell (MODERN / MINIMAL / CLASSIC) */
//   cell: {
//     overflow:        'hidden',
//     backgroundColor: 'rgba(0,0,0,0.08)',
//   },
//   tapHint: {
//     position:        'absolute',
//     bottom:          6,
//     right:           6,
//     width:           20,
//     height:          20,
//     borderRadius:    10,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     alignItems:      'center',
//     justifyContent:  'center',
//   },

//   /* Empty */
//   empty:    { alignItems: 'center', justifyContent: 'center', height: 80, gap: 6 },
//   emptyTxt: { fontSize: 11 },

//   /* Carousel nav */
//   carouselNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
//   arrowBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
//   dots:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
//   dot:         { height: 6, borderRadius: 3 },

//   /* Lightbox */
//   lbRoot:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
//   lbClose:   { position: 'absolute', top: 56, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
//   lbCounter: { position: 'absolute', top: 64, alignSelf: 'center', fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
// });


// /* ── Image download helper ──────────────────────────────────────── */
// async function downloadImageToLibrary(uri: string) {
//   try {
//     const { status } = await MediaLibrary.requestPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission required', 'Allow photo library access to save images.');
//       return;
//     }
//     const filename = uri.split('/').pop()?.split('?')[0] ?? `img_${Date.now()}.jpg`;
//     const dest = new FSFile(Paths.cache, filename);
//     const res = await fetch(uri);
//     const buf = await res.arrayBuffer();
//     dest.write(new Uint8Array(buf));
//     await MediaLibrary.saveToLibraryAsync(dest.uri);
//     Alert.alert('Saved', 'Image saved to your photo library.');
//   } catch {
//     Alert.alert('Error', 'Could not save image. Please try again.');
//   }
// }

// /* ══════════════════════════════════════════════════════════════════
//    STORY / COUPLE / COUNTDOWN / VENUE / SPEAKERS / CTA / DONATIONS / REGISTRY
// ══════════════════════════════════════════════════════════════════ */
// function StoryBlock({ cfg, title, body, theme }: any) {
//   const t = theme as ThemeDef;
//   return (
//     <View style={[gen.wrap, { backgroundColor: t.bg, flexDirection: 'row' }]}>
//       <View style={[gen.storyBar, { backgroundColor: t.accent }]} />
//       <View style={{ flex: 1, paddingVertical: 18, paddingRight: 16, gap: 6 }}>
//         <Text style={[gen.title, { color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle }]}>
//           {title || 'Our Story'}
//         </Text>
//         <Text style={[gen.body, { color: t.muted }]} numberOfLines={3}>{body || 'Share the story behind this event.'}</Text>
//       </View>
//     </View>
//   );
// }

// function CoupleBlock({ cfg, theme }: any) {
//   const t = theme as ThemeDef;
//   const p1 = cfg.bride_name  || cfg.person1_name || 'Person 1';
//   const p2 = cfg.groom_name  || cfg.person2_name || 'Person 2';
//   const i1 = cfg.person1_image as string | undefined;
//   const i2 = cfg.person2_image as string | undefined;

//   return (
//     <View style={[gen.couple, { backgroundColor: t.bg }]}>
//       <CoupleAvatar img={i1} name={p1} accent={t.accent} />
//       <Text style={[gen.heart, { color: t.accent }]}>♥</Text>
//       <CoupleAvatar img={i2} name={p2} accent={t.accent} />
//     </View>
//   );
// }

// function CoupleAvatar({ img, name, accent, size = 56 }: any) {
//   const initials = (name as string).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
//   return (
//     <View style={[gen.avatar, { width: size, height: size, borderRadius: size/2, backgroundColor: `${accent}20`, borderColor: `${accent}50` }]}>
//       {img
//         ? <Image source={{ uri: img }} style={[StyleSheet.absoluteFill, { borderRadius: size/2 }]} resizeMode="cover" />
//         : <Text style={[gen.avatarTxt, { color: accent, fontSize: size * 0.28 }]}>{initials}</Text>
//       }
//     </View>
//   );
// }

// function CountdownBlock({ cfg, event, theme }: any) {
//   const t  = theme as ThemeDef;
//   const iso = cfg.event_date || cfg.starts_at || event?.starts_at_utc || event?.starts_at;
//   const [diff, setDiff] = useState(calcDiff(iso));
//   useEffect(() => {
//     if (!iso) return;
//     const timer = setInterval(() => setDiff(calcDiff(iso)), 1000);
//     return () => clearInterval(timer);
//   }, [iso]);

//   const units = [
//     { l: 'DAYS', v: diff?.d },
//     { l: 'HRS',  v: diff?.h },
//     { l: 'MIN',  v: diff?.m },
//     { l: 'SEC',  v: diff?.s },
//   ];

//   return (
//     <View style={[gen.wrap, { backgroundColor: t.bg, flexDirection: 'row', gap: 8, paddingVertical: 18 }]}>
//       {units.map(u => (
//         <View key={u.l} style={[gen.cntBox, { borderColor: `${t.accent}40`, backgroundColor: `${t.accent}12` }]}>
//           <Text style={[gen.cntNum, { color: t.accent }]}>{String(u.v ?? 0).padStart(2,'0')}</Text>
//           <Text style={[gen.cntLbl, { color: t.muted }]}>{u.l}</Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// function VenueBlock({ cfg, title, theme }: any) {
//   const t = theme as ThemeDef;
//   const name = cfg.venue_name || title || 'Venue';
//   const address = [cfg.venue_address, cfg.city].filter(Boolean).join(', ');
//   return (
//     <View style={[gen.wrap, { backgroundColor: t.bg, flexDirection: 'row', alignItems: 'center', paddingVertical: 20 }]}>
//       <View style={{ flex: 1, gap: 5 }}>
//         <Text style={[gen.title, { color: t.text, fontWeight: t.fontWeightHeading }]}>{name}</Text>
//         {address ? <Text style={[gen.body, { color: t.muted }]} numberOfLines={2}>{address}</Text> : null}
//       </View>
//       <View style={[gen.venueIcon, { backgroundColor: `${t.accent}18` }]}>
//         <Feather name="map-pin" size={22} color={t.accent} />
//       </View>
//     </View>
//   );
// }

// function SpeakersBlock({ cfg, theme }: any) {
//   const t = theme as ThemeDef;
//   const items: any[] = cfg.speakers || cfg.items || [];
//   return (
//     <View style={[gen.wrap, { backgroundColor: t.bg, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 18 }]}>
//       {items.length === 0
//         ? <Text style={[gen.body, { color: t.muted }]}>No speakers added</Text>
//         : items.slice(0, 4).map((spk: any, i: number) => (
//             <View key={i} style={{ alignItems: 'center', gap: 6 }}>
//               <View style={[gen.avatar, { width: 48, height: 48, borderRadius: 24, backgroundColor: `${t.accent}18`, borderColor: `${t.accent}50` }]}>
//                 {spk.image
//                   ? <Image source={{ uri: spk.image }} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} resizeMode="cover" />
//                   : <Feather name="user" size={18} color={t.accent} />
//                 }
//               </View>
//               <Text style={[gen.body, { color: t.muted, maxWidth: 60, textAlign: 'center' }]} numberOfLines={1}>{spk.name || `Speaker ${i+1}`}</Text>
//             </View>
//           ))
//       }
//     </View>
//   );
// }

// function CTABlock({ cfg, title, body, theme }: any) {
//   const t = theme as ThemeDef;
//   return (
//     <View style={[gen.wrap, { backgroundColor: t.bg, alignItems: 'center', paddingVertical: 24 }]}>
//       <Text style={[gen.title, { color: t.text, fontWeight: t.fontWeightHeading, fontStyle: t.headingStyle, textAlign: 'center' }]}>{title || 'Join us'}</Text>
//       {body ? <Text style={[gen.body, { color: t.muted, textAlign: 'center' }]} numberOfLines={2}>{body}</Text> : null}
//       <View style={[gen.btn, { backgroundColor: t.accent, marginTop: 10 }]}>
//         <Text style={gen.btnTxt}>{cfg.button_text || 'Get Started'}</Text>
//       </View>
//     </View>
//   );
// }

// function DonationsBlock({ cfg, title, theme }: any) {
//   const t = theme as ThemeDef;
//   return (
//     <View style={[gen.wrap, { backgroundColor: t.bg, alignItems: 'center', paddingVertical: 20 }]}>
//       <Text style={[gen.title, { color: t.text, textAlign: 'center' }]}>{title || 'Support This Event'}</Text>
//       <View style={[gen.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: t.accent, marginTop: 10 }]}>
//         <Feather name="heart" size={13} color={t.accent} />
//         <Text style={[gen.btnTxt, { color: t.accent }]}>Donate</Text>
//       </View>
//     </View>
//   );
// }

// function RegistryBlock({ cfg, title, theme }: any) {
//   const t = theme as ThemeDef;
//   const items: any[] = cfg.items || [];
//   return (
//     <View style={[gen.wrap, { backgroundColor: t.bg, paddingVertical: 18 }]}>
//       <Text style={[gen.title, { color: t.text }]}>{title || 'Registry'}</Text>
//       {items.slice(0, 2).map((item: any, i: number) => (
//         <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
//           <Feather name="external-link" size={12} color={t.accent} />
//           <Text style={[gen.body, { color: t.muted }]} numberOfLines={1}>{item.name || item.store || `Registry ${i+1}`}</Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// function GenericBlock({ title, body, theme, type }: any) {
//   const t = theme as ThemeDef;
//   const accent = BADGE_COLOR[type] ?? t.accent;
//   return (
//     <View style={[gen.wrap, { backgroundColor: t.bg, paddingVertical: 18 }]}>
//       <View style={[gen.accentBar, { backgroundColor: accent }]} />
//       <Text style={[gen.title, { color: t.text }]}>{title || type}</Text>
//       {body ? <Text style={[gen.body, { color: t.muted }]} numberOfLines={2}>{body}</Text> : null}
//     </View>
//   );
// }

// /* Shared generic styles */
// const gen = StyleSheet.create({
//   wrap:     { padding: 18, minHeight: 88 },
//   storyBar: { width: 4, borderRadius: 2, margin: 16 },
//   accentBar:{ height: 2, width: 36, borderRadius: 2, marginBottom: 8 },
//   title:    { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
//   body:     { fontSize: 12, lineHeight: 18 },
//   btn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 99 },
//   btnTxt:   { fontSize: 13, fontWeight: '800', color: '#fff' },
//   avatar:   { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
//   avatarTxt:{ fontWeight: '900' },
//   heart:    { fontSize: 24 },
//   couple:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 24 },
//   cntBox:   { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, gap: 3 },
//   cntNum:   { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
//   cntLbl:   { fontSize: 7, fontWeight: '800', letterSpacing: 1 },
//   venueIcon:{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
// });

// /* Root card styles */
// const r = StyleSheet.create({
//   card:    { overflow: 'hidden', position: 'relative' },
//   badge:   { position: 'absolute', top: 10, right: 10, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, zIndex: 3 },
//   badgeTxt:{ fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.8, textTransform: 'uppercase' },
//   ring:    { ...StyleSheet.absoluteFillObject, borderWidth: 2, zIndex: 4 },
//   hidden:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, zIndex: 5 },
//   hiddenTxt:{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
// });

