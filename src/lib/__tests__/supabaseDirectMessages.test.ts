jest.unmock('../supabaseDirectMessages');

import { supabase } from '../supabase';
import * as push from '../pushNotifications';
import {
  sendDirectMessage,
  fetchConversation,
  fetchConversationsList,
  markMessagesAsRead,
} from '../supabaseDirectMessages';

jest.mock('../pushNotifications', () => ({
  sendPushIfAllowed: jest.fn().mockResolvedValue({ inAppCreated: false, pushSent: true }),
}));

function chain(resolved: { data: unknown; error: unknown }) {
  const c: Record<string, jest.Mock> & { then?: jest.Mock } = {};
  for (const m of [
    'select',
    'insert',
    'update',
    'eq',
    'or',
    'order',
    'limit',
    'single',
  ]) {
    c[m] = jest.fn().mockReturnValue(c);
  }
  c.then = jest.fn((res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  );
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sendDirectMessage', () => {
  it('inserts the message + fires a push without an in-app record', async () => {
    const c = chain({
      data: {
        id: 'm-1',
        sender_id: 's',
        receiver_id: 'r',
        reservation_id: null,
        content: 'hello',
        read: false,
        created_at: '2026-01-01',
        sender: { name: 'Alice' },
      },
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const msg = await sendDirectMessage({
      senderId: 's',
      receiverId: 'r',
      content: 'hello',
    });

    expect(msg?.id).toBe('m-1');
    expect(msg?.content).toBe('hello');
    expect(push.sendPushIfAllowed).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientProfileId: 'r',
        category: 'messages',
        type: 'direct_message',
        title: 'Alice',
        body: 'hello',
        createInAppRecord: false,
      })
    );
  });

  it('truncates push body when content is > 100 chars', async () => {
    const long = 'x'.repeat(150);
    const c = chain({
      data: {
        id: 'm-2',
        sender_id: 's',
        receiver_id: 'r',
        reservation_id: null,
        content: long,
        read: false,
        created_at: '2026-01-01',
        sender: { name: 'Alice' },
      },
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await sendDirectMessage({ senderId: 's', receiverId: 'r', content: long });

    const pushCall = (push.sendPushIfAllowed as jest.Mock).mock.calls[0][0];
    expect(pushCall.body).toHaveLength(100);
    expect(pushCall.body.endsWith('...')).toBe(true);
  });

  it('returns null + skips push on insert error', async () => {
    const c = chain({ data: null, error: { message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const msg = await sendDirectMessage({ senderId: 's', receiverId: 'r', content: 'hi' });

    expect(msg).toBeNull();
    expect(push.sendPushIfAllowed).not.toHaveBeenCalled();
  });

  it('forwards reservationId in push data when present', async () => {
    const c = chain({
      data: {
        id: 'm-3',
        sender_id: 's',
        receiver_id: 'r',
        reservation_id: 'res-1',
        content: 'hi',
        read: false,
        created_at: '2026-01-01',
        sender: { name: 'Bob' },
      },
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await sendDirectMessage({
      senderId: 's',
      receiverId: 'r',
      reservationId: 'res-1',
      content: 'hi',
    });

    const pushCall = (push.sendPushIfAllowed as jest.Mock).mock.calls[0][0];
    expect(pushCall.data.reservationId).toBe('res-1');
  });
});

describe('fetchConversation', () => {
  it('queries both directions via .or and orders by created_at asc', async () => {
    const c = chain({
      data: [
        { id: 'm1', sender_id: 'u1', receiver_id: 'u2', reservation_id: null, content: 'A', read: true, created_at: '2026-01-01T10:00:00Z' },
        { id: 'm2', sender_id: 'u2', receiver_id: 'u1', reservation_id: null, content: 'B', read: false, created_at: '2026-01-01T10:05:00Z' },
      ],
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchConversation('u1', 'u2');

    expect(out).toHaveLength(2);
    expect(out[0].senderId).toBe('u1');
    expect(c.order).toHaveBeenCalledWith('created_at', { ascending: true });
    const orCall = c.or.mock.calls[0][0];
    expect(orCall).toContain('sender_id.eq.u1');
    expect(orCall).toContain('receiver_id.eq.u2');
    expect(orCall).toContain('sender_id.eq.u2');
    expect(orCall).toContain('receiver_id.eq.u1');
  });

  it('filters by reservationId when provided', async () => {
    const c = chain({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await fetchConversation('u1', 'u2', 'res-1');
    expect(c.eq).toHaveBeenCalledWith('reservation_id', 'res-1');
  });

  it('returns empty array on error', async () => {
    const c = chain({ data: null, error: { message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await fetchConversation('u1', 'u2')).toEqual([]);
  });
});

describe('fetchConversationsList', () => {
  it('dedupes by partner id and picks the most recent', async () => {
    const c = chain({
      data: [
        // newest first (DESC) — first item per partner wins
        { id: 'm3', sender_id: 'u1', receiver_id: 'p2', reservation_id: null, content: 'latest p2', read: false, created_at: '2026-01-02', receiver: { name: 'Bob', avatar: '' } },
        { id: 'm2', sender_id: 'p2', receiver_id: 'u1', reservation_id: null, content: 'older p2', read: true, created_at: '2026-01-01', sender: { name: 'Bob', avatar: '' } },
        { id: 'm1', sender_id: 'p1', receiver_id: 'u1', reservation_id: null, content: 'p1', read: true, created_at: '2026-01-01', sender: { name: 'Alice', avatar: '' } },
      ],
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchConversationsList('u1');
    expect(out).toHaveLength(2);
    expect(out[0].partnerId).toBe('p2');
    expect(out[0].content).toBe('latest p2'); // dedupe kept the newest
    expect(out[0].partnerName).toBe('Bob');
    expect(out[1].partnerId).toBe('p1');
  });

  it('defaults partnerName to "Utilisateur" when join returns nothing', async () => {
    const c = chain({
      data: [{ id: 'm1', sender_id: 'unknown', receiver_id: 'u1', reservation_id: null, content: 'x', read: true, created_at: '2026-01-01' }],
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchConversationsList('u1');
    expect(out[0].partnerName).toBe('Utilisateur');
  });
});

describe('markMessagesAsRead', () => {
  it('updates read=true scoped to (receiver, sender, unread)', async () => {
    const c = chain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await markMessagesAsRead('r', 's');

    expect(ok).toBe(true);
    expect(c.update).toHaveBeenCalledWith({ read: true });
    expect(c.eq).toHaveBeenCalledWith('receiver_id', 'r');
    expect(c.eq).toHaveBeenCalledWith('sender_id', 's');
    expect(c.eq).toHaveBeenCalledWith('read', false);
  });

  it('returns false on error', async () => {
    const c = chain({ data: null, error: { message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await markMessagesAsRead('r', 's')).toBe(false);
  });
});
