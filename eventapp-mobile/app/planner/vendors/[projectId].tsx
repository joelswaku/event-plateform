import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Image, ActivityIndicator, Linking, StyleSheet,
  Dimensions, Platform, ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { notify } from '@/lib/toast';
import { usePlannerStore } from '@/store/planner.store';
import api from '@/lib/api';
import { Config } from '@/constants/config';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 48) / 2;
const REC_W  = (SW - 48) / 2;

// ─────────────────────────────────────────────────────────────────────────
// Design tokens — exact match to web
// ─────────────────────────────────────────────────────────────────────────
const BG     = '#07070f';
const CARD   = '#0d0d1a';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT   = '#ffffff';
const MUTED  = 'rgba(255,255,255,0.45)';
const SUBTLE = 'rgba(255,255,255,0.22)';
const INDIGO = '#4f46e5';
const BLUE   = '#3b82f6';
const EMERALD= '#10b981';
const AMBER  = '#f59e0b';
const RED    = '#ef4444';

const CAT_COLORS: Record<string, string> = {
  Photography:'#818cf8', Videography:'#a78bfa', Catering:'#fbbf24',
  'Music & DJ':'#4ade80', 'Flowers & Décor':'#f472b6', Venue:'#38bdf8',
  Lighting:'#fde68a', 'Sound & AV':'#34d399', 'Hair & Makeup':'#f9a8d4',
  Officiant:'#c084fc', 'Cake & Desserts':'#fb923c', Transportation:'#60a5fa',
  Rentals:'#a3e635', Entertainment:'#f87171', Security:'#94a3b8',
};
const CAT_ICONS: Record<string,string> = {
  Photography:'📷', Videography:'🎥', Catering:'🍽️', 'Music & DJ':'🎵',
  'Flowers & Décor':'💐', Venue:'🏛️', Lighting:'💡', 'Sound & AV':'🔊',
  'Hair & Makeup':'💄', Transportation:'🚗', Entertainment:'🎭',
  'Cake & Desserts':'🎂', Officiant:'💍', Rentals:'📦', Security:'🛡️',
};
const CAT_COVERS: Record<string,string> = {
  Photography:   'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=70',
  Videography:   'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=70',
  Catering:      'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=70',
  'Music & DJ':  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=70',
  'Flowers & Décor':'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&q=70',
  Venue:         'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=70',
  Lighting:      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=70',
  'Hair & Makeup':'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=70',
  Transportation:'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=70',
  Entertainment: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=70',
  'Cake & Desserts':'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&q=70',
  Officiant:     'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&q=70',
  Rentals:       'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=70',
  Security:      'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=600&q=70',
  'Sound & AV':  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=70',
};
const CAT_QUERIES: Record<string,string> = {
  Photography:'wedding photographer', Videography:'wedding videographer',
  Catering:'event catering service', 'Music & DJ':'DJ music event entertainment',
  'Flowers & Décor':'wedding florist decorator', Venue:'event venue banquet hall',
  Lighting:'event lighting company', 'Sound & AV':'audio visual AV event',
  'Hair & Makeup':'bridal makeup artist hair salon', Transportation:'wedding transportation',
  Entertainment:'event entertainment company', 'Cake & Desserts':'wedding cake bakery',
  Officiant:'wedding officiant', Rentals:'event rental company', Security:'event security',
};
const CATEGORIES = Object.keys(CAT_QUERIES);
const FALLBACK = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=70';

// Convert direct Google Places photo URLs → backend proxy so React Native
// doesn't need to follow Google's redirect chain or match referrer restrictions.
function toProxyUri(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/places\.googleapis\.com\/v1\/(places\/[^?/]+\/photos\/[^?/]+)\/media/);
  if (m) return `${Config.API_URL}/google-places/photo?ref=${encodeURIComponent(m[1])}`;
  return url;
}

const STATUS_META: Record<string,{label:string;color:string;bg:string}> = {
  researching:{ label:'Researching', color:'#9ca3af', bg:'rgba(107,114,128,0.18)' },
  contacted:  { label:'Contacted',   color:'#60a5fa', bg:'rgba(59,130,246,0.18)'  },
  quoted:     { label:'Quoted',      color:'#f59e0b', bg:'rgba(245,158,11,0.18)'  },
  booked:     { label:'Booked',      color:'#10b981', bg:'rgba(16,185,129,0.18)'  },
  rejected:   { label:'Rejected',    color:'#ef4444', bg:'rgba(239,68,68,0.18)'   },
};
function ns(s: string): string {
  if (!s) return 'researching';
  const l = s.toLowerCase();
  if (l === 'confirmed') return 'booked';
  return STATUS_META[l] ? l : 'researching';
}

