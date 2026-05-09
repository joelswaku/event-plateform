
// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
// import { useRouter } from 'expo-router';

// interface Props {
//   eventId: string;
//   saveStatus: 'idle' | 'saving' | 'saved' | 'error';
//   onTemplatesOpen: () => void;
//   onPublish: () => void;
//   publishLoading?: boolean;
//   eventTitle?: string;
// }

// function SaveBadge({ status }: { status: Props['saveStatus'] }) {
//   if (status === 'idle') return null;
//   const map = {
//     saving: { label: 'Saving…', color: '#8b8f9a' },
//     saved:  { label: 'Saved ✓', color: '#3ecf8e' },
//     error:  { label: 'Error',   color: '#f87171' },
//   };
//   const v = map[status];
//   return <Text style={{ fontSize: 11, fontWeight: '600', color: v.color }}>{v.label}</Text>;
// }

// export default function BuilderTopBar({ eventId, saveStatus, onTemplatesOpen, onPublish, publishLoading, eventTitle }: Props) {
//   const router = useRouter();
//   return (
//     <View style={s.bar}>
//       {/* Left */}
//       <View style={s.left}>
//         <TouchableOpacity style={s.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
//           <Text style={{ fontSize: 18, color: '#8b8f9a' }}>←</Text>
//         </TouchableOpacity>
//         <Text style={s.title} numberOfLines={1}>{eventTitle || 'Page Builder'}</Text>
//       </View>
//       {/* Center */}
//       <SaveBadge status={saveStatus} />
//       {/* Right */}
//       <View style={s.right}>
//         <TouchableOpacity style={s.templatesBtn} onPress={onTemplatesOpen} activeOpacity={0.8}>
//           <Text style={{ fontSize: 12 }}>⊞</Text>
//           <Text style={s.templatesTxt}>Templates</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[s.publishBtn, publishLoading && { opacity: 0.7 }]}
//           onPress={onPublish}
//           activeOpacity={0.85}
//           disabled={publishLoading}
//         >
//           {publishLoading
//             ? <ActivityIndicator size="small" color="#fff" />
//             : <Text style={s.publishTxt}>↑ Publish</Text>
//           }
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   bar:          { height: 56, backgroundColor: '#16181c', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, gap: 8 },
//   left:         { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
//   iconBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
//   title:        { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)', flexShrink: 1 },
//   right:        { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
//   templatesBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(201,169,110,0.1)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)' },
//   templatesTxt: { fontSize: 11, fontWeight: '700', color: '#c9a96e' },
//   publishBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#6c6fee' },
//   publishTxt:   { fontSize: 11, fontWeight: '800', color: '#fff' },
// });
















import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { SaveStatus } from '@/types';

const BG  = '#16181c';
const BD  = 'rgba(255,255,255,0.07)';
const ACC = '#6c6fee';
const GLD = '#c9a96e';

interface Props {
  eventTitle: string;
  saveStatus: SaveStatus;
  onBack:      () => void;
  onPublish:   () => void;
  onTemplates: () => void;
}

export default function BuilderTopBar({ eventTitle, saveStatus, onBack, onPublish, onTemplates }: Props) {
  return (
    <View style={s.bar}>
      {/* Left */}
      <View style={s.left}>
        <Pressable style={s.iconBtn} onPress={onBack} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <Text style={s.title} numberOfLines={1}>{eventTitle}</Text>
      </View>

      {/* Center – save badge */}
      <View style={s.center}>
        {saveStatus !== 'idle' && (
          <View style={[s.badge, saveStatus === 'error' && { backgroundColor: 'rgba(248,113,113,0.15)' }]}>
            <Text style={[
              s.badgeText,
              saveStatus === 'saved' && { color: '#3ecf8e' },
              saveStatus === 'error' && { color: '#f87171' },
            ]}>
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Error'}
            </Text>
          </View>
        )}
      </View>

      {/* Right */}
      <View style={s.right}>
        <Pressable style={s.templatesBtn} onPress={onTemplates} hitSlop={8}>
          <Feather name="layout" size={15} color={GLD} />
        </Pressable>
        <Pressable style={s.publishBtn} onPress={onPublish} hitSlop={8}>
          <LinearGradient colors={[ACC, '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <Feather name="upload" size={13} color="#fff" />
          <Text style={s.publishText}>Publish</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, backgroundColor: BG,
    borderBottomWidth: 1, borderBottomColor: BD,
  },
  left:  { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  center: { flex: 0, alignItems: 'center', paddingHorizontal: 4 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)',
    flex: 1, maxWidth: 140,
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#8b8f9a' },
  templatesBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  publishBtn: {
    height: 34, paddingHorizontal: 12, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5, overflow: 'hidden',
  },
  publishText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
