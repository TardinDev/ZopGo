import { View, Text, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { useAuthStore } from '../../../stores/authStore';
import { useReservationsStore } from '../../../stores/reservationsStore';

export default function VoyageDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [passengers, setPassengers] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  const { user, supabaseProfileId } = useAuthStore();
  const { bookTrajet } = useReservationsStore();

  const voyage = {
    id: String(params.id || ''),
    type: params.type || 'Bus',
    from: params.from || 'Libreville',
    to: params.to || 'Mouanda',
    price: params.price || '25000 Fcfa',
    icon: params.icon || '🚍',
    departureTime: '14:30',
    arrivalTime: '18:45',
    duration: '4h 15min',
    availableSeats: Number(params.placesDisponibles) || 4,
    driver: (params.chauffeurName as string) || 'Conducteur',
    driverRating: Number(params.chauffeurRating) || 0,
    driverAvatar: (params.chauffeurAvatar as string) || '',
    chauffeurProfileId: (params.chauffeurProfileId as string) || '',
    vehicle: String(params.type || 'Véhicule'),
    amenities: ['Climatisation', 'Bagages'],
  };

  const unitPrice = parseInt(String(voyage.price).replace(/[^0-9]/g, '')) || 0;
  const totalPrice = unitPrice * passengers;

  const performBooking = async () => {
    if (!supabaseProfileId || !voyage.chauffeurProfileId || !voyage.id) {
      Alert.alert('Erreur', 'Informations de réservation incomplètes.');
      return;
    }

    setIsBooking(true);
    try {
      const clientName = user?.profile?.name || 'Client';
      const reservation = await bookTrajet({
        trajetId: voyage.id,
        clientId: supabaseProfileId,
        chauffeurId: voyage.chauffeurProfileId,
        nombrePlaces: passengers,
        prixTotal: totalPrice,
        clientName,
        remainingPlaces: voyage.availableSeats,
        villeDepart: String(voyage.from),
        villeArrivee: String(voyage.to),
      });

      if (reservation) {
        Alert.alert(
          'Réservation envoyée',
          'Le chauffeur a été notifié. Vous recevrez une réponse bientôt.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de créer la réservation. Réessayez.');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la réservation.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleBooking = () => {
    Alert.alert(
      'Confirmer la réservation',
      `Réserver ${passengers} place(s) pour ${totalPrice} Fcfa ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: performBooking },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={COLORS.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={{ paddingBottom: 32 }}>
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
                <Ionicons name="remove" size={20} color={COLORS.gray[500]} />
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
              {voyage.driverAvatar ? (
                <Image
                  source={{ uri: voyage.driverAvatar }}
                  style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}
                />
              ) : null}
              <Text className="mr-2 font-medium">{voyage.driver}</Text>
              {voyage.driverRating > 0 && (
                <View className="flex-row items-center">
                  <Ionicons name="star" size={16} color={COLORS.star} />
                  <Text className="ml-1 text-sm text-gray-600">{voyage.driverRating.toFixed(1)}</Text>
                </View>
              )}
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
            disabled={isBooking}
            className="items-center rounded-2xl bg-[#2162FE] py-4"
            style={{ opacity: isBooking ? 0.7 : 1 }}>
            {isBooking ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-bold text-white">Réserver maintenant</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
