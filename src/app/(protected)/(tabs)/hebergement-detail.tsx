import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
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
import { COLORS } from '../../../constants';
import { SPRING_CONFIG } from '../../../constants/animations';
import { hapticSelection, hapticSuccess, hapticMedium } from '../../../utils/haptics';
import { useAuthStore } from '../../../stores/authStore';
import { useReservationsStore } from '../../../stores/reservationsStore';
import { toast } from '../../../stores/toastStore';
import { ImageCarousel } from '../../../components/ui';
import { validateHebergementBooking } from '../../../lib/bookingValidation';

const HEBERGEUR_COLOR = '#8B5CF6';
const HEBERGEUR_TINT = '#F3E8FF';
const PAGE_BG = '#F1F3F7';

function getAvailabilityStyle(count: number) {
  if (count <= 0) return { color: COLORS.error, label: 'Complet' };
  if (count <= 2) return { color: COLORS.warning, label: `Plus que ${count} !` };
  return { color: COLORS.success, label: `${count} dispo.` };
}

function parseImagesParam(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((u): u is string => typeof u === 'string' && u.length > 0);
    }
  } catch {
    if (raw.startsWith('http')) return [raw];
  }
  return [];
}

function formatPriceFr(value: number): string {
  return value.toLocaleString('fr-FR').replace(/,/g, ' ');
}

