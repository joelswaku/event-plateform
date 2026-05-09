import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type TabKey = 'style' | 'blocks' | 'layers' | 'edit' | null;

const TABS = [
  { id: 'style'  as TabKey, label: 'Style',  icon: '🎨' },
  { id: 'blocks' as TabKey, label: 'Add',    icon: '＋' },
  { id: 'layers' as TabKey, label: 'Layers', icon: '☰'  },
  { id: 'edit'   as TabKey, label: 'Edit',   icon: '✏'  },
];

interface Props {
  activeTab: TabKey;
  onTabChange: (t: TabKey) => void;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function BottomSheetTabs({ activeTab, onTabChange, hasSelection, canUndo, canRedo, onUndo, onRedo }: Props) {
  return (
    <View style={s.bar}>
      <View style={s.undoGroup}>
        <TouchableOpacity style={s.undoBtn} onPress={onUndo} disabled={!canUndo} activeOpacity={0.7}>
          <Text style={[s.undoIcon, { color: canUndo ? '#8b8f9a' : '#333640' }]}>↩</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.undoBtn} onPress={onRedo} disabled={!canRedo} activeOpacity={0.7}>
          <Text style={[s.undoIcon, { color: canRedo ? '#8b8f9a' : '#333640' }]}>↪</Text>
        </TouchableOpacity>
      </View>
      <View style={s.tabGroup}>
        {TABS.map(({ id, label, icon }) => {
          const active   = activeTab === id;
          const disabled = id === 'edit' && !hasSelection;
          return (
            <TouchableOpacity
              key={id!}
              style={[s.tab, active && s.tabActive]}
              onPress={() => !disabled && onTabChange(active ? null : id)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              {active && <View style={s.indicator} />}
              <Text style={[s.tabIcon, { color: disabled ? '#333640' : active ? '#6c6fee' : '#8b8f9a', opacity: disabled ? 0.4 : 1 }]}>{icon}</Text>
              <Text style={[s.tabLabel, { color: disabled ? '#333640' : active ? '#6c6fee' : '#8b8f9a', opacity: disabled ? 0.4 : 1 }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar:       { height: 64, backgroundColor: '#16181c', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, justifyContent: 'space-between' },
  undoGroup: { flexDirection: 'row', gap: 2 },
  undoBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  undoIcon:  { fontSize: 18 },
  tabGroup:  { flexDirection: 'row', gap: 2 },
  tab:       { alignItems: 'center', justifyContent: 'center', gap: 1, minWidth: 52, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10, position: 'relative' },
  tabActive: { backgroundColor: 'rgba(108,111,238,0.15)' },
  indicator: { position: 'absolute', top: 0, height: 2, width: 28, borderRadius: 2, backgroundColor: '#6c6fee' },
  tabIcon:   { fontSize: 16 },
  tabLabel:  { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});
