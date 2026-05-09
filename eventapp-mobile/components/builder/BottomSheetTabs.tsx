/**
 * eventapp-mobile/components/builder/BottomSheetTabs.tsx
 *
 * Pixel-exact match to web MobileBottomBar bottom tab bar (Image 1).
 *
 * Web layout:
 *   [N logomark]  [↩ undo]  |  [Style] [Add] [Layers]
 *
 * Key details from photo:
 *  - Left: "N" dark rounded square (Next.js logomark style) + undo arrow
 *  - Divider: 1px vertical rgba line
 *  - Tabs: Style / Add / Layers — each has icon + label
 *  - Active tab: indigo icon + label, small top-line indicator
 *  - NO "Edit" tab visible in bottom bar (web doesn't show it here)
 *  - NO redo button visible
 *  - Height: matches web h-16 = 64px
 *  - Background: #16181c, 1px top border
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type TabKey = 'style' | 'blocks' | 'layers' | 'edit' | null;

/* Only 3 tabs shown — matches web exactly */
const TABS: { id: TabKey; icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { id: 'style',  icon: 'sliders',     label: 'Style'  },
  { id: 'blocks', icon: 'plus-square', label: 'Add'    },
  { id: 'layers', icon: 'layers',      label: 'Layers' },
];

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
  canUndo, onUndo,
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

      {/* ── Style / Add / Layers tabs ───────────────────────────── */}
      <View style={s.tabGroup}>
        {TABS.map(({ id, icon, label }) => {
          const active = activeTab === id;
          return (
            <Pressable
              key={id!}
              style={[s.tab, active && s.tabActive]}
              onPress={() => onTabChange(active ? null : id)}
              hitSlop={4}
            >
              {/* Top indicator bar when active */}
              {active && <View style={s.indicator} />}

              <Feather
                name={icon}
                size={18}
                color={active ? '#6c6fee' : '#8b8f9a'}
              />
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>
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
    paddingHorizontal: 14,
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