function Perforation({ pageColor }: { pageColor: string }) {
  return (
    <View style={{ height: 22, position: 'relative', justifyContent: 'center' }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -11,
          top: 0,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: pageColor,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -11,
          top: 0,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: pageColor,
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 18,
        }}>
        {Array.from({ length: 26 }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 1.5,
              marginRight: 4,
              borderRadius: 0.75,
              backgroundColor: '#D1D5DB',
            }}
          />
        ))}
      </View>
    </View>
  );
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

  const locationText = [hebergement.location, hebergement.adresse].filter(Boolean).join(' · ');

  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      {/* Image hero */}
      <View>
        <ImageCarousel
          images={images}
          height={190}
          fallbackEmoji={hebergement.icon}
          fallbackIcon="bed-outline"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100 }}
          pointerEvents="none"
        />
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: 8,
            }}>
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                height: 40,
                width: 40,
                borderRadius: 20,
                borderCurve: 'continuous',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.95)',
              }}>
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Ajouter aux favoris"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                height: 40,
                width: 40,
                borderRadius: 20,
                borderCurve: 'continuous',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.95)',
              }}>
              <Ionicons name="heart-outline" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Body */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          marginTop: -28,
        }}>
        {/* Room Key card (boarding pass style) */}
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 22,
            borderCurve: 'continuous',
            overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(15, 23, 42, 0.10)',
          }}>
          {/* Brand strip */}
          <View
            style={{
              backgroundColor: HEBERGEUR_COLOR,
              paddingHorizontal: 18,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: 'white',
                letterSpacing: 1.5,
              }}>
              ZOPGO STAY
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, marginRight: 6 }}>{hebergement.icon}</Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: 'rgba(255,255,255,0.95)',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                {hebergement.type || 'Hébergement'}
              </Text>
            </View>
          </View>

          {/* Top section: hebergement */}
          <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: '#9CA3AF',
                letterSpacing: 1,
              }}>
              VOTRE SÉJOUR
            </Text>
            <Text
              selectable
              numberOfLines={1}
              style={{
                marginTop: 4,
                fontSize: 22,
                fontWeight: '800',
                color: '#0F172A',
              }}>
              {hebergement.name || 'Hébergement'}
            </Text>
            {locationText ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text
                  selectable
                  numberOfLines={1}
                  style={{ marginLeft: 4, flex: 1, fontSize: 13, color: '#6B7280' }}>
                  {locationText}
                </Text>
              </View>
            ) : null}

            {/* Stay meta: ville / capacité / dispo */}
            <View
              style={{
                flexDirection: 'row',
                marginTop: 16,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: '#F3F4F6',
              }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#9CA3AF',
                    letterSpacing: 1,
                  }}>
                  TYPE
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#0F172A',
                    textTransform: 'capitalize',
                  }}>
                  {hebergement.type || '—'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#9CA3AF',
                    letterSpacing: 1,
                  }}>
                  CAPACITÉ
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#0F172A',
                    fontVariant: ['tabular-nums'],
                  }}>
                  {hebergement.capacite} pers.
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#9CA3AF',
                    letterSpacing: 1,
                  }}>
                  DISPO
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 14,
                    fontWeight: '700',
                    color: availability.color,
                  }}>
                  {availability.label}
                </Text>
              </View>
            </View>
          </View>

          <Perforation pageColor={PAGE_BG} />

          {/* Bottom section: hôte */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: 18,
            }}>
            {hebergement.hebergeurAvatar ? (
              <Image
                source={{ uri: hebergement.hebergeurAvatar }}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              />
            ) : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: HEBERGEUR_TINT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="person" size={24} color={HEBERGEUR_COLOR} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: '#9CA3AF',
                  letterSpacing: 1,
                }}>
                VOTRE HÔTE
              </Text>
              <Text
                selectable
                numberOfLines={1}
                style={{ marginTop: 2, fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                {hebergement.hebergeurName}
              </Text>
            </View>
            {hebergement.hebergeurRating > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FEF3C7',
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                }}>
                <Ionicons name="star" size={12} color={COLORS.star} />
                <Text
                  style={{
                    marginLeft: 3,
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#92400E',
                    fontVariant: ['tabular-nums'],
                  }}>
                  {hebergement.hebergeurRating.toFixed(1)}
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>NOUVEAU</Text>
            )}
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Booking bar */}
        <View style={{ paddingHorizontal: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}>
            <View>
              <Text
                style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 }}>
                NUITS
              </Text>
              <Text
                selectable
                style={{
                  marginTop: 2,
                  fontSize: 13,
                  color: '#6B7280',
                  fontVariant: ['tabular-nums'],
                }}>
                {formatPriceFr(hebergement.prixParNuit)} Fcfa / nuit
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'white',
                borderRadius: 999,
                borderCurve: 'continuous',
                paddingHorizontal: 4,
                paddingVertical: 4,
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              }}>
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
                style={{
                  height: 36,
                  width: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#F3F4F6',
                }}>
                <Ionicons name="remove" size={18} color="#374151" />
              </TouchableOpacity>
              <Animated.Text
                style={[
                  counterAnimatedStyle,
                  {
                    marginHorizontal: 16,
                    fontSize: 17,
                    fontWeight: '700',
                    color: '#0F172A',
                    fontVariant: ['tabular-nums'],
                    minWidth: 18,
                    textAlign: 'center',
                  },
                ]}>
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
                style={{
                  height: 36,
                  width: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: HEBERGEUR_COLOR,
                }}>
                <Ionicons name="add" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
              Total · {nights} nuit{nights > 1 ? 's' : ''}
            </Text>
            <Animated.Text
              selectable
              style={[
                totalAnimatedStyle,
                {
                  fontSize: 26,
                  fontWeight: '800',
                  color: '#0F172A',
                  fontVariant: ['tabular-nums'],
                },
              ]}>
              {formatPriceFr(totalPrice)} Fcfa
            </Animated.Text>
          </View>

          {!validation.ok && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                backgroundColor: '#FEF2F2',
                borderRadius: 12,
                borderCurve: 'continuous',
                padding: 10,
                marginBottom: 12,
              }}>
              <Ionicons name="information-circle" size={16} color="#B91C1C" />
              <Text style={{ flex: 1, marginLeft: 6, fontSize: 12, color: '#7F1D1D' }}>
                {validation.message}
              </Text>
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
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              borderCurve: 'continuous',
              paddingVertical: 16,
              backgroundColor: HEBERGEUR_COLOR,
              opacity: isBooking || !validation.ok ? 0.5 : 1,
              boxShadow: '0 6px 14px rgba(139, 92, 246, 0.30)',
            }}>
            {isBooking ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: 'white',
                    marginRight: 6,
                    letterSpacing: 0.3,
                  }}>
                  {!validation.ok && validation.reason === 'sold_out'
                    ? 'Complet'
                    : 'Réserver maintenant'}
                </Text>
                {validation.ok && <Ionicons name="arrow-forward" size={18} color="white" />}
              </>
            )}
          </TouchableOpacity>
        </View>

        <SafeAreaView edges={['bottom']} />
      </View>
    </View>
  );
}
