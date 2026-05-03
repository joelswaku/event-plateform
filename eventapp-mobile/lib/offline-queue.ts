import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineScan } from '@/types';
import { Config } from '@/constants/config';

const KEY = Config.ASYNC_STORAGE_KEYS.SCANNER_QUEUE;

export async function loadQueue(): Promise<OfflineScan[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OfflineScan[]) : [];
  } catch {
    return [];
  }
}

export async function saveQueue(queue: OfflineScan[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(queue));
  } catch { /* storage full — degrade gracefully */ }
}

export async function enqueue(qr_token: string, eventId: string): Promise<OfflineScan[]> {
  const queue = await loadQueue();
  // Deduplicate by qr_token
  if (queue.some(s => s.qr_token === qr_token)) return queue;
  const updated = [
    ...queue,
    { qr_token, eventId, queued_at: new Date().toISOString(), status: 'pending' as const },
  ];
  await saveQueue(updated);
  return updated;
}

export async function dequeue(qr_tokens: string[]): Promise<OfflineScan[]> {
  const queue   = await loadQueue();
  const updated = queue.filter(s => !qr_tokens.includes(s.qr_token));
  await saveQueue(updated);
  return updated;
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

// ─── Device ID (stable per install) ──────────────────────────────────────────
const DEVICE_KEY = Config.ASYNC_STORAGE_KEYS.DEVICE_ID;

export async function getDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = `mobile-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return 'mobile-fallback';
  }
}
