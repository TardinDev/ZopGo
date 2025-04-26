/* eslint-disable */

import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function Voyage() {
  const [selectedType, setSelectedType] = useState('All');

  const voyages = [
    { id: 1, type: 'Bus', from: 'Libreville', to: 'Mouanda', price: '25000 Fcfa', icon: '🚍' },
    { id: 2, type: 'Voiture', from: 'PK12', to: 'Ntoum', price: '500 Fcfa', icon: '🚗' },
    { id: 3, type: 'Bateau', from: 'Marseille', to: 'Alger', price: '90€', icon: '🚢' },
    { id: 4, type: 'Avion', from: 'Paris', to: 'New York', price: '450€', icon: '✈️' },
    { id: 5, type: 'Bus', from: 'Toulouse', to: 'Bordeaux', price: '20€', icon: '🚍' },
    { id: 6, type: 'Voiture', from: 'Lille', to: 'Bruxelles', price: '35€', icon: '🚗' },
    { id: 7, type: 'Avion', from: 'Nice', to: 'Rome', price: '150€', icon: '✈️' },
    { id: 8, type: 'Bateau', from: 'Nice', to: 'Corse', price: '80€', icon: '🚢' },
    { id: 9, type: 'Bus', from: 'Strasbourg', to: 'Metz', price: '18€', icon: '🚍' },
    { id: 10, type: 'Voiture', from: 'Lyon', to: 'Geneve', price: '50€', icon: '🚗' },
  ];

  const transportTypes = ['All', 'Bus', 'Voiture', 'Bateau', 'Avion'];

  const filteredVoyages = selectedType === 'All' ? voyages : voyages.filter(v => v.type === selectedType);

  return (
    <LinearGradient
      colors={['#4facfe', '#00f2fe']}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-3xl font-bold text-white">🚀 Trouvez votre voyage</Text>
        </View>

        {/* Types de transport */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2">
          {transportTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedType(type)}
              className={`px-4 py-2 mr-3 rounded-full ${
                selectedType === type ? 'bg-white' : 'bg-[#4facfe]'
              } shadow-md`}
            >
              <Text className={`${selectedType === type ? 'text-blue-600' : 'text-white'} font-bold`}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste des voyages */}
        <ScrollView showsVerticalScrollIndicator={false} className="p-6">
          {filteredVoyages.map((voyage) => (
            <TouchableOpacity
              key={voyage.id}
              className="bg-white p-5 rounded-2xl mb-4 shadow-md"
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-xl font-bold text-gray-800">{voyage.from} ➔ {voyage.to}</Text>
                  <Text className="text-gray-500">{voyage.type} • {voyage.price}</Text>
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
