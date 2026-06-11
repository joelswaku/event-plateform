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

export interface CreateDonationPayload {
  amount: number;
  currency?: string;
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
  message?: string;
  is_anonymous?: boolean;
}

interface DonationState {
  donations: Donation[];
  loading: boolean;
  submitting: boolean;
  totalRaised: number;
  confirmedCount: number;
  donationAmounts: number[];

  fetchDonations: (eventId: string) => Promise<void>;
  createDonation: (eventId: string, payload: CreateDonationPayload) => Promise<Donation>;
  deleteDonation: (eventId: string, donationId: string) => Promise<void>;
  fetchDonationConfig: (eventId: string) => Promise<void>;
  saveDonationConfig: (eventId: string, amounts: number[], message?: string) => Promise<void>;
}

export const useDonationStore = create<DonationState>((set, get) => ({
  donations: [],
  loading: false,
  submitting: false,
  totalRaised: 0,
  confirmedCount: 0,
  donationAmounts: [],

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
      set({ donationAmounts: res.data?.data?.amounts ?? [] });
    } catch { /* non-critical */ }
  },

  saveDonationConfig: async (eventId, amounts, message) => {
    const res = await api.patch(`/engagement/events/${eventId}/donation-config`, { amounts, message });
    set({ donationAmounts: res.data?.data?.amounts ?? amounts });
  },
}));
