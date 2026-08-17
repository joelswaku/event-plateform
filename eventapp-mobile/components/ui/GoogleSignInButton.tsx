import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { signInWithGoogle, isGoogleSignInAvailable, isGoogleSignInConfigured } from '@/lib/google-signin';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/lib/toast';

type GoogleSignInButtonProps = {
  mode?: 'login' | 'signup';
};

function GoogleMark() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityLabel="Google">
      <Path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.79h3.14c1.84-1.7 2.92-4.2 2.92-7.75Z" />
      <Path fill="#34A853" d="M12 21.75c2.62 0 4.82-.87 6.43-2.36l-3.14-2.79c-.87.58-1.99.92-3.29.92-2.53 0-4.67-1.71-5.43-4v2.88H3.33a9.72 9.72 0 0 0 8.67 5.35Z" />
      <Path fill="#FBBC05" d="M6.57 13.52a5.85 5.85 0 0 1 0-3.73V6.91H3.33a9.75 9.75 0 0 0 0 9.49l3.24-2.88Z" />
      <Path fill="#EA4335" d="M12 5.8c1.42 0 2.7.49 3.71 1.45l2.78-2.78C16.81 2.91 14.61 2 12 2a9.72 9.72 0 0 0-8.67 4.91l3.24 2.88c.76-2.29 2.9-4 5.43-4Z" />
    </Svg>
  );
}

export function GoogleSignInButton({ mode = 'login' }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const googleLogin = useAuthStore(s => s.googleLogin);
  const isAvailable = isGoogleSignInAvailable();
  const isConfigured = isGoogleSignInConfigured();

  const handleGoogleSignIn = async () => {
    if (!isAvailable) {
      Alert.alert(
        'Google sign-in needs an app update',
        'This copy of LiteEvent does not include the secure Google sign-in module. Install the latest LiteEvent test or store build, then try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isConfigured) {
      Alert.alert(
        'Google sign-in is not configured',
        'This app build is missing its Google client ID. Add the Google client ID to the Expo build environment and create a new app build.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      // Get Google ID token
      const idToken = await signInWithGoogle();

      if (!idToken) {
        setLoading(false);
        return; // User cancelled or error already logged
      }

      // Authenticate with backend
      const result = await googleLogin(idToken);

      if (!result.success) {
        toast.error('Sign In Failed', result.message || 'Could not sign in with Google');
      }
    } catch (error: any) {
      console.error('[Google Sign In Button] Error:', error);
      toast.error('Sign In Failed', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        loading && styles.buttonDisabled,
      ]}
      onPress={handleGoogleSignIn}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
      android_ripple={{ color: 'rgba(60,64,67,0.12)' }}
    >
      <View style={styles.iconContainer}>
        {loading ? (
          <ActivityIndicator size="small" color="#5f6368" />
        ) : (
          <GoogleMark />
        )}
      </View>
      <Text style={styles.buttonText}>
        {loading
          ? 'Signing in with Google…'
          : mode === 'signup'
          ? 'Sign up with Google'
          : 'Sign in with Google'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    gap: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
    backgroundColor: '#F8F9FA',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
});
