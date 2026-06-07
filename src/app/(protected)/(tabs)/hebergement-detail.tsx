import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useMemo, useState, useEffect, useCallback } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
import { useFavoritesStore } from '../../../stores/favoritesStore';
import { toast } from '../../../stores/toastStore';
import { ImageCarousel } from '../../../components/ui';
import { RatingModal, RatingSummary, StarRating } from '../../../components/ratings';
import {
  fetchHebergementReviews,
  computeReviewSummary,
  clientCanReviewHebergement,
  submitHebergementReview,
} from '../../../lib/supabaseHebergementReviews';
import type { HebergementReview } from '../../../types';
import { validateHebergementBooking } from '../../../lib/bookingValidation';
import {
  generateIdempotencyKey,
  initiatePayment,
  isSuccessStatus,
} from '../../../lib/payments';
import { PaymentMethodSheet, PaymentStatusModal } from '../../../components/payments';
import type { PaymentMethod, Payment, PaymentStatus } from '../../../types';
import {
  formatPriceFr,
  getHebergementAvailability,
  parseImagesParam,
  computeStay,
  addDays,
  formatDayMonthFr,
} from '../../../utils/detailFormatters';
import { resolveAmenities } from '../../../constants/amenities';
import {
  isTarifPeriode,
  periodeSuffixe,
  uniteLabel,
  maxUnites,
  dureeEnNuits,
} from '../../../utils/tarifPeriode';

