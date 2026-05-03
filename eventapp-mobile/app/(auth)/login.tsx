import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { ENV } from '@/config/env';

WebBrowser.maybeCompleteAuthSession();

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type Form = z.infer<typeof schema>;

export default function LoginScreen() {
  const router      = useRouter();
  const login       = useAuthStore(s => s.login);
  const googleLogin = useAuthStore(s => s.googleLogin);
  const [showPw, setShowPw]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    expoClientId: ENV.GOOGLE_WEB,
    webClientId:  ENV.GOOGLE_WEB,
    iosClientId:  ENV.GOOGLE_IOS,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        handleGoogleToken(idToken);
      } else {
        setGoogleLoading(false);
        Toast.show({ type: 'error', text1: 'Google Sign-In failed', text2: 'No id_token received' });
      }
    } else if (response?.type === 'error' || response?.type === 'dismiss') {
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleToken = async (idToken: string) => {
    const result = await googleLogin(idToken);
    setGoogleLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Google Sign-In failed', text2: result.message });
    }
  };

  const onGooglePress = async () => {
    setGoogleLoading(true);
    await promptAsync();
  };

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: Form) => {
    const result = await login(data.email, data.password);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Login failed', text2: result.message });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[Colors.bg.primary, '#0d0d1a', Colors.bg.primary]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Brand */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoEmoji}>🎟️</Text>
            </View>
            <Text style={styles.appName}>EventApp</Text>
            <Text style={styles.tagline}>Manage events. Scan tickets. Go live.</Text>
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

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In */}
            <Pressable
              style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.85 }]}
              onPress={onGooglePress}
              disabled={!request || googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <View style={styles.googleIconWrap}>
                    <Text style={styles.googleG}>G</Text>
                  </View>
                  <Text style={styles.googleLabel}>Continue with Google</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Register link */}
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
  safe:      { flex: 1, backgroundColor: Colors.bg.primary },
  scroll:    { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 24 },
  brand:     { alignItems: 'center', gap: 8, paddingVertical: 24 },
  logoWrap:  {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: `${Colors.accent.indigo}20`,
    borderWidth: 1, borderColor: `${Colors.accent.indigo}40`,
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 32 },
  appName:   { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  tagline:   { fontSize: 13, color: Colors.text.muted },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius:    24,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    padding:         24,
    gap:             16,
  },
  cardTitle:  { fontSize: 22, fontWeight: '800', color: '#fff' },
  cardSub:    { fontSize: 13, color: Colors.text.muted, marginTop: -8 },
  fields:     { gap: 14 },
  forgotWrap: { alignSelf: 'flex-end' },
  forgot:     { fontSize: 12, color: Colors.accent.indigo, fontWeight: '600' },

  divider: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
    marginVertical: 4,
  },
  dividerLine: {
    flex:            1,
    height:          1,
    backgroundColor: Colors.border.DEFAULT,
  },
  dividerText: {
    fontSize:      12,
    color:         Colors.text.muted,
    fontWeight:    '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  googleBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            12,
    height:         52,
    borderRadius:   14,
    backgroundColor: '#ffffff0f',
    borderWidth:    1,
    borderColor:    '#ffffff20',
  },
  googleIconWrap: {
    width:          28,
    height:         28,
    borderRadius:   14,
    backgroundColor: '#fff',
    alignItems:     'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize:   16,
    fontWeight: '800',
    color:      '#4285F4',
    lineHeight: 20,
  },
  googleLabel: {
    fontSize:   15,
    fontWeight: '700',
    color:      '#fff',
  },

  footer:     { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  footerText: { color: Colors.text.muted, fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '700' },
});
