import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'EventApp',
  slug: 'event-app',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'eventapp',
  userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#07070f',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.eventapp.mobile',
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription:
        'EventApp uses your camera to scan QR codes at event check-in.',
    },
  },
  android: {
    package: 'com.eventapp.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#07070f',
    },
    permissions: ['CAMERA', 'VIBRATE', 'INTERNET', 'ACCESS_NETWORK_STATE'],
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-web-browser',
    'expo-secure-store',
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow EventApp to access your camera to scan QR codes at events.',
      },
    ],
    'expo-notifications',
    [
      'expo-build-properties',
      {
        android: { usesCleartextTraffic: true },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api',
    eas: { projectId: 'your-project-id' },
  },
});
