export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { Hebergement } from '../../../types';
import { COLORS } from '../../../constants';
import { useHebergementsDiscoveryStore } from '../../../stores';
import { SkeletonList, RotatingLoadingText } from '../../../components/ui';
import {
  applyHebergementFilters,
  countActiveHebergementFilters,
  type HebergementFilters,
} from '../../../lib/hebergementsFilters';

const HEBERGEMENT_LOADING_MESSAGES = [
  'On scanne les hôtels...',
  'On prépare les meilleures chambres...',
  'On déplie les couvertures...',
  'Presque prêt...',
];
import { hebergementTypes } from '../../../stores/hebergementsDiscoveryStore';
import {
  HebergementCard,
  TypeFilter,
  LocationSearchBar,
  EmptyResults,
  FiltersButton,
  HebergementFiltersSheet,
} from '../../../components/voyages';
import { useFocusEffect } from '@react-navigation/native';
import { useSupabaseSubscription } from '../../../hooks/useSupabaseSubscription';

export default function HebergementsTab() {
  const router = useRouter();
  const {
    listings,
    isLoading,
    error,
    selectedType,
    searchLocation,
    priceMax,
    minCapacity,
    sortBy,
    loadHebergements,
    setSelectedType,
    setSearchLocation,
    setPriceMax,
    setMinCapacity,
    setSortBy,
    resetFilters,
  } = useHebergementsDiscoveryStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Charger les hébergements au montage
  useEffect(() => {
    loadHebergements();
  }, [loadHebergements]);

  // Refresh when the user returns to this tab.
  useFocusEffect(
    useCallback(() => {
      loadHebergements();
    }, [loadHebergements])
  );

  // Realtime instead of 30s polling — only the 'actif' bucket matters here.
  useSupabaseSubscription({
    table: 'hebergements',
    filter: 'status=eq.actif',
    onChange: loadHebergements,
  });

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHebergements();
    setRefreshing(false);
  }, [loadHebergements]);

  const filters: HebergementFilters = useMemo(
    () => ({ selectedType, searchLocation, priceMax, minCapacity, sortBy }),
    [selectedType, searchLocation, priceMax, minCapacity, sortBy]
  );

  const filteredHebergements = useMemo(
    () => applyHebergementFilters(listings, filters),
    [listings, filters]
  );

  const activeCount = useMemo(() => countActiveHebergementFilters(filters), [filters]);

  const handleHebergementPress = useCallback((hebergement: Hebergement) => {
    router.push({
      pathname: '/(protected)/(tabs)/hebergement-detail',
      params: {
        supabaseId: hebergement.supabaseId,
        name: hebergement.name,
        type: hebergement.type,
        location: hebergement.location,
        adresse: hebergement.adresse || '',
        description: hebergement.description || '',
        icon: hebergement.icon,
        prixParNuit: String(hebergement.prixParNuit),
        capacite: String(hebergement.capacite || 1),
        disponibilite: String(hebergement.disponibilite || 0),
        hebergeurProfileId: hebergement.hebergeurProfileId || '',
        hebergeurName: hebergement.hebergeurName || '',
        hebergeurAvatar: hebergement.hebergeurAvatar || '',
        hebergeurRating: String(hebergement.hebergeurRating || 0),
        // Pass the full image gallery (JSON-serialised). Detail screen
        // parses it back so the client sees every photo, not just the first.
        images: JSON.stringify(hebergement.images || []),
      },
    });
  }, [router]);

  return (
    <LinearGradient colors={COLORS.gradients.hebergeur} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
            Trouvez votre hébergement
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
            Hôtels, auberges et plus encore
          </Text>
        </View>

        {/* Barre de recherche */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          <LocationSearchBar value={searchLocation} onChange={setSearchLocation} />
        </View>

        {/* Filtres rapides type + bouton modale */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TypeFilter
              types={hebergementTypes}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
            />
          </View>
          <View style={{ paddingRight: 20, paddingBottom: 14 }}>
            <FiltersButton onPress={() => setFiltersOpen(true)} count={activeCount} />
          </View>
        </View>

        {/* Liste des résultats */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="white" />
          }>
          {isLoading ? (
            <>
              <RotatingLoadingText messages={HEBERGEMENT_LOADING_MESSAGES} />
              <SkeletonList count={4} />
            </>
          ) : error ? (
            <EmptyResults
              icon="cloud-offline-outline"
              message="Connexion impossible"
              subMessage={error}
              actionLabel="Réessayer"
              onAction={loadHebergements}
            />
          ) : filteredHebergements.length > 0 ? (
            filteredHebergements.map((hebergement, i) => (
              <HebergementCard
                key={hebergement.id}
                hebergement={hebergement}
                onPress={() => handleHebergementPress(hebergement)}
                index={i}
              />
            ))
          ) : (
            <EmptyResults
              icon="bed-outline"
              message="Le Gabon prépare ses chambres..."
              subMessage="Essaie une autre ville, un autre type ou ajuste tes filtres"
              actionLabel="Voir tous"
              onAction={resetFilters}
            />
          )}
        </ScrollView>

        <HebergementFiltersSheet
          visible={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          priceMax={priceMax}
          minCapacity={minCapacity}
          sortBy={sortBy}
          computeCount={(drafts) =>
            applyHebergementFilters(listings, { ...filters, ...drafts }).length
          }
          onApply={(next) => {
            setPriceMax(next.priceMax);
            setMinCapacity(next.minCapacity);
            setSortBy(next.sortBy);
          }}
          onReset={() => {
            setPriceMax(null);
            setMinCapacity(null);
            setSortBy('default');
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
