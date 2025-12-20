import { View, Text, ScrollView } from 'react-native';
import { useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { voyages, hebergements, transportTypes, hebergementTypes } from '../../../data';
import type { Voyage, Hebergement } from '../../../types';
import { useVoyagesStore } from '../../../stores';
import {
  VoyageCard,
  HebergementCard,
  TabSelector,
  TypeFilter,
  TransportSearchBar,
  LocationSearchBar,
  EmptyResults,
} from '../../../components/voyages';

// Définition des onglets
const TABS = [
  { key: 'transport', label: '🚗 Transport' },
  { key: 'hebergement', label: '🏨 Hébergement' },
];

export default function VoyagesTab() {
  const router = useRouter();

  // État global Zustand
  const {
    selectedTab,
    selectedType,
    fromCity,
    toCity,
    searchLocation,
    setSelectedTab,
    setSelectedType,
    setFromCity,
    setToCity,
    setSearchLocation,
    swapCities,
  } = useVoyagesStore();

  // Types de filtre selon l'onglet
  const typesToRender = useMemo(() => {
    const base = selectedTab === 'transport' ? transportTypes : hebergementTypes;
    return Array.isArray(base) && base.length > 0 ? base : ['All'];
  }, [selectedTab]);

  // Filtrage des voyages
  const filteredVoyages = useMemo(() => {
    return voyages
      .filter((v) => selectedType === 'All' || v.type === selectedType)
      .filter((v) => {
        const matchFrom = !fromCity || v.from.toLowerCase().includes(fromCity.toLowerCase());
        const matchTo = !toCity || v.to.toLowerCase().includes(toCity.toLowerCase());
        return matchFrom && matchTo;
      });
  }, [selectedType, fromCity, toCity]);

  // Filtrage des hébergements
  const filteredHebergements = useMemo(() => {
    if (!Array.isArray(hebergements) || hebergements.length === 0) return [];
    return hebergements
      .filter((h) => selectedType === 'All' || h.type === selectedType)
      .filter((h) => {
        if (!searchLocation.trim()) return true;
        return (h.location || '').toLowerCase().includes(searchLocation.toLowerCase());
      });
  }, [selectedType, searchLocation]);

  // Handlers
  const handleTabChange = useCallback((tab: string) => {
    setSelectedTab(tab as 'transport' | 'hebergement');
  }, [setSelectedTab]);

  const handleVoyagePress = useCallback((voyage: Voyage) => {
    router.push({
      pathname: '/(protected)/(tabs)/voyage-detail',
      params: {
        id: voyage.id,
        type: voyage.type,
        from: voyage.from,
        to: voyage.to,
        price: voyage.price,
        icon: voyage.icon,
      },
    });
  }, [router]);

  const handleHebergementPress = useCallback((hebergement: Hebergement) => {
    console.log('Hébergement:', hebergement.name);
  }, []);

  return (
    <LinearGradient colors={['#4facfe', '#00f2fe']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
            {selectedTab === 'transport' ? '🚀 Trouvez votre voyage' : '🏨 Trouvez votre hébergement'}
          </Text>
        </View>

        {/* Onglets */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <TabSelector
            tabs={TABS}
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
          />
        </View>

        {/* Barre de recherche */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          {selectedTab === 'transport' ? (
            <TransportSearchBar
              fromCity={fromCity}
              toCity={toCity}
              onFromChange={setFromCity}
              onToChange={setToCity}
              onSwap={swapCities}
            />
          ) : (
            <LocationSearchBar
              value={searchLocation}
              onChange={setSearchLocation}
            />
          )}
        </View>

        {/* Filtres par type */}
        <TypeFilter
          types={typesToRender}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />

        {/* Liste des résultats */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}>

          {selectedTab === 'transport' ? (
            filteredVoyages.length > 0 ? (
              filteredVoyages.map((voyage) => (
                <VoyageCard
                  key={voyage.id}
                  voyage={voyage}
                  onPress={() => handleVoyagePress(voyage)}
                />
              ))
            ) : (
              <EmptyResults
                message="Aucun voyage trouvé"
                subMessage="Essayez une autre recherche ou un autre filtre"
              />
            )
          ) : (
            filteredHebergements.length > 0 ? (
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
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
