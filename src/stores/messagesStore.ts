import * as Sentry from '@sentry/react-native';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

type MessageTab = 'notifications' | 'messages';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  iconColor: string;
  iconBg: string;
  recipientRole?: 'client' | 'chauffeur' | 'all';
  recipientId?: string;
}

export interface Message {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  date: string;
  time: string;
  read: boolean;
}

interface MessagesState {
  // État
  selectedTab: MessageTab;
  notifications: Notification[];
  messages: Message[];
  isLoading: boolean;

  // Actions
  setSelectedTab: (tab: MessageTab) => void;
  markNotificationAsRead: (id: string) => void;
  markMessageAsRead: (id: string) => void;
  addNotification: (notification: Notification) => void;
  addMessage: (message: Message) => void;
  loadNotifications: (userId: string, userRole: string) => Promise<void>;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  // État initial — vide, plus de mocks
  selectedTab: 'notifications',
  notifications: [],
  messages: [],
  isLoading: false,

  // Actions
  setSelectedTab: (tab) => set({ selectedTab: tab }),

  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markMessageAsRead: (id) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, read: true } : m)),
    })),

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
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_id.eq.${userId},recipient_role.eq.${userRole},recipient_role.eq.all`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        Sentry.captureException(new Error(`Error loading notifications: ${error.message}`));
        return;
      }

      if (data) {
        const notifications: Notification[] = data.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          time: formatTimeAgo(new Date(n.created_at)),
          read: n.read,
          icon: n.icon || 'information-circle',
          iconColor: n.icon_color || '#6366F1',
          iconBg: n.icon_bg || '#E0E7FF',
          recipientRole: n.recipient_role,
          recipientId: n.recipient_id,
        }));
        set({ notifications });
      }
    } catch (err) {
      Sentry.captureException(err);
    } finally {
      set({ isLoading: false });
    }
  },
}));

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  return `Il y a ${diffD} jours`;
}
