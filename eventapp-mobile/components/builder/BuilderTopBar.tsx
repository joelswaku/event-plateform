/**
 * eventapp-mobile/components/builder/BuilderTopBar.tsx
 *
 * Pixel-exact match to the web builder small-viewport top bar.
 *
 * Web layout (Image 1):
 *   [←]  [MY EVE ...........]  [⊞]  [↑ blue-circle]
 *
 * Key details from photo:
 *  - Background: #16181c
 *  - Back btn:   small ghost square, chevron-left icon
 *  - Title:      white, medium weight, truncates
 *  - Templates:  2×2 grid icon (⊞), ghost square, NO label
 *  - Publish:    solid indigo circle/pill, upload arrow only (NO text on small screen)
 *  - NO save badge visible in topbar (matches web — it's hidden on small)
 *  - Height: 48px tight bar (web is h-14 = 56px but rendered smaller in viewport)
 */

import React from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Feather }        from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter }      from 'expo-router';

const BG  = '#16181c';
const BD  = 'rgba(255,255,255,0.07)';
const ACC = '#6c6fee';   // indigo — matches web #6c6fee

/* ── 2×2 grid icon — exact match to web ⊞ templatespicker button ── */
function GridIcon({ color = '#f0f1f3' }: { color?: string }) {
  return (
    <View style={{ gap: 3 }}>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        <View style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: color, opacity: 0.9 }} />
        <View style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: color, opacity: 0.55 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        <View style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: color, opacity: 0.55 }} />
        <View style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: color, opacity: 0.25 }} />
      </View>
    </View>
  );
}

interface Props {
  eventId:        string;
  saveStatus:     'idle' | 'saving' | 'saved' | 'error';
  onTemplates:    () => void;
  onPublish:      () => void;
  publishLoading?: boolean;
  eventTitle?:    string;
}

export default function BuilderTopBar({
  eventId, saveStatus, onTemplates, onPublish, publishLoading, eventTitle,
}: Props) {
  const router = useRouter();

  return (
    <View style={s.bar}>

      {/* ── Left: back arrow ───────────────────────────────────────── */}
      <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={10}>
        <Feather name="chevron-left" size={20} color="#8b8f9a" />
      </Pressable>

      {/* ── Title ──────────────────────────────────────────────────── */}
      <Text style={s.title} numberOfLines={1}>
        {eventTitle || 'Page Builder'}
      </Text>

      {/* ── Right: templates grid + publish circle ─────────────────── */}
      <View style={s.right}>

        {/* Templates — ghost square with 2×2 grid icon */}
        <Pressable style={s.ghostBtn} onPress={onTemplates} hitSlop={8}>
          <GridIcon color="#f0f1f3" />
        </Pressable>

        {/* Publish — solid indigo circle/pill, arrow icon only */}
        <Pressable
          style={[s.publishBtn, publishLoading && { opacity: 0.65 }]}
          onPress={onPublish}
          disabled={publishLoading}
          hitSlop={4}
        >
          <LinearGradient
            colors={[ACC, ACC]}
            style={StyleSheet.absoluteFill}
          />
          {publishLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Feather name="arrow-up" size={16} color="#fff" />
          }
        </Pressable>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    height:            52,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 10,
    backgroundColor:   BG,
    borderBottomWidth: 1,
    borderBottomColor: BD,
    gap:               8,
  },

  /* Back button — minimal, no border */
  backBtn: {
    width:           34,
    height:          34,
    borderRadius:    8,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexShrink:      0,
  },

  /* Title — flex 1 so it takes remaining space and truncates */
  title: {
    flex:         1,
    fontSize:     14,
    fontWeight:   '600',
    color:        'rgba(255,255,255,0.88)',
    letterSpacing: -0.1,
  },

  /* Right group */
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    flexShrink:    0,
  },

  /* Ghost square — templates */
  ghostBtn: {
    width:           36,
    height:          36,
    borderRadius:    9,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth:     1,
    borderColor:     BD,
    alignItems:      'center',
    justifyContent:  'center',
  },

  /* Publish — solid indigo, rounded, icon only */
  publishBtn: {
    width:          44,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
});





// /**
//  * eventapp-mobile/components/builder/BuilderTopBar.tsx
//  *
//  * REBUILT — matches web BuilderTopbar small-viewport layout exactly:
//  *
//  *   [← back]  [Event Title .............]  [Saved ✓]  [⊞ Templates]  [↑ Publish]
//  *
//  * Pixel-for-pixel match with the web screenshot:
//  *   - Dark bg #16181c, 1px bottom border rgba(255,255,255,0.07)
//  *   - Back:      34×34 rounded-10 ghost button
//  *   - Title:     truncated, 13px semibold white/85
//  *   - Save badge: "Saved ✓" green / "Saving…" gray / "Error" red
//  *   - Templates: icon-only 34×34 ghost button with gold border
//  *   - Publish:   indigo pill with upload icon + "Publish" label
//  */

