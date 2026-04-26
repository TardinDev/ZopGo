// Unmock this module so we test the real implementation
jest.unmock('../supabaseAdminMessages');

import { supabase } from '../supabase';
import {
  fetchAdminMessages,
  markAdminMessageAsRead,
  countUnreadAdminMessages,
} from '../supabaseAdminMessages';

function createMockChain(resolvedValue: { data: unknown; error: unknown }) {
  const result = resolvedValue;
  const chain: Record<string, jest.Mock> & { then?: jest.Mock } = {};
  const methods = [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'in',
    'is',
    'not',
    'order',
    'limit',
    'single',
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = jest.fn((resolve, reject) =>
    Promise.resolve(result).then(resolve, reject)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('supabaseAdminMessages', () => {
  describe('fetchAdminMessages', () => {
    it('returns empty array when no messages exist', async () => {
      const chain = createMockChain({ data: [], error: null });
      (supabase.from as jest.Mock).mockReturnValue(chain);

      const result = await fetchAdminMessages('user-1');
      expect(result).toEqual([]);
      expect(supabase.from).toHaveBeenCalledWith('admin_messages');
    });

    it('returns empty array on supabase error', async () => {
      const chain = createMockChain({ data: null, error: { message: 'fail' } });
      (supabase.from as jest.Mock).mockReturnValue(chain);

      const result = await fetchAdminMessages('user-1');
      expect(result).toEqual([]);
    });

    it('maps rows and merges read state', async () => {
      const messagesChain = createMockChain({
        data: [
          {
            id: 'm1',
            sender_clerk_id: 'admin1',
            sender_name: 'Admin',
            target_type: 'all',
            target_user_id: null,
            target_role: null,
            title: 'Hello',
            body: 'World',
            push_sent: true,
            expires_at: null,
            created_at: '2026-04-01T10:00:00Z',
          },
          {
            id: 'm2',
            sender_clerk_id: 'admin1',
            sender_name: 'Admin',
            target_type: 'role',
            target_user_id: null,
            target_role: 'chauffeur',
            title: 'Update',
            body: 'Body 2',
            push_sent: false,
            expires_at: null,
            created_at: '2026-04-02T10:00:00Z',
          },
        ],
        error: null,
      });
      const readsChain = createMockChain({
        data: [{ message_id: 'm1', read_at: '2026-04-01T11:00:00Z' }],
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(messagesChain)
        .mockReturnValueOnce(readsChain);

      const result = await fetchAdminMessages('user-1');

      expect(result).toHaveLength(2);
      const m1 = result.find((m) => m.id === 'm1');
      const m2 = result.find((m) => m.id === 'm2');
      expect(m1?.isRead).toBe(true);
      expect(m1?.readAt).toBe('2026-04-01T11:00:00Z');
      expect(m1?.targetType).toBe('all');
      expect(m2?.isRead).toBe(false);
      expect(m2?.readAt).toBeNull();
      expect(m2?.targetRole).toBe('chauffeur');
    });

    it('does not query reads when message list is empty', async () => {
      const messagesChain = createMockChain({ data: [], error: null });
      (supabase.from as jest.Mock).mockReturnValue(messagesChain);

      await fetchAdminMessages('user-1');
      expect(supabase.from).toHaveBeenCalledTimes(1);
      expect(supabase.from).toHaveBeenCalledWith('admin_messages');
    });
  });

  describe('markAdminMessageAsRead', () => {
    it('upserts a read record and returns true', async () => {
      const chain = createMockChain({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue(chain);

      const ok = await markAdminMessageAsRead('m1', 'user-1');
      expect(ok).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('admin_message_reads');
      expect(chain.upsert).toHaveBeenCalledWith(
        { message_id: 'm1', user_id: 'user-1' },
        { onConflict: 'message_id,user_id', ignoreDuplicates: true }
      );
    });

    it('returns false on supabase error', async () => {
      const chain = createMockChain({ data: null, error: { message: 'fail' } });
      (supabase.from as jest.Mock).mockReturnValue(chain);

      const ok = await markAdminMessageAsRead('m1', 'user-1');
      expect(ok).toBe(false);
    });
  });

  describe('countUnreadAdminMessages', () => {
    it('counts only unread messages', async () => {
      const messagesChain = createMockChain({
        data: [
          {
            id: 'm1',
            sender_clerk_id: 'a',
            sender_name: 'A',
            target_type: 'all',
            target_user_id: null,
            target_role: null,
            title: 't',
            body: 'b',
            push_sent: false,
            expires_at: null,
            created_at: '2026-04-01T10:00:00Z',
          },
          {
            id: 'm2',
            sender_clerk_id: 'a',
            sender_name: 'A',
            target_type: 'all',
            target_user_id: null,
            target_role: null,
            title: 't',
            body: 'b',
            push_sent: false,
            expires_at: null,
            created_at: '2026-04-02T10:00:00Z',
          },
        ],
        error: null,
      });
      const readsChain = createMockChain({
        data: [{ message_id: 'm1', read_at: '2026-04-01T11:00:00Z' }],
        error: null,
      });
      (supabase.from as jest.Mock)
        .mockReturnValueOnce(messagesChain)
        .mockReturnValueOnce(readsChain);

      const count = await countUnreadAdminMessages('user-1');
      expect(count).toBe(1);
    });
  });
});
