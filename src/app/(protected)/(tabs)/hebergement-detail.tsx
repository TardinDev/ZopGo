import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useMemo, useState } from 'react';
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
import { hapticSelection, hapticSuccess, hapticMedium } from '../../../utils/haptics';
import { useAuthStore } from '../../../stores/authStore';
import { useReservationsStore } from '../../../stores/reservationsStore';
import { toast } from '../../../stores/toastStore';
import { ImageCarousel } from '../../../components/ui';
import { validateHebergementBooking } from '../../../lib/bookingValidation';

const HEBERGEUR_COLOR = '#8B5CF6';

function getAvailabilityStyle(count: number) {
  if (count <= 0) return { color: COLORS.error, label: 'Complet' };
  if (count <= 2) return { color: COLORS.warning, label: `Plus que ${count} !` };
  return { color: COLORS.success, label: `${count} disponible${count > 1 ? 's' : ''}` };
}

function parseImagesParam(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((u): u is string => typeof u === 'string' && u.length > 0);
    }
  } catch {
    // older callers may have passed a single URL — accept that gracefully
    if (raw.startsWith('http')) return [raw];
  }
  return [];
}

export default function HebergementDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [nights, setNights] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  const { user, supabaseProfileId } = useAuthStore();
  const { bookHebergement } = useReservationsStore();

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

  // params.images is a JSON-serialised string[]. Older callers passed a
  // single `image` URL — fallback handled by parseImagesParam.
  const images = useMemo(
    () => parseImagesParam(params.images ?? params.image),
    [params.images, params.image]
  );

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
  };

  const totalPrice = hebergement.prixParNuit * nights;
  const availability = getAvailabilityStyle(hebergement.disponibilite);

  const validation = validateHebergementBooking({
    supabaseProfileId,
    hebergeurProfileId: hebergement.hebergeurProfileId,
    hebergementId: hebergement.supabaseId,
    availableUnits: hebergement.disponibilite,
  });

  const performBooking = async () => {
    if (!validation.ok) {
      toast.error(validation.message, { title: 'Réservation impossible', durationMs: 5000 });
      return;
    }

    setIsBooking(true);
    try {
      const clientName = user?.profile?.name || 'Client';
      const reservation = await bookHebergement({
        hebergementId: hebergement.supabaseId,
        clientId: supabaseProfileId!,
        hebergeurId: hebergement.hebergeurProfileId,
        nombreNuits: nights,
        prixTotal: totalPrice,
        clientName,
        currentDisponibilite: hebergement.disponibilite,
        hebergementNom: hebergement.name,
        hebergementVille: hebergement.location,
      });

      if (reservation) {
        toast.success("L'hébergeur a été notifié. Réponse à venir bientôt.", {
          title: 'Demande envoyée',
        });
        router.back();
      } else {
        toast.error('Impossible de créer la demande. Réessaie.', { title: 'Erreur' });
      }
    } catch {
      toast.error('Une erreur est survenue.', { title: 'Erreur' });
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
      {/* Hero gallery */}
      <View>
        <ImageCarousel
          images={images}
          height={280}
          fallbackEmoji={hebergement.icon}
          fallbackIcon="bed-outline"
        />
        {/* Gradient overlay for the back button readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 90 }}
          pointerEvents="none"
        />
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <View className="flex-row items-center justify-between px-6 pb-2 pt-2">
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-black/40">
                <Ionicons name="arrow-back" size={22} color="white" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Ajouter aux favoris"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-black/40">
                <Ionicons name="heart-outline" size={22} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        className="-mt-6 flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Title card */}
        <View className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: '#F3E8FF' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: HEBERGEUR_COLOR }}>
                {hebergement.type}
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: availability.color }}>
              {availability.label}
            </Text>
          </View>
          <Text className="mt-3 text-2xl font-bold text-gray-900">{hebergement.name}</Text>
          <View className="mt-2 flex-row items-center">
            <Ionicons name="location-outline" size={16} color={COLORS.gray[500]} />
            <Text className="ml-1 text-sm text-gray-600">{hebergement.location}</Text>
          </View>
          {hebergement.adresse ? (
            <Text className="mt-1 text-xs text-gray-500">{hebergement.adresse}</Text>
          ) : null}
          <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={18} color={COLORS.gray[500]} />
              <Text className="ml-2 text-sm text-gray-600">
                {hebergement.capacite} personne{hebergement.capacite > 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: HEBERGEUR_COLOR }}>
              {hebergement.prixParNuit} Fcfa
              <Text className="text-xs font-normal text-gray-500">/nuit</Text>
            </Text>
          </View>
        </View>

        {/* Description */}
        {hebergement.description ? (
          <View className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Description
            </Text>
            <Text className="text-sm leading-6 text-gray-700">{hebergement.description}</Text>
          </View>
        ) : null}

        {/* Hebergeur card */}
        <View className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Hébergeur
          </Text>
          <View className="flex-row items-center">
            {hebergement.hebergeurAvatar ? (
              <Image
                source={{ uri: hebergement.hebergeurAvatar }}
                style={{ width: 56, height: 56, borderRadius: 28 }}
              />
            ) : (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#F3E8FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="person" size={28} color={HEBERGEUR_COLOR} />
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-gray-900">{hebergement.hebergeurName}</Text>
              <View className="mt-1 flex-row items-center">
                {hebergement.hebergeurRating > 0 ? (
                  <>
                    <Ionicons name="star" size={14} color={COLORS.star} />
                    <Text className="ml-1 text-sm font-semibold text-gray-700">
                      {hebergement.hebergeurRating.toFixed(1)}
                    </Text>
                  </>
                ) : (
                  <Text className="text-sm text-gray-500">Nouveau hôte</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Counter card */}
        <View className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Combien de nuits ?
              </Text>
              <Text className="mt-1 text-sm text-gray-600">Choisis ta durée de séjour</Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  if (nights > 1) {
                    hapticSelection();
                    animateCounter();
                    setNights(nights - 1);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Réduire le nombre de nuits"
                className="h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="remove" size={22} color={COLORS.gray[600]} />
              </TouchableOpacity>
              <Animated.Text
                className="mx-5 text-xl font-bold text-gray-900"
                style={counterAnimatedStyle}>
                {nights}
              </Animated.Text>
              <TouchableOpacity
                onPress={() => {
                  if (nights < 30) {
                    hapticSelection();
                    animateCounter();
                    setNights(nights + 1);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Augmenter le nombre de nuits"
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: HEBERGEUR_COLOR }}>
                <Ionicons name="add" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Total + CTA */}
        <View
          className="rounded-3xl bg-white p-5"
          style={{ ...LAYOUT.shadows.large, borderLeftWidth: 4, borderLeftColor: HEBERGEUR_COLOR }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-700">Total</Text>
            <Animated.Text
              className="text-2xl font-bold"
              style={[totalAnimatedStyle, { color: HEBERGEUR_COLOR }]}>
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
                : `Réserver ${nights} nuit${nights > 1 ? 's' : ''} pour ${totalPrice} Fcfa`
            }
            accessibilityState={{ disabled: isBooking || !validation.ok }}
            className="items-center rounded-2xl py-4"
            style={{
              backgroundColor: HEBERGEUR_COLOR,
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
