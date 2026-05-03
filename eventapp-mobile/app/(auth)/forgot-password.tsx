import React from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';
import { Feather } from '@expo/vector-icons';
import api from '@/lib/api';
import { Input }  from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema), defaultValues: { email: '' },
  });

  const onSubmit = async (data: Form) => {
    try {
      await api.post('/auth/request-password-reset', { email: data.email });
      Toast.show({ type: 'success', text1: 'Check your inbox', text2: 'Password reset instructions sent.' });
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to send reset email' });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>
          <View style={styles.iconWrap}>
            <Feather name="lock" size={28} color={Colors.accent.indigo} />
          </View>
          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.sub}>Enter your email and we'll send reset instructions.</Text>
          <Controller control={control} name="email"
            render={({ field: { onChange, value } }) => (
              <Input label="Email" icon="mail" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} error={errors.email?.message} />
            )} />
          <Button label="Send Reset Link" onPress={handleSubmit(onSubmit)} loading={isSubmitting} accent={Colors.accent.indigo} size="lg" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },
  content: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  back:    { position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg.elevated, alignItems: 'center', justifyContent: 'center' },
  iconWrap:{ width: 72, height: 72, borderRadius: 22, backgroundColor: `${Colors.accent.indigo}20`, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  title:   { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center' },
  sub:     { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
});
