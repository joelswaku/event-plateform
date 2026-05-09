import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const CARD_BG = '#1e2026';
const BD      = 'rgba(255,255,255,0.07)';
const MUTED   = '#555a66';
const TEXT    = 'rgba(255,255,255,0.75)';
const ACC     = '#6c6fee';

const SECTION_ACCENT: Record<string, string> = {
  HERO: '#6c6fee', ABOUT: '#3ecf8e', GALLERY: '#f59e0b', FAQ: '#f43f5e',
  CTA: '#8b5cf6', SPEAKERS: '#06b6d4', VENUE: '#c9a96e', COUNTDOWN: '#ef4444',
  TICKETS: '#22c55e', COUPLE: '#ec4899', STORY: '#f97316', SCHEDULE: '#64748b',
  REGISTRY: '#a78bfa', DONATIONS: '#10b981',
};

interface Section {
  id: string;
  section_type: string;
  title?: string;
  body?: string;
  config?: Record<string, any>;
  is_visible?: boolean;
}

interface Props {
  section: Section;
  selected: boolean;
  event?: any;
}

export default function SectionPreviewCard({ section, selected, event }: Props) {
  const type   = section.section_type;
  const accent = SECTION_ACCENT[type] ?? ACC;
  const cfg    = section.config ?? {};

  return (
    <View style={[s.card, selected && { borderColor: accent, borderWidth: 2 }]}>
      {/* Color strip */}
      <View style={[s.strip, { backgroundColor: accent }]} />

      {/* Content */}
      <View style={s.body}>
        <SectionBody type={type} accent={accent} cfg={cfg} event={event} />
      </View>

      {/* Type label */}
      <View style={[s.typePill, { backgroundColor: accent + '20' }]}>
        <Text style={[s.typeLabel, { color: accent }]}>{type}</Text>
      </View>

      {/* Editing badge */}
      {selected && (
        <View style={[s.editBadge, { backgroundColor: accent }]}>
          <Text style={s.editTxt}>✏ EDITING</Text>
        </View>
      )}

      {/* Hidden overlay */}
      {section.is_visible === false && (
        <View style={s.hiddenOverlay}>
          <Text style={s.hiddenTxt}>👁 HIDDEN</Text>
        </View>
      )}
    </View>
  );
}

// ── Per-type previews ─────────────────────────────────────────────────────────

