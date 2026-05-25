import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { checkNetwork } from '../hooks/useNetworkStatus';
import { fetchConversationsList } from '../lib/supabaseDirectMessages';
import { fetchReservationContexts } from '../lib/supabaseReservations';
import { fetchHebergementReservationContexts } from '../lib/supabaseHebergementReservations';
import { markNotificationAsReadInDb } from '../lib/supabaseNotificationsCreate';
import { formatTimeAgo } from '../utils/timeAgo';

type MessageTab = 'annonces' | 'notifications' | 'messages';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  /**
   * Pre-computed relative label (e.g. "Il y a 5 min"). Set at insertion
   * time. Stale for long-lived sessions — render code should prefer
   * `createdAtMs` when present and recompute on mount.
   */
  time: string;
  /**
   * Epoch ms of when the notification was created. Optional for backward
   * compatibility, but always set by every code path that inserts now.
   */
  createdAtMs?: number;
  read: boolean;
  icon: string;
  iconColor: string;
  iconBg: string;
  recipientRole?: 'client' | 'chauffeur' | 'all';
  recipientId?: string;
  data?: Record<string, string>;
}

export interface Message {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  date: string;
  time: string;
  read: boolean;
  partnerId?: string;
  reservationId?: string;
  contextLabel?: string;
}

interface SupabaseNotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  icon?: string;
  icon_color?: string;
  icon_bg?: string;
  recipient_role?: 'client' | 'chauffeur' | 'all';
  recipient_id?: string;
  data?: Record<string, string>;
}

interface MessagesState {
  selectedTab: MessageTab;
  notifications: Notification[];
  messages: Message[];
  isLoading: boolean;

  setSelectedTab: (tab: MessageTab) => void;
  markNotificationAsRead: (id: string) => void;
  markMessageAsRead: (id: string) => void;
  addNotification: (notification: Notification) => void;
  addMessage: (message: Message) => void;
  loadNotifications: (userId: string, userRole: string) => Promise<void>;
  loadConversations: (userId: string) => Promise<void>;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  selectedTab: 'notifications',
  notifications: [],
  messages: [],
  isLoading: false,

  setSelectedTab: (tab) => set({ selectedTab: tab }),

  markNotificationAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    // Persist to Supabase (fire-and-forget)
    markNotificationAsReadInDb(id);
  },

  markMessageAsRead: (id) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, read: true } : m)),
    }));
    // Supabase persistence is handled by the conversation screen's markMessagesAsRead
  },

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: [message, ...state.messages],
    })),

  loadNotifications: async (userId: string, userRole: string) => {
    set({ isLoading: true });
    try {
      const connected = await checkNetwork();
      if (!connected) {
        set({ isLoading: false });
        return;
      }
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_id.eq.${userId},recipient_role.eq.${userRole},recipient_role.eq.all`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        if (__DEV__) console.error('Error loading notifications:', error.message);
        return;
      }

      if (data) {
        const notifications: Notification[] = data.map((n: SupabaseNotificationRow) => {
          const createdAtMs = new Date(n.created_at).getTime();
          return {
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            time: formatTimeAgo(createdAtMs),
            createdAtMs,
            read: n.read,
            icon: n.icon || 'information-circle',
            iconColor: n.icon_color || '#6366F1',
            iconBg: n.icon_bg || '#E0E7FF',
            recipientRole: n.recipient_role,
            recipientId: n.recipient_id,
            data: n.data || {},
          };
        });
        set({ notifications });
      }
    } catch (err) {
      if (__DEV__) console.error('loadNotifications error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadConversations: async (userId: string) => {
    set({ isLoading: true });
    try {
      const connected = await checkNetwork();
      if (!connected) {
        set({ isLoading: false });
        return;
      }
      const items = await fetchConversationsList(userId);

      // Batch-fetch route context for conversations linked to reservations
      const reservationIds = items
        .map((item) => item.reservationId)
        .filter((id): id is string => !!id);
      const uniqueIds = [...new Set(reservationIds)];

      // Fetch trajet contexts
      const trajetContexts = uniqueIds.length > 0 ? await fetchReservationContexts(uniqueIds) : {};

      // Fetch hébergement contexts for IDs not found in trajet contexts
      const remainingIds = uniqueIds.filter((id) => !trajetContexts[id]);
      const hebContexts = remainingIds.length > 0
        ? await fetchHebergementReservationContexts(remainingIds)
        : {};

      const messages: Message[] = items.map((item) => {
        const created = new Date(item.createdAt);
        const trajetCtx = item.reservationId ? trajetContexts[item.reservationId] : undefined;
        const hebCtx = item.reservationId ? hebContexts[item.reservationId] : undefined;
        let contextLabel: string | undefined;
        if (trajetCtx) {
          contextLabel = `${trajetCtx.villeDepart} → ${trajetCtx.villeArrivee}`;
        } else if (hebCtx) {
          contextLabel = `${hebCtx.hebergementNom} — ${hebCtx.hebergementVille}`;
        }
        return {
          id: item.id,
          sender: item.partnerName || 'Utilisateur',
          avatar: item.partnerAvatar || '',
          content: item.content,
          date: created.toLocaleDateString('fr-FR'),
          time: formatTimeAgo(created),
          read: item.read,
          partnerId: item.partnerId,
          reservationId: item.reservationId,
          contextLabel,
        };
      });
      set({ messages });
    } catch (err) {
      if (__DEV__) console.error('loadConversations error:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
