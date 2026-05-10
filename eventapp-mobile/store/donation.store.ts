import { create } from 'zustand';
import api from '@/lib/api';

export interface Donation {
  id: string;
  event_id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  currency: string;
  message: string | null;
  payment_status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  donated_at: string | null;
  created_at: string;
}

interface DonationState {
  donations: Donation[];
  loading: boolean;
  totalRaised: number;
  confirmedCount: number;

  fetchDonations: (eventId: string) => Promise<void>;
}

export const useDonationStore = create<DonationState>((set) => ({
  donations: [],
  loading: false,
  totalRaised: 0,
  confirmedCount: 0,

  fetchDonations: async (eventId) => {
    set({ loading: true });
    try {
      const res = await api.get(`/engagement/events/${eventId}/donations`);
      const list: Donation[] = res.data?.data ?? res.data?.donations ?? [];
      const succeeded = list.filter(d => d.payment_status === 'SUCCEEDED');
      set({
        donations: list,
        totalRaised: succeeded.reduce((s, d) => s + Number(d.amount), 0),
        confirmedCount: succeeded.length,
      });
    } catch {
      // non-critical
    } finally {
      set({ loading: false });
    }
  },
}));
