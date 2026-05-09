import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

type ChangeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE';

interface Options {
  /** Public table name (e.g. 'trajets', 'notifications'). */
  table: string;
  /** Postgres-style filter, e.g. 'status=eq.en_attente'. Optional. */
  filter?: string;
  /** Which DML events to listen to. Defaults to '*' (any). */
  event?: ChangeEvent;
  /** Called every time a matching row changes. Receives no payload by
   *  design — most screens just refetch since the join shape isn't in
   *  the realtime payload anyway. */
  onChange: () => void;
  /** Set false to disable the subscription (e.g. while supabaseProfileId
   *  is null and there's nothing to filter on). */
  enabled?: boolean;
}

/**
 * Subscribes to Postgres changes on a Supabase table for the lifetime
 * of the calling component. The matching tables must be added to the
 * supabase_realtime publication (see migration 020). Mirror of the
 * pattern already used inline in livraisons.tsx.
 *
 * Replaces 15-30s polling intervals — saves cellular data and battery,
 * pairs with useFocusEffect-driven initial loads for a clean reactive
 * UI without manual refresh.
 */
export function useSupabaseSubscription({
  table,
  filter,
  event = '*',
  onChange,
  enabled = true,
}: Options) {
  useEffect(() => {
    if (!enabled) return;

    const channelName = `${table}-${filter ?? 'any'}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        // The supabase-js types insist on the literal string 'postgres_changes'
        // here; nothing more specific to do.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, event, enabled, onChange]);
}
