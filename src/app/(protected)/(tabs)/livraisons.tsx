import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TIMEOUTS, COLORS } from '../../../constants';
import { getSortedLivreursByDistance } from '../../../data';
import { useLivraisonsStore } from '../../../stores';
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
    setShowResults,
    setSelectedLivreur,
    setWaitingForAcceptance,
    setAccepted,
    setNoResponse,
    resetAll,
  } = useLivraisonsStore();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const acceptanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const livreurs = getSortedLivreursByDistance();
  const currentLivreur = livreurs.find((l) => l.id === selectedLivreur);

  // Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (acceptanceTimeoutRef.current) clearTimeout(acceptanceTimeoutRef.current);
    };
  }, []);

  const handleConfirmLivraison = () => {
    setWaitingForAcceptance(true);
    setNoResponse(false);

    // Timeout de non-réponse
    timeoutRef.current = setTimeout(() => {
      setWaitingForAcceptance(false);
      setNoResponse(true);
    }, TIMEOUTS.DELIVERY_ACCEPTANCE);

    // Simulation d'acceptation (Demo)
    acceptanceTimeoutRef.current = setTimeout(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setWaitingForAcceptance(false);
      setAccepted(true);
    }, TIMEOUTS.DEMO_ACCEPTANCE);
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
  );
}
