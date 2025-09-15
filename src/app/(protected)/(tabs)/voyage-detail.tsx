import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function VoyageDetailScreen() {
  const params = useLocalSearchParams();
  const [passengers, setPassengers] = useState(1);

  // En vraie app, on récupérerait les données du voyage avec l'ID
  const voyage = {
    id: params.id || '1',
    type: params.type || 'Bus',
    from: params.from || 'Libreville',
    to: params.to || 'Mouanda',
    price: params.price || '25000 Fcfa',
    icon: params.icon || '🚍',
    departureTime: '14:30',
    arrivalTime: '18:45',
    duration: '4h 15min',
    availableSeats: 15,
    driver: 'Amadou Traore',
    driverRating: 4.8,
    vehicle: 'Mercedes Sprinter',
    amenities: ['WiFi', 'Climatisation', 'USB', 'Bagages'],
  };

  const totalPrice = parseInt(String(voyage.price).replace(/[^0-9]/g, '')) * passengers;

  const handleBooking = () => {
    Alert.alert(
      'Confirmer la réservation',
      `Réserver ${passengers} place(s) pour ${totalPrice} Fcfa ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            Alert.alert('Succès', 'Votre réservation a été confirmée !', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#4FA5CF', '#2162FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        className="pb-8">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Détails du voyage</Text>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Trip Info Card */}
        <View className="mx-6 rounded-2xl bg-white/10 p-6 backdrop-blur">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-4xl">{voyage.icon}</Text>
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-sm font-medium text-white">{voyage.type}</Text>
            </View>
          </View>

          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-white">{voyage.from}</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
            <Text className="text-2xl font-bold text-white">{voyage.to}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-white/80">{voyage.departureTime}</Text>
            <Text className="text-white/80">{voyage.duration}</Text>
            <Text className="text-white/80">{voyage.arrivalTime}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="-mt-4 flex-1 px-6">
        {/* Price Card */}
        <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-gray-600">Prix par personne</Text>
            <Text className="text-2xl font-bold text-[#2162FE]">{voyage.price}</Text>
          </View>

          {/* Passenger Selector */}
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-gray-700">Nombre de passagers</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => passengers > 1 && setPassengers(passengers - 1)}
                className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="remove" size={20} color="#666" />
              </TouchableOpacity>
              <Text className="mx-4 text-lg font-bold">{passengers}</Text>
              <TouchableOpacity
                onPress={() => passengers < voyage.availableSeats && setPassengers(passengers + 1)}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#2162FE]">
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Vehicle Info */}
        <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <Text className="mb-4 text-lg font-bold text-gray-800">Informations du véhicule</Text>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-gray-600">Véhicule</Text>
            <Text className="font-medium">{voyage.vehicle}</Text>
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-gray-600">Places disponibles</Text>
            <Text className="font-medium text-green-600">{voyage.availableSeats} places</Text>
          </View>

          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-gray-600">Conducteur</Text>
            <View className="flex-row items-center">
              <Text className="mr-2 font-medium">{voyage.driver}</Text>
              <View className="flex-row items-center">
                <Ionicons name="star" size={16} color="#FCA91A" />
                <Text className="ml-1 text-sm text-gray-600">{voyage.driverRating}</Text>
              </View>
            </View>
          </View>

          {/* Amenities */}
          <Text className="mb-2 text-gray-600">Équipements</Text>
          <View className="flex-row flex-wrap">
            {voyage.amenities.map((amenity, index) => (
              <View key={index} className="mb-2 mr-2 rounded-full bg-gray-100 px-3 py-1">
                <Text className="text-sm text-gray-700">{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total and Book Button */}
        <View className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-800">Total</Text>
            <Text className="text-2xl font-bold text-[#2162FE]">{totalPrice} Fcfa</Text>
          </View>

          <TouchableOpacity
            onPress={handleBooking}
            className="items-center rounded-2xl bg-[#2162FE] py-4">
            <Text className="text-lg font-bold text-white">Réserver maintenant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
