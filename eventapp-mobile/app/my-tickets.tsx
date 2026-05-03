import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { TicketStub }   from '@/components/tickets/TicketStub';
import { Colors }        from '@/constants/colors';
import { Config }        from '@/constants/config';
import { IssuedTicket }  from '@/types';

export default function MyTicketsScreen() {
  const router       = useRouter();
  const user         = useAuthStore(s => s.user);
  const isAuth       = useAuthStore(s => s.isAuthenticated);

  const [email,    setEmail]    = useState(user?.email ?? '');
  const [tickets,  setTickets]  = useState<IssuedTicket[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [searched, setSearched] = useState(false);

  // Auto-load for authenticated users
  useEffect(() => {
    if (isAuth && user?.email) {
      setEmail(user.email);
      fetchTickets(user.email);
    }
  }, [isAuth, user?.email]);

  async function fetchTickets(emailToFetch: string) {
    if (!emailToFetch.includes('@')) { setError('Enter a valid email address'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${Config.API_URL}/public/my-tickets`, {
        params: { email: emailToFetch.trim().toLowerCase() },
      });
      setTickets(res.data?.tickets ?? []);
      setSearched(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to fetch tickets';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color="#fff" />
            </Pressable>
            <View>
              <Text style={styles.title}>My Tickets</Text>
              <Text style={styles.subtitle}>Your digital ticket wallet</Text>
            </View>
          </View>

          {/* Email gate (non-authenticated) */}
          {!isAuth && (
            <View style={styles.gate}>
              <View style={styles.gateIcon}>
                <Feather name="mail" size={24} color={Colors.accent.indigo} />
              </View>
              <Text style={styles.gateTitle}>Find your tickets</Text>
              <Text style={styles.gateSub}>Enter the email address you used when purchasing</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.emailInput}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.text.subtle}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={() => fetchTickets(email)}
                />
                <Pressable
                  style={[styles.searchBtn, loading && { opacity: 0.6 }]}
                  onPress={() => fetchTickets(email)}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Feather name="search" size={18} color="#fff" />
                  }
                </Pressable>
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          )}

          {/* Loading for auth users */}
          {isAuth && loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={Colors.accent.indigo} />
              <Text style={styles.loadingText}>Loading your tickets…</Text>
            </View>
          )}

          {/* Tickets list */}
          {searched && !loading && (
            <View style={styles.ticketList}>
              {tickets.length === 0 ? (
                <View style={styles.empty}>
                  <Feather name="inbox" size={40} color={Colors.text.subtle} />
                  <Text style={styles.emptyTitle}>No tickets found</Text>
                  <Text style={styles.emptySub}>
                    No tickets are associated with {email}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.count}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found</Text>
                  {tickets.map(t => (
                    <TicketStub key={t.id} ticket={t} />
                  ))}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: 20, gap: 20, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
    paddingVertical: 4,
  },
  backBtn: {
    width:           40,
    height:          40,
    borderRadius:    12,
    backgroundColor: Colors.bg.elevated,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    alignItems:      'center',
    justifyContent:  'center',
  },
  title:    { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: Colors.text.muted },

  gate: {
    backgroundColor: Colors.bg.card,
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    padding:         24,
    alignItems:      'center',
    gap:             10,
  },
  gateIcon: {
    width:           60,
    height:          60,
    borderRadius:    18,
    backgroundColor: `${Colors.accent.indigo}18`,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  gateTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  gateSub:   { fontSize: 13, color: Colors.text.muted, textAlign: 'center' },

  inputRow: { flexDirection: 'row', gap: 8, width: '100%', marginTop: 4 },
  emailInput: {
    flex:              1,
    backgroundColor:   Colors.bg.input,
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       Colors.border.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical:   12,
    color:             '#fff',
    fontSize:          14,
  },
  searchBtn: {
    width:           48,
    height:          48,
    borderRadius:    12,
    backgroundColor: Colors.accent.indigo,
    alignItems:      'center',
    justifyContent:  'center',
  },
  error: { fontSize: 12, color: Colors.accent.red, textAlign: 'center' },

  loadingWrap: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  loadingText: { fontSize: 13, color: Colors.text.muted },

  ticketList: { gap: 4 },
  count:      { fontSize: 12, fontWeight: '700', color: Colors.text.muted, marginBottom: 4 },

  empty:      { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text.primary },
  emptySub:   { fontSize: 13, color: Colors.text.muted, textAlign: 'center' },
});
