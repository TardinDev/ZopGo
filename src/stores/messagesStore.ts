import { create } from 'zustand';
import { notificationsData, messagesData } from '../data';

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

  // Actions
  setSelectedTab: (tab: MessageTab) => void;
  markNotificationAsRead: (id: string) => void;
  markMessageAsRead: (id: string) => void;
  addNotification: (notification: Notification) => void;
  addMessage: (message: Message) => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  // État initial
  selectedTab: 'notifications',
  notifications: notificationsData,
  messages: messagesData,

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
}));
