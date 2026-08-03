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
  donor_phone?: string | null;
  is_anonymous?: boolean;
  frequency?: 'one_time' | 'monthly' | string | null;
  provider_transaction_id?: string | null;
  payment_status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  donated_at: string | null;
  created_at: string;
}

export interface CreateDonationPayload {
  amount: number;
  currency?: string;
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
  message?: string;
  is_anonymous?: boolean;
}

export interface DonationConfig {
  amounts: number[];
  message: string;
  title: string;
  cover_image: string;
}

interface DonationState {
  donations: Donation[];
  loading: boolean;
  submitting: boolean;
  totalRaised: number;
  confirmedCount: number;
  donationAmounts: number[];
  donationConfig: DonationConfig;

  fetchDonations: (eventId: string) => Promise<void>;
  createDonation: (eventId: string, payload: CreateDonationPayload) => Promise<Donation>;
  deleteDonation: (eventId: string, donationId: string) => Promise<void>;
  fetchDonationConfig: (eventId: string) => Promise<void>;
  saveDonationConfig: (eventId: string, amounts: number[], message?: string, title?: string, coverImage?: string) => Promise<void>;
}

export const useDonationStore = create<DonationState>((set, get) => ({
  donations: [],
  loading: false,
  submitting: false,
  totalRaised: 0,
  confirmedCount: 0,
  donationAmounts: [],
  donationConfig: { amounts: [], message: '', title: '', cover_image: '' },

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

  createDonation: async (eventId, payload) => {
    set({ submitting: true });
    try {
      const res = await api.post(`/engagement/events/${eventId}/donations/manual`, payload);
      const donation: Donation = res.data?.data ?? res.data;
      const updated = [donation, ...get().donations];
      const succeeded = updated.filter(d => d.payment_status === 'SUCCEEDED');
      set({
        donations: updated,
        totalRaised: succeeded.reduce((s, d) => s + Number(d.amount), 0),
        confirmedCount: succeeded.length,
      });
      return donation;
    } finally {
      set({ submitting: false });
    }
  },

  deleteDonation: async (eventId, donationId) => {
    await api.delete(`/engagement/events/${eventId}/donations/${donationId}`);
    const updated = get().donations.filter(d => d.id !== donationId);
    const succeeded = updated.filter(d => d.payment_status === 'SUCCEEDED');
    set({
      donations: updated,
      totalRaised: succeeded.reduce((s, d) => s + Number(d.amount), 0),
      confirmedCount: succeeded.length,
    });
  },

  fetchDonationConfig: async (eventId) => {
    try {
      const res = await api.get(`/engagement/events/${eventId}/donation-config`);
      const config: DonationConfig = {
        amounts: res.data?.data?.amounts ?? [],
        message: res.data?.data?.message ?? '',
        title: res.data?.data?.title ?? '',
        cover_image: res.data?.data?.cover_image ?? '',
      };
      set({ donationAmounts: config.amounts, donationConfig: config });
    } catch { /* non-critical */ }
  },

  saveDonationConfig: async (eventId, amounts, message, title, coverImage) => {
    const res = await api.patch(`/engagement/events/${eventId}/donation-config`, {
      amounts, message, title, cover_image: coverImage,
    });
    const config: DonationConfig = {
      amounts: res.data?.data?.amounts ?? amounts,
      message: res.data?.data?.message ?? message ?? '',
      title: res.data?.data?.title ?? title ?? '',
      cover_image: res.data?.data?.cover_image ?? coverImage ?? '',
    };
    set({ donationAmounts: config.amounts, donationConfig: config });
  },
}));
