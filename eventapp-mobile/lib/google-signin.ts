import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Lazy import to avoid errors when module isn't available
let GoogleSignin: any = null;
let isAvailable = false;

function googleClientConfig() {
  return {
    webClientId: Constants.expoConfig?.extra?.googleWebClientId as string | undefined,
    iosClientId: Constants.expoConfig?.extra?.googleIosClientId as string | undefined,
  };
}

try {
  const module = require('@react-native-google-signin/google-signin');
  if (module && module.GoogleSignin) {
    GoogleSignin = module.GoogleSignin;
    isAvailable = true;
    console.log('[Google Sign In] Native module loaded successfully');
  } else {
    console.log('[Google Sign In] Module exists but GoogleSignin is undefined');
    isAvailable = false;
  }
} catch (error) {
  console.log('[Google Sign In] Native module not available - skipping (this is normal in Expo Go or old dev builds)');
  isAvailable = false;
}

/**
 * Check if Google Sign In is available in this build
 */
export function isGoogleSignInAvailable(): boolean {
  console.log('[Google Sign In] isAvailable check:', isAvailable);
  return isAvailable;
}

/** Google can be shown in every build; a configured client ID is required to complete sign-in. */
export function isGoogleSignInConfigured(): boolean {
  const { webClientId } = googleClientConfig();
  return Boolean(webClientId && webClientId.endsWith('.apps.googleusercontent.com'));
}

/**
 * Configure Google Sign In
 * Call this once during app initialization
 */
export function configureGoogleSignIn() {
  if (!isAvailable || !GoogleSignin) {
    console.log('[Google Sign In] Skipped - native module not available');
    return;
  }

  const { webClientId, iosClientId } = googleClientConfig();

  if (!webClientId) {
    console.warn('[Google Sign In] Web Client ID not configured');
    return;
  }

  try {
    GoogleSignin.configure({
      webClientId, // Required for both iOS and Android
      iosClientId, // Optional: iOS-specific client ID
      offlineAccess: true, // Get refresh token
      scopes: ['profile', 'email'],
    });

    console.log('[Google Sign In] Configured successfully');
  } catch (error) {
    console.error('[Google Sign In] Configuration error:', error);
  }
}

/**
 * Sign in with Google
 * @returns Google ID token or null on error
 */
export async function signInWithGoogle(): Promise<string | null> {
  if (!isAvailable || !GoogleSignin) {
    console.warn('[Google Sign In] Not available in this build');
    return null;
  }

  try {
    // Check for Play Services before opening the Android account chooser.
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    // v16 returns { type: 'success', data: User } (or a cancelled response).
    // Older native builds returned User directly, so retain a safe fallback
    // while every installed build moves to the current response shape.
    const signInResponse = await GoogleSignin.signIn();
    if (signInResponse?.type === 'cancelled') {
      return null;
    }
    const userInfo = signInResponse?.data ?? signInResponse;

    // Prefer the identity token returned by sign-in. getTokens is retained as
    // a fallback for native builds which only expose it through that method.
    const tokens = await GoogleSignin.getTokens();
    const idToken = userInfo?.idToken ?? tokens?.idToken;
    if (!idToken) {
      throw new Error('Google did not return a sign-in token');
    }

    console.log('[Google Sign In] Success:', userInfo?.user?.email ?? 'Google account');

    return idToken;
  } catch (error: any) {
    console.error('[Google Sign In] Error:', error);

    if (error.code === 'SIGN_IN_CANCELLED') {
      console.log('[Google Sign In] User cancelled sign in');
    } else if (error.code === 'IN_PROGRESS') {
      console.log('[Google Sign In] Sign in already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      console.error('[Google Sign In] Play services not available');
    }

    return null;
  }
}

/**
 * Sign out from Google
 */
export async function signOutFromGoogle() {
  if (!isAvailable || !GoogleSignin) {
    return;
  }

  try {
    await GoogleSignin.signOut();
    console.log('[Google Sign In] Signed out');
  } catch (error) {
    console.error('[Google Sign In] Sign out error:', error);
  }
}

/**
 * Check if user is signed in
 */
export async function isGoogleSignedIn(): Promise<boolean> {
  if (!isAvailable || !GoogleSignin) {
    return false;
  }

  try {
    return await GoogleSignin.isSignedIn();
  } catch (error) {
    return false;
  }
}
