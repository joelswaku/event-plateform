/**
 * eventapp-mobile/components/builder/BottomSheetTabs.tsx
 *
 * Pixel-exact match to web MobileBottomBar bottom tab bar (Image 1).
 *
 * Web layout:
 *   [N logomark]  [↩ undo]  |  [Style] [Add] [Layers] [Edit]
 *
 * Key details from photo:
 *  - Left: "N" dark rounded square (Next.js logomark style) + undo arrow
 *  - Divider: 1px vertical rgba line
 *  - Tabs: Style / Add / Layers / Edit — each has icon + label
 *  - Active tab: indigo icon + label, small top-line indicator
 *  - Edit stays disabled until a section is selected, matching web mobile.
 *  - NO redo button visible
 *  - Height: matches web h-16 = 64px
 *  - Background: #16181c, 1px top border
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

export type TabKey = 'style' | 'blocks' | 'layers' | 'edit' | null;
type BuilderTab = Exclude<TabKey, null>;

const TABS: { id: BuilderTab; label: string }[] = [
  { id: 'style',  label: 'Style'  },
  { id: 'blocks', label: 'Add'    },
  { id: 'layers', label: 'Layers' },
  { id: 'edit',   label: 'Edit'   },
];

// Exact SVG paths from web mobile's Heroicons: Swatch, Squares2X2,
// ListBullet, and PencilSquare. This keeps the two Builder toolbars aligned.
const TAB_ICON_PATHS: Record<BuilderTab, string> = {
  style: 'M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z',
  blocks: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  layers: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
  edit: 'm16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10',
};

function BuilderTabIcon({ tab, color, faded }: { tab: BuilderTab; color: string; faded: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" opacity={faded ? 0.45 : 1}>
      <Path d={TAB_ICON_PATHS[tab]} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface Props {
  activeTab:    TabKey;
  onTabChange:  (t: TabKey) => void;
  hasSelection: boolean;
  canUndo:      boolean;
  canRedo:      boolean;
  onUndo:       () => void;
  onRedo:       () => void;
}

/* ── "N" logomark — matches the web bottom bar left icon ─────────── */
function LogoMark() {
  return (
    <View style={logo.wrap}>
      {/* Dark rounded square */}
      <View style={logo.square}>
        <Text style={logo.letter}>N</Text>
      </View>
    </View>
  );
}

