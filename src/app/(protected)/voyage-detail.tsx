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
              { text: 'OK', onPress: () => router.back() }
            ]);
          }
        }
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
        <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Détails du voyage</Text>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Trip Info Card */}
        <View className="mx-6 bg-white/10 backdrop-blur rounded-2xl p-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-4xl">{voyage.icon}</Text>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-sm font-medium">{voyage.type}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-2xl font-bold">{voyage.from}</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
            <Text className="text-white text-2xl font-bold">{voyage.to}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-white/80">{voyage.departureTime}</Text>
            <Text className="text-white/80">{voyage.duration}</Text>
            <Text className="text-white/80">{voyage.arrivalTime}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 -mt-4">
        {/* Price Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-600">Prix par personne</Text>
            <Text className="text-2xl font-bold text-[#2162FE]">{voyage.price}</Text>
          </View>

          {/* Passenger Selector */}
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-700 font-medium">Nombre de passagers</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => passengers > 1 && setPassengers(passengers - 1)}
                className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center">
                <Ionicons name="remove" size={20} color="#666" />
              </TouchableOpacity>
              <Text className="mx-4 text-lg font-bold">{passengers}</Text>
              <TouchableOpacity
                onPress={() => passengers < voyage.availableSeats && setPassengers(passengers + 1)}
                className="bg-[#2162FE] w-10 h-10 rounded-full items-center justify-center">
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Vehicle Info */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">Informations du véhicule</Text>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-600">Véhicule</Text>
            <Text className="font-medium">{voyage.vehicle}</Text>
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-600">Places disponibles</Text>
            <Text className="font-medium text-green-600">{voyage.availableSeats} places</Text>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-600">Conducteur</Text>
            <View className="flex-row items-center">
              <Text className="font-medium mr-2">{voyage.driver}</Text>
              <View className="flex-row items-center">
                <Ionicons name="star" size={16} color="#FCA91A" />
                <Text className="text-sm text-gray-600 ml-1">{voyage.driverRating}</Text>
              </View>
            </View>
          </View>

          {/* Amenities */}
          <Text className="text-gray-600 mb-2">Équipements</Text>
          <View className="flex-row flex-wrap">
            {voyage.amenities.map((amenity, index) => (
              <View key={index} className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-sm text-gray-700">{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total and Book Button */}
        <View className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">Total</Text>
            <Text className="text-2xl font-bold text-[#2162FE]">{totalPrice} Fcfa</Text>
          </View>

          <TouchableOpacity
            onPress={handleBooking}
            className="bg-[#2162FE] rounded-2xl py-4 items-center">
            <Text className="text-white text-lg font-bold">Réserver maintenant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}