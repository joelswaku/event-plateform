// import { ExpoConfig, ConfigContext } from 'expo/config';

// export default ({ config }: ConfigContext): ExpoConfig => ({
//   ...config,
//   name: 'EventApp',
//   slug: 'event-app',
//   version: '1.0.0',
//   orientation: 'portrait',
//   scheme: 'eventapp',
//   userInterfaceStyle: 'dark',
//   icon: './assets/icon.png',
//   splash: {
//     image: './assets/splash.png',
//     resizeMode: 'contain',
//     backgroundColor: '#07070f',
//   },
//   assetBundlePatterns: ['**/*'],
//   ios: {
//     bundleIdentifier: 'com.liteevent.mobile',
//     supportsTablet: false,
//     infoPlist: {
//       NSCameraUsageDescription:
//         'LiteEvent uses your camera to scan QR codes at event check-in.',
//       NSContactsUsageDescription:
//         'LiteEvent uses your contacts to quickly add guests to your events.',
//       NSAppTransportSecurity: {
//         NSAllowsArbitraryLoads: true,
//       },
//       // Google OAuth reverse-client-ID URL scheme so the OS can redirect
//       // back to the app after Google sign-in completes.
//       CFBundleURLTypes: [
//         {
//           CFBundleURLSchemes: [
//             'com.googleusercontent.apps.728056596746-44c4q2vgaiojan8imrs50ikkjmg3e8d0',
//           ],
//         },
//       ],
//     },
//   },
//   android: {
//     package: 'com.liteevent.mobile',
//     adaptiveIcon: {
//       foregroundImage: './assets/adaptive-icon.png',
//       backgroundColor: '#07070f',
//     },
//     permissions: ['CAMERA', 'VIBRATE', 'INTERNET', 'ACCESS_NETWORK_STATE', 'READ_CONTACTS'],
//   },
//   plugins: [
//     'expo-router',
//     'expo-font',
//     'expo-web-browser',
//     'expo-secure-store',
//     [
//       'expo-camera',
//       {
//         cameraPermission:
//           'Allow LiteEvent to access your camera to scan QR codes at events.',
//       },
//     ],
//     'expo-notifications',
//     [
//       'expo-contacts',
//       {
//         contactsPermission: 'Allow LiteEvent to access your contacts to add guests quickly.',
//       },
//     ],
//     [
//       'expo-build-properties',
//       {
//         android: { usesCleartextTraffic: true },
//       },
//     ],
//     '@react-native-community/datetimepicker',
//   ],
//   experiments: {
//     typedRoutes: true,
//   },
//   extra: {
//     apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api',
//     eas: { projectId: 'your-project-id' },
//   },
// });

import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: "okapiapp",
  name: "LiteEvent",
  slug: "event-app",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "liteevent",
  userInterfaceStyle: "dark",

  icon: "./assets/icon.png",

  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#07070f",
  },

  assetBundlePatterns: ["**/*"],

  // EAS Update configuration
  updates: {
    url: "https://u.expo.dev/d03571a3-0dee-483c-9a4f-0706b2d9e07d",
  },
  runtimeVersion: {
    policy: "appVersion",
  },

  ios: {
    bundleIdentifier: "com.liteevent.mobile",
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription:
        "LiteEvent uses your camera to scan QR codes at event check-in.",
      NSContactsUsageDescription:
        "LiteEvent uses your contacts to quickly add guests to your events.",
      // Declare that app does not use encryption requiring export compliance
      ITSAppUsesNonExemptEncryption: false,
      // Google OAuth reverse client ID
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: [
            "com.googleusercontent.apps.728056596746-44c4q2vgaiojan8imrs50ikkjmg3e8d0",
          ],
        },
      ],
    },
  },

  android: {
    package: "com.liteevent.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#07070f",
    },
    permissions: [
      "CAMERA",
      "VIBRATE",
      "INTERNET",
      "ACCESS_NETWORK_STATE",
      "READ_CONTACTS",
    ],
  },

  androidNavigationBar: {
    barStyle: "light-content",
    backgroundColor: "#07070f",
  },

  plugins: [
    "expo-router",
    "expo-font",
    "expo-web-browser",
    "expo-secure-store",

    // ✅ Google Sign-In plugin
    "@react-native-google-signin/google-signin",

    [
      "expo-camera",
      {
        cameraPermission:
          "Allow LiteEvent to access your camera to scan QR codes at events.",
      },
    ],

    "expo-notifications",

    [
      "expo-contacts",
      {
        contactsPermission:
          "Allow LiteEvent to access your contacts to add guests quickly.",
      },
    ],

    [
      "expo-build-properties",
      {
        android: {
          // Release builds may only communicate over HTTPS. This prevents a
          // device on an untrusted network from intercepting API traffic.
          usesCleartextTraffic: false,
          // Disable Hermes to avoid ES6 class compatibility issues
          enableHermes: false,
        },
      },
    ],

    "@react-native-community/datetimepicker",
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://api.liteevent.com/api",
    webUrl: process.env.EXPO_PUBLIC_WEB_URL ?? "https://liteevent.com",
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "",
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    environment: process.env.NODE_ENV ?? "production",
    eas: {
      projectId: "d03571a3-0dee-483c-9a4f-0706b2d9e07d",
    },
  },
});
