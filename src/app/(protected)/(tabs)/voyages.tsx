export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import type { Voyage } from '../../../types';
import { COLORS } from '../../../constants';
import { useVoyagesStore } from '../../../stores';
import { transportTypes } from '../../../stores/voyagesStore';
import { AnimatedTabScreen, SkeletonList, RotatingLoadingText } from '../../../components/ui';

const VOYAGE_LOADING_MESSAGES = [
  'On ratisse le Gabon...',
  'Les motos s\'échauffent...',
  'On cherche les meilleurs trajets...',
  'Presque prêt...',
];
import {
  VoyageCard,
  TypeFilter,
  TransportSearchBar,
  EmptyResults,
} from '../../../components/voyages';
import { useFocusEffect } from '@react-navigation/native';
import { useSupabaseSubscription } from '../../../hooks/useSupabaseSubscription';

export default function VoyagesTab() {
  const router = useRouter();

  // État global Zustand
  const {
    trajets,
    isLoading,
    error,
    selectedType,
    fromCity,
    toCity,
    loadVoyages,
    setSelectedType,
    setFromCity,
    setToCity,
    swapCities,
    resetFilters,
  } = useVoyagesStore();

  const [refreshing, setRefreshing] = useState(false);

  // Charger les trajets au montage
  useEffect(() => {
    loadVoyages();
  }, [loadVoyages]);

  // Refresh when the user returns to this tab (cheap, just refetches once).
  useFocusEffect(
    useCallback(() => {
      loadVoyages();
    }, [loadVoyages])
  );

  // Realtime instead of 30s polling — battery + data win in 3G/4G regions.
  // We only refetch on changes to en_attente trajets, which is the only
  // bucket this screen displays.
  useSupabaseSubscription({
    table: 'trajets',
    filter: 'status=eq.en_attente',
    onChange: loadVoyages,
  });

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVoyages();
    setRefreshing(false);
  }, [loadVoyages]);

  // Filtrage des voyages
  const filteredVoyages = useMemo(() => {
    return trajets
      .filter((v) => selectedType === 'All' || v.type === selectedType)
      .filter((v) => {
        const matchFrom = !fromCity || v.from.toLowerCase().includes(fromCity.toLowerCase());
        const matchTo = !toCity || v.to.toLowerCase().includes(toCity.toLowerCase());
        return matchFrom && matchTo;
      });
  }, [trajets, selectedType, fromCity, toCity]);

  const handleVoyagePress = useCallback(
    (voyage: Voyage) => {
      router.push({
        pathname: '/(protected)/(tabs)/voyage-detail',
        params: {
          id: voyage.id,
          type: voyage.type,
          from: voyage.from,
          to: voyage.to,
          price: voyage.price,
          icon: voyage.icon,
          chauffeurName: voyage.chauffeurName || '',
          chauffeurAvatar: voyage.chauffeurAvatar || '',
          chauffeurRating: voyage.chauffeurRating?.toString() || '',
          chauffeurProfileId: voyage.chauffeurProfileId || '',
          placesDisponibles: voyage.placesDisponibles?.toString() || '',
          date: voyage.date || '',
          marque: voyage.marque || '',
          modele: voyage.modele || '',
          couleur: voyage.couleur || '',
        },
      });
    },
    [router]
  );

  return (
    <AnimatedTabScreen>
      <LinearGradient colors={COLORS.gradients.cyan} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(400).springify().damping(18)}
            style={{ paddingHorizontal: 24, paddingVertical: 16 }}
          >
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
              Trouvez votre voyage
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              Motos, voitures, camionnettes
            </Text>
          </Animated.View>

          {/* Barre de recherche */}
          <Animated.View
            entering={FadeInDown.delay(80).duration(400).springify().damping(18)}
            style={{ paddingHorizontal: 24, paddingBottom: 8 }}
          >
            <TransportSearchBar
              fromCity={fromCity}
              toCity={toCity}
              onFromChange={setFromCity}
              onToChange={setToCity}
              onSwap={swapCities}
            />
          </Animated.View>

          {/* Filtres par type */}
          <TypeFilter
            types={transportTypes}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />

          {/* Liste des résultats */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="white" />
            }>
            {isLoading ? (
              <>
                <RotatingLoadingText messages={VOYAGE_LOADING_MESSAGES} />
                <SkeletonList count={4} />
              </>
            ) : error ? (
              <Animated.View entering={FadeIn.duration(300)}>
                <EmptyResults
                  icon="cloud-offline-outline"
                  message="Connexion impossible"
                  subMessage={error}
                  actionLabel="Réessayer"
                  onAction={loadVoyages}
                />
              </Animated.View>
            ) : filteredVoyages.length > 0 ? (
              filteredVoyages.map((voyage, i) => (
                <VoyageCard
                  key={voyage.id}
                  voyage={voyage}
                  onPress={() => handleVoyagePress(voyage)}
                  index={i}
                />
              ))
            ) : (
              <Animated.View entering={FadeIn.duration(300)}>
                <EmptyResults
                  icon="car-sport-outline"
                  message="Les chauffeurs dorment encore..."
                  subMessage="Essaie une autre ville ou un autre type de véhicule"
                  actionLabel="Voir tous les voyages"
                  onAction={resetFilters}
                />
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </AnimatedTabScreen>
  );
}
