import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Config } from '@/constants/config';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];

  // Redirect if no token
  if (!token) {
    router.replace('/(auth)/register');
    return null;
  }

  const handleChange = (index: number, value: string) => {
    // Handle paste - if multiple digits pasted, distribute across inputs
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs[nextIndex].current?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // Auto-verify when all 6 digits are filled
  useEffect(() => {
    const verificationCode = code.join('');
    if (verificationCode.length === 6 && !loading) {
      handleVerify();
    }
  }, [code]);

  const handleVerify = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${Config.API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, code: verificationCode }),
      });

      const data = await res.json();

      if (!data.success) {
        Alert.alert('Error', data.message || 'Verification failed');
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Email verified!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch(`${Config.API_URL}/auth/resend-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      Alert.alert('Success', data.message || 'Code sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code');
    }
    setResending(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={['#0f0c29', '#1a1040', '#24243e']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.glow, { top: -80, left: -60, width: 280, height: 280, backgroundColor: '#4f46e5' }]} />
      <View style={[styles.glow, { top: '38%', right: -90, width: 220, height: 220, backgroundColor: '#7c3aed' }]} />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Feather name="mail" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to your email
          </Text>
        </View>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={inputRefs[index]}
              style={styles.codeInput}
              value={digit}
              onChangeText={(value) => handleChange(index, value)}
              onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(index, key)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        <Pressable
          onPress={handleVerify}
          disabled={loading || code.join('').length !== 6}
          style={[styles.button, (loading || code.join('').length !== 6) && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify Email'}</Text>
        </Pressable>

        <Pressable onPress={handleResend} disabled={resending} style={styles.resendButton}>
          <Text style={styles.resendText}>{resending ? 'Sending...' : 'Resend code'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0c29' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  glow: { position: 'absolute', borderRadius: 999, opacity: 0.18 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
  email: { color: '#fff', fontWeight: '700' },
  codeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: Colors.bg.input,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.DEFAULT,
    color: Colors.text.primary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.accent.indigo,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendButton: { alignItems: 'center', padding: 12 },
  resendText: { color: Colors.accent.indigo, fontSize: 14, fontWeight: '600' },
});
