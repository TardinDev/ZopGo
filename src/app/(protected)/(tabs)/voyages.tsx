import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { voyages, hebergements, transportTypes, hebergementTypes } from '../../../data';

export default function VoyagesTab() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'transport' | 'hebergement'>('transport');
  const [selectedType, setSelectedType] = useState('All');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const filteredVoyages = useMemo(() => {
    return voyages
      .filter((v) => selectedType === 'All' || v.type === selectedType)
      .filter((v) => {
        const matchFrom = !fromCity || v.from.toLowerCase().includes(fromCity.toLowerCase());
        const matchTo = !toCity || v.to.toLowerCase().includes(toCity.toLowerCase());
        return matchFrom && matchTo;
      });
  }, [selectedType, fromCity, toCity]);

  const filteredHebergements = useMemo(() => {
    return hebergements
      .filter((h) => {
        // Ne filtrer par type que si on est sur l'onglet hébergement
        if (selectedTab !== 'hebergement') return true;
        return selectedType === 'All' || h.type === selectedType;
      })
      .filter((h) => !searchLocation || h.location.toLowerCase().includes(searchLocation.toLowerCase()));
  }, [selectedTab, selectedType, searchLocation]);

  return (
    <LinearGradient colors={['#4facfe', '#00f2fe']} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-3xl font-bold text-white">
            {selectedTab === 'transport' ? '🚀 Trouvez votre voyage' : '🏨 Trouvez votre hébergement'}
          </Text>
        </View>

        {/* Onglets */}
        <View className="px-6 pb-4">
          <View className="flex-row bg-white/30 rounded-full p-1">
            <TouchableOpacity
              onPress={() => {
                setSelectedTab('transport');
                setSelectedType('All');
              }}
              className={`flex-1 py-3 rounded-full ${selectedTab === 'transport' ? 'bg-white' : ''}`}
              activeOpacity={0.7}>
              <Text className={`text-center font-semibold ${selectedTab === 'transport' ? 'text-blue-600' : 'text-white'}`}>
                🚗 Transport
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSelectedTab('hebergement');
                setSelectedType('All');
              }}
              className={`flex-1 py-3 rounded-full ${selectedTab === 'hebergement' ? 'bg-white' : ''}`}
              activeOpacity={0.7}>
              <Text className={`text-center font-semibold ${selectedTab === 'hebergement' ? 'text-blue-600' : 'text-white'}`}>
                🏨 Hébergement
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sélecteurs de départ et d'arrivée / Recherche d'hébergement */}
        {selectedTab === 'transport' ? (
          <View className="px-6 pb-2">
            {/* Départ et Arrivée en horizontal */}
            <View className="flex-row items-center mb-3">
              {/* Départ */}
              <View className="flex-1 flex-row items-center rounded-2xl bg-white px-3 py-3 shadow-md">
                <Ionicons name="location" size={18} color="#4facfe" />
                <TextInput
                  placeholder="Départ"
                  placeholderTextColor="#9CA3AF"
                  value={fromCity}
                  onChangeText={setFromCity}
                  className="ml-2 flex-1 text-gray-800 text-base"
                  autoCapitalize="words"
                />
                {fromCity.length > 0 && (
                  <TouchableOpacity onPress={() => setFromCity('')}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Bouton d'inversion */}
              <TouchableOpacity
                onPress={() => {
                  const temp = fromCity;
                  setFromCity(toCity);
                  setToCity(temp);
                }}
                className="bg-white rounded-full p-2 shadow-md mx-2"
                activeOpacity={0.7}>
                <Ionicons name="swap-horizontal" size={20} color="#4facfe" />
              </TouchableOpacity>

              {/* Arrivée */}
              <View className="flex-1 flex-row items-center rounded-2xl bg-white px-3 py-3 shadow-md">
                <Ionicons name="flag" size={18} color="#00f2fe" />
                <TextInput
                  placeholder="Arrivée"
                  placeholderTextColor="#9CA3AF"
                  value={toCity}
                  onChangeText={setToCity}
                  className="ml-2 flex-1 text-gray-800 text-base"
                  autoCapitalize="words"
                />
                {toCity.length > 0 && (
                  <TouchableOpacity onPress={() => setToCity('')}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Bouton de réinitialisation */}
            {(fromCity || toCity) && (
              <TouchableOpacity
                onPress={() => {
                  setFromCity('');
                  setToCity('');
                }}
                className="bg-white/30 rounded-full px-4 py-2 self-center"
                activeOpacity={0.7}>
                <Text className="text-white font-semibold text-sm">Réinitialiser</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="px-6 pb-2">
            {/* Recherche de localisation pour hébergement */}
            <View className="mb-3 flex-row items-center rounded-2xl bg-white px-4 py-3 shadow-md">
              <Ionicons name="search" size={20} color="#4facfe" />
              <TextInput
                placeholder="Rechercher une ville"
                placeholderTextColor="#9CA3AF"
                value={searchLocation}
                onChangeText={setSearchLocation}
                className="ml-3 flex-1 text-gray-800 text-base"
                autoCapitalize="words"
              />
              {searchLocation.length > 0 && (
                <TouchableOpacity onPress={() => setSearchLocation('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

       {/* Types de transport / hébergement */}
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 16 }}
  style={{ marginBottom: 8 }}
>
  {(selectedTab === 'transport' ? transportTypes : hebergementTypes).map((type) => {
    const isActive = selectedType === type;
    return (
      <TouchableOpacity
        key={type}
        activeOpacity={0.9}
        onPress={() => setSelectedType(type)}
        style={{
          // Dimensions fixes = pas de "saut"
          width: 95,
          height: 40,
          borderRadius: 20,
          marginRight: 12,

          // Centrage parfait du contenu
          alignItems: 'center',
          justifyContent: 'center',

          // Couleurs stables
          backgroundColor: isActive ? '#FFFFFF' : '#4facfe',

          // Ombres légères mais constantes
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Text
          style={{
            color: isActive ? '#2563EB' : '#FFFFFF',
            fontWeight: '600',
            fontSize: 14,
            lineHeight: 18,            // IMPORTANT: lineHeight calée
            textAlign: 'center',
            includeFontPadding: false, // Android: évite le décalage bas
            textAlignVertical: 'center',
          }}
          allowFontScaling={false}     // (optionnel) évite de légers "sauts"
        >
          {type}
        </Text>
      </TouchableOpacity>
    );
  })}
</ScrollView>


        {/* Liste des voyages / hébergements */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 96 }}
        >
          {selectedTab === 'transport' ? (
            filteredVoyages.length > 0 ? (
              filteredVoyages.map((voyage) => (
                <TouchableOpacity
                  key={voyage.id}
                  onPress={() =>
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
                    })
                  }
                  className="mb-4 rounded-2xl bg-white p-5 shadow-md">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-xl font-bold text-gray-800">
                        {voyage.from} ➔ {voyage.to}
                      </Text>
                      <Text className="text-gray-500">
                        {voyage.type} • {voyage.price}
                      </Text>
                    </View>
                    <Text className="text-4xl">{voyage.icon}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center justify-center py-20">
                <Ionicons name="search-outline" size={64} color="#FFFFFF" />
                <Text className="mt-4 text-center text-lg font-semibold text-white">
                  Aucun voyage trouvé
                </Text>
                <Text className="mt-2 text-center text-white/80">
                  Essayez une autre recherche ou un autre filtre
                </Text>
              </View>
            )
          ) : (
            filteredHebergements.length > 0 ? (
              filteredHebergements.map((hebergement) => (
                <TouchableOpacity
                  key={hebergement.id}
                  onPress={() => {
                    // TODO: Créer la page de détail d'hébergement
                    console.log('Hébergement sélectionné:', hebergement.name);
                  }}
                  className="mb-4 rounded-2xl bg-white p-5 shadow-md">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-gray-800">
                        {hebergement.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-500 ml-1">{hebergement.location}</Text>
                      </View>
                      <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-gray-600 font-semibold">{hebergement.price}</Text>
                        <View className="flex-row items-center">
                          <Ionicons name="star" size={16} color="#FFA500" />
                          <Text className="text-gray-600 ml-1 font-semibold">
                            {hebergement.rating}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text className="text-4xl ml-4">{hebergement.icon}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center justify-center py-20">
                <Ionicons name="search-outline" size={64} color="#FFFFFF" />
                <Text className="mt-4 text-center text-lg font-semibold text-white">
                  Aucun hébergement trouvé
                </Text>
                <Text className="mt-2 text-center text-white/80">
                  Essayez une autre recherche ou un autre filtre
                </Text>
              </View>
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
