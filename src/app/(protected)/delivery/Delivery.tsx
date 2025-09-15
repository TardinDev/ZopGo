import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function Delivery() {
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [expandedLivreur, setExpandedLivreur] = useState<number | null>(null); // pour voir les commentaires

  const livreurs = [
    {
      id: 1,
      prenom: 'Thierry Ngoma',
      vehicule: '🚲 Vélo',
      etoiles: 4.5,
      disponible: true,
      photo:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      commentaires: ['Rapide et sympa', 'Très pro'],
      distance: 1.2,
    },
    {
      id: 2,
      prenom: 'Grace Moussavou',
      vehicule: '🏍️ Moto',
      etoiles: 4.8,
      disponible: false,
      photo:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      commentaires: ['Service impeccable', "Toujours à l'heure"],
      distance: 2.0,
    },
    {
      id: 3,
      prenom: 'Alain Ndong',
      vehicule: '🚐 Mini-bus',
      etoiles: 4.2,
      disponible: true,
      photo:
        'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face',
      commentaires: ['Super professionnel', 'Très ponctuel'],
      distance: 1.8,
    },
    {
      id: 4,
      prenom: 'Sandrine Oba',
      vehicule: '🚗 Voiture',
      etoiles: 4.7,
      disponible: true,
      photo:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      commentaires: ['Rapide', 'Souriante'],
      distance: 1.5,
    },
    {
      id: 5,
      prenom: 'Jean-Claude Mba',
      vehicule: '🚛 Camionnette',
      etoiles: 4.3,
      disponible: false,
      photo:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      commentaires: ['Top!', 'Consciencieux'],
      distance: 2.5,
    },
    {
      id: 6,
      prenom: 'Sylvie Mintsa',
      vehicule: '🚲 Vélo',
      etoiles: 4.6,
      disponible: true,
      photo:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      commentaires: ['Rapide', 'Très gentille'],
      distance: 1.9,
    },
    {
      id: 7,
      prenom: 'Patrick Ella',
      vehicule: '🛵 Scooter',
      etoiles: 4.4,
      disponible: true,
      photo:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
      commentaires: ['Professionnel', 'Serviable'],
      distance: 2.2,
    },
    {
      id: 8,
      prenom: 'Christelle Ntoutoume',
      vehicule: '🚗 Voiture',
      etoiles: 4.5,
      disponible: true,
      photo:
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&h=150&fit=crop&crop=face',
      commentaires: ['Très agréable', 'Super ponctuelle'],
      distance: 1.4,
    },
    {
      id: 9,
      prenom: 'Boris Ondo',
      vehicule: '🚐 Mini-bus',
      etoiles: 4.1,
      disponible: false,
      photo:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      commentaires: ['Ponctuel', 'Bon service'],
      distance: 3.0,
    },
    {
      id: 10,
      prenom: 'Fatou Kombila',
      vehicule: '🚗 Voiture',
      etoiles: 4.9,
      disponible: true,
      photo:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
      commentaires: ['Super rapide!', 'Hyper gentille'],
      distance: 1.1,
    },
  ].sort((a, b) => a.distance - b.distance);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1">
      <LinearGradient colors={['#FFDD5C', '#ffffff']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 p-6">
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1e40af" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-blue-800">🚚 Trouvez votre livreur</Text>
            <View className="w-6" />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {livreurs.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="mb-5 rounded-2xl bg-white p-4 shadow-md"
                onPress={() => setExpandedLivreur(expandedLivreur === item.id ? null : item.id)}>
                <View className="mb-2 flex-row items-center gap-4">
                  <Image source={{ uri: item.photo }} className="h-14 w-14 rounded-full" />
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xl font-semibold text-gray-800">{item.prenom}</Text>
                      <Text className="text-2xl">{item.vehicule}</Text>
                    </View>
                    <View className="mt-1 flex-row items-center">
                      <Text className="mr-2 font-bold text-yellow-500">⭐ {item.etoiles}</Text>
                      <Text
                        className={`text-xs font-bold ${item.disponible ? 'text-green-500' : 'text-red-500'}`}>
                        {item.disponible ? 'Disponible' : 'Occupé'}
                      </Text>
                    </View>
                  </View>
                </View>

                {expandedLivreur === item.id && (
                  <View className="mt-2 pl-2">
                    <Text className="mb-1 font-bold text-gray-600">Commentaires :</Text>
                    {item.commentaires.map((com, idx) => (
                      <Text key={idx} className="text-sm italic text-gray-500">
                        &ldquo;{com}&rdquo;
                      </Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Formulaire */}
          <View className="mt-8 space-y-4">
            <View className="flex-col gap-5">
              <View className="flex-row items-center rounded-2xl bg-white p-4 shadow-md">
                <Ionicons name="location-outline" size={24} color="#2162FE" className="mr-3" />
                <TextInput
                  className="flex-1 text-gray-700"
                  placeholder="Lieu de récupération"
                  value={pickupLocation}
                  onChangeText={setPickupLocation}
                />
              </View>

              <View className="flex-row items-center rounded-2xl bg-white p-4 shadow-md">
                <Ionicons name="flag-outline" size={24} color="#2162FE" className="mr-3" />
                <TextInput
                  className="flex-1 text-gray-700"
                  placeholder="Lieu de dépôt"
                  value={dropoffLocation}
                  onChangeText={setDropoffLocation}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(protected)/(tabs)')}
              className="mt-4 items-center rounded-2xl bg-[#2162FE] py-4 shadow-md"
              activeOpacity={0.8}>
              <Text className="text-lg font-bold text-white">✅ Confirmer la livraison</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
