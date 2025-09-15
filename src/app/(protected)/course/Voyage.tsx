import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function Voyage() {
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
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">🚀 Trouvez votre voyage</Text>
          <View className="w-6" />
        </View>

        {/* Types de transport */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2">
          {transportTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedType(type)}
              className={`mr-3 rounded-full px-4 py-2 ${
                selectedType === type ? 'bg-white' : 'bg-[#4facfe]'
              } shadow-md`}>
              <Text
                className={`${selectedType === type ? 'text-blue-600' : 'text-white'} font-bold`}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste des voyages */}
        <ScrollView showsVerticalScrollIndicator={false} className="p-6">
          {filteredVoyages.map((voyage) => (
            <TouchableOpacity key={voyage.id} className="mb-4 rounded-2xl bg-white p-5 shadow-md">
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
