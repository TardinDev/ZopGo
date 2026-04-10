export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TIMEOUTS, COLORS } from '../../../constants';
import { useLivraisonsStore } from '../../../stores';
import { useDriversStore } from '../../../stores/driversStore';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { AnimatedTabScreen } from '../../../components/ui';
import {
  LivraisonHeader,
  LivraisonForm,
  LivreurList,
  NoResponseView,
  WaitingView,
  AcceptedView,
} from '../../../components/livraisons';

export default function LivraisonsTab() {
  const {
    pickupLocation,
    dropoffLocation,
    showResults,
    selectedLivreur,
    waitingForAcceptance,
    accepted,
    noResponse,
    currentLivraison,
    setShowResults,
    setSelectedLivreur,
    setWaitingForAcceptance,
    setAccepted,
    setNoResponse,
    resetAll,
    createLivraisonRequest,
  } = useLivraisonsStore();

  const { user, supabaseProfileId } = useAuthStore();
  const clientName = user?.profile.name || 'Client';

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out drivers without a Supabase profile UUID (static demo drivers),
  // because livraisons.livreur_id is a real FK to profiles(id).
  const { getAllDrivers } = useDriversStore();
  const livreurs = useMemo(
    () => getAllDrivers().filter((l) => !!l.supabaseProfileId),
    [getAllDrivers]
  );
  const currentLivreur = livreurs.find((l) => l.id === selectedLivreur);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Realtime subscription: watch the created livraison and reflect status
  // transitions directly in the UI (acceptee → accepted view).
  useEffect(() => {
    if (!currentLivraison?.id) return;

    const channel = supabase
      .channel(`livraison-${currentLivraison.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'livraisons',
          filter: `id=eq.${currentLivraison.id}`,
        },
        (payload) => {
          const next = payload.new as { status?: string };
          if (next.status === 'acceptee') {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setWaitingForAcceptance(false);
            setAccepted(true);
          } else if (next.status === 'refusee' || next.status === 'expiree') {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setWaitingForAcceptance(false);
            setNoResponse(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentLivraison?.id, setAccepted, setNoResponse, setWaitingForAcceptance]);

  const handleConfirmLivraison = async () => {
    if (!supabaseProfileId || !currentLivreur?.supabaseProfileId) {
      // No backing profile — bail early so we don't hit an FK violation.
      setNoResponse(true);
      return;
    }

    setWaitingForAcceptance(true);
    setNoResponse(false);

    const created = await createLivraisonRequest({
      clientId: supabaseProfileId,
      livreurProfileId: currentLivreur.supabaseProfileId,
      pickupLocation,
      dropoffLocation,
      clientName,
    });

    if (!created) {
      setWaitingForAcceptance(false);
      setNoResponse(true);
      return;
    }

    // Expiration safeguard: if no realtime update arrives, surface "no response"
    timeoutRef.current = setTimeout(() => {
      setWaitingForAcceptance(false);
      setNoResponse(true);
    }, TIMEOUTS.DELIVERY_ACCEPTANCE);
  };

  const handleRetrySearch = () => {
    setNoResponse(false);
    setSelectedLivreur(null);
    setShowResults(true);
  };

  const handleEditSearch = () => {
    setShowResults(false);
    setSelectedLivreur(null);
  };

  return (
    <AnimatedTabScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <LinearGradient colors={COLORS.gradients.orange} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <LivraisonHeader />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}>
              {noResponse ? (
                <NoResponseView
                  livreur={currentLivreur}
                  onRetry={handleRetrySearch}
                  onCancel={resetAll}
                />
              ) : waitingForAcceptance ? (
                <WaitingView
                  livreur={currentLivreur}
                  pickupLocation={pickupLocation}
                  dropoffLocation={dropoffLocation}
                />
              ) : accepted ? (
                <AcceptedView
                  livreur={currentLivreur}
                  pickupLocation={pickupLocation}
                  dropoffLocation={dropoffLocation}
                  onNewDelivery={resetAll}
                />
              ) : showResults ? (
                <LivreurList
                  livreurs={livreurs}
                  pickupLocation={pickupLocation}
                  dropoffLocation={dropoffLocation}
                  selectedLivreurId={selectedLivreur}
                  onSelectLivreur={setSelectedLivreur}
                  onConfirm={handleConfirmLivraison}
                  onEditSearch={handleEditSearch}
                />
              ) : (
                <LivraisonForm />
              )}
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </AnimatedTabScreen>
  );
}
