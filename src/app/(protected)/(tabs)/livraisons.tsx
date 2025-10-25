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

export default function LivraisonsTab() {
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [expandedLivreur, setExpandedLivreur] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedLivreur, setSelectedLivreur] = useState<number | null>(null);

  const livreurs = [
    {
      id: 1,
      prenom: 'Mamadou',
      vehicule: '🚲 Vélo',
      etoiles: 4.5,
      disponible: true,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
      commentaires: ['Rapide et sympa', 'Très pro'],
      distance: 1.2,
    },
    {
      id: 2,
      prenom: 'Fatou',
      vehicule: '🏍️ Moto',
      etoiles: 4.8,
      disponible: false,
      photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop',
      commentaires: ['Service impeccable', "Toujours à l'heure"],
      distance: 2.0,
    },
    {
      id: 3,
      prenom: 'Kofi',
      vehicule: '🚐 Mini-bus',
      etoiles: 4.2,
      disponible: true,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      commentaires: ['Super professionnel', 'Très ponctuel'],
      distance: 1.8,
    },
    {
      id: 4,
      prenom: 'Amina',
      vehicule: '🚗 Voiture',
      etoiles: 4.7,
      disponible: true,
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
      commentaires: ['Rapide', 'Souriante'],
      distance: 1.5,
    },
    {
      id: 5,
      prenom: 'Ibrahim',
      vehicule: '🚛 Camionnette',
      etoiles: 4.3,
      disponible: false,
      photo: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=150&h=150&fit=crop',
      commentaires: ['Top!', 'Consciencieux'],
      distance: 2.5,
    },
  ].sort((a, b) => a.distance - b.distance);

  const handleSearch = () => {
    if (pickupLocation && dropoffLocation) {
      setShowResults(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1">
      <LinearGradient colors={['#F59E0B', '#FBBF24']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <Text className="text-4xl font-extrabold text-white">📦 Livraison</Text>
            <Text className="text-white/80 mt-1">Trouvez votre livreur en quelques clics</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}>

            {/* Formulaire Principal */}
            {!showResults ? (
              <View className="px-6">
                {/* Card principale */}
                <View className="bg-white rounded-3xl p-6 shadow-xl mb-6">
                  <Text className="text-2xl font-bold text-gray-800 mb-6">
                    Où souhaitez-vous envoyer votre colis ?
                  </Text>

                  {/* Lieu de récupération */}
                  <View className="mb-5">
                    <View className="flex-row items-center mb-2">
                      <View className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                        <Ionicons name="cube-outline" size={20} color="#2162FE" />
                      </View>
                      <Text className="text-sm font-semibold text-gray-600">Point de récupération</Text>
                    </View>
                    <View className="flex-row items-center rounded-2xl bg-gray-50 px-4 py-4 border-2 border-gray-200">
                      <Ionicons name="location" size={24} color="#2162FE" />
                      <TextInput
                        className="flex-1 ml-3 text-gray-800 text-base"
                        placeholder="Ex: Libreville, Glass"
                        placeholderTextColor="#9CA3AF"
                        value={pickupLocation}
                        onChangeText={setPickupLocation}
                      />
                    </View>
                  </View>

                  {/* Bouton swap */}
                  <View className="items-center -my-3 z-10">
                    <View className="bg-white rounded-full p-2 shadow-md border-2 border-orange-200">
                      <Ionicons name="swap-vertical" size={24} color="#F59E0B" />
                    </View>
                  </View>

                  {/* Lieu de livraison */}
                  <View className="mt-5">
                    <View className="flex-row items-center mb-2">
                      <View className="h-10 w-10 rounded-full bg-green-100 items-center justify-center mr-3">
                        <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                      </View>
                      <Text className="text-sm font-semibold text-gray-600">Point de livraison</Text>
                    </View>
                    <View className="flex-row items-center rounded-2xl bg-gray-50 px-4 py-4 border-2 border-gray-200">
                      <Ionicons name="flag" size={24} color="#10B981" />
                      <TextInput
                        className="flex-1 ml-3 text-gray-800 text-base"
                        placeholder="Ex: Port-Gentil, Centre-ville"
                        placeholderTextColor="#9CA3AF"
                        value={dropoffLocation}
                        onChangeText={setDropoffLocation}
                      />
                    </View>
                  </View>

                  {/* Informations supplémentaires */}
                  <View className="mt-6 bg-blue-50 rounded-2xl p-4">
                    <View className="flex-row items-center">
                      <Ionicons name="information-circle" size={20} color="#2162FE" />
                      <Text className="ml-2 text-sm text-gray-600 flex-1">
                        Les livreurs les plus proches seront affichés en premier
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bouton de recherche principal */}
                <TouchableOpacity
                  onPress={handleSearch}
                  disabled={!pickupLocation || !dropoffLocation}
                  className={`overflow-hidden rounded-3xl shadow-xl ${(!pickupLocation || !dropoffLocation) ? 'opacity-50' : ''}`}
                  activeOpacity={0.9}>
                  <LinearGradient
                    colors={['#2162FE', '#1E40AF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ paddingVertical: 20, paddingHorizontal: 24 }}>
                    <View className="flex-row items-center justify-center">
                      <Ionicons name="search" size={24} color="white" />
                      <Text className="text-xl font-bold text-white ml-3">
                        Rechercher un livreur
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* Résultats de recherche */
              <View className="px-6">
                {/* En-tête des résultats */}
                <View className="bg-white rounded-3xl p-4 mb-4 shadow-md">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm text-gray-500">Trajet</Text>
                      <Text className="text-base font-bold text-gray-800">
                        {pickupLocation} → {dropoffLocation}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowResults(false)}
                      className="bg-gray-100 rounded-full p-2">
                      <Ionicons name="pencil" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text className="text-white text-lg font-bold mb-4">
                  {livreurs.filter(l => l.disponible).length} livreurs disponibles
                </Text>

                {/* Liste des livreurs */}
                {livreurs.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    className={`mb-4 rounded-3xl bg-white p-5 shadow-lg ${selectedLivreur === item.id ? 'border-4 border-blue-500' : ''}`}
                    onPress={() => setSelectedLivreur(item.id)}
                    activeOpacity={0.9}>
                    <View className="flex-row items-center gap-4">
                      <Image source={{ uri: item.photo }} className="h-16 w-16 rounded-full border-2 border-gray-200" />
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-xl font-bold text-gray-800">{item.prenom}</Text>
                          <View className={`px-3 py-1 rounded-full ${item.disponible ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Text className={`text-xs font-bold ${item.disponible ? 'text-green-700' : 'text-red-700'}`}>
                              {item.disponible ? 'Disponible' : 'Occupé'}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-600">{item.vehicule}</Text>
                          <View className="flex-row items-center">
                            <Ionicons name="star" size={16} color="#F59E0B" />
                            <Text className="ml-1 font-bold text-gray-700">{item.etoiles}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center mt-2">
                          <Ionicons name="location-outline" size={14} color="#6B7280" />
                          <Text className="ml-1 text-xs text-gray-500">{item.distance} km</Text>
                        </View>
                      </View>
                    </View>

                    {selectedLivreur === item.id && (
                      <View className="mt-4 pt-4 border-t border-gray-200">
                        <Text className="font-bold text-gray-700 mb-2">Avis clients :</Text>
                        {item.commentaires.map((com, idx) => (
                          <View key={idx} className="flex-row items-start mb-1">
                            <Ionicons name="chatbox-ellipses" size={14} color="#9CA3AF" />
                            <Text className="ml-2 text-sm text-gray-600 flex-1 italic">
                              "{com}"
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                {/* Bouton de confirmation */}
                {selectedLivreur && (
                  <TouchableOpacity
                    onPress={() => console.log('Confirmer avec livreur', selectedLivreur)}
                    className="overflow-hidden rounded-3xl shadow-xl mt-4"
                    activeOpacity={0.9}>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ paddingVertical: 20, paddingHorizontal: 24 }}>
                      <View className="flex-row items-center justify-center">
                        <Ionicons name="checkmark-circle" size={24} color="white" />
                        <Text className="text-xl font-bold text-white ml-3">
                          Confirmer la livraison
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
