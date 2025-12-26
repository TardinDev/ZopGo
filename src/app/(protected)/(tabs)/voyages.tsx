import { View, Text, ScrollView } from 'react-native';
import { useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { voyages, transportTypes } from '../../../data';
import type { Voyage } from '../../../types';
import { useVoyagesStore } from '../../../stores';
import { AnimatedTabScreen } from '../../../components/ui';
import {
  VoyageCard,
  TypeFilter,
  TransportSearchBar,
  EmptyResults,
} from '../../../components/voyages';

export default function VoyagesTab() {
  const router = useRouter();

  // État global Zustand
  const { selectedType, fromCity, toCity, setSelectedType, setFromCity, setToCity, swapCities } =
    useVoyagesStore();

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
        },
      });
    },
    [router]
  );

  return (
    <AnimatedTabScreen>
      <LinearGradient colors={['#4facfe', '#00f2fe']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
              Trouvez votre voyage
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              Bus, voitures, trains et plus
            </Text>
          </View>

          {/* Barre de recherche */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
            <TransportSearchBar
              fromCity={fromCity}
              toCity={toCity}
              onFromChange={setFromCity}
              onToChange={setToCity}
              onSwap={swapCities}
            />
          </View>

          {/* Filtres par type */}
          <TypeFilter
            types={transportTypes}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />

          {/* Liste des résultats */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}>
            {filteredVoyages.length > 0 ? (
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
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </AnimatedTabScreen>
  );
}
