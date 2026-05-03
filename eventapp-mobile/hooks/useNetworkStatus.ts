import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useScannerStore } from '@/store/scanner.store';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const setOnline = useScannerStore(s => s.setOnline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      setOnline(connected);
    });

    // Initial check
    NetInfo.fetch().then(state => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      setOnline(connected);
    });

    return unsubscribe;
  }, [setOnline]);

  return isConnected;
}
