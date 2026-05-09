import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, LAYOUT } from '../../../constants';
import { SPRING_CONFIG } from '../../../constants/animations';
import { hapticSelection, hapticSuccess, hapticMedium } from '../../../utils/haptics';
import { useAuthStore } from '../../../stores/authStore';
import { useReservationsStore } from '../../../stores/reservationsStore';
import { toast } from '../../../stores/toastStore';
import { validateTrajetBooking } from '../../../lib/bookingValidation';

function getAvailabilityStyle(count: number) {
  if (count <= 0) return { color: COLORS.error, label: 'Complet' };
  if (count <= 2) return { color: COLORS.warning, label: `Plus que ${count} !` };
  return { color: COLORS.success, label: `${count} places` };
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} à ${hours}h${minutes}`;
  } catch {
    return '';
  }
}

export default function VoyageDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [passengers, setPassengers] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  const { user, supabaseProfileId } = useAuthStore();
  const { bookTrajet } = useReservationsStore();

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

  const voyage = {
    id: String(params.id || ''),
    type: String(params.type || 'Voiture'),
    from: String(params.from || ''),
    to: String(params.to || ''),
    price: String(params.price || ''),
    icon: String(params.icon || '🚗'),
    availableSeats: Number(params.placesDisponibles) || 0,
    driver: String(params.chauffeurName || 'Conducteur'),
    driverRating: Number(params.chauffeurRating) || 0,
    driverAvatar: String(params.chauffeurAvatar || ''),
    chauffeurProfileId: String(params.chauffeurProfileId || ''),
    date: String(params.date || ''),
    marque: String(params.marque || ''),
    modele: String(params.modele || ''),
    couleur: String(params.couleur || ''),
  };

  const unitPrice = parseInt(voyage.price.replace(/[^0-9]/g, '')) || 0;
  const totalPrice = unitPrice * passengers;
  const availability = getAvailabilityStyle(voyage.availableSeats);
  const dateLabel = formatDate(voyage.date);
  const vehicleSpecs = [voyage.marque, voyage.modele, voyage.couleur].filter(Boolean).join(' · ');

  const validation = validateTrajetBooking({
    supabaseProfileId,
    chauffeurProfileId: voyage.chauffeurProfileId,
    trajetId: voyage.id,
    availableSeats: voyage.availableSeats,
    requestedSeats: passengers,
  });

  const performBooking = async () => {
    if (!validation.ok) {
      toast.error(validation.message, { title: 'Réservation impossible', durationMs: 5000 });
      return;
    }

    setIsBooking(true);
    try {
      const clientName = user?.profile?.name || 'Client';
      const reservation = await bookTrajet({
        trajetId: voyage.id,
        clientId: supabaseProfileId!,
        chauffeurId: voyage.chauffeurProfileId,
        nombrePlaces: passengers,
        prixTotal: totalPrice,
        clientName,
        villeDepart: voyage.from,
        villeArrivee: voyage.to,
      });

      if (reservation) {
        toast.success('Le chauffeur a été notifié. Réponse à venir bientôt.', {
          title: 'Demande envoyée',
        });
        router.back();
      } else {
        toast.error('Impossible de créer la réservation. Réessaie.', { title: 'Erreur' });
      }
    } catch {
      toast.error('Une erreur est survenue lors de la réservation.', { title: 'Erreur' });
    } finally {
      setIsBooking(false);
    }
  };

  const handleBooking = () => {
    if (!validation.ok) {
      toast.error(validation.message, { title: 'Réservation impossible', durationMs: 5000 });
      return;
    }
    hapticMedium();
    hapticSuccess();
    performBooking();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Hero header */}
      <LinearGradient
        colors={COLORS.gradients.header as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingBottom: 36 }}>
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center justify-between px-6 pb-2 pt-2">
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Ionicons name="arrow-back" size={22} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-base font-semibold text-white" accessibilityRole="header">
              Détails du voyage
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Ajouter aux favoris"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Ionicons name="heart-outline" size={22} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Route hero */}
          <View className="mx-6 mt-4 rounded-3xl bg-white/15 px-5 py-5">
            <View className="mb-2 flex-row items-center">
              <Text style={{ fontSize: 36, marginRight: 8 }}>{voyage.icon}</Text>
              <View className="rounded-full bg-white/25 px-3 py-1">
                <Text className="text-xs font-semibold text-white">{voyage.type}</Text>
              </View>
            </View>

            <View className="mt-1">
              <Text className="text-xs font-medium uppercase text-white/70">De</Text>
              <Text className="mt-0.5 text-2xl font-bold text-white" numberOfLines={1}>
                {voyage.from}
              </Text>
            </View>

            <View className="my-2 ml-1 h-5 w-px bg-white/40" />

            <View>
              <Text className="text-xs font-medium uppercase text-white/70">Vers</Text>
              <Text className="mt-0.5 text-2xl font-bold text-white" numberOfLines={1}>
                {voyage.to}
              </Text>
            </View>

            {dateLabel ? (
              <View className="mt-4 flex-row items-center border-t border-white/15 pt-3">
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.85)" />
                <Text className="ml-2 text-sm text-white/85">{dateLabel}</Text>
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        className="-mt-6 flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Driver card */}
        <View className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Conducteur
          </Text>
          <View className="flex-row items-center">
            {voyage.driverAvatar ? (
              <Image
                source={{ uri: voyage.driverAvatar }}
                style={{ width: 56, height: 56, borderRadius: 28 }}
              />
            ) : (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="person" size={28} color={COLORS.primary} />
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-gray-900">{voyage.driver}</Text>
              <View className="mt-1 flex-row items-center">
                {voyage.driverRating > 0 ? (
                  <>
                    <Ionicons name="star" size={14} color={COLORS.star} />
                    <Text className="ml-1 text-sm font-semibold text-gray-700">
                      {voyage.driverRating.toFixed(1)}
                    </Text>
                  </>
                ) : (
                  <Text className="text-sm text-gray-500">Nouveau chauffeur</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Vehicle card */}
        {(vehicleSpecs || voyage.type) && (
          <View className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Véhicule
            </Text>
            <View className="flex-row items-center">
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <MaterialCommunityIcons name="car-side" size={24} color={COLORS.primary} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-gray-900">{voyage.type}</Text>
                {vehicleSpecs ? (
                  <Text className="mt-0.5 text-sm text-gray-500">{vehicleSpecs}</Text>
                ) : null}
              </View>
            </View>
            <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
              <Text className="text-sm text-gray-500">Places disponibles</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: availability.color }}>
                {availability.label}
              </Text>
            </View>
          </View>
        )}

        {/* Counter card */}
        <View className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Prix par personne
              </Text>
              <Text className="mt-1 text-xl font-bold" style={{ color: COLORS.primary }}>
                {voyage.price}
              </Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  if (passengers > 1) {
                    hapticSelection();
                    animateCounter();
                    setPassengers(passengers - 1);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Réduire le nombre de passagers"
                className="h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="remove" size={22} color={COLORS.gray[600]} />
              </TouchableOpacity>
              <Animated.Text
                className="mx-5 text-xl font-bold text-gray-900"
                style={counterAnimatedStyle}>
                {passengers}
              </Animated.Text>
              <TouchableOpacity
                onPress={() => {
                  if (passengers < voyage.availableSeats) {
                    hapticSelection();
                    animateCounter();
                    setPassengers(passengers + 1);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Augmenter le nombre de passagers"
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: COLORS.primary }}>
                <Ionicons name="add" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Total + CTA */}
        <View
          className="rounded-3xl bg-white p-5"
          style={{ ...LAYOUT.shadows.large, borderLeftWidth: 4, borderLeftColor: COLORS.primary }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-700">Total</Text>
            <Animated.Text
              className="text-2xl font-bold"
              style={[totalAnimatedStyle, { color: COLORS.primary }]}>
              {totalPrice} Fcfa
            </Animated.Text>
          </View>

          {!validation.ok && (
            <View className="mb-3 flex-row items-start rounded-2xl bg-red-50 px-3 py-2.5">
              <Ionicons name="information-circle" size={18} color="#B91C1C" />
              <Text className="ml-2 flex-1 text-xs text-red-900">{validation.message}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleBooking}
            disabled={isBooking || !validation.ok}
            accessibilityRole="button"
            accessibilityLabel={
              !validation.ok
                ? 'Réservation indisponible'
                : `Réserver ${passengers} place${passengers > 1 ? 's' : ''} pour ${totalPrice} Fcfa`
            }
            accessibilityState={{ disabled: isBooking || !validation.ok }}
            className="items-center rounded-2xl py-4"
            style={{
              backgroundColor: COLORS.primary,
              opacity: isBooking || !validation.ok ? 0.5 : 1,
            }}>
            {isBooking ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-bold text-white">
                {!validation.ok && validation.reason === 'sold_out' ? 'Complet' : 'Réserver maintenant'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
