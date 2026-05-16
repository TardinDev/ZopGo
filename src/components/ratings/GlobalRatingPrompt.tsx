import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useReservationsStore } from '../../stores/reservationsStore';
import { useSupabaseSubscription } from '../../hooks/useSupabaseSubscription';
import { toast } from '../../stores/toastStore';
import { RatingModal } from './RatingModal';
import type { Reservation } from '../../types';

/**
 * Global hook-up so the client sees the "rate your driver" sheet wherever
 * they are in the app when a course flips to terminée. Pairs with the
 * per-screen prompt in conversation.tsx — that one fires only when the
 * client is already viewing the conversation. This one covers the case
 * where the client is on home / messages / anywhere else.
 *
 * Dedupe is per-session via a ref keyed on reservation.id. Persistent
 * dedupe is handled server-side by the `reviewed` boolean.
 */
export function GlobalRatingPrompt() {
  const { user, supabaseProfileId } = useAuthStore();
  const { clientReservations, loadClientReservations, markReviewed } =
    useReservationsStore();

  const [pending, setPending] = useState<Reservation | null>(null);
  const promptedIdsRef = useRef<Set<string>>(new Set());

  // Only clients see the prompt — chauffeurs don't rate themselves.
  const isClient = user?.role === 'client';

  useEffect(() => {
    if (!isClient || !supabaseProfileId) return;
    loadClientReservations(supabaseProfileId);
  }, [isClient, supabaseProfileId, loadClientReservations]);

  // useCallback so the subscription isn't torn down + re-created on every
  // render (the hook tracks `onChange` in its dep array). Without this the
  // channel would flap and we'd miss updates that land during the gap.
  const handleReservationUpdate = useCallback(() => {
    if (supabaseProfileId) loadClientReservations(supabaseProfileId);
  }, [supabaseProfileId, loadClientReservations]);

  // Stay subscribed to client's reservation updates so a terminée transition
  // anywhere in the app surfaces the prompt within ~1s.
  useSupabaseSubscription({
    table: 'reservations',
    filter: supabaseProfileId ? `client_id=eq.${supabaseProfileId}` : undefined,
    event: 'UPDATE',
    onChange: handleReservationUpdate,
    enabled: !!isClient && !!supabaseProfileId,
  });

  useEffect(() => {
    if (!isClient || pending) return;
    const candidate = clientReservations.find(
      (r) =>
        r.status === 'terminee' &&
        !r.reviewed &&
        !promptedIdsRef.current.has(r.id)
    );
    if (candidate) {
      promptedIdsRef.current.add(candidate.id);
      setPending(candidate);
    }
  }, [clientReservations, isClient, pending]);

  const handleSubmit = useCallback(
    async (_rating: number, _comment: string) => {
      if (!pending) return;
      await markReviewed(pending.id);
      toast.success('Merci pour ton avis ⭐', { title: 'Évaluation envoyée' });
      setPending(null);
    },
    [pending, markReviewed]
  );

  const handleClose = useCallback(() => {
    setPending(null);
  }, []);

  if (!pending) return null;

  return (
    <RatingModal
      visible={!!pending}
      onClose={handleClose}
      onSubmit={handleSubmit}
      userName={pending.chauffeurName || 'le chauffeur'}
      tripType="voyage"
    />
  );
}
