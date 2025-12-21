import { View, Text, ScrollView } from 'react-native';
import { useMemo, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { hebergements, hebergementTypes } from '../../../data';
import type { Hebergement } from '../../../types';
import {
    HebergementCard,
    TypeFilter,
    LocationSearchBar,
    EmptyResults,
} from '../../../components/voyages';

export default function HebergementsTab() {
    const [selectedType, setSelectedType] = useState('All');
    const [searchLocation, setSearchLocation] = useState('');

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

    const handleHebergementPress = useCallback((hebergement: Hebergement) => {
        console.log('Hébergement sélectionné:', hebergement.name);
    }, []);

    return (
        <LinearGradient colors={['#8B5CF6', '#A855F7']} style={{ flex: 1 }}>
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
                    <LocationSearchBar
                        value={searchLocation}
                        onChange={setSearchLocation}
                    />
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
                    {filteredHebergements.length > 0 ? (
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
