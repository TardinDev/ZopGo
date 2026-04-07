import { View, Text, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, LAYOUT } from '../../../constants';
import { SPRING_CONFIG } from '../../../constants/animations';
import { useAuthStore } from '../../../stores/authStore';
import { useReservationsStore } from '../../../stores/reservationsStore';

function getAvailabilityStyle(count: number) {
  if (count <= 0) return { color: COLORS.error, label: 'Complet' };
  if (count <= 2) return { color: COLORS.warning, label: `Plus que ${count} !` };
  return { color: COLORS.success, label: `${count} disponible${count > 1 ? 's' : ''}` };
}

export default function HebergementDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [nights, setNights] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  const { user, supabaseProfileId } = useAuthStore();
  const { bookHebergement } = useReservationsStore();

  // Counter bounce animation
  const counterScale = useSharedValue(1);
  const totalScale = useSharedValue(1);

  const animateCounter = () => {
    counterScale.value = withSequence(
      withSpring(1.3, SPRING_CONFIG.fast),
      withSpring(1, SPRING_CONFIG.bouncy)
    );
    totalScale.value = withSequence(
      withSpring(1.15, SPRING_CONFIG.fast),
      withSpring(1, SPRING_CONFIG.bouncy)
    );
  };

  const counterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
  }));

  const totalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: totalScale.value }],
  }));

  const hebergement = {
    supabaseId: String(params.supabaseId || ''),
    name: String(params.name || ''),
    type: String(params.type || ''),
    location: String(params.location || ''),
    adresse: String(params.adresse || ''),
    description: String(params.description || ''),
    icon: String(params.icon || '🏨'),
    prixParNuit: Number(params.prixParNuit) || 0,
    capacite: Number(params.capacite) || 1,
    disponibilite: Number(params.disponibilite) || 0,
    hebergeurProfileId: String(params.hebergeurProfileId || ''),
    hebergeurName: String(params.hebergeurName || 'Hébergeur'),
    hebergeurAvatar: String(params.hebergeurAvatar || ''),
    hebergeurRating: Number(params.hebergeurRating) || 0,
    image: String(params.image || ''),
  };

  const totalPrice = hebergement.prixParNuit * nights;
  const availability = getAvailabilityStyle(hebergement.disponibilite);

  const performBooking = async () => {
    if (!supabaseProfileId || !hebergement.hebergeurProfileId || !hebergement.supabaseId) {
      Alert.alert('Erreur', 'Informations de réservation incomplètes.');
      return;
    }

    setIsBooking(true);
    try {
      const clientName = user?.profile?.name || 'Client';
      const reservation = await bookHebergement({
        hebergementId: hebergement.supabaseId,
        clientId: supabaseProfileId,
        hebergeurId: hebergement.hebergeurProfileId,
        nombreNuits: nights,
        prixTotal: totalPrice,
        clientName,
        currentDisponibilite: hebergement.disponibilite,
        hebergementNom: hebergement.name,
        hebergementVille: hebergement.location,
      });

      if (reservation) {
        Alert.alert(
          'Demande envoyée',
          "L'hébergeur a été notifié. Vous recevrez une réponse bientôt.",
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de créer la demande. Réessayez.');
      }
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleBooking = () => {
    Alert.alert(
      'Confirmer la réservation',
      `Réserver ${nights} nuit${nights > 1 ? 's' : ''} pour ${totalPrice} Fcfa ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: performBooking },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={COLORS.gradients.hebergeur}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Détails hébergement</Text>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View className="mx-6 rounded-2xl bg-white/10 p-6 backdrop-blur">
          <View className="mb-4 flex-row items-center justify-between">
            {hebergement.image ? (
              <Image
                source={{ uri: hebergement.image }}
                style={{ width: 56, height: 56, borderRadius: 12 }}
              />
            ) : (
              <Text className="text-4xl">{hebergement.icon}</Text>
            )}
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-sm font-medium text-white">{hebergement.type}</Text>
            </View>
          </View>

          <Text className="mb-1 text-2xl font-bold text-white">{hebergement.name}</Text>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text className="ml-1 text-white/80">{hebergement.location}</Text>
          </View>
          {hebergement.adresse ? (
            <Text className="mt-1 text-sm text-white/60">{hebergement.adresse}</Text>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView className="-mt-4 flex-1 px-6">
        {/* Prix */}
        <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-gray-600">Prix par nuit</Text>
            <Text className="text-2xl font-bold text-[#8B5CF6]">{hebergement.prixParNuit} Fcfa</Text>
          </View>

          {/* Sélecteur de nuits */}
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-gray-700">Nombre de nuits</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  if (nights > 1) {
                    animateCounter();
                    setNights(nights - 1);
                  }
                }}
                className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="remove" size={20} color={COLORS.gray[500]} />
              </TouchableOpacity>
              <Animated.Text
                className="mx-4 text-lg font-bold"
                style={counterAnimatedStyle}>
                {nights}
              </Animated.Text>
              <TouchableOpacity
                onPress={() => {
                  if (nights < 30) {
                    animateCounter();
                    setNights(nights + 1);
                  }
                }}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#8B5CF6]">
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Infos hébergement */}
        <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <Text className="mb-4 text-lg font-bold text-gray-800">Informations</Text>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-gray-600">Capacité</Text>
            <Text className="font-medium">{hebergement.capacite} personne{hebergement.capacite > 1 ? 's' : ''}</Text>
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-gray-600">Disponibilité</Text>
            <Text style={{ fontWeight: '600', color: availability.color }}>
              {availability.label}
            </Text>
          </View>

          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-gray-600">Hébergeur</Text>
            <View className="flex-row items-center">
              {hebergement.hebergeurAvatar ? (
                <Image
                  source={{ uri: hebergement.hebergeurAvatar }}
                  style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}
                />
              ) : null}
              <Text className="mr-2 font-medium">{hebergement.hebergeurName}</Text>
              {hebergement.hebergeurRating > 0 && (
                <View className="flex-row items-center">
                  <Ionicons name="star" size={16} color={COLORS.star} />
                  <Text className="ml-1 text-sm text-gray-600">{hebergement.hebergeurRating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>

          {hebergement.description ? (
            <>
              <Text className="mb-2 text-gray-600">Description</Text>
              <Text className="text-gray-700">{hebergement.description}</Text>
            </>
          ) : null}
        </View>

        {/* Total et bouton */}
        <View
          className="mb-8 rounded-2xl bg-white p-6"
          style={{ ...LAYOUT.shadows.large, borderLeftWidth: 4, borderLeftColor: '#8B5CF6' }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-800">Total</Text>
            <Animated.Text
              className="text-2xl font-bold text-[#8B5CF6]"
              style={totalAnimatedStyle}>
              {totalPrice} Fcfa
            </Animated.Text>
          </View>

          <TouchableOpacity
            onPress={handleBooking}
            disabled={isBooking || hebergement.disponibilite <= 0}
            className="items-center rounded-2xl bg-[#8B5CF6] py-4"
            style={{ opacity: isBooking || hebergement.disponibilite <= 0 ? 0.7 : 1 }}>
            {isBooking ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-bold text-white">
                {hebergement.disponibilite <= 0 ? 'Complet' : 'Réserver maintenant'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
