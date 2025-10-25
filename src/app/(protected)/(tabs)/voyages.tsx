import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function VoyagesTab() {
  const [selectedTab, setSelectedTab] = useState<'transport' | 'hebergement'>('transport');
  const [selectedType, setSelectedType] = useState('All');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const voyages = [
    { id: 1, type: 'Bus', from: 'Libreville', to: 'Franceville', price: '25000 FCFA', icon: '🚍' },
    { id: 2, type: 'Voiture', from: 'PK12', to: 'Ntoum', price: '2500 FCFA', icon: '🚗' },
    { id: 3, type: 'Bus', from: 'Port-Gentil', to: 'Lambaréné', price: '15000 FCFA', icon: '🚍' },
    {
      id: 4,
      type: 'Avion',
      from: 'Libreville',
      to: 'Port-Gentil',
      price: '75000 FCFA',
      icon: '✈️',
    },
    { id: 5, type: 'Voiture', from: 'Libreville', to: 'Oyem', price: '18000 FCFA', icon: '🚗' },
    { id: 6, type: 'Bus', from: 'Mouanda', to: 'Franceville', price: '8000 FCFA', icon: '🚍' },
    { id: 7, type: 'Voiture', from: 'Tchibanga', to: 'Mayumba', price: '12000 FCFA', icon: '🚗' },
    { id: 8, type: 'Bateau', from: 'Port-Gentil', to: 'Cap Lopez', price: '5000 FCFA', icon: '🚢' },
    { id: 9, type: 'Bus', from: 'Bitam', to: 'Oyem', price: '6000 FCFA', icon: '🚍' },
    { id: 10, type: 'Voiture', from: 'Gamba', to: 'Tchibanga', price: '10000 FCFA', icon: '🚗' },
    { id: 11, type: 'Train', from: 'Libreville', to: 'Franceville', price: '30000 FCFA', icon: '🚂' },
    { id: 12, type: 'Train', from: 'Libreville', to: 'Ndjolé', price: '12000 FCFA', icon: '🚂' },
    { id: 13, type: 'Train', from: 'Owendo', to: 'Booué', price: '18000 FCFA', icon: '🚂' },
    { id: 14, type: 'Train', from: 'Ntoum', to: 'Lopé', price: '22000 FCFA', icon: '🚂' },
  ];

  const hebergements = [
    { id: 1, type: 'Hôtel', name: 'Hôtel Le Meridien', location: 'Libreville', price: '45000 FCFA/nuit', rating: 4.5, icon: '🏨' },
    { id: 2, type: 'Auberge', name: 'Auberge du Centre', location: 'Franceville', price: '15000 FCFA/nuit', rating: 3.8, icon: '🏠' },
    { id: 3, type: 'Hôtel', name: 'Hôtel Hibiscus', location: 'Port-Gentil', price: '38000 FCFA/nuit', rating: 4.2, icon: '🏨' },
    { id: 4, type: 'Auberge', name: 'Chez Marie', location: 'Oyem', price: '12000 FCFA/nuit', rating: 4.0, icon: '🏠' },
    { id: 5, type: 'Hôtel', name: 'Hôtel Rapontchombo', location: 'Lambaréné', price: '25000 FCFA/nuit', rating: 3.9, icon: '🏨' },
    { id: 6, type: 'Auberge', name: 'Villa Tropicale', location: 'Mayumba', price: '18000 FCFA/nuit', rating: 4.3, icon: '🏠' },
    { id: 7, type: 'Hôtel', name: 'Hôtel Residence', location: 'Tchibanga', price: '20000 FCFA/nuit', rating: 3.7, icon: '🏨' },
    { id: 8, type: 'Auberge', name: 'Auberge du Parc', location: 'Lopé', price: '22000 FCFA/nuit', rating: 4.4, icon: '🏠' },
  ];

  const transportTypes = ['All', 'Bus', 'Voiture', 'Bateau', 'Avion', 'Train'];
  const hebergementTypes = ['All', 'Hôtel', 'Auberge'];

  // Extraire toutes les villes uniques
  const allCities = Array.from(
    new Set(voyages.flatMap((v) => [v.from, v.to]))
  ).sort();

  const filteredVoyages = voyages
    .filter((v) => selectedType === 'All' || v.type === selectedType)
    .filter((v) => {
      const matchFrom = !fromCity || v.from.toLowerCase().includes(fromCity.toLowerCase());
      const matchTo = !toCity || v.to.toLowerCase().includes(toCity.toLowerCase());
      return matchFrom && matchTo;
    });

  const filteredHebergements = hebergements
    .filter((h) => selectedType === 'All' || h.type === selectedType)
    .filter((h) => !searchLocation || h.location.toLowerCase().includes(searchLocation.toLowerCase()));

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
                      pathname: '/voyage-detail',
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
