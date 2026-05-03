import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Feather } from '@expo/vector-icons';
import { IssuedTicket } from '@/types';
import { Colors, TierKey } from '@/constants/colors';
import { getTierConfig } from '@/lib/tier';
import { fmtDate, fmtCurrency } from '@/lib/format';

interface TicketStubProps { ticket: IssuedTicket; }

function Perforation({ accent }: { accent: string }) {
  return (
    <View style={styles.perfRow}>
      <View style={[styles.halfCircle, styles.halfLeft, { borderColor: 'rgba(0,0,0,0.5)' }]} />
      {Array.from({ length: 18 }).map((_, i) => (
        <View key={i} style={[styles.dash, { backgroundColor: `${accent}25` }]} />
      ))}
      <View style={[styles.halfCircle, styles.halfRight, { borderColor: 'rgba(0,0,0,0.5)' }]} />
    </View>
  );
}

export function TicketStub({ ticket }: TicketStubProps) {
  const [qrModal, setQrModal] = useState(false);
  const tier   = getTierConfig({ name: ticket.ticket_type_name, kind: ticket.kind });
  const status = ticket.qr_status;

  const isUsed    = status === 'USED';
  const isRevoked = status === 'REVOKED';

  return (
    <>
      <View style={[styles.card, { borderColor: `${tier.accent}30`, shadowColor: tier.accent }]}>
        {/* Shimmer for VIP/pro */}
        <LinearGradient
          colors={[tier.dark, `${tier.dark}ee`, tier.dark]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Top accent stripe */}
        <View style={[styles.accentBar, { backgroundColor: tier.accent }]} />

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={[styles.tierChip, { backgroundColor: `${tier.accent}20`, borderColor: `${tier.accent}35` }]}>
              <Text style={{ fontSize: 13 }}>{Colors.tier[getTierKey(ticket)]?.icon}</Text>
              <Text style={[styles.tierLabel, { color: tier.accent }]}>
                {Colors.tier[getTierKey(ticket)]?.label}
              </Text>
            </View>
            <Text style={styles.eventTitle} numberOfLines={2}>{ticket.event_title}</Text>
            <Text style={[styles.ticketType, { color: tier.accent }]}>{ticket.ticket_type_name}</Text>
          </View>

          {/* Status */}
          <View style={[styles.statusBadge, {
            backgroundColor: isUsed ? 'rgba(107,114,128,0.2)' : isRevoked ? 'rgba(239,68,68,0.2)' : `${tier.accent}18`,
          }]}>
            <Text style={[styles.statusText, {
              color: isUsed ? '#9ca3af' : isRevoked ? Colors.accent.red : tier.accent,
            }]}>
              {isUsed ? 'USED' : isRevoked ? 'REVOKED' : 'ACTIVE'}
            </Text>
          </View>
        </View>

        {/* Event details */}
        <View style={styles.details}>
          {ticket.starts_at_utc && (
            <View style={styles.detailRow}>
              <Feather name="clock" size={12} color={`${tier.accent}80`} />
              <Text style={[styles.detailText, { color: `${tier.accent}90` }]}>
                {fmtDate(ticket.starts_at_utc)}
              </Text>
            </View>
          )}
          {ticket.venue_name && (
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={12} color={`${tier.accent}80`} />
              <Text style={[styles.detailText, { color: `${tier.accent}90` }]} numberOfLines={1}>
                {ticket.venue_name}{ticket.city ? `, ${ticket.city}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Perforation */}
        <Perforation accent={tier.accent} />

        {/* QR Section */}
        <Pressable style={styles.qrSection} onPress={() => setQrModal(true)}>
          <View style={[styles.qrWrap, { borderColor: `${tier.accent}30`, backgroundColor: '#fff' }]}>
            <QRCode
              value={ticket.qr_token}
              size={160}
              color="#000"
              backgroundColor="#fff"
            />
            {(isUsed || isRevoked) && (
              <View style={styles.qrOverlay}>
                <Text style={styles.qrOverlayText}>
                  {isUsed ? '✓ USED' : '✗ REVOKED'}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.qrHint, { color: `${tier.accent}60` }]}>Tap to expand</Text>
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.holderLabel}>HOLDER</Text>
            <Text style={styles.holderName}>{ticket.buyer_name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.holderLabel}>TICKET #</Text>
            <Text style={[styles.ticketNum, { color: tier.accent }]}>{ticket.ticket_number}</Text>
          </View>
        </View>

        {/* Checked-in banner */}
        {ticket.checked_in_at && (
          <View style={[styles.checkedBanner, { backgroundColor: `${Colors.accent.emerald}20` }]}>
            <Feather name="check-circle" size={12} color={Colors.accent.emerald} />
            <Text style={[styles.checkedText, { color: Colors.accent.emerald }]}>
              Checked in {fmtDate(ticket.checked_in_at)}
            </Text>
          </View>
        )}
      </View>

      {/* Full-screen QR modal */}
      <Modal visible={qrModal} transparent animationType="fade">
        <TouchableOpacity style={styles.qrModalBg} activeOpacity={1} onPress={() => setQrModal(false)}>
          <View style={[styles.qrModalCard, { borderColor: `${tier.accent}40` }]}>
            <Text style={[styles.qrModalTitle, { color: tier.accent }]}>{ticket.event_title}</Text>
            <Text style={styles.qrModalSub}>{ticket.ticket_type_name}</Text>
            <View style={[styles.qrModalWrap, { borderColor: `${tier.accent}30` }]}>
              <QRCode value={ticket.qr_token} size={240} color="#000" backgroundColor="#fff" />
            </View>
            <Text style={[styles.ticketNum, { color: tier.accent, fontSize: 16 }]}>
              #{ticket.ticket_number}
            </Text>
            <Text style={styles.qrHint}>Tap anywhere to close</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function getTierKey(ticket: IssuedTicket): TierKey {
  const n = (ticket.ticket_type_name ?? '').toLowerCase();
  const kind = ticket.kind;
  if (kind === 'FREE')                                                                          return 'free';
  if (n.includes('vip') || n.includes('platinum') || n.includes('premium'))                   return 'vip';
  if (n.includes('pro') || n.includes('diamond') || n.includes('all-access'))                 return 'pro';
  if (n.includes('early') || n.includes('bird') || n.includes('presale'))                     return 'early';
  if (n.includes('student') || n.includes('youth') || n.includes('concession'))               return 'discount';
  return 'standard';
}

const styles = StyleSheet.create({
  card: {
    borderRadius:  20,
    borderWidth:   1,
    overflow:      'hidden',
    marginBottom:  16,
    shadowOpacity: 0.3,
    shadowRadius:  20,
    shadowOffset:  { width: 0, height: 8 },
    elevation:     10,
  },
  accentBar: { height: 3 },
  header: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           12,
    padding:       16,
    paddingBottom: 8,
  },
  tierChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      99,
    borderWidth:       1,
    alignSelf:         'flex-start',
    marginBottom:      6,
  },
  tierLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  eventTitle: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  ticketType: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText:  { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  details: { paddingHorizontal: 16, gap: 3, marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, fontWeight: '500' },
  perfRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginVertical: 4,
  },
  halfCircle: {
    width:  16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: Colors.bg.primary,
  },
  halfLeft:  { marginLeft:  -8 },
  halfRight: { marginRight: -8 },
  dash: { flex: 1, height: 1, marginHorizontal: 1 },
  qrSection: { alignItems: 'center', padding: 16, gap: 6 },
  qrWrap: {
    padding:      12,
    borderRadius: 16,
    borderWidth:  1,
    position:     'relative',
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    16,
  },
  qrOverlayText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  qrHint: { fontSize: 10, fontWeight: '600' },
  footer: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    paddingHorizontal: 16,
    paddingBottom:   14,
    paddingTop:      4,
  },
  holderLabel: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1 },
  holderName:  { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 1 },
  ticketNum:   { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  checkedBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  checkedText: { fontSize: 11, fontWeight: '700' },
  // QR modal
  qrModalBg: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         24,
  },
  qrModalCard: {
    backgroundColor: Colors.bg.card,
    borderRadius:    24,
    borderWidth:     1,
    padding:         28,
    alignItems:      'center',
    gap:             8,
    width:           '100%',
    maxWidth:        340,
  },
  qrModalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  qrModalSub:   { fontSize: 13, color: Colors.text.muted, marginBottom: 8 },
  qrModalWrap: { padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1 },
});
