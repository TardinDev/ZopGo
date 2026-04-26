import { useAdminMessagesStore } from '../adminMessagesStore';
import {
  fetchAdminMessages,
  markAdminMessageAsRead,
} from '../../lib/supabaseAdminMessages';
import type { AdminMessage } from '../../types';

const makeMessage = (overrides: Partial<AdminMessage> = {}): AdminMessage => ({
  id: 'm1',
  senderName: 'Admin',
  targetType: 'all',
  targetUserId: null,
  targetRole: null,
  title: 'Test annonce',
  body: 'Contenu de test',
  expiresAt: null,
  createdAt: '2026-04-01T10:00:00Z',
  isRead: false,
  readAt: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  useAdminMessagesStore.setState({ adminMessages: [], isLoading: false });
  // Default: network is reachable
  (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({ ok: true });
});

describe('adminMessagesStore', () => {
  describe('loadAdminMessages', () => {
    it('populates adminMessages from supabase', async () => {
      const messages = [makeMessage({ id: 'm1' }), makeMessage({ id: 'm2' })];
      (fetchAdminMessages as jest.Mock).mockResolvedValueOnce(messages);

      await useAdminMessagesStore.getState().loadAdminMessages('user-1');
      expect(useAdminMessagesStore.getState().adminMessages).toEqual(messages);
      expect(useAdminMessagesStore.getState().isLoading).toBe(false);
    });

    it('skips fetch when offline', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'));

      await useAdminMessagesStore.getState().loadAdminMessages('user-1');
      expect(fetchAdminMessages).not.toHaveBeenCalled();
      expect(useAdminMessagesStore.getState().adminMessages).toEqual([]);
    });

    it('keeps store stable on lib error', async () => {
      (fetchAdminMessages as jest.Mock).mockRejectedValueOnce(new Error('boom'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await useAdminMessagesStore.getState().loadAdminMessages('user-1');
      expect(useAdminMessagesStore.getState().adminMessages).toEqual([]);
      expect(useAdminMessagesStore.getState().isLoading).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('does nothing when message is missing', async () => {
      await useAdminMessagesStore.getState().markAsRead('unknown', 'user-1');
      expect(markAdminMessageAsRead).not.toHaveBeenCalled();
    });

    it('does nothing when already read', async () => {
      useAdminMessagesStore.setState({
        adminMessages: [makeMessage({ id: 'm1', isRead: true })],
      });
      await useAdminMessagesStore.getState().markAsRead('m1', 'user-1');
      expect(markAdminMessageAsRead).not.toHaveBeenCalled();
    });

    it('optimistically marks as read and persists', async () => {
      useAdminMessagesStore.setState({
        adminMessages: [makeMessage({ id: 'm1', isRead: false })],
      });
      (markAdminMessageAsRead as jest.Mock).mockResolvedValueOnce(true);

      await useAdminMessagesStore.getState().markAsRead('m1', 'user-1');

      const updated = useAdminMessagesStore
        .getState()
        .adminMessages.find((m) => m.id === 'm1');
      expect(updated?.isRead).toBe(true);
      expect(updated?.readAt).not.toBeNull();
      expect(markAdminMessageAsRead).toHaveBeenCalledWith('m1', 'user-1');
    });

    it('rolls back optimistic update if persistence fails', async () => {
      const original = makeMessage({ id: 'm1', isRead: false });
      useAdminMessagesStore.setState({ adminMessages: [original] });
      (markAdminMessageAsRead as jest.Mock).mockResolvedValueOnce(false);

      await useAdminMessagesStore.getState().markAsRead('m1', 'user-1');

      expect(useAdminMessagesStore.getState().adminMessages).toEqual([original]);
    });
  });

  describe('reset', () => {
    it('clears adminMessages and isLoading', () => {
      useAdminMessagesStore.setState({
        adminMessages: [makeMessage()],
        isLoading: true,
      });
      useAdminMessagesStore.getState().reset();
      expect(useAdminMessagesStore.getState().adminMessages).toEqual([]);
      expect(useAdminMessagesStore.getState().isLoading).toBe(false);
    });
  });
});
