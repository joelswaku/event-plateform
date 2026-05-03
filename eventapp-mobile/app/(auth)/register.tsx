import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';
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
  message:  'Passwords do not match',
  path:     ['confirm_password'],
});
type Form = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router   = useRouter();
  const register = useAuthStore(s => s.register);
  const [showPw, setShowPw] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver:      zodResolver(schema),
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '' },
  });

  const onSubmit = async (data: Form) => {
    const result = await register({ full_name: data.full_name, email: data.email, password: data.password });
    if (result.success) {
      Toast.show({ type: 'success', text1: 'Account created!', text2: 'Please sign in.' });
      router.replace('/(auth)/login');
    } else {
      Toast.show({ type: 'error', text1: 'Registration failed', text2: result.message });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[Colors.bg.primary, '#0d0d1a', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.sub}>Join EventApp and start managing events</Text>
          </View>

          <View style={styles.card}>
            <Controller control={control} name="full_name"
              render={({ field: { onChange, value } }) => (
                <Input label="Full Name" icon="user" placeholder="Jane Smith" value={value} onChangeText={onChange} error={errors.full_name?.message} />
              )} />
            <Controller control={control} name="email"
              render={({ field: { onChange, value } }) => (
                <Input label="Email" icon="mail" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} error={errors.email?.message} />
              )} />
            <Controller control={control} name="password"
              render={({ field: { onChange, value } }) => (
                <Input label="Password" icon="lock" rightIcon={showPw ? 'eye-off' : 'eye'} onRightPress={() => setShowPw(p => !p)} placeholder="At least 8 characters" secureTextEntry={!showPw} value={value} onChangeText={onChange} error={errors.password?.message} />
              )} />
            <Controller control={control} name="confirm_password"
              render={({ field: { onChange, value } }) => (
                <Input label="Confirm Password" icon="lock" secureTextEntry={!showPw} placeholder="Repeat password" value={value} onChangeText={onChange} error={errors.confirm_password?.message} />
              )} />

            <Button label="Create Account" onPress={handleSubmit(onSubmit)} loading={isSubmitting} accent={Colors.accent.indigo} size="lg" />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={[styles.link, { color: Colors.accent.indigo }]}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg.primary },
  scroll:     { flexGrow: 1, padding: 24, gap: 20, paddingBottom: 40 },
  header:     { paddingVertical: 16, gap: 6 },
  title:      { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  sub:        { fontSize: 14, color: Colors.text.muted },
  card:       { backgroundColor: Colors.bg.card, borderRadius: 24, borderWidth: 1, borderColor: Colors.border.DEFAULT, padding: 20, gap: 14 },
  footer:     { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  footerText: { color: Colors.text.muted, fontSize: 13 },
  link:       { fontSize: 13, fontWeight: '700' },
});
