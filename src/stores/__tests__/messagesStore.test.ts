import * as Network from 'expo-network';
import { useMessagesStore } from '../messagesStore';
import { supabase } from '../../lib/supabase';
import type { Notification, Message } from '../messagesStore';

beforeEach(() => {
  jest.clearAllMocks();
  useMessagesStore.setState({
    selectedTab: 'notifications',
    notifications: [],
    messages: [],
    isLoading: false,
  });
});

const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: '1',
  type: 'info',
  title: 'Test',
  message: 'Test message',
  time: 'Il y a 5 min',
  read: false,
  icon: 'information-circle',
  iconColor: '#6366F1',
  iconBg: '#E0E7FF',
  ...overrides,
});

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: '1',
  sender: 'John',
  avatar: 'https://example.com/avatar.jpg',
  content: 'Hello',
  date: '2026-01-01',
  time: '10:00',
  read: false,
  ...overrides,
});

describe('messagesStore', () => {
  describe('setSelectedTab', () => {
    it('switches to messages tab', () => {
      useMessagesStore.getState().setSelectedTab('messages');
      expect(useMessagesStore.getState().selectedTab).toBe('messages');
    });

    it('switches back to notifications tab', () => {
      useMessagesStore.getState().setSelectedTab('messages');
      useMessagesStore.getState().setSelectedTab('notifications');
      expect(useMessagesStore.getState().selectedTab).toBe('notifications');
    });
  });

  describe('addNotification', () => {
    it('adds notification to beginning', () => {
      const n = makeNotification();
      useMessagesStore.getState().addNotification(n);
      expect(useMessagesStore.getState().notifications).toHaveLength(1);
      expect(useMessagesStore.getState().notifications[0]).toEqual(n);
    });

    it('prepends new notification', () => {
      useMessagesStore.getState().addNotification(makeNotification({ id: '1' }));
      useMessagesStore.getState().addNotification(makeNotification({ id: '2' }));
      expect(useMessagesStore.getState().notifications[0].id).toBe('2');
    });
  });

  describe('markNotificationAsRead', () => {
    it('marks a specific notification as read', () => {
      useMessagesStore.getState().addNotification(makeNotification({ id: '1' }));
      useMessagesStore.getState().addNotification(makeNotification({ id: '2' }));
      useMessagesStore.getState().markNotificationAsRead('1');
      const notifs = useMessagesStore.getState().notifications;
      expect(notifs.find((n) => n.id === '1')?.read).toBe(true);
      expect(notifs.find((n) => n.id === '2')?.read).toBe(false);
    });
  });

  describe('addMessage', () => {
    it('adds message to beginning', () => {
      const m = makeMessage();
      useMessagesStore.getState().addMessage(m);
      expect(useMessagesStore.getState().messages).toHaveLength(1);
    });
  });

  describe('markMessageAsRead', () => {
    it('marks a specific message as read', () => {
      useMessagesStore.getState().addMessage(makeMessage({ id: '1' }));
      useMessagesStore.getState().addMessage(makeMessage({ id: '2' }));
      useMessagesStore.getState().markMessageAsRead('1');
      const msgs = useMessagesStore.getState().messages;
      expect(msgs.find((m) => m.id === '1')?.read).toBe(true);
      expect(msgs.find((m) => m.id === '2')?.read).toBe(false);
    });
  });

  describe('loadNotifications', () => {
    it('sets isLoading during fetch', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useMessagesStore.getState().loadNotifications('user1', 'client');
      expect(useMessagesStore.getState().isLoading).toBe(false);
    });

    it('does nothing when offline', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ type: 'NONE', isConnected: false });
      (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));
      await useMessagesStore.getState().loadNotifications('user1', 'client');
      expect(supabase.from).not.toHaveBeenCalled();
      expect(useMessagesStore.getState().isLoading).toBe(false);
    });

    it('loads and transforms notifications from Supabase', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'n1',
              type: 'reservation',
              title: 'Welcome',
              message: 'Hello',
              created_at: new Date().toISOString(),
              read: false,
              icon: 'star',
              icon_color: '#FFF',
              icon_bg: '#000',
              recipient_role: 'client',
              recipient_id: 'user1',
              data: { reservationId: 'res-1', clientId: 'cli-1' },
            },
          ],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useMessagesStore.getState().loadNotifications('user1', 'client');
      const notifs = useMessagesStore.getState().notifications;
      expect(notifs).toHaveLength(1);
      expect(notifs[0].title).toBe('Welcome');
      expect(notifs[0].icon).toBe('star');
      expect(notifs[0].data).toEqual({ reservationId: 'res-1', clientId: 'cli-1' });
    });

    it('logs Supabase errors in dev', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB error' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      jest.spyOn(console, 'error').mockImplementation(() => {});
      await useMessagesStore.getState().loadNotifications('user1', 'client');
      expect(console.error).toHaveBeenCalled();
    });

    it('catches exceptions and resets loading', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('crash');
      });

      jest.spyOn(console, 'error').mockImplementation(() => {});
      await useMessagesStore.getState().loadNotifications('user1', 'client');
      expect(useMessagesStore.getState().isLoading).toBe(false);
    });
  });
});
