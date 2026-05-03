import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useScannerStore } from '@/store/scanner.store';

/**
 * Listens for network reconnection and automatically batch-syncs
 * any pending offline scans for the given eventId.
 */
export function useOfflineSync(eventId: string | null) {
  const syncOffline  = useScannerStore(s => s.syncOffline);
  const offlineQueue = useScannerStore(s => s.offlineQueue);
  const wasOffline   = useRef(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? true;

      if (!isConnected) {
        wasOffline.current = true;
        return;
      }

      // Just came back online and have pending items
      if (wasOffline.current && offlineQueue.length > 0 && eventId) {
        wasOffline.current = false;
        syncOffline(eventId);
      } else {
        wasOffline.current = false;
      }
    });

    return unsub;
  }, [eventId, offlineQueue.length, syncOffline]);
}
