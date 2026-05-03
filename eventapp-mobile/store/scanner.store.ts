import { create } from 'zustand';
import api from '@/lib/api';
import {
  loadQueue, saveQueue, enqueue, dequeue, getDeviceId,
} from '@/lib/offline-queue';
import { ScanResult, ScanResultType, OfflineScan, ScannerStats } from '@/types';
import { Config } from '@/constants/config';

interface ScannerState {
  feed:         ScanResult[];
  stats:        ScannerStats | null;
  offlineQueue: OfflineScan[];
  syncing:      boolean;
  online:       boolean;
  lastScanAt:   number;

  // Actions
  setOnline:       (online: boolean) => void;
  loadQueue:       () => Promise<void>;
  scanTicket:      (eventId: string, qrToken: string) => Promise<ScanResult>;
  syncOffline:     (eventId: string) => Promise<void>;
  fetchStats:      (eventId: string) => Promise<void>;
  pushToFeed:      (result: ScanResult) => void;
  clearFeed:       () => void;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  feed:         [],
  stats:        null,
  offlineQueue: [],
  syncing:      false,
  online:       true,
  lastScanAt:   0,

  setOnline: (online) => set({ online }),

  loadQueue: async () => {
    const q = await loadQueue();
    set({ offlineQueue: q });
  },

  scanTicket: async (eventId, qrToken) => {
    const now = Date.now();
    // Debounce
    if (now - get().lastScanAt < Config.SCANNER.DEBOUNCE_MS) {
      return {
        type: 'INVALID' as ScanResultType,
        qr_token: qrToken,
        message: 'Scan too fast — wait a moment',
        scanned_at: new Date().toISOString(),
      };
    }
    set({ lastScanAt: now });

    // Offline path
    if (!get().online) {
      const updated = await enqueue(qrToken, eventId);
      set({ offlineQueue: updated });
      const result: ScanResult = {
        type: 'QUEUED',
        qr_token: qrToken,
        message: 'Saved — will sync when online',
        scanned_at: new Date().toISOString(),
      };
      get().pushToFeed(result);
      return result;
    }

    // Online path
    try {
      const deviceId = await getDeviceId();
      const res      = await api.post<{
        data: {
          checked_in: boolean;
          ticket_type_name: string;
          holder_name: string;
          holder_email: string;
          checked_in_at: string;
        };
      }>(`/checkin/events/${eventId}/tickets/checkin`, {
        qr_token:  qrToken,
        device_id: deviceId,
      });

      const d      = res.data.data;
      const result: ScanResult = {
        type:             'SUCCESS',
        qr_token:         qrToken,
        holder_name:      d.holder_name,
        holder_email:     d.holder_email,
        ticket_type_name: d.ticket_type_name,
        scanned_at:       d.checked_in_at,
      };
      get().pushToFeed(result);
      get().fetchStats(eventId);
      return result;
    } catch (err: unknown) {
      const status  = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown error';

      let type: ScanResultType = 'INVALID';
      if (status === 409)                              type = 'DUPLICATE';
      else if (message.toLowerCase().includes('revoked')) type = 'REVOKED';

      const result: ScanResult = { type, qr_token: qrToken, message, scanned_at: new Date().toISOString() };
      get().pushToFeed(result);
      return result;
    }
  },

  syncOffline: async (eventId) => {
    if (get().syncing) return;
    const pending = get().offlineQueue.filter(s => s.eventId === eventId);
    if (!pending.length) return;

    set({ syncing: true });
    try {
      const deviceId = await getDeviceId();
      await api.post(`/scanner/events/${eventId}/tickets/checkin/batch-sync`, {
        scans:     pending.map(s => ({ qr_token: s.qr_token })),
        device_id: deviceId,
      });
      const synced  = pending.map(s => s.qr_token);
      const updated = await dequeue(synced);
      set({ offlineQueue: updated });
      await get().fetchStats(eventId);
    } catch { /* retry next reconnect */ } finally {
      set({ syncing: false });
    }
  },

  fetchStats: async (eventId) => {
    try {
      const res = await api.get<{ data: ScannerStats }>(`/scanner/events/${eventId}/dashboard`);
      set({ stats: res.data?.data ?? null });
    } catch { /* non-critical */ }
  },

  pushToFeed: (result) => {
    set(s => ({
      feed: [result, ...s.feed].slice(0, Config.SCANNER.MAX_FEED),
    }));
  },

  clearFeed: () => set({ feed: [] }),
}));