// import React from 'react';
// import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
// import { Feather }        from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useRouter }      from 'expo-router';

// /* ── Constants (identical to web) ─────────────────────────────────── */
// const BG  = '#16181c';
// const BD  = 'rgba(255,255,255,0.07)';
// const GLD = '#c9a96e';
// const ACC = '#6c6fee';

// interface Props {
//   eventId:        string;
//   saveStatus:     'idle' | 'saving' | 'saved' | 'error';
//   onTemplates:    () => void;
//   onPublish:      () => void;
//   publishLoading?: boolean;
//   eventTitle?:    string;
// }

// function SaveBadge({ status }: { status: Props['saveStatus'] }) {
//   if (status === 'idle') return null;
//   const cfg = {
//     saving: { label: 'Saving…', color: '#8b8f9a' },
//     saved:  { label: 'Saved ✓', color: '#3ecf8e' },
//     error:  { label: 'Error ✕', color: '#f87171' },
//   }[status];
//   return (
//     <Text style={{ fontSize: 11, fontWeight: '600', color: cfg.color }}>
//       {cfg.label}
//     </Text>
//   );
// }

// export default function BuilderTopBar({
//   eventId, saveStatus, onTemplates, onPublish, publishLoading, eventTitle,
// }: Props) {
//   const router = useRouter();

//   return (
//     <View style={s.bar}>

//       {/* ── Left: back + title ──────────────────────────────────── */}
//       <View style={s.left}>
//         <Pressable
//           style={s.iconBtn}
//           onPress={() => router.back()}
//           hitSlop={10}
//         >
//           <Feather name="arrow-left" size={16} color="#8b8f9a" />
//         </Pressable>

//         <Text style={s.title} numberOfLines={1}>
//           {eventTitle || 'Page Builder'}
//         </Text>
//       </View>

//       {/* ── Center: save status ─────────────────────────────────── */}
//       <SaveBadge status={saveStatus} />

//       {/* ── Right: templates + publish ──────────────────────────── */}
//       <View style={s.right}>

//         {/* Templates — gold-bordered icon button */}
//         <Pressable style={s.templatesBtn} onPress={onTemplates} hitSlop={8}>
//           <Feather name="layout" size={15} color={GLD} />
//         </Pressable>

//         {/* Publish — indigo gradient pill */}
//         <Pressable
//           style={[s.publishBtn, publishLoading && { opacity: 0.65 }]}
//           onPress={onPublish}
//           disabled={publishLoading}
//           hitSlop={4}
//         >
//           <LinearGradient
//             colors={[ACC, '#8b5cf6']}
//             start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//             style={StyleSheet.absoluteFill}
//           />
//           {publishLoading
//             ? <ActivityIndicator size="small" color="#fff" />
//             : <Feather name="upload" size={13} color="#fff" />
//           }
//           <Text style={s.publishTxt}>Publish</Text>
//         </Pressable>

//       </View>
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   bar: {
//     height:            56,
//     flexDirection:     'row',
//     alignItems:        'center',
//     paddingHorizontal: 10,
//     backgroundColor:   BG,
//     borderBottomWidth: 1,
//     borderBottomColor: BD,
//     gap:               8,
//   },

//   left: {
//     flexDirection: 'row',
//     alignItems:    'center',
//     gap:           8,
//     flex:          1,
//     minWidth:      0,
//   },

//   iconBtn: {
//     width:           34,
//     height:          34,
//     borderRadius:    10,
//     backgroundColor: 'rgba(255,255,255,0.06)',
//     borderWidth:     1,
//     borderColor:     BD,
//     alignItems:      'center',
//     justifyContent:  'center',
//     flexShrink:      0,
//   },

//   title: {
//     fontSize:     13,
//     fontWeight:   '700',
//     color:        'rgba(255,255,255,0.85)',
//     flex:         1,
//   },

//   right: {
//     flexDirection: 'row',
//     alignItems:    'center',
//     gap:           8,
//     flexShrink:    0,
//   },

//   /* Templates — icon-only with gold border */
//   templatesBtn: {
//     width:           34,
//     height:          34,
//     borderRadius:    10,
//     backgroundColor: 'rgba(255,255,255,0.06)',
//     borderWidth:     1,
//     borderColor:     `${GLD}40`,
//     alignItems:      'center',
//     justifyContent:  'center',
//   },

//   /* Publish pill */
//   publishBtn: {
//     height:          34,
//     paddingHorizontal: 12,
//     borderRadius:    10,
//     flexDirection:   'row',
//     alignItems:      'center',
//     gap:             5,
//     overflow:        'hidden',
//   },
//   publishTxt: {
//     fontSize:   12,
//     fontWeight: '800',
//     color:      '#fff',
//   },
// });