export default function BottomSheetTabs({
  activeTab, onTabChange,
  hasSelection, canUndo, onUndo,
}: Props) {
  return (
    <View style={s.bar}>

      {/* ── Left: N logo + undo ─────────────────────────────────── */}
      <View style={s.leftGroup}>
        <LogoMark />

        <Pressable
          style={s.undoBtn}
          onPress={onUndo}
          disabled={!canUndo}
          hitSlop={8}
        >
          {/* Curved undo arrow — matches web SVG undo icon */}
          <Feather
            name="rotate-ccw"
            size={16}
            color={canUndo ? '#8b8f9a' : '#2e3038'}
          />
        </Pressable>
      </View>

      {/* ── Vertical divider ────────────────────────────────────── */}
      <View style={s.vDivider} />

      {/* ── Style / Add / Layers / Edit tabs ────────────────────── */}
      <View style={s.tabGroup}>
        {TABS.map(({ id, label }) => {
          const active = activeTab === id;
          const disabled = id === 'edit' && !hasSelection;
          const iconColor = disabled ? '#3c404b' : active ? '#6c6fee' : '#8b8f9a';
          return (
            <Pressable
              key={id!}
              style={[s.tab, active && s.tabActive]}
              onPress={() => !disabled && onTabChange(active ? null : id)}
              disabled={disabled}
              hitSlop={4}
            >
              {/* Top indicator bar when active */}
              {active && <View style={s.indicator} />}

              <BuilderTabIcon tab={id} color={iconColor} faded={disabled} />
              <Text style={[s.tabLabel, active && s.tabLabelActive, disabled && s.tabLabelDisabled]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

    </View>
  );
}

/* ── Logo styles ─────────────────────────────────────────────────── */
const logo = StyleSheet.create({
  wrap:   { alignItems: 'center', justifyContent: 'center' },
  square: {
    width:           34,
    height:          34,
    borderRadius:    9,
    backgroundColor: '#1e2026',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.10)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  letter: {
    fontSize:   14,
    fontWeight: '900',
    color:      '#f0f1f3',
    letterSpacing: -0.5,
  },
});

/* ── Main styles ─────────────────────────────────────────────────── */
const s = StyleSheet.create({
  bar: {
    height:            64,
    backgroundColor:   '#16181c',
    borderTopWidth:    1,
    borderTopColor:    'rgba(255,255,255,0.07)',
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 12,
    gap:               0,
  },

  /* Left group: logo + undo */
  leftGroup: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    paddingRight:  4,
  },
  undoBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   9,
  },

  /* Vertical divider */
  vDivider: {
    width:           1,
    height:          22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 8,
  },

  /* Tabs */
  tabGroup: {
    flexDirection:  'row',
    alignItems:     'center',
    flex:           1,
    justifyContent: 'space-around',
  },
  tab: {
    alignItems:      'center',
    justifyContent:  'center',
    gap:             3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius:    10,
    position:        'relative',
    minWidth:        56,
  },
  tabActive: {
    backgroundColor: 'rgba(108,111,238,0.12)',
  },

  /* Top indicator — thin indigo line at top of active tab */
  indicator: {
    position:        'absolute',
    top:             0,
    alignSelf:       'center',
    width:           24,
    height:          2,
    borderRadius:    2,
    backgroundColor: '#6c6fee',
  },

  tabLabel: {
    fontSize:      10,
    fontWeight:    '600',
    color:         '#8b8f9a',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color:      '#6c6fee',
    fontWeight: '700',
  },
  tabLabelDisabled: { color: '#3c404b', opacity: 0.6 },
});






// /**
//  * eventapp-mobile/components/builder/BottomSheetTabs.tsx
//  *
//  * REBUILT — matches web MobileBottomBar bottom tab bar exactly:
//  *   [↩ Undo] [↪ Redo]  |  [Style] [Add] [Layers] [Edit]
//  *
//  * Uses Feather icons instead of emoji.
//  * Active tab gets indigo top-indicator + indigo bg pill.
//  */

// import React from 'react';
// import { View, Text, Pressable, StyleSheet } from 'react-native';
// import { Feather } from '@expo/vector-icons';

// export type TabKey = 'style' | 'blocks' | 'layers' | 'edit' | null;

// const TABS: { id: TabKey; icon: keyof typeof Feather.glyphMap; label: string }[] = [
//   { id: 'style',  icon: 'sliders',     label: 'Style'  },
//   { id: 'blocks', icon: 'plus-square', label: 'Add'    },
//   { id: 'layers', icon: 'layers',      label: 'Layers' },
//   { id: 'edit',   icon: 'edit-2',      label: 'Edit'   },
// ];

// interface Props {
//   activeTab:    TabKey;
//   onTabChange:  (t: TabKey) => void;
//   hasSelection: boolean;
//   canUndo:      boolean;
//   canRedo:      boolean;
//   onUndo:       () => void;
//   onRedo:       () => void;
// }

// export default function BottomSheetTabs({
//   activeTab, onTabChange,
//   hasSelection,
//   canUndo, canRedo, onUndo, onRedo,
// }: Props) {
//   return (
//     <View style={s.bar}>

//       {/* ── Undo / Redo ─────────────────────────────────────────── */}
//       <View style={s.undoGroup}>
//         <Pressable
//           style={s.undoBtn}
//           onPress={onUndo}
//           disabled={!canUndo}
//           hitSlop={8}
//         >
//           <Feather
//             name="corner-up-left"
//             size={17}
//             color={canUndo ? '#8b8f9a' : '#2e3038'}
//           />
//         </Pressable>
//         <Pressable
//           style={s.undoBtn}
//           onPress={onRedo}
//           disabled={!canRedo}
//           hitSlop={8}
//         >
//           <Feather
//             name="corner-up-right"
//             size={17}
//             color={canRedo ? '#8b8f9a' : '#2e3038'}
//           />
//         </Pressable>
//       </View>

//       {/* ── Divider ─────────────────────────────────────────────── */}
//       <View style={s.sep} />

//       {/* ── Style / Add / Layers / Edit ─────────────────────────── */}
//       <View style={s.tabGroup}>
//         {TABS.map(({ id, icon, label }) => {
//           const active   = activeTab === id;
//           const disabled = id === 'edit' && !hasSelection;
//           const iconColor = disabled ? '#2e3038'
//             : active    ? '#6c6fee'
//             : '#8b8f9a';

//           return (
//             <Pressable
//               key={id!}
//               style={[s.tab, active && s.tabActive]}
//               onPress={() => !disabled && onTabChange(active ? null : id)}
//               disabled={disabled}
//               hitSlop={4}
//             >
//               {/* Top indicator bar */}
//               {active && <View style={s.indicator} />}

//               <Feather
//                 name={icon}
//                 size={17}
//                 color={iconColor}
//                 style={{ opacity: disabled ? 0.3 : 1 }}
//               />
//               <Text style={[
//                 s.tabLabel,
//                 { color: iconColor, opacity: disabled ? 0.3 : 1 },
//               ]}>
//                 {label}
//               </Text>
//             </Pressable>
//           );
//         })}
//       </View>

//     </View>
//   );
// }

// const s = StyleSheet.create({
//   bar: {
//     height:             62,
//     backgroundColor:    '#16181c',
//     borderTopWidth:     1,
//     borderTopColor:     'rgba(255,255,255,0.07)',
//     flexDirection:      'row',
//     alignItems:         'center',
//     paddingHorizontal:  10,
//     gap:                4,
//   },

//   /* Undo / redo */
//   undoGroup: { flexDirection: 'row', alignItems: 'center', gap: 2 },
//   undoBtn: {
//     width:  38,
//     height: 38,
//     alignItems:     'center',
//     justifyContent: 'center',
//     borderRadius:   10,
//   },

//   /* Divider */
//   sep: {
//     width:           1,
//     height:          20,
//     backgroundColor: 'rgba(255,255,255,0.08)',
//     marginHorizontal: 4,
//   },

//   /* Tabs */
//   tabGroup: {
//     flexDirection:  'row',
//     alignItems:     'center',
//     flex:           1,
//     justifyContent: 'center',
//     gap:            2,
//   },
//   tab: {
//     alignItems:      'center',
//     justifyContent:  'center',
//     gap:             3,
//     paddingVertical: 5,
//     paddingHorizontal: 10,
//     borderRadius:    10,
//     position:        'relative',
//   },
//   tabActive: {
//     backgroundColor: 'rgba(108,111,238,0.14)',
//   },

//   /* Active top-line indicator — mirrors web */
//   indicator: {
//     position:        'absolute',
//     top:             0,
//     alignSelf:       'center',
//     width:           26,
//     height:          2,
//     borderRadius:    2,
//     backgroundColor: '#6c6fee',
//   },

//   tabLabel: {
//     fontSize:      9.5,
//     fontWeight:    '700',
//     letterSpacing: 0.15,
//   },
// });











// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// export type TabKey = 'style' | 'blocks' | 'layers' | 'edit' | null;

// const TABS = [
//   { id: 'style'  as TabKey, label: 'Style',  icon: '🎨' },
//   { id: 'blocks' as TabKey, label: 'Add',    icon: '＋' },
//   { id: 'layers' as TabKey, label: 'Layers', icon: '☰'  },
//   { id: 'edit'   as TabKey, label: 'Edit',   icon: '✏'  },
// ];

// interface Props {
//   activeTab: TabKey;
//   onTabChange: (t: TabKey) => void;
//   hasSelection: boolean;
//   canUndo: boolean;
//   canRedo: boolean;
//   onUndo: () => void;
//   onRedo: () => void;
// }

// export default function BottomSheetTabs({ activeTab, onTabChange, hasSelection, canUndo, canRedo, onUndo, onRedo }: Props) {
//   return (
//     <View style={s.bar}>
//       <View style={s.undoGroup}>
//         <TouchableOpacity style={s.undoBtn} onPress={onUndo} disabled={!canUndo} activeOpacity={0.7}>
//           <Text style={[s.undoIcon, { color: canUndo ? '#8b8f9a' : '#333640' }]}>↩</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={s.undoBtn} onPress={onRedo} disabled={!canRedo} activeOpacity={0.7}>
//           <Text style={[s.undoIcon, { color: canRedo ? '#8b8f9a' : '#333640' }]}>↪</Text>
//         </TouchableOpacity>
//       </View>
//       <View style={s.tabGroup}>
//         {TABS.map(({ id, label, icon }) => {
//           const active   = activeTab === id;
//           const disabled = id === 'edit' && !hasSelection;
//           return (
//             <TouchableOpacity
//               key={id!}
//               style={[s.tab, active && s.tabActive]}
//               onPress={() => !disabled && onTabChange(active ? null : id)}
//               disabled={disabled}
//               activeOpacity={0.7}
//             >
//               {active && <View style={s.indicator} />}
//               <Text style={[s.tabIcon, { color: disabled ? '#333640' : active ? '#6c6fee' : '#8b8f9a', opacity: disabled ? 0.4 : 1 }]}>{icon}</Text>
//               <Text style={[s.tabLabel, { color: disabled ? '#333640' : active ? '#6c6fee' : '#8b8f9a', opacity: disabled ? 0.4 : 1 }]}>{label}</Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   bar:       { height: 64, backgroundColor: '#16181c', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, justifyContent: 'space-between' },
//   undoGroup: { flexDirection: 'row', gap: 2 },
//   undoBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
//   undoIcon:  { fontSize: 18 },
//   tabGroup:  { flexDirection: 'row', gap: 2 },
//   tab:       { alignItems: 'center', justifyContent: 'center', gap: 1, minWidth: 52, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10, position: 'relative' },
//   tabActive: { backgroundColor: 'rgba(108,111,238,0.15)' },
//   indicator: { position: 'absolute', top: 0, height: 2, width: 28, borderRadius: 2, backgroundColor: '#6c6fee' },
//   tabIcon:   { fontSize: 16 },
//   tabLabel:  { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
// });
