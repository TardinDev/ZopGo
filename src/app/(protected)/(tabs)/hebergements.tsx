export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useMemo, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { Hebergement } from '../../../types';
import { COLORS } from '../../../constants';
import { useHebergementsDiscoveryStore } from '../../../stores';
import { hebergementTypes } from '../../../stores/hebergementsDiscoveryStore';
import {
  HebergementCard,
  TypeFilter,
  LocationSearchBar,
  EmptyResults,
} from '../../../components/voyages';

export default function HebergementsTab() {
  const {
    listings,
    isLoading,
    selectedType,
    searchLocation,
    loadHebergements,
    setSelectedType,
    setSearchLocation,
  } = useHebergementsDiscoveryStore();

  // Charger les hébergements au montage
  useEffect(() => {
    loadHebergements();
  }, [loadHebergements]);

  // Filtrage des hébergements
  const filteredHebergements = useMemo(() => {
    return listings
      .filter((h) => selectedType === 'All' || h.type === selectedType)
      .filter((h) => {
        if (!searchLocation.trim()) return true;
        return (h.location || '').toLowerCase().includes(searchLocation.toLowerCase());
      });
  }, [listings, selectedType, searchLocation]);

  const handleHebergementPress = useCallback((hebergement: Hebergement) => {
    Alert.alert(hebergement.name, `${hebergement.location}\n${hebergement.price}\nNote : ${hebergement.rating > 0 ? hebergement.rating.toFixed(1) + '/5' : 'N/A'}`);
  }, []);

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

        {/* Filtres par type */}
        <TypeFilter
          types={hebergementTypes}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />

        {/* Liste des résultats */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}>
          {isLoading ? (
            <ActivityIndicator size="large" color="white" style={{ marginTop: 40 }} />
          ) : filteredHebergements.length > 0 ? (
            filteredHebergements.map((hebergement) => (
              <HebergementCard
                key={hebergement.id}
                hebergement={hebergement}
                onPress={() => handleHebergementPress(hebergement)}
              />
            ))
          ) : (
            <EmptyResults
              message="Aucun hébergement trouvé"
              subMessage="Essayez une autre recherche ou un autre filtre"
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
