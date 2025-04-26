import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function Delivery() {
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [expandedLivreur, setExpandedLivreur] = useState<number | null>(null); // pour voir les commentaires

  const livreurs = [
    {
      id: 1,
      prenom: "Alex",
      vehicule: "🚲 Vélo",
      etoiles: 4.5,
      disponible: true,
      photo: "https://randomuser.me/api/portraits/men/32.jpg",
      commentaires: ["Rapide et sympa", "Très pro"],
      distance: 1.2,
    },
    {
      id: 2,
      prenom: "Sofia",
      vehicule: "🏍️ Moto",
      etoiles: 4.8,
      disponible: false,
      photo: "https://randomuser.me/api/portraits/women/44.jpg",
      commentaires: ["Service impeccable", "Toujours à l'heure"],
      distance: 2.0,
    },
    {
      id: 3,
      prenom: "Karim",
      vehicule: "🚐 Mini-bus",
      etoiles: 4.2,
      disponible: true,
      photo: "https://randomuser.me/api/portraits/men/45.jpg",
      commentaires: ["Super professionnel", "Très ponctuel"],
      distance: 1.8,
    },
    {
      id: 4,
      prenom: "Emily",
      vehicule: "🚗 Voiture",
      etoiles: 4.7,
      disponible: true,
      photo: "https://randomuser.me/api/portraits/women/28.jpg",
      commentaires: ["Rapide", "Souriante"],
      distance: 1.5,
    },
    {
      id: 5,
      prenom: "Lucas",
      vehicule: "🚛 Camionnette",
      etoiles: 4.3,
      disponible: false,
      photo: "https://randomuser.me/api/portraits/men/52.jpg",
      commentaires: ["Top!", "Consciencieux"],
      distance: 2.5,
    },
    {
      id: 6,
      prenom: "Nina",
      vehicule: "🚲 Vélo",
      etoiles: 4.6,
      disponible: true,
      photo: "https://randomuser.me/api/portraits/women/36.jpg",
      commentaires: ["Rapide", "Très gentille"],
      distance: 1.9,
    },
    {
      id: 7,
      prenom: "Thomas",
      vehicule: "🛵 Scooter",
      etoiles: 4.4,
      disponible: true,
      photo: "https://randomuser.me/api/portraits/men/76.jpg",
      commentaires: ["Professionnel", "Serviable"],
      distance: 2.2,
    },
    {
      id: 8,
      prenom: "Laura",
      vehicule: "🚗 Voiture",
      etoiles: 4.5,
      disponible: true,
      photo: "https://randomuser.me/api/portraits/women/58.jpg",
      commentaires: ["Très agréable", "Super ponctuelle"],
      distance: 1.4,
    },
    {
      id: 9,
      prenom: "Hugo",
      vehicule: "🚐 Mini-bus",
      etoiles: 4.1,
      disponible: false,
      photo: "https://randomuser.me/api/portraits/men/84.jpg",
      commentaires: ["Ponctuel", "Bon service"],
      distance: 3.0,
    },
    {
      id: 10,
      prenom: "Emma",
      vehicule: "🚗 Voiture",
      etoiles: 4.9,
      disponible: true,
      photo: "https://randomuser.me/api/portraits/women/70.jpg",
      commentaires: ["Super rapide!", "Hyper gentille"],
      distance: 1.1,
    },
  ].sort((a, b) => a.distance - b.distance);

  const router = useRouter();

  const handleConfirm = () => {
    router.push('/delivery/waiting-confirmation');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <LinearGradient
        colors={['#FFDD5C', '#ffffff']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1 p-6">
          {/* Header */}
          <Text className="text-3xl font-bold text-blue-800 mb-6">🚚 Trouvez votre livreur</Text>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {livreurs.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-white p-4 mb-5 rounded-2xl shadow-md"
                onPress={() => setExpandedLivreur(expandedLivreur === item.id ? null : item.id)}
              >
                <View className="flex-row items-center gap-4 mb-2">
                  <Image
                    source={{ uri: item.photo }}
                    className="w-14 h-14 rounded-full"
                  />
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-xl font-semibold text-gray-800">{item.prenom}</Text>
                      <Text className="text-2xl">{item.vehicule}</Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-yellow-500 font-bold mr-2">⭐ {item.etoiles}</Text>
                      <Text className={`text-xs font-bold ${item.disponible ? 'text-green-500' : 'text-red-500'}`}>
                        {item.disponible ? 'Disponible' : 'Occupé'}
                      </Text>
                    </View>
                  </View>
                </View>

                {expandedLivreur === item.id && (
                  <View className="mt-2 pl-2">
                    <Text className="text-gray-600 mb-1 font-bold">Commentaires :</Text>
                    {item.commentaires.map((com, idx) => (
                      <Text key={idx} className="text-gray-500 italic text-sm">"{com}"</Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Formulaire */}
          <View className="mt-8 space-y-4">
            <View className='flex-col gap-5'>
              <View className="bg-white p-4 rounded-2xl shadow-md flex-row items-center">
                <Ionicons name="location-outline" size={24} color="#2162FE" className="mr-3" />
                <TextInput
                  className="flex-1 text-gray-700"
                  placeholder="Lieu de récupération"
                  value={pickupLocation}
                  onChangeText={setPickupLocation}
                />
              </View>

              <View className="bg-white p-4 rounded-2xl shadow-md flex-row items-center">
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
              onPress={() => router.push('/delivery/waiting-confirmation')}
              className="bg-[#2162FE] py-4 rounded-2xl items-center shadow-md mt-4"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">✅ Confirmer la livraison</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
