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
import { useRouter } from 'expo-router';
import { useDriversStore } from '../../../stores/driversStore';

export default function Delivery() {
  const router = useRouter();
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [expandedLivreur, setExpandedLivreur] = useState<number | null>(null);

  const livreurs = useDriversStore().getAllDrivers();

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
