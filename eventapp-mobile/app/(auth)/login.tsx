import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { notify } from '@/lib/toast';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type Form = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const login  = useAuthStore(s => s.login);
  const [showPw, setShowPw] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: Form) => {
    const result = await login(data.email, data.password);
    if (!result.success) {
      notify.loginFailed(result.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Background ── */}
      <LinearGradient
        colors={['#0f0c29', '#1a1040', '#24243e']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow orbs */}
      <View style={[styles.glow, { top: -80, left: -60, width: 280, height: 280, backgroundColor: '#4f46e5' }]} />
      <View style={[styles.glow, { top: '38%', right: -90, width: 220, height: 220, backgroundColor: '#7c3aed' }]} />
      <View style={[styles.glow, { bottom: -60, left: '15%', width: 180, height: 180, backgroundColor: '#db2777' }]} />

      {/* Grid overlay */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Feather name="zap" size={28} color="#fff" />
            </View>
            <Text style={styles.appName}>LiteEvent</Text>
            <Text style={styles.tagline}>Manage events. Scan tickets. Go live.</Text>
          </View>

          {/* Floating stat card */}
          <View style={styles.statCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12K+</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>890K</Text>
              <Text style={styles.statLabel}>Tickets sold</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2.4K</Text>
              <Text style={styles.statLabel}>Organizers</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>

            <View style={styles.fields}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Email"
                    icon="mail"
                    placeholder="you@example.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={value}
                    onChangeText={onChange}
                    error={errors.email?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Password"
                    icon="lock"
                    rightIcon={showPw ? 'eye-off' : 'eye'}
                    onRightPress={() => setShowPw(p => !p)}
                    placeholder="••••••••"
                    secureTextEntry={!showPw}
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                  />
                )}
              />
            </View>

            <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotWrap}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </Pressable>

            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              accent={Colors.accent.indigo}
              size="lg"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.footerLink, { color: Colors.accent.indigo }]}>Sign up</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#0f0c29' },
  scroll:      { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 20 },

  glow: {
    position:     'absolute',
    borderRadius: 999,
    opacity:      0.18,
  },

  gridOverlay: {
    position:        'absolute',
    inset:           0,
    backgroundColor: 'transparent',
  },

  brand:     { alignItems: 'center', gap: 8, paddingVertical: 16 },
  logoWrap:  {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#4f46e5',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  appName:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  tagline:  { fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },

  statCard: {
    flexDirection:    'row',
    backgroundColor:  'rgba(255,255,255,0.05)',
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.08)',
    borderRadius:     20,
    padding:          16,
    justifyContent:   'space-around',
    alignItems:       'center',
  },
  statItem:    { alignItems: 'center', flex: 1 },
  statValue:   { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius:    24,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
    padding:         24,
    gap:             16,
  },
  cardTitle:  { fontSize: 22, fontWeight: '800', color: '#fff' },
  cardSub:    { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: -8 },
  fields:     { gap: 14 },
  forgotWrap: { alignSelf: 'flex-end' },
  forgot:     { fontSize: 12, color: Colors.accent.indigo, fontWeight: '600' },

  footer:     { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '700' },
});
