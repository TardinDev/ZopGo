// Hook-level tests using @testing-library/react-native's renderHook.
// We mock supabase.channel() at the module level so we can inspect what
// the hook actually asks Supabase to subscribe to.

import { renderHook, act } from '@testing-library/react-native';
import { supabase } from '../../lib/supabase';
import { useSupabaseSubscription } from '../useSupabaseSubscription';

// Mocked at module level by jest.setup.js — extend with the realtime API
// surface we use here.
interface MockedChannel {
  on: jest.Mock;
  subscribe: jest.Mock;
}

let lastChannel: MockedChannel | null = null;
let removeChannelMock: jest.Mock;

beforeEach(() => {
  lastChannel = null;
  removeChannelMock = jest.fn();
  (supabase as unknown as {
    channel: jest.Mock;
    removeChannel: jest.Mock;
  }).channel = jest.fn((_name: string) => {
    const ch: MockedChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };
    lastChannel = ch;
    return ch as unknown as ReturnType<typeof supabase.channel>;
  });
  (supabase as unknown as { removeChannel: jest.Mock }).removeChannel = removeChannelMock;
});

describe('useSupabaseSubscription — subscribe params', () => {
  it('subscribes to postgres_changes with the right table + filter', () => {
    const onChange = jest.fn();
    renderHook(() =>
      useSupabaseSubscription({
        table: 'trajets',
        filter: 'status=eq.en_attente',
        event: 'INSERT',
        onChange,
      })
    );

    expect(supabase.channel).toHaveBeenCalledTimes(1);
    const channelName = (supabase.channel as jest.Mock).mock.calls[0][0];
    expect(channelName).toMatch(/^trajets-status=eq\.en_attente-/);

    const onCall = lastChannel!.on.mock.calls[0];
    expect(onCall[0]).toBe('postgres_changes');
    expect(onCall[1]).toMatchObject({
      event: 'INSERT',
      schema: 'public',
      table: 'trajets',
      filter: 'status=eq.en_attente',
    });
    expect(lastChannel!.subscribe).toHaveBeenCalled();
  });

  it('defaults event to "*" and omits filter when not provided', () => {
    renderHook(() =>
      useSupabaseSubscription({
        table: 'notifications',
        onChange: jest.fn(),
      })
    );

    const config = lastChannel!.on.mock.calls[0][1];
    expect(config.event).toBe('*');
    expect(config.filter).toBeUndefined();
    const channelName = (supabase.channel as jest.Mock).mock.calls[0][0];
    expect(channelName).toMatch(/^notifications-any-/);
  });

  it('invokes onChange when supabase delivers a row event', () => {
    const onChange = jest.fn();
    renderHook(() =>
      useSupabaseSubscription({
        table: 'reservations',
        onChange,
      })
    );

    // Grab the handler the hook registered with channel.on()
    const handler = lastChannel!.on.mock.calls[0][2];
    act(() => {
      handler({ new: { id: 'r-1' } });
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('useSupabaseSubscription — lifecycle', () => {
  it('removes the channel on unmount', () => {
    const { unmount } = renderHook(() =>
      useSupabaseSubscription({
        table: 'trajets',
        onChange: jest.fn(),
      })
    );

    expect(removeChannelMock).not.toHaveBeenCalled();
    unmount();
    expect(removeChannelMock).toHaveBeenCalledTimes(1);
    expect(removeChannelMock).toHaveBeenCalledWith(lastChannel);
  });

  it('skips subscription when enabled=false', () => {
    renderHook(() =>
      useSupabaseSubscription({
        table: 'trajets',
        onChange: jest.fn(),
        enabled: false,
      })
    );

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('re-creates the channel when the filter changes (e.g. user switches reservation)', () => {
    const { rerender } = renderHook<void, { filter: string }>(
      ({ filter }) =>
        useSupabaseSubscription({
          table: 'reservations',
          filter,
          onChange: jest.fn(),
        }),
      { initialProps: { filter: 'id=eq.r-1' } }
    );

    expect(supabase.channel).toHaveBeenCalledTimes(1);

    rerender({ filter: 'id=eq.r-2' });

    expect(removeChannelMock).toHaveBeenCalledTimes(1);
    expect(supabase.channel).toHaveBeenCalledTimes(2);
    const secondName = (supabase.channel as jest.Mock).mock.calls[1][0];
    expect(secondName).toMatch(/^reservations-id=eq\.r-2-/);
  });

  it('does NOT re-create the channel when onChange identity changes IF other deps stable', () => {
    // Sanity check: onChange is a dep but Zustand actions / useCallback'd
    // handlers should keep the same identity — confirming the hook honours
    // that contract.
    const cb1 = jest.fn();
    const { rerender } = renderHook(
      ({ cb }: { cb: typeof cb1 }) =>
        useSupabaseSubscription({ table: 'trajets', onChange: cb }),
      { initialProps: { cb: cb1 } }
    );
    expect(supabase.channel).toHaveBeenCalledTimes(1);

    // Same callback identity → no re-subscribe.
    rerender({ cb: cb1 });
    expect(supabase.channel).toHaveBeenCalledTimes(1);

    // Different identity → re-subscribe (intentional behaviour).
    const cb2 = jest.fn();
    rerender({ cb: cb2 });
    expect(supabase.channel).toHaveBeenCalledTimes(2);
  });

  it('cleans up the previous channel before re-subscribing', () => {
    const { rerender } = renderHook<void, { table: string }>(
      ({ table }) =>
        useSupabaseSubscription({ table, onChange: jest.fn() }),
      { initialProps: { table: 'trajets' } }
    );
    const firstChannel = lastChannel;

    rerender({ table: 'reservations' });

    // The first channel must be removed (we don't want to leak)
    expect(removeChannelMock).toHaveBeenCalledWith(firstChannel);
  });

  it('does not call removeChannel when never subscribed (enabled=false from start)', () => {
    const { unmount } = renderHook(() =>
      useSupabaseSubscription({
        table: 'trajets',
        onChange: jest.fn(),
        enabled: false,
      })
    );

    unmount();
    expect(removeChannelMock).not.toHaveBeenCalled();
  });
});