const HEBERGEUR_COLOR = '#8B5CF6';
const HEBERGEUR_TINT = '#F3E8FF';
const PAGE_BG = '#F1F3F7';

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
  // `units` = nombre de périodes réservées (nuits, semaines ou mois selon
  // periodeTarif). La durée réelle en nuits en est dérivée pour le stockage.
  const [units, setUnits] = useState(1);
  const [guests, setGuests] = useState(1);
  const [checkIn, setCheckIn] = useState<Date>(() => new Date());
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [reviews, setReviews] = useState<HebergementReview[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  // Payment flow state: open the method sheet first, then the status
  // modal while the provider settles. On 'succeeded' we create the
  // reservation via the existing bookHebergement path.
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [paymentStatusVisible, setPaymentStatusVisible] = useState(false);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [initialPaymentStatus, setInitialPaymentStatus] = useState<PaymentStatus | undefined>(
    undefined
  );
  const [initialPaymentMessage, setInitialPaymentMessage] = useState<string | undefined>(undefined);

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

  // Only the amenity keys the hôte actually selected — unknown/legacy keys
  // are dropped by resolveAmenities, so the client never sees a service the
  // hôte didn't declare.
  const amenities = useMemo(
    () => resolveAmenities(parseImagesParam(params.amenities)),
    [params.amenities]
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

  const periodeTarif = isTarifPeriode(params.periodeTarif) ? params.periodeTarif : 'nuit';
  // Durée réelle du séjour en nuits (1 semaine = 7 nuits, 1 mois = 30 nuits).
  const durationNights = dureeEnNuits(periodeTarif, units);
  const totalPrice = hebergement.prixParNuit * units;
  const availability = getHebergementAvailability(hebergement.disponibilite);
  const checkOutDate = useMemo(
    () => addDays(checkIn, Math.max(1, durationNights)),
    [checkIn, durationNights]
  );
  const stay = useMemo(() => computeStay(checkIn, durationNights), [checkIn, durationNights]);
  const reviewSummary = useMemo(() => computeReviewSummary(reviews), [reviews]);

  const isFavorite = useFavoritesStore((s) => s.favoriteIds.includes(hebergement.supabaseId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const loadFavoriteIds = useFavoritesStore((s) => s.loadFavoriteIds);

  // Ensure the favourites store knows the client even on a direct deep-link
  // into this screen (so the ❤️ toggles instead of being a no-op).
  useEffect(() => {
    if (supabaseProfileId) void loadFavoriteIds(supabaseProfileId);
  }, [supabaseProfileId, loadFavoriteIds]);

  const loadReviews = useCallback(async () => {
    if (!hebergement.supabaseId) return;
    setReviews(await fetchHebergementReviews(hebergement.supabaseId));
  }, [hebergement.supabaseId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  // Gate the "Laisser un avis" affordance: only a client with a reservation
  // for this listing may review (RLS enforces it server-side too).
  useEffect(() => {
    if (!supabaseProfileId || !hebergement.supabaseId) {
      setCanReview(false);
      return;
    }
    let active = true;
    clientCanReviewHebergement(supabaseProfileId, hebergement.supabaseId).then((ok) => {
      if (active) setCanReview(ok);
    });
    return () => {
      active = false;
    };
  }, [supabaseProfileId, hebergement.supabaseId]);

  const handleSubmitReview = useCallback(
    async (rating: number, comment: string) => {
      if (!supabaseProfileId) return;
      setReviewModalVisible(false);
      const saved = await submitHebergementReview({
        hebergementId: hebergement.supabaseId,
        clientId: supabaseProfileId,
        rating,
        comment,
      });
      if (saved) {
        hapticSuccess();
        toast.success('Merci pour ton avis ⭐', { title: 'Avis publié' });
        void loadReviews();
      } else {
        toast.error('Impossible de publier ton avis. Réessaie.', { title: 'Erreur' });
      }
    },
    [supabaseProfileId, hebergement.supabaseId, loadReviews]
  );

  const validation = validateHebergementBooking({
    supabaseProfileId,
    hebergeurProfileId: hebergement.hebergeurProfileId,
    hebergementId: hebergement.supabaseId,
    availableUnits: hebergement.disponibilite,
    capacite: hebergement.capacite,
    requestedGuests: guests,
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
        nombreNuits: durationNights,
        nombreVoyageurs: guests,
        dateArrivee: stay.dateArrivee,
        dateDepart: stay.dateDepart,
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
    // New flow (post-payment integration): open the method sheet first.
    // The reservation row is created only after the payment succeeds.
    setPaymentSheetVisible(true);
  };

  const handlePaymentConfirm = async (input: {
    method: PaymentMethod;
    payerPhone?: string;
  }) => {
    setPaymentSheetVisible(false);
    if (!supabaseProfileId) {
      toast.error('Connecte-toi pour payer.', { title: 'Session expirée' });
      return;
    }
    setIsBooking(true);
    const idempotencyKey = generateIdempotencyKey();
    const result = await initiatePayment({
      amount: totalPrice,
      currency: 'XAF',
      method: input.method,
      relatedType: 'hebergement_reservation',
      // No reservation row exists yet — we link by hebergement id. The
      // reservation row is created on payment success.
      relatedId: hebergement.supabaseId,
      idempotencyKey,
      payerPhone: input.payerPhone,
      // Fallback for the Edge Function when JWT auth doesn't resolve.
      payerProfileId: supabaseProfileId ?? undefined,
    });
    setIsBooking(false);

    if ('error' in result) {
      toast.error(result.error, { title: 'Paiement impossible', durationMs: 5000 });
      return;
    }

    // PayPal would open redirectUrl in expo-web-browser (Phase 3).
    setActivePaymentId(result.paymentId);
    setInitialPaymentStatus(result.status);
    setInitialPaymentMessage(result.message);
    setPaymentStatusVisible(true);

    if (isSuccessStatus(result.status)) {
      void performBooking();
    }
  };

  const handlePaymentSuccess = (_payment: Payment) => {
    hapticSuccess();
    void performBooking();
  };

  const handlePaymentFailure = (payment: Payment) => {
    toast.error(payment.errorMessage || 'Le paiement a échoué.', {
      title: 'Paiement échoué',
      durationMs: 5000,
    });
  };

  const handleClosePaymentStatus = () => {
    setPaymentStatusVisible(false);
    setActivePaymentId(null);
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
              onPress={() => {
                hapticSelection();
                toggleFavorite(hebergement.supabaseId);
              }}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
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
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#EF4444' : '#111827'}
              />
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
          marginTop: -28,
        }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 16 }}>
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
                  PRIX / NUIT
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#0F172A',
                    fontVariant: ['tabular-nums'],
                  }}>
                  {formatPriceFr(hebergement.prixParNuit)} Fcfa
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

        {/* À propos de ce logement */}
        {hebergement.description ? (
          <View
            style={{
              marginTop: 14,
              backgroundColor: 'white',
              borderRadius: 18,
              borderCurve: 'continuous',
              padding: 18,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
            }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: '#9CA3AF',
                letterSpacing: 1,
              }}>
              À PROPOS DE CE LOGEMENT
            </Text>
            <Text
              selectable
              style={{ marginTop: 8, fontSize: 14, lineHeight: 21, color: '#374151' }}>
              {hebergement.description}
            </Text>
          </View>
        ) : null}

        {/* Équipements — uniquement ceux déclarés par l'hôte */}
        {amenities.length > 0 ? (
          <View
            style={{
              marginTop: 14,
              backgroundColor: 'white',
              borderRadius: 18,
              borderCurve: 'continuous',
              padding: 18,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
            }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: '#9CA3AF',
                letterSpacing: 1,
              }}>
              ÉQUIPEMENTS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 10 }}>
              {amenities.map((a) => (
                <View
                  key={a.key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: HEBERGEUR_TINT,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderCurve: 'continuous',
                  }}>
                  <Ionicons
                    name={a.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={HEBERGEUR_COLOR}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                    {a.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Avis du logement */}
        <View
          style={{
            marginTop: 14,
            backgroundColor: 'white',
            borderRadius: 18,
            borderCurve: 'continuous',
            padding: 18,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text
              style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 }}>
              AVIS
            </Text>
            {canReview && (
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  setReviewModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Laisser un avis"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="create-outline" size={16} color={HEBERGEUR_COLOR} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: HEBERGEUR_COLOR }}>
                  Laisser un avis
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {reviewSummary.total > 0 ? (
            <View style={{ marginTop: 12 }}>
              <RatingSummary data={reviewSummary} />
              <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }} />
              {reviews.slice(0, 5).map((rev) => (
                <View key={rev.id} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {rev.authorAvatar ? (
                      <Image
                        source={{ uri: rev.authorAvatar }}
                        style={{ width: 32, height: 32, borderRadius: 16 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: HEBERGEUR_TINT,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Ionicons name="person" size={16} color={HEBERGEUR_COLOR} />
                      </View>
                    )}
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
                        {rev.authorName || 'Client'}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {formatDayMonthFr(new Date(rev.createdAt))}
                      </Text>
                    </View>
                    <StarRating rating={rev.rating} size={14} />
                  </View>
                  {rev.comment ? (
                    <Text
                      style={{ marginTop: 6, fontSize: 13, lineHeight: 19, color: '#374151' }}>
                      {rev.comment}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ marginTop: 10, fontSize: 13, color: '#6B7280' }}>
              {canReview
                ? 'Sois le premier à laisser un avis sur ce logement.'
                : "Pas encore d'avis."}
            </Text>
          )}
        </View>
        </ScrollView>

        {/* Booking bar */}
        <View style={{ paddingHorizontal: 4, paddingTop: 12 }}>
          {/* Dates : date d'arrivée (picker) ; départ calculé = arrivée + nuits */}
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
                ARRIVÉE
              </Text>
              <Text style={{ marginTop: 2, fontSize: 13, color: '#6B7280' }}>
                Départ le {formatDayMonthFr(checkOutDate)}
              </Text>
            </View>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={checkIn}
                mode="date"
                display="compact"
                minimumDate={new Date()}
                onChange={(_e: DateTimePickerEvent, d?: Date) => {
                  if (d) setCheckIn(d);
                }}
              />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  setShowCheckInPicker(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Choisir la date d'arrivée"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'white',
                  borderRadius: 999,
                  borderCurve: 'continuous',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                }}>
                <Ionicons name="calendar-outline" size={16} color={HEBERGEUR_COLOR} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
                  {formatDayMonthFr(checkIn)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {Platform.OS === 'android' && showCheckInPicker && (
            <DateTimePicker
              value={checkIn}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_e: DateTimePickerEvent, d?: Date) => {
                setShowCheckInPicker(false);
                if (d) setCheckIn(d);
              }}
            />
          )}

          {/* Voyageurs counter — borné par la capacité du logement */}
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
                VOYAGEURS
              </Text>
              <Text style={{ marginTop: 2, fontSize: 13, color: '#6B7280' }}>
                {hebergement.capacite} max
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
                  if (guests > 1) {
                    hapticSelection();
                    setGuests(guests - 1);
                  }
                }}
                disabled={guests <= 1}
                accessibilityRole="button"
                accessibilityLabel="Réduire le nombre de voyageurs"
                style={{
                  height: 36,
                  width: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#F3F4F6',
                  opacity: guests <= 1 ? 0.4 : 1,
                }}>
                <Ionicons name="remove" size={18} color="#374151" />
              </TouchableOpacity>
              <Text
                style={{
                  marginHorizontal: 16,
                  fontSize: 17,
                  fontWeight: '700',
                  color: '#0F172A',
                  fontVariant: ['tabular-nums'],
                  minWidth: 18,
                  textAlign: 'center',
                }}>
                {guests}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (guests < hebergement.capacite) {
                    hapticSelection();
                    setGuests(guests + 1);
                  }
                }}
                disabled={guests >= hebergement.capacite}
                accessibilityRole="button"
                accessibilityLabel="Augmenter le nombre de voyageurs"
                style={{
                  height: 36,
                  width: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: HEBERGEUR_COLOR,
                  opacity: guests >= hebergement.capacite ? 0.4 : 1,
                }}>
                <Ionicons name="add" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

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
                {uniteLabel(periodeTarif, 2).split(' ')[1].toUpperCase()}
              </Text>
              <Text
                selectable
                style={{
                  marginTop: 2,
                  fontSize: 13,
                  color: '#6B7280',
                  fontVariant: ['tabular-nums'],
                }}>
                {formatPriceFr(hebergement.prixParNuit)} Fcfa / {periodeSuffixe(periodeTarif)}
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
                  if (units > 1) {
                    hapticSelection();
                    animateCounter();
                    setUnits(units - 1);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={`Réduire le nombre de ${periodeSuffixe(periodeTarif)}s`}
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
                {units}
              </Animated.Text>
              <TouchableOpacity
                onPress={() => {
                  if (units < maxUnites(periodeTarif)) {
                    hapticSelection();
                    animateCounter();
                    setUnits(units + 1);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={`Augmenter le nombre de ${periodeSuffixe(periodeTarif)}s`}
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
              Total · {uniteLabel(periodeTarif, units)}
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
                : `Réserver ${uniteLabel(periodeTarif, units)} pour ${totalPrice} Fcfa`
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

      <PaymentMethodSheet
        visible={paymentSheetVisible}
        onClose={() => setPaymentSheetVisible(false)}
        amount={totalPrice}
        currency="XAF"
        onConfirm={handlePaymentConfirm}
      />

      <PaymentStatusModal
        visible={paymentStatusVisible}
        paymentId={activePaymentId}
        initialStatus={initialPaymentStatus}
        initialMessage={initialPaymentMessage}
        onClose={handleClosePaymentStatus}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
      />

      <RatingModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        onSubmit={handleSubmitReview}
      />
    </View>
  );
}
