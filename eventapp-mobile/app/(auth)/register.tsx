import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LegalPageModal } from '@/components/ui/LegalPageModal';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { notify } from '@/lib/toast';
import { scheduleWelcomeNotification, registerPushToken } from '@/lib/push-notifications';
import { useAuthStore } from '@/store/auth.store';
import { Input }  from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

const schema = z.object({
  full_name:        z.string().min(2, 'Name must be at least 2 characters'),
  email:            z.string().email('Enter a valid email'),
  password:         z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path:    ['confirm_password'],
});
type Form = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router   = useRouter();
  const register = useAuthStore(s => s.register);
  const [showPw,       setShowPw]       = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [legalSlug,    setLegalSlug]    = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver:      zodResolver(schema),
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '' },
  });

  const onSubmit = async (data: Form) => {
    setTermsTouched(true);
    if (!termsChecked) return notify.warning?.('Terms required', 'Please accept the terms to continue.');
    const result = await register({ full_name: data.full_name, email: data.email, password: data.password });

    console.log('Mobile Register Result:', JSON.stringify(result, null, 2)); // DEBUG

    if (result.success) {
      // Check if email verification is required
      if (result.requiresVerification && result.verificationToken) {
        console.log('Redirecting to verify-email with token:', result.verificationToken); // DEBUG
        router.replace(`/(auth)/verify-email?token=${result.verificationToken}`);
      } else {
        console.log('No verification required, redirecting to login'); // DEBUG
        notify.registerSuccess();
        // Request permission + schedule welcome notification in the background
        registerPushToken().then(() => scheduleWelcomeNotification());
        router.replace('/(auth)/login');
      }
    } else {
      notify.registerFailed(result.message);
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
      <View style={[styles.glow, { top: -60, right: -80, width: 260, height: 260, backgroundColor: '#7c3aed' }]} />
      <View style={[styles.glow, { top: '30%', left: -100, width: 220, height: 220, backgroundColor: '#4f46e5' }]} />
      <View style={[styles.glow, { bottom: -40, right: '20%', width: 160, height: 160, backgroundColor: '#db2777' }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Feather name="zap" size={28} color="#fff" />
            </View>
            <Text style={styles.appName}>LiteEvent</Text>
            <Text style={styles.tagline}>Create your account and start managing events</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create account</Text>
            <Text style={styles.cardSub}>Join thousands of event organizers</Text>

            <Controller control={control} name="full_name"
              render={({ field: { onChange, value } }) => (
                <Input label="Full Name" icon="user" placeholder="Jane Smith"
                  value={value} onChangeText={onChange} error={errors.full_name?.message} />
              )} />

            <Controller control={control} name="email"
              render={({ field: { onChange, value } }) => (
                <Input label="Email" icon="mail" placeholder="you@example.com"
                  autoCapitalize="none" keyboardType="email-address"
                  value={value} onChangeText={onChange} error={errors.email?.message} />
              )} />

            <Controller control={control} name="password"
              render={({ field: { onChange, value } }) => (
                <Input label="Password" icon="lock"
                  rightIcon={showPw ? 'eye-off' : 'eye'}
                  onRightPress={() => setShowPw(p => !p)}
                  placeholder="Min. 8 characters"
                  secureTextEntry={!showPw}
                  value={value} onChangeText={onChange} error={errors.password?.message} />
              )} />

            <Controller control={control} name="confirm_password"
              render={({ field: { onChange, value } }) => (
                <Input label="Confirm Password" icon="lock"
                  secureTextEntry={!showPw}
                  placeholder="Repeat password"
                  value={value} onChangeText={onChange} error={errors.confirm_password?.message} />
              )} />

            {/* Terms checkbox */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => { setTermsChecked(v => !v); setTermsTouched(true); }}
                hitSlop={8}
                style={{
                  width: 18, height: 18, borderRadius: 5, borderWidth: 2, marginTop: 1,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: termsChecked ? Colors.accent.indigo : 'rgba(255,255,255,0.06)',
                  borderColor: termsTouched && !termsChecked ? '#ef4444' : termsChecked ? Colors.accent.indigo : 'rgba(255,255,255,0.25)',
                }}>
                {termsChecked && <Feather name="check" size={11} color="#fff" />}
              </Pressable>
              <Text style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 18 }}>
                {'I agree to the '}
                <Text onPress={() => setLegalSlug('terms')}
                  style={{ color: Colors.accent.indigo, textDecorationLine: 'underline' }}>
                  Terms of Service
                </Text>
                {' and '}
                <Text onPress={() => setLegalSlug('privacy-policy')}
                  style={{ color: Colors.accent.indigo, textDecorationLine: 'underline' }}>
                  Privacy Policy
                </Text>
                {'. I am at least 18 years old.'}
              </Text>
            </View>
            {termsTouched && !termsChecked && (
              <Text style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                You must accept the terms to create an account.
              </Text>
            )}

            <Button
              label="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              accent={Colors.accent.indigo}
              size="lg"
            />

            <LegalPageModal slug={legalSlug} onClose={() => setLegalSlug(null)} />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={[styles.footerLink, { color: Colors.accent.indigo }]}>Sign in</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0f0c29' },
  scroll: { flexGrow: 1, padding: 24, gap: 20, paddingBottom: 40 },

  glow: {
    position:     'absolute',
    borderRadius: 999,
    opacity:      0.18,
  },

  brand:    { alignItems: 'center', gap: 8, paddingVertical: 16 },
  logoWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#4f46e5',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  appName: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius:    24,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
    padding:         24,
    gap:             14,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  cardSub:   { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: -6 },

  footer:     { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '700' },
});
