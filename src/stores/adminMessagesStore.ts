import { create } from 'zustand';
import {
  fetchAdminMessages,
  markAdminMessageAsRead as markAsReadInDb,
} from '../lib/supabaseAdminMessages';
import { checkNetwork } from '../hooks/useNetworkStatus';
import type { AdminMessage } from '../types';

interface AdminMessagesState {
  adminMessages: AdminMessage[];
  isLoading: boolean;

  loadAdminMessages: (profileId: string) => Promise<void>;
  markAsRead: (messageId: string, profileId: string) => Promise<void>;
  reset: () => void;
}

export const useAdminMessagesStore = create<AdminMessagesState>((set, get) => ({
  adminMessages: [],
  isLoading: false,

  loadAdminMessages: async (profileId: string) => {
    set({ isLoading: true });
    try {
      const connected = await checkNetwork();
      if (!connected) {
        set({ isLoading: false });
        return;
      }
      const messages = await fetchAdminMessages(profileId);
      set({ adminMessages: messages });
    } catch (err) {
      if (__DEV__) console.error('loadAdminMessages error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (messageId: string, profileId: string) => {
    // Optimistic update
    const current = get().adminMessages;
    const target = current.find((m) => m.id === messageId);
    if (!target || target.isRead) return;

    set({
      adminMessages: current.map((m) =>
        m.id === messageId
          ? { ...m, isRead: true, readAt: new Date().toISOString() }
          : m
      ),
    });

    const ok = await markAsReadInDb(messageId, profileId);
    if (!ok) {
      // Rollback
      set({ adminMessages: current });
    }
  },

  reset: () => set({ adminMessages: [], isLoading: false }),
}));
