import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function VoyagesTab() {
  const [selectedType, setSelectedType] = useState('All');

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
  ];

  const transportTypes = ['All', 'Bus', 'Voiture', 'Bateau', 'Avion'];

  const filteredVoyages =
    selectedType === 'All' ? voyages : voyages.filter((v) => v.type === selectedType);

  return (
    <LinearGradient colors={['#4facfe', '#00f2fe']} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-3xl font-bold text-white">🚀 Trouvez votre voyage</Text>
        </View>

       {/* Types de transport */}
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
>
  {transportTypes.map((type) => {
    const isActive = selectedType === type;
    return (
      <TouchableOpacity
        key={type}
        activeOpacity={0.9}
        onPress={() => setSelectedType(type)}
        style={{
          // Dimensions fixes = pas de “saut”
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
          allowFontScaling={false}     // (optionnel) évite de légers “sauts”
        >
          {type}
        </Text>
      </TouchableOpacity>
    );
  })}
</ScrollView>


        {/* Liste des voyages */}
        <ScrollView showsVerticalScrollIndicator={false} className="p-6 pb-24">
          {filteredVoyages.map((voyage) => (
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
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
