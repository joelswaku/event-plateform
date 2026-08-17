import { useState, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Config } from '@/constants/config';
import { getToken } from '@/lib/api';
import { useEventStore } from '@/store/event.store';

export default function EventPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const events = useEventStore(s => s.events);
  const event = events.find(e => e.id === id);

  const token = getToken();
  const isPublished = event?.status === 'PUBLISHED';
  const previewUrl = isPublished
    ? `${Config.WEB_URL}/e/${event?.slug}`
    : `${Config.WEB_URL}/e/${event?.slug}?preview=1${token ? `&ptoken=${encodeURIComponent(token)}` : ''}`;

  const handleBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      router.back();
    }
  };

  const handleOpenExternal = async () => {
    try {
      await Share.share({
        message: currentUrl || previewUrl,
        url: currentUrl || previewUrl,
      });
    } catch (error) {
      console.log('Share cancelled', error);
    }
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    webViewRef.current?.reload();
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.bg.primary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: Colors.bg.elevated,
            borderBottomColor: Colors.border.primary,
          },
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={styles.headerButton}
          hitSlop={8}
        >
          <Feather name={canGoBack ? "arrow-left" : "x"} size={22} color={Colors.text.primary} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: Colors.text.primary }]}>
          {isPublished ? 'Live Event' : 'Preview'}
        </Text>

        <View style={styles.headerRight}>
          {canGoBack && (
            <Pressable
              onPress={() => webViewRef.current?.goForward()}
              disabled={!canGoForward}
              style={[styles.headerButton, { marginRight: 8 }]}
              hitSlop={8}
            >
              <Feather
                name="arrow-right"
                size={20}
                color={canGoForward ? Colors.text.primary : Colors.text.muted}
              />
            </Pressable>
          )}
          <Pressable
            onPress={handleOpenExternal}
            style={styles.headerButton}
            hitSlop={8}
          >
            <Feather name="share" size={20} color={Colors.text.primary} />
          </Pressable>
        </View>
      </View>

      {/* WebView */}
      {!error ? (
        <WebView
          ref={webViewRef}
          source={{ uri: previewUrl }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
            setCanGoForward(navState.canGoForward);
            setCurrentUrl(navState.url);
          }}
          // Enable features
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          // Better UX
          allowsBackForwardNavigationGestures={true}
          bounces={false}
          // Security
          originWhitelist={['*']}
          mixedContentMode="compatibility"
          // iOS specific
          {...(Platform.OS === 'ios' && {
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
          })}
          // Android specific
          {...(Platform.OS === 'android' && {
            setSupportMultipleWindows: false,
          })}
        />
      ) : (
        <View style={styles.errorContainer}>
          <View style={[styles.errorIcon, { backgroundColor: Colors.bg.elevated }]}>
            <Feather name="wifi-off" size={32} color={Colors.text.muted} />
          </View>
          <Text style={[styles.errorTitle, { color: Colors.text.primary }]}>
            Could not load event page
          </Text>
          <Text style={[styles.errorMessage, { color: Colors.text.muted }]}>
            Check your internet connection and try again.
          </Text>
          <Pressable
            onPress={handleRetry}
            style={[styles.retryButton, { backgroundColor: Colors.accent.indigo }]}
          >
            <Feather name="refresh-cw" size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {/* Loading Overlay */}
      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingBox, { backgroundColor: Colors.bg.elevated }]}>
            <ActivityIndicator size="large" color={Colors.accent.indigo} />
            <Text style={[styles.loadingText, { color: Colors.text.muted, marginTop: 12 }]}>
              Loading...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