function SectionBody({ type, accent, cfg, event }: {
  type: string; accent: string; cfg: Record<string, any>; event?: any;
}) {
  if (type === 'HERO') {
    const bg = cfg.background_image as string | undefined;
    return (
      <View style={sh.heroWrap}>
        {bg
          ? <Image source={{ uri: bg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0e0f11' }]} />}
        <View style={sh.heroDark} />
        <View style={sh.heroContent}>
          <View style={[sh.bar, { width: '65%', backgroundColor: '#fff', opacity: 0.85 }]} />
          <View style={[sh.bar, { width: '42%', backgroundColor: accent, marginTop: 5 }]} />
          <View style={[sh.btnPlaceholder, { backgroundColor: accent, marginTop: 10 }]} />
        </View>
      </View>
    );
  }

  if (type === 'COUNTDOWN') {
    const iso = cfg.event_date || cfg.starts_at || event?.starts_at_utc;
    const diff = iso ? Math.max(0, new Date(iso).getTime() - Date.now()) : 0;
    const days = iso ? Math.floor(diff / 86400000) : '--';
    const hrs  = iso ? Math.floor((diff % 86400000) / 3600000) : '--';
    const min  = iso ? Math.floor((diff % 3600000) / 60000) : '--';
    const sec  = iso ? Math.floor((diff % 60000) / 1000) : '--';
    return (
      <View style={sh.cntWrap}>
        {[{ v: days, l: 'DAYS' }, { v: hrs, l: 'HRS' }, { v: min, l: 'MIN' }, { v: sec, l: 'SEC' }].map(it => (
          <View key={it.l} style={[sh.cntBox, { backgroundColor: accent + '14', borderColor: accent + '35' }]}>
            <Text style={[sh.cntNum, { color: accent }]}>
              {typeof it.v === 'number' ? String(it.v).padStart(2, '0') : it.v}
            </Text>
            <Text style={sh.cntLbl}>{it.l}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'GALLERY') {
    const imgs: string[] = cfg.images ?? [];
    return (
      <View style={sh.galleryGrid}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View key={i} style={sh.galleryCell}>
            {imgs[i]
              ? <Image source={{ uri: imgs[i] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : <View style={[StyleSheet.absoluteFill, { backgroundColor: accent + '18' }]} />}
          </View>
        ))}
      </View>
    );
  }

  if (type === 'VENUE') {
    return (
      <View style={sh.venueRow}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={sh.venueTitle} numberOfLines={1}>{cfg.venue_name || cfg.name || 'Venue'}</Text>
          <Placeholder w="70%" />
          <Placeholder w="55%" />
        </View>
        <View style={[sh.venueIcon, { backgroundColor: accent + '20' }]}>
          <Text style={{ fontSize: 20 }}>📍</Text>
        </View>
      </View>
    );
  }

  if (type === 'SCHEDULE') {
    return (
      <View style={sh.schedWrap}>
        {[0, 1, 2].map(i => (
          <View key={i} style={sh.schedRow}>
            <View style={[sh.schedDot, { backgroundColor: i === 0 ? accent : MUTED + '66' }]} />
            <View style={[sh.schedLine, { width: `${55 + i * 12}%` }]} />
          </View>
        ))}
      </View>
    );
  }

  if (type === 'SPEAKERS') {
    return (
      <View style={sh.speakersRow}>
        {[0, 1, 2].map(i => (
          <View key={i} style={sh.speakerItem}>
            <View style={[sh.speakerAvatar, { backgroundColor: accent + '20', borderColor: accent + '40' }]} />
            <Placeholder w="80%" />
          </View>
        ))}
      </View>
    );
  }

  if (type === 'TICKETS') {
    return (
      <View style={sh.ticketsRow}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[sh.ticket, { borderColor: accent + '50', backgroundColor: accent + '0c' }]}>
            <Text style={{ fontSize: 14 }}>🎟</Text>
            <Placeholder w="70%" />
          </View>
        ))}
      </View>
    );
  }

  if (type === 'COUPLE') {
    return (
      <View style={sh.coupleRow}>
        <View style={[sh.coupleAvatar, { backgroundColor: accent + '20' }]}>
          <Text style={{ fontSize: 18 }}>👤</Text>
        </View>
        <Text style={[sh.coupleHeart, { color: accent }]}>♥</Text>
        <View style={[sh.coupleAvatar, { backgroundColor: accent + '20' }]}>
          <Text style={{ fontSize: 18 }}>👤</Text>
        </View>
      </View>
    );
  }

  // Generic fallback: ABOUT, FAQ, CTA, STORY, REGISTRY, DONATIONS, etc.
  return (
    <View style={sh.generic}>
      <View style={[sh.accentBar, { backgroundColor: accent }]} />
      <Placeholder w="85%" />
      <Placeholder w="68%" />
      <Placeholder w="74%" />
    </View>
  );
}

function Placeholder({ w }: { w: string }) {
  return <View style={[sh.placeholderLine, { width: w as any }]} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    borderRadius: 14, borderWidth: 1, borderColor: BD,
    backgroundColor: CARD_BG, overflow: 'hidden',
    flexDirection: 'row', position: 'relative',
  },
  strip:     { width: 3 },
  body:      { flex: 1 },
  typePill:  { position: 'absolute', top: 7, right: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  typeLabel: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  editBadge: { position: 'absolute', top: 7, left: 10, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  editTxt:   { fontSize: 8, fontWeight: '900', color: '#fff' },
  hiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  hiddenTxt: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
});

const sh = StyleSheet.create({
  // Hero
  heroWrap:    { height: 160, justifyContent: 'flex-end' },
  heroDark:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)' },
  heroContent: { padding: 14 },
  bar:         { height: 5, borderRadius: 3 },
  btnPlaceholder: { height: 22, width: 80, borderRadius: 6 },

  // Countdown
  cntWrap: { flexDirection: 'row', gap: 8, padding: 14 },
  cntBox:  { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, gap: 2 },
  cntNum:  { fontSize: 20, fontWeight: '900' },
  cntLbl:  { fontSize: 7, fontWeight: '800', color: MUTED, letterSpacing: 1 },

  // Gallery
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 6, gap: 3, height: 120 },
  galleryCell: { width: '31.5%', aspectRatio: 1, borderRadius: 4, overflow: 'hidden' },

  // Venue
  venueRow:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, minHeight: 90 },
  venueTitle: { fontSize: 12, fontWeight: '700', color: TEXT, marginBottom: 3 },
  venueIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Schedule
  schedWrap: { padding: 14, gap: 12, minHeight: 90 },
  schedRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  schedDot:  { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  schedLine: { height: 3, borderRadius: 2, backgroundColor: MUTED, opacity: 0.35 },

  // Speakers
  speakersRow:   { flexDirection: 'row', justifyContent: 'space-around', padding: 14, minHeight: 100 },
  speakerItem:   { alignItems: 'center', gap: 6 },
  speakerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1 },

  // Tickets
  ticketsRow: { flexDirection: 'row', gap: 8, padding: 14, minHeight: 90 },
  ticket:     { flex: 1, borderRadius: 8, borderWidth: 1, padding: 10, alignItems: 'center', gap: 6 },

  // Couple
  coupleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 20, minHeight: 100 },
  coupleAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  coupleHeart:  { fontSize: 22 },

  // Generic
  generic:         { padding: 14, gap: 7, minHeight: 90 },
  accentBar:       { height: 3, width: '45%', borderRadius: 2, marginBottom: 4 },
  placeholderLine: { height: 4, borderRadius: 2, backgroundColor: MUTED, opacity: 0.3 },
});