// ─────────────────────────────────────────────────────────────────────────
// Small atoms
// ─────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.researching;
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, backgroundColor: m.bg }}>
      <Text style={{ fontSize: 9, fontWeight: '700', color: m.color }}>{m.label}</Text>
    </View>
  );
}
function Stars({ v, size = 11 }: { v: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <Text key={i} style={{ fontSize: size, color: i <= Math.round(v) ? '#fbbf24' : 'rgba(255,255,255,0.15)' }}>★</Text>
      ))}
    </View>
  );
}
function GBadge() {
  return (
    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 8, fontWeight: '900', color: '#fff' }}>G</Text>
    </View>
  );
}
function SectionDivider({ icon, gBadge, title, count, color }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
      {gBadge && <GBadge />}
      {icon && <Feather name={icon} size={13} color={color || MUTED} />}
      <Text style={{ fontSize: 11, fontWeight: '800', color: TEXT, textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</Text>
      {count != null && <Text style={{ fontSize: 11, color: SUBTLE }}>{count}</Text>}
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 2 }} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CompactVendorCard — mirrors web exactly
// ─────────────────────────────────────────────────────────────────────────
function CompactVendorCard({ vendor, onPress }: { vendor: any; onPress: () => void }) {
  const status   = ns(vendor.booking_status);
  const accent   = CAT_COLORS[vendor.category] || INDIGO;
  const icon     = CAT_ICONS[vendor.category];
  const imgUri   = toProxyUri(vendor.image_url) || CAT_COVERS[vendor.category] || null;
  const [imgOk, setImgOk] = React.useState(true);
  const showImg  = imgUri && imgOk;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={S.compactRow}>
      <View style={[S.compactIcon, { backgroundColor: accent + '22', borderColor: accent + '40', overflow: 'hidden',
                                    shadowColor: accent, shadowOffset: { width: 0, height: 3 },
                                    shadowOpacity: 0.30, shadowRadius: 6, elevation: 4 }]}>
        {showImg
          ? <Image source={{ uri: imgUri }} style={StyleSheet.absoluteFill} resizeMode="cover"
              onError={() => setImgOk(false)} />
          : icon
          ? <Text style={{ fontSize: 16 }}>{icon}</Text>
          : <Text style={{ fontSize: 14, fontWeight: '900', color: accent }}>{vendor.name?.charAt(0)?.toUpperCase()}</Text>
        }
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={S.compactName} numberOfLines={1}>{vendor.name}</Text>
        <Text style={[S.compactCat, { color: accent }]} numberOfLines={1}>{vendor.category || 'Other'}</Text>
      </View>
      <StatusBadge status={status} />
      <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.22)" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RecommendedCategoryCard — full-bleed image, gradient, accent stripe
// mirrors the web h-40 card exactly
// ─────────────────────────────────────────────────────────────────────────
function RecommendedCategoryCard({ cat, onSelect, covered }: { cat: string; onSelect: (c: string) => void; covered: boolean }) {
  const accent = CAT_COLORS[cat] || INDIGO;
  const icon   = CAT_ICONS[cat]  || '◈';
  const imgUri = CAT_COVERS[cat] || FALLBACK;
  return (
    <View style={{ width: REC_W, borderRadius: 14,
                   shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
                   shadowOpacity: 0.45, shadowRadius: 14, elevation: 10 }}>
    <TouchableOpacity onPress={() => onSelect(cat)} activeOpacity={0.82}
      style={{ width: REC_W, height: 140, borderRadius: 14, overflow: 'hidden',
               borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
      {/* Full background image */}
      <Image
        source={{ uri: imgUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {/* Gradient layers — top light, bottom dark */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48,
                     backgroundColor: 'rgba(0,0,0,0.08)' }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 96,
                     backgroundColor: 'rgba(0,0,0,0.84)' }} />
      {/* Accent top stripe — same as web h-0.5 */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                     backgroundColor: accent }} />
      {/* Covered badge — top right */}
      {covered && (
        <View style={{ position: 'absolute', top: 9, right: 9, width: 22, height: 22,
                       borderRadius: 11, backgroundColor: EMERALD,
                       alignItems: 'center', justifyContent: 'center',
                       shadowColor: EMERALD, shadowOffset: { width: 0, height: 2 },
                       shadowOpacity: 0.7, shadowRadius: 4, elevation: 4 }}>
          <Feather name="check" size={12} color="#fff" />
        </View>
      )}
      {/* Content bottom-left */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 11 }}>
        <Text style={{ fontSize: 22, marginBottom: 3 }}>{icon}</Text>
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff', lineHeight: 15 }}>{cat}</Text>
        <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.48)', marginTop: 2 }}>Find vendors →</Text>
      </View>
    </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// GooglePlaceCard — photo card with rating pill, category chip, G badge
// ─────────────────────────────────────────────────────────────────────────
function GooglePlaceCard({ place, category, onAdd, onPress, adding, added, inProject }: any) {
  const accent  = CAT_COLORS[category] || BLUE;
  const name    = place.displayName?.text || 'Unknown';
  const primary = toProxyUri(place.photoUrl) || CAT_COVERS[category] || FALLBACK;
  const [imgUri, setImgUri] = React.useState(primary);
  return (
    <View style={{ width: CARD_W, borderRadius: 14,
                   shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
                   shadowOpacity: 0.45, shadowRadius: 14, elevation: 10 }}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.82}
      style={{ width: CARD_W, borderRadius: 14, overflow: 'hidden',
               backgroundColor: CARD, borderWidth: 1, borderColor: BORDER }}>
      {/* Cover image h-36 equivalent */}
      <View style={{ height: 110, position: 'relative', overflow: 'hidden' }}>
        <Image
          source={{ uri: imgUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => { if (imgUri !== FALLBACK) setImgUri(CAT_COVERS[category] || FALLBACK); }}
        />
        {/* Dark bottom overlay */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 72,
                       backgroundColor: 'rgba(0,0,0,0.76)' }} />
        {/* Category chip top-left */}
        <View style={{ position: 'absolute', top: 7, left: 7, paddingHorizontal: 7, paddingVertical: 2,
                       borderRadius: 10, backgroundColor: accent + 'cc' }}>
          <Text style={{ fontSize: 8, fontWeight: '700', color: '#fff' }}>{category}</Text>
        </View>
        {/* G badge top-right */}
        <View style={{ position: 'absolute', top: 7, right: 7 }}><GBadge /></View>
        {/* Rating pill bottom-left */}
        {place.rating > 0 && (
          <View style={{ position: 'absolute', bottom: 7, left: 7, flexDirection: 'row', alignItems: 'center',
                         gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8,
                         backgroundColor: 'rgba(0,0,0,0.72)' }}>
            <Text style={{ fontSize: 9, color: '#fbbf24' }}>★</Text>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{place.rating}</Text>
            {place.userRatingCount > 0 && (
              <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>
                ({place.userRatingCount > 999 ? `${(place.userRatingCount/1000).toFixed(1)}k` : place.userRatingCount})
              </Text>
            )}
          </View>
        )}
      </View>
      {/* Body */}
      <View style={{ padding: 10, gap: 5 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: TEXT }} numberOfLines={1}>{name}</Text>
        {place.formattedAddress != null && place.formattedAddress !== '' && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
            <Feather name="map-pin" size={9} color={MUTED} style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 9, color: MUTED, flex: 1, lineHeight: 13 }} numberOfLines={2}>
              {place.formattedAddress}
            </Text>
          </View>
        )}
        {/* Add button */}
        <TouchableOpacity
          onPress={() => { if (!inProject && !added) onAdd(place); }}
          disabled={adding || added || inProject}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
                   paddingVertical: 6, borderRadius: 8, marginTop: 2,
                   backgroundColor: inProject || added ? 'rgba(16,185,129,0.15)' : accent + '22',
                   borderWidth: 1,
                   borderColor: inProject || added ? 'rgba(16,185,129,0.3)' : accent + '44' }}>
          {adding
            ? <ActivityIndicator size="small" color={accent} />
            : inProject || added
            ? <><Feather name="check-circle" size={10} color={EMERALD} /><Text style={{ fontSize: 9, fontWeight: '700', color: EMERALD }}>{inProject ? 'In Project' : 'Added'}</Text></>
            : <><Feather name="plus" size={10} color="#fff" /><Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>Add to Project</Text></>
          }
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Category dropdown — styled selector sheet
// ─────────────────────────────────────────────────────────────────────────
function CategoryDropdown({ value, onChange, byCategory }: { value:string; onChange:(c:string)=>void; byCategory:Record<string,any[]> }) {
  const [open, setOpen] = useState(false);
  const accent   = CAT_COLORS[value] || INDIGO;
  const icon     = value !== 'All' ? (CAT_ICONS[value] || '◈') : '✦';
  const total    = Object.values(byCategory).reduce((s, a) => s + a.length, 0);
  const isActive = value !== 'All';
  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8,
                 paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, flex: 1,
                 backgroundColor: isActive ? accent + '18' : 'rgba(255,255,255,0.05)',
                 borderWidth: 1, borderColor: isActive ? accent + '45' : 'rgba(255,255,255,0.10)' }}>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
        <Text style={{ flex: 1, fontSize: 13, fontWeight: '600',
                       color: isActive ? '#fff' : '#d1d5db' }} numberOfLines={1}>
          {value === 'All' ? 'All Categories' : value}
        </Text>
        <Feather name="chevron-down" size={14} color={MUTED} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={{ width: '100%', maxWidth: 340, backgroundColor: '#0d0d1c', borderRadius: 20,
                         borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', paddingVertical: 6 }}>
            {/* All */}
            <TouchableOpacity onPress={() => { onChange('All'); setOpen(false); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
                       paddingHorizontal: 14, paddingVertical: 12,
                       backgroundColor: value === 'All' ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
              <Text style={{ fontSize: 16, width: 26, textAlign: 'center' }}>✦</Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: value === 'All' ? TEXT : MUTED }}>All Categories</Text>
              {total > 0 && <Text style={{ fontSize: 10, color: SUBTLE, fontWeight: '700' }}>{total}</Text>}
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 14, marginVertical: 3 }} />
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {CATEGORIES.map(cat => {
                const a     = CAT_COLORS[cat] || INDIGO;
                const count = byCategory[cat]?.length || 0;
                const active = value === cat;
                return (
                  <TouchableOpacity key={cat} onPress={() => { onChange(cat); setOpen(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
                             paddingHorizontal: 14, paddingVertical: 11,
                             backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
                    <Text style={{ fontSize: 15, width: 26, textAlign: 'center' }}>{CAT_ICONS[cat] || '◈'}</Text>
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: active ? '700' : '500',
                                   color: active ? TEXT : MUTED }}>{cat}</Text>
                    {count > 0 && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: a + '28' }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: a }}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VendorDetailSheet — full detail bottom sheet
// ─────────────────────────────────────────────────────────────────────────
function VendorDetailSheet({ item, type, category, projectId, onClose, onAdd, adding, added, inProject, onAdded }: any) {
  const { updateVendor, deleteVendor } = usePlannerStore();
  const insets = useSafeAreaInsets();
  const isPlace  = type === 'place';
  const isSaved  = type === 'saved';
  const accent   = CAT_COLORS[category || item?.category] || INDIGO;
  const name     = isPlace ? (item?.displayName?.text || 'Unknown') : (isSaved ? (item?.name || 'Unknown') : (item?.business_name || 'Unknown'));
  const phone    = isPlace ? (item?.internationalPhoneNumber || item?.nationalPhoneNumber || '') : (isSaved ? (item?.contact_phone || '') : (item?.phone || ''));
  const website  = isPlace ? (item?.websiteUri || '') : (item?.website_url || '');
  const address  = isPlace ? (item?.formattedAddress || '') : '';
  const status   = isSaved ? ns(item?.booking_status) : null;

  const catCover = CAT_COVERS[category || item?.category] || FALLBACK;
  const [heroUri, setHeroUri] = useState(
    toProxyUri(item?.photoUrl) || toProxyUri(item?.image_url) || catCover
  );

  const [placeData,    setPlaceData]    = useState<any>(null);
  const [loadingPD,    setLoadingPD]    = useState(false);
  const [savingStatus, setSavingStatus] = useState('');
  const [confirmDel,   setConfirmDel]  = useState(false);
  const [expanded,     setExpanded]    = useState(new Set<number>());
  const [localAdding,  setLocalAdding] = useState(false);
  const [localAdded,   setLocalAdded]  = useState(false);
  const { createVendor } = usePlannerStore();

  useEffect(() => {
    const placeId = isPlace ? item?.id : item?.google_place_id;
    if (!placeId) return;
    setLoadingPD(true);
    api.post('/google-places/details', { placeId })
      .then(r => setPlaceData(r.data))
      .catch(() => {})
      .finally(() => setLoadingPD(false));
  }, [item?.id, item?.google_place_id]);

  async function doAdd() {
    setLocalAdding(true);
    const res = await createVendor(projectId, {
      name, category: category || item?.category || 'Other',
      google_place_id: isPlace ? item?.id : undefined,
      image_url: item?.photoUrl || catCover,
      contact_phone: phone,
      website_url: website,
      notes: [address, item?.rating ? `Google Rating: ${item.rating}/5` : null].filter(Boolean).join('\n'),
      booking_status: 'researching',
    });
    setLocalAdding(false);
    if (res.success) { setLocalAdded(true); notify.vendorAdded(name); onAdded?.(); }
    else notify.vendorFailed(res.error);
  }

  async function saveStatus(s: string) {
    setSavingStatus(s);
    await updateVendor(projectId, item.id, { booking_status: s });
    setSavingStatus('');
  }
  async function handleDelete() {
    const r = await deleteVendor(projectId, item.id);
    if (r.success) { notify.vendorRemoved(); onClose(); }
    else notify.vendorFailed(r.error);
  }

  const isDone = inProject || added || localAdded;

  return (
    <Modal visible animationType="slide" statusBarTranslucent presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#06060f' }}>
        {/* Drag handle */}
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginTop: 10 }} />

        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>

          {/* ── Hero ── */}
          <View style={{ height: 210, overflow: 'hidden' }}>
            <Image source={{ uri: heroUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => { if (heroUri !== FALLBACK) setHeroUri(catCover !== heroUri ? catCover : FALLBACK); }} />
            {/* Gradient layers */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.12)' }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 128, backgroundColor: 'rgba(6,6,15,0.92)' }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 58, backgroundColor: accent + '18' }} />
            {/* Close button */}
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}
              style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 16,
                       backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
                       alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={15} color="#fff" />
            </TouchableOpacity>
            {/* Identity */}
            <View style={{ position: 'absolute', bottom: 0, left: 16, right: 16, paddingBottom: 16,
                           flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
              <View style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden',
                             borderWidth: 2, borderColor: accent + '60',
                             backgroundColor: accent + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>{CAT_ICONS[category || item?.category] || name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 19, fontWeight: '900', color: TEXT, lineHeight: 23 }} numberOfLines={2}>{name}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
                  {(category || item?.category) && (
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12,
                                   backgroundColor: accent + '35', borderWidth: 1, borderColor: accent + '55' }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: accent }}>{category || item?.category}</Text>
                    </View>
                  )}
                  {isPlace && <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: '#4285F480' }}><Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>G Maps</Text></View>}
                  {isSaved && <StatusBadge status={status!} />}
                  {item?.rating > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2,
                                   backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ fontSize: 10, color: '#fbbf24' }}>★</Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#fbbf24' }}>{Number(item.rating).toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
            {/* Add CTA (for non-saved vendors) */}
            {!isSaved && (
              <TouchableOpacity onPress={isDone ? undefined : doAdd}
                disabled={localAdding || isDone}
                activeOpacity={0.85}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                         paddingVertical: 14, borderRadius: 14,
                         backgroundColor: isDone ? 'rgba(16,185,129,0.15)' : INDIGO,
                         borderWidth: isDone ? 1 : 0, borderColor: 'rgba(16,185,129,0.3)',
                         shadowColor: INDIGO, shadowOffset: { width: 0, height: 4 },
                         shadowOpacity: isDone ? 0 : 0.4, shadowRadius: 10, elevation: isDone ? 0 : 6 }}>
                {localAdding ? <ActivityIndicator color="#fff" size="small" />
                  : isDone
                  ? <><Feather name="check-circle" size={16} color={EMERALD} /><Text style={{ fontSize: 15, fontWeight: '800', color: EMERALD }}>Already in Project</Text></>
                  : <><Feather name="plus" size={16} color="#fff" /><Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Add to Project</Text></>
                }
              </TouchableOpacity>
            )}

            {/* Contact card */}
            {(address !== '' || phone !== '' || website !== '') && (
              <View style={S.infoCard}>
                <Text style={S.infoCardLabel}>Contact & Location</Text>
                {address !== '' && (
                  <View style={S.contactRow}>
                    <View style={S.contactIcon}><Feather name="map-pin" size={13} color={MUTED} /></View>
                    <Text style={S.contactText}>{address}</Text>
                  </View>
                )}
                {phone !== '' && (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)} style={S.contactRow}>
                    <View style={S.contactIcon}><Feather name="phone" size={13} color={MUTED} /></View>
                    <Text style={[S.contactText, { color: BLUE }]}>{phone}</Text>
                  </TouchableOpacity>
                )}
                {website !== '' && (
                  <TouchableOpacity onPress={() => Linking.openURL(website)} style={S.contactRow}>
                    <View style={S.contactIcon}><Feather name="globe" size={13} color={MUTED} /></View>
                    <Text style={[S.contactText, { color: '#818cf8', flex: 1 }]} numberOfLines={1}>{website.replace(/^https?:\/\//, '')}</Text>
                    <Feather name="external-link" size={10} color={MUTED} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Pipeline (saved only) */}
            {isSaved && (
              <View style={S.infoCard}>
                <Text style={S.infoCardLabel}>Pipeline Stage</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {Object.entries(STATUS_META).map(([st, m]) => {
                      const active = status === st;
                      return (
                        <TouchableOpacity key={st} onPress={() => saveStatus(st)} disabled={!!savingStatus}
                          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                                   backgroundColor: active ? m.bg : CARD,
                                   borderWidth: 1, borderColor: active ? m.color + '55' : BORDER,
                                   overflow: 'hidden' }}>
                          {active && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: m.color }} />}
                          {savingStatus === st
                            ? <ActivityIndicator size="small" color={m.color} />
                            : <Text style={{ fontSize: 9, fontWeight: '700', color: active ? m.color : MUTED }}>{m.label}</Text>
                          }
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Quick actions */}
            {(phone !== '' || website !== '') && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {phone !== '' && (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)} activeOpacity={0.8}
                    style={[S.actionBtn, { flex: 1 }]}>
                    <Feather name="phone" size={15} color={EMERALD} />
                    <Text style={[S.actionBtnText, { color: EMERALD }]}>Call</Text>
                  </TouchableOpacity>
                )}
                {website !== '' && (
                  <TouchableOpacity onPress={() => Linking.openURL(website)} activeOpacity={0.8}
                    style={[S.actionBtn, { flex: 1 }]}>
                    <Feather name="globe" size={15} color={BLUE} />
                    <Text style={[S.actionBtnText, { color: BLUE }]}>Website</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Google About */}
            {(loadingPD || placeData?.editorialSummary || placeData?.openingHours) && (
              <View style={S.infoCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <GBadge />
                  <Text style={S.infoCardLabel}>About (Google)</Text>
                </View>
                {loadingPD && !placeData && <ActivityIndicator color={MUTED} size="small" style={{ alignSelf: 'flex-start' }} />}
                {placeData?.editorialSummary && <Text style={{ fontSize: 13, color: MUTED, lineHeight: 19 }}>{placeData.editorialSummary}</Text>}
                {placeData?.openingHours && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={[S.infoCardLabel, { marginBottom: 6 }]}>Opening Hours</Text>
                    {placeData.openingHours.map((d: string, i: number) => {
                      const [day, ...rest] = d.split(': ');
                      return (
                        <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
                          <Text style={{ fontSize: 11, color: MUTED, width: 90 }}>{day}</Text>
                          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', flex: 1 }}>{rest.join(': ')}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Reviews */}
            {(loadingPD || (placeData?.reviews?.length > 0)) && (
              <View style={S.infoCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <GBadge />
                  <Text style={S.infoCardLabel}>Google Reviews</Text>
                  {placeData?.reviews?.length > 0 && <Text style={{ fontSize: 10, color: SUBTLE, marginLeft: 'auto' }}>{placeData.reviews.length}</Text>}
                </View>
                {loadingPD && !placeData
                  ? [1,2].map(i => (
                      <View key={i} style={{ gap: 8, marginBottom: 14 }}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.07)' }} />
                          <View style={{ flex: 1, gap: 5 }}>
                            <View style={{ height: 10, width: '40%', borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                            <View style={{ height: 8, width: '25%', borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                          </View>
                        </View>
                        <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                      </View>
                    ))
                  : (placeData?.reviews || []).map((r: any, i: number) => {
                      const author   = r.authorAttribution?.displayName || 'Anonymous';
                      const initials = author.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase();
                      const cols     = ['#818cf8','#34d399','#f472b6','#fbbf24','#38bdf8','#a78bfa'];
                      const col      = cols[i % cols.length];
                      const txt      = r.text?.text || r.originalText?.text || '';
                      const isLong   = txt.length > 200;
                      const isExp    = expanded.has(i);
                      const shown    = isLong && !isExp ? txt.slice(0, 200).trimEnd() + '…' : txt;
                      return (
                        <View key={i}>
                          {i > 0 && <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 14, marginTop: 2 }} />}
                          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
                            {r.authorPhotoUrl
                              ? <Image source={{ uri: r.authorPhotoUrl }} style={{ width: 30, height: 30, borderRadius: 15 }} />
                              : <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: col + '28' }}>
                                  <Text style={{ fontSize: 11, fontWeight: '900', color: col }}>{initials}</Text>
                                </View>
                            }
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: TEXT, flex: 1 }} numberOfLines={1}>{author}</Text>
                                <Text style={{ fontSize: 10, color: SUBTLE }}>{r.relativePublishTimeDescription}</Text>
                              </View>
                              {r.rating > 0 && <Stars v={r.rating} size={11} />}
                            </View>
                          </View>
                          {txt !== '' && (
                            <View style={{ paddingLeft: 40 }}>
                              <Text style={{ fontSize: 12, color: MUTED, lineHeight: 18 }}>{shown}</Text>
                              {isLong && (
                                <TouchableOpacity onPress={() => setExpanded(prev => { const n = new Set(prev); isExp ? n.delete(i) : n.add(i); return n; })} style={{ marginTop: 4 }}>
                                  <Text style={{ fontSize: 11, color: '#818cf8', fontWeight: '600' }}>{isExp ? 'Show less' : 'Read more'}</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })
                }
              </View>
            )}

            {/* Other suggestions — same category, mirrors web */}
            {(category || item?.category) && (
              <OtherSuggestions
                category={category || item?.category}
                currentVendorName={name}
                projectId={projectId}
              />
            )}

            {/* Delete */}
            {isSaved && (
              confirmDel
                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
                                  backgroundColor: 'rgba(239,68,68,0.07)', borderRadius: 12,
                                  borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)' }}>
                    <Text style={{ fontSize: 12, color: MUTED, flex: 1 }}>Remove {name}?</Text>
                    <TouchableOpacity onPress={() => setConfirmDel(false)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                      <Text style={{ fontSize: 12, color: MUTED }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.14)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.28)' }}>
                      <Text style={{ fontSize: 12, color: RED, fontWeight: '700' }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                : <TouchableOpacity onPress={() => setConfirmDel(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
                    <Feather name="trash-2" size={13} color={RED} />
                    <Text style={{ fontSize: 12, color: RED, fontWeight: '600' }}>Remove this vendor</Text>
                  </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// OtherSuggestions — same-category Google Places cards, mirrors web exactly
// ─────────────────────────────────────────────────────────────────────────
function OtherSuggestions({ category, currentVendorName, projectId }: {
  category: string; currentVendorName: string; projectId: string;
}) {
  const { createVendor, currentProject } = usePlannerStore();
  const [places,  setPlaces]  = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding,  setAdding]  = useState<string | null>(null);
  const [added,   setAdded]   = useState(new Set<string>());

  const projNames = useMemo(
    () => new Set((currentProject?.vendors || []).map((v: any) => (v.name || '').toLowerCase().trim())),
    [currentProject?.vendors],
  );

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    const q = CAT_QUERIES[category] || category.toLowerCase();
    api.post('/google-places/search', { query: q })
      .then(r => {
        const results = (r.data?.places || [])
          .filter((p: any) => (p.displayName?.text || '') !== currentVendorName)
          .slice(0, 6);
        setPlaces(results);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, currentVendorName]);

  async function handleAdd(place: any) {
    setAdding(place.id);
    const res = await createVendor(projectId, {
      name: place.displayName?.text || 'Unknown',
      category,
      google_place_id: place.id,
      image_url: place.photoUrl || CAT_COVERS[category] || FALLBACK,
      contact_phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
      website_url: place.websiteUri || '',
      notes: [place.formattedAddress, place.rating ? `Google Rating: ${place.rating}/5` : null].filter(Boolean).join('\n'),
      booking_status: 'researching',
    });
    setAdding(null);
    if (res.success) {
      setAdded(prev => new Set([...prev, place.id]));
      notify.vendorAdded(place.displayName?.text);
    } else {
      notify.vendorFailed(res.error);
    }
  }

  if (!loading && places.length === 0) return null;

  const accent = CAT_COLORS[category] || INDIGO;

  return (
    <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: accent + '30',
                       alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 11 }}>{CAT_ICONS[category] || '✦'}</Text>
        </View>
        <Text style={{ fontSize: 10, fontWeight: '800', color: MUTED,
                       textTransform: 'uppercase', letterSpacing: 1 }}>
          Other {category} Vendors
        </Text>
      </View>

      {/* Skeleton — 2 columns × 2 rows */}
      {loading ? (
        <View style={{ gap: 10 }}>
          {[[1, 2], [3, 4]].map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 10 }}>
              {row.map(i => (
                <View key={i} style={{ flex: 1, height: 140, borderRadius: 12,
                                       backgroundColor: 'rgba(255,255,255,0.04)',
                                       borderWidth: 1, borderColor: BORDER }} />
              ))}
            </View>
          ))}
        </View>
      ) : (
        /* Explicit row-pair grid — guarantees exactly 2 columns */
        <View style={{ gap: 10 }}>
          {Array.from({ length: Math.ceil(places.length / 2) }, (_, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 10 }}>
              {places.slice(ri * 2, ri * 2 + 2).map((place: any) => {
                const name    = place.displayName?.text || 'Unknown';
                const isAdded = added.has(place.id);
                const inProj  = projNames.has(name.toLowerCase().trim());
                const primary = toProxyUri(place.photoUrl) || CAT_COVERS[category] || FALLBACK;
                return (
                  <SuggestionCard
                    key={place.id}
                    place={place}
                    name={name}
                    primary={primary}
                    fallback={CAT_COVERS[category] || FALLBACK}
                    accent={accent}
                    isAdded={isAdded}
                    inProj={inProj}
                    isAdding={adding === place.id}
                    onAdd={() => !inProj && !isAdded && handleAdd(place)}
                  />
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function SuggestionCard({ place, name, primary, fallback, accent, isAdded, inProj, isAdding, onAdd }: any) {
  const [imgUri, setImgUri] = React.useState(primary);
  return (
    <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden',
                   backgroundColor: 'rgba(255,255,255,0.03)',
                   borderWidth: 1, borderColor: BORDER }}>
      {/* Photo */}
      <View style={{ height: 80, position: 'relative' }}>
        <Image source={{ uri: imgUri }} style={StyleSheet.absoluteFill} resizeMode="cover"
          onError={() => { if (imgUri !== fallback) setImgUri(fallback); }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44,
                       backgroundColor: 'rgba(0,0,0,0.60)' }} />
        {place.rating > 0 && (
          <View style={{ position: 'absolute', bottom: 6, left: 7, flexDirection: 'row',
                         alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2,
                         borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.65)' }}>
            <Text style={{ fontSize: 8, color: '#fbbf24' }}>★</Text>
            <Text style={{ fontSize: 8, fontWeight: '700', color: '#fff' }}>{place.rating}</Text>
          </View>
        )}
      </View>
      {/* Body */}
      <View style={{ padding: 8, gap: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: TEXT }} numberOfLines={1}>{name}</Text>
        {!!place.formattedAddress && (
          <Text style={{ fontSize: 9, color: MUTED }} numberOfLines={1}>{place.formattedAddress}</Text>
        )}
        <TouchableOpacity
          onPress={onAdd}
          disabled={isAdding || isAdded || inProj}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3,
                   paddingVertical: 5, borderRadius: 7, marginTop: 2,
                   backgroundColor: inProj || isAdded ? 'rgba(16,185,129,0.15)' : accent + '22',
                   borderWidth: 1, borderColor: inProj || isAdded ? 'rgba(16,185,129,0.3)' : accent + '44' }}>
          {isAdding
            ? <ActivityIndicator size="small" color={accent} />
            : inProj || isAdded
            ? <><Feather name="check-circle" size={9} color={EMERALD} />
                <Text style={{ fontSize: 9, fontWeight: '700', color: EMERALD }}> Added</Text></>
            : <><Feather name="plus" size={9} color="#fff" />
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}> Add</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────
export default function VendorsPage() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router        = useRouter();
  const insets        = useSafeAreaInsets();
  const { currentProject, fetchProject, createVendor } = usePlannerStore();

  useEffect(() => { if (projectId) fetchProject(projectId); }, [projectId]);

  const allVendors: any[] = useMemo(
    () => (currentProject?.vendors || []).filter((v: any) => !v.ai_suggested),
    [currentProject?.vendors]
  );
  const projNames = useMemo(
    () => new Set(allVendors.map((v: any) => (v.name || '').toLowerCase().trim())),
    [allVendors]
  );

  const [search,           setSearch]           = useState('');
  const [city,             setCity]             = useState('');
  const [stateF,           setStateF]           = useState('');
  const [country,          setCountry]          = useState('');
  const [category,         setCategory]         = useState('All');
  const [showAllVendors,   setShowAllVendors]   = useState(false);
  const VENDOR_PREVIEW = 4;
  const [places,      setPlaces]      = useState<any[]>([]);
  const [loadingG,    setLoadingG]    = useState(false);
  const [adding,      setAdding]      = useState<string | null>(null);
  const [added,       setAdded]       = useState(new Set<string>());
  const [detail,      setDetail]      = useState<{ item: any; type: 'place'|'saved' } | null>(null);

  useEffect(() => {
    if (currentProject?.city)    setCity(currentProject.city);
    if (currentProject?.country) setCountry(currentProject.country);
  }, [currentProject?.id]);

  const filteredVendors = useMemo(() => {
    let list = allVendors;
    if (category !== 'All') list = list.filter((v: any) => v.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v: any) =>
        (v.name || '').toLowerCase().includes(q) || (v.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allVendors, category, search]);

  const byCategory = useMemo(() => {
    const m: Record<string, any[]> = {};
    filteredVendors.forEach((v: any) => { const c = v.category || 'Other'; if (!m[c]) m[c] = []; m[c].push(v); });
    return m;
  }, [filteredVendors]);

  const byCatAll = useMemo(() => {
    const m: Record<string, any[]> = {};
    allVendors.forEach((v: any) => { const c = v.category || 'Other'; if (!m[c]) m[c] = []; m[c].push(v); });
    return m;
  }, [allVendors]);

  async function runSearch(cat: string) {
    const q   = CAT_QUERIES[cat] || cat.toLowerCase();
    const loc = [city, stateF, country].filter(Boolean).join(', ');
    setLoadingG(true);
    setPlaces([]);
    try {
      const r = await api.post('/google-places/search', { query: q, location: loc });
      setPlaces(r.data?.places || []);
    } catch (e: any) {
      notify.vendorSearchFailed(e?.response?.data?.error);
    } finally {
      setLoadingG(false);
    }
  }

  function selectCategory(cat: string) {
    setCategory(cat);
    setPlaces([]);
    if (cat !== 'All') runSearch(cat);
  }

  async function handleAddPlace(place: any) {
    const key = `g_${place.id}`;
    setAdding(key);
    const res = await createVendor(projectId, {
      name: place.displayName?.text || 'Unknown',
      category,
      google_place_id: place.id,
      image_url: place.photoUrl || CAT_COVERS[category] || FALLBACK,
      contact_phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
      website_url: place.websiteUri || '',
      notes: [place.formattedAddress, place.rating ? `Google Rating: ${place.rating}/5` : null].filter(Boolean).join('\n'),
      booking_status: 'researching',
    });
    setAdding(null);
    if (res.success) {
      setAdded(prev => new Set([...prev, key]));
      notify.vendorAdded(place.displayName?.text);
      fetchProject(projectId);
    } else {
      notify.vendorFailed(res.error);
    }
  }

  const confirmed  = allVendors.filter((v: any) => ns(v.booking_status) === 'booked').length;
  const totalSpend = allVendors.reduce((s: number, v: any) => s + Number(v.confirmed_price || v.quoted_price || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
                     borderBottomWidth: 1, borderBottomColor: BORDER }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
              <Feather name="arrow-left" size={18} color={TEXT} />
            </TouchableOpacity>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 19, fontWeight: '900', color: TEXT, letterSpacing: -0.3 }}>Vendors</Text>
              {currentProject?.title != null && (
                <Text style={{ fontSize: 11, color: MUTED, marginTop: 1 }} numberOfLines={1}>{currentProject.title}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.85}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10,
                     borderRadius: 12, backgroundColor: INDIGO,
                     shadowColor: INDIGO, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 }}>
            <Feather name="plus" size={14} color="#fff" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>Add Vendor</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        {allVendors.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <StatTile icon="shopping-bag" iconColor="#818cf8" iconBg="rgba(129,140,248,0.15)"
              value={String(allVendors.length)} label="Total" />
            <StatTile icon="check-circle" iconColor={confirmed > 0 ? EMERALD : '#4b5563'}
              iconBg={confirmed > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)'}
              value={String(confirmed)} label="Confirmed"
              cardBg={confirmed > 0 ? 'rgba(16,185,129,0.06)' : undefined}
              cardBorder={confirmed > 0 ? 'rgba(16,185,129,0.18)' : undefined} />
            <StatTile icon="dollar-sign" iconColor={AMBER} iconBg="rgba(245,158,11,0.15)"
              value={totalSpend > 0 ? `$${totalSpend >= 1000 ? `${(totalSpend/1000).toFixed(0)}k` : totalSpend}` : '—'}
              label="Budget" cardBg="rgba(245,158,11,0.05)" cardBorder="rgba(245,158,11,0.18)" />
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── Toolbar ── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 9 }}>
          {/* Row 1: dropdown + search */}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <CategoryDropdown value={category} onChange={selectCategory} byCategory={byCatAll} />
            <View style={{ flex: 0.85, flexDirection: 'row', alignItems: 'center', gap: 6,
                           backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
                           paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 10 : 8 }}>
              <Feather name="search" size={13} color={MUTED} />
              <TextInput style={{ flex: 1, fontSize: 13, color: TEXT, padding: 0 }}
                value={search} onChangeText={setSearch}
                placeholder="Search vendors…" placeholderTextColor={SUBTLE} />
              {search !== '' && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={12} color={MUTED} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Row 2: location (only when category selected) */}
          {category !== 'All' && (
            <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
              <TextInput style={S.locInp} value={city} onChangeText={setCity}
                placeholder="City" placeholderTextColor={SUBTLE} />
              <TextInput style={S.locInp} value={stateF} onChangeText={setStateF}
                placeholder="State" placeholderTextColor={SUBTLE} />
              <TextInput style={S.locInp} value={country} onChangeText={setCountry}
                placeholder="Country" placeholderTextColor={SUBTLE} />
              <TouchableOpacity onPress={() => runSearch(category)} disabled={loadingG}
                style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: BLUE,
                          alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
                {loadingG ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="search" size={15} color="#fff" />}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── ALL VIEW ── */}
        {category === 'All' && (
          <View style={{ paddingHorizontal: 16 }}>

            {/* Your Vendors */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT }}>Your Vendors</Text>
                <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                  {allVendors.length > 0
                    ? `${allVendors.length} vendor${allVendors.length !== 1 ? 's' : ''} saved to this project`
                    : 'No vendors added yet'}
                </Text>
              </View>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: BORDER }}>
                <Feather name="plus" size={11} color={MUTED} />
                <Text style={{ fontSize: 11, color: MUTED, fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Your vendors — preview (4) with See All toggle */}
            {allVendors.length > 0 ? (
              <>
                {(showAllVendors ? allVendors : allVendors.slice(0, VENDOR_PREVIEW)).map((v: any) => {
                  const a = CAT_COLORS[v.category] || INDIGO;
                  return (
                    <View key={v.id} style={{ marginBottom: 8 }}>
                      {/* category pill */}
                      {(showAllVendors ? allVendors : allVendors.slice(0, VENDOR_PREVIEW)).indexOf(v) === 0 ||
                       (showAllVendors ? allVendors : allVendors.slice(0, VENDOR_PREVIEW))[(showAllVendors ? allVendors : allVendors.slice(0, VENDOR_PREVIEW)).indexOf(v) - 1]?.category !== v.category ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7, marginTop: v.category !== allVendors[0]?.category ? 10 : 0 }}>
                          <View style={{ width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: a + '20', borderWidth: 1, borderColor: a + '38' }}>
                            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: a }} />
                          </View>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: TEXT }}>{v.category}</Text>
                          <View style={{ flex: 1, height: 1, backgroundColor: a + '25', marginLeft: 2 }} />
                        </View>
                      ) : null}
                      <CompactVendorCard vendor={v} onPress={() => setDetail({ item: v, type: 'saved' })} />
                    </View>
                  );
                })}

                {allVendors.length > VENDOR_PREVIEW && (
                  <TouchableOpacity
                    onPress={() => setShowAllVendors(v => !v)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, marginBottom: 8 }}>
                    <Feather name={showAllVendors ? 'chevron-up' : 'chevron-down'} size={13} color={INDIGO} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: INDIGO }}>
                      {showAllVendors ? 'Show less' : `See all ${allVendors.length} vendors`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 8 }}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>🏪</Text>
                <Text style={{ fontSize: 13, color: MUTED, textAlign: 'center' }}>
                  {search !== '' ? `No vendors match "${search}"` : 'Select a category below to find vendors'}
                </Text>
              </View>
            )}

            {/* Recommended for your event */}
            <View style={{ marginTop: 4, marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 4 }}>Recommended for your event</Text>
              <Text style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>Tap a category to search vendors on Google Maps</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {CATEGORIES
                  .sort((a, b) => (!!byCatAll[b]?.length ? 1 : 0) - (!!byCatAll[a]?.length ? 1 : 0))
                  .map(cat => (
                    <RecommendedCategoryCard
                      key={cat}
                      cat={cat}
                      onSelect={selectCategory}
                      covered={!!(byCatAll[cat]?.length)}
                    />
                  ))}
              </View>
            </View>
          </View>
        )}

        {/* ── CATEGORY VIEW ── */}
        {category !== 'All' && (
          <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
            {/* Category header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <View style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
                             backgroundColor: (CAT_COLORS[category] || INDIGO) + '1a',
                             borderWidth: 1, borderColor: (CAT_COLORS[category] || INDIGO) + '38' }}>
                <Text style={{ fontSize: 22 }}>{CAT_ICONS[category] || '◈'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT }}>{category}</Text>
                <Text style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>
                  {[city, stateF, country].filter(Boolean).join(', ') || 'Enter a location to search'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => selectCategory('All')} activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7,
                         borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: BORDER }}>
                <Feather name="x" size={12} color={MUTED} />
                <Text style={{ fontSize: 11, color: MUTED, fontWeight: '600' }}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* In project */}
            {(byCategory[category]?.length ?? 0) > 0 && (
              <View style={{ marginBottom: 20 }}>
                <SectionDivider icon="check-circle" color={CAT_COLORS[category] || INDIGO}
                  title="In your project" count={byCategory[category].length} />
                {byCategory[category].map((v: any) => (
                  <CompactVendorCard key={v.id} vendor={v}
                    onPress={() => setDetail({ item: v, type: 'saved' })} />
                ))}
              </View>
            )}

            {/* Google Maps */}
            <View style={{ marginBottom: 20 }}>
              <SectionDivider gBadge title={`Google Maps — ${category}`}
                count={!loadingG && places.length > 0 ? places.length : undefined} />
              {loadingG ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {[1,2,3,4].map(i => (
                    <View key={i} style={{ width: CARD_W, height: 180, backgroundColor: CARD,
                                           borderRadius: 14, borderWidth: 1, borderColor: BORDER, opacity: 0.5 }} />
                  ))}
                </View>
              ) : places.length === 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
                               backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
                  <Feather name="map-pin" size={15} color={MUTED} />
                  <Text style={{ fontSize: 12, color: MUTED, flex: 1 }}>Enter a city and tap Search to find {category.toLowerCase()} vendors nearby</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {places.map((place: any) => {
                    const key = `g_${place.id}`;
                    return (
                      <GooglePlaceCard key={place.id} place={place} category={category}
                        onPress={() => setDetail({ item: { ...place, category }, type: 'place' })}
                        onAdd={handleAddPlace}
                        adding={adding === key}
                        added={added.has(key)}
                        inProject={projNames.has((place.displayName?.text || '').toLowerCase().trim())}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Detail sheet */}
      {detail && (
        <VendorDetailSheet
          item={detail.item}
          type={detail.type}
          category={detail.type === 'saved' ? detail.item?.category : category}
          projectId={projectId}
          onClose={() => setDetail(null)}
          onAdd={handleAddPlace}
          adding={detail.item?.id ? adding === `g_${detail.item.id}` : false}
          added={detail.item?.id ? added.has(`g_${detail.item.id}`) : false}
          inProject={projNames.has((detail.item?.displayName?.text || detail.item?.name || '').toLowerCase().trim())}
          onAdded={() => fetchProject(projectId)}
        />
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────
function StatTile({ icon, iconColor, iconBg, value, label, cardBg, cardBorder }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: cardBg || CARD, borderRadius: 14,
                   borderWidth: 1, borderColor: cardBorder || BORDER,
                   padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: iconBg,
                     alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={icon} size={14} color={iconColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: TEXT }} numberOfLines={1}>{value}</Text>
        <Text style={{ fontSize: 9, color: MUTED, fontWeight: '600', marginTop: 1 }}>{label}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// StyleSheet — only valid React Native properties
// ─────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  compactRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, marginBottom: 6 },
  compactIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  compactName:   { fontSize: 13, fontWeight: '700', color: TEXT },
  compactCat:    { fontSize: 10, fontWeight: '600', marginTop: 1 },
  infoCard:      { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14, gap: 2 },
  infoCardLabel: { fontSize: 10, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  contactRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 8 },
  contactIcon:   { width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  contactText:   { fontSize: 13, color: MUTED, flex: 1, lineHeight: 18 },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  locInp:        { flex: 1, backgroundColor: CARD, borderRadius: 9, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 9 : 7, fontSize: 12, color: TEXT },
});
