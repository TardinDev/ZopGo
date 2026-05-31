import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { validateTrajetBooking } from '../../../lib/bookingValidation';
import {
  cityCode,
  formatLongDate,
  formatPriceFr,
  formatTime,
  getVoyageAvailability,
} from '../../../utils/detailFormatters';
import {
  generateIdempotencyKey,
  initiatePayment,
  isSuccessStatus,
} from '../../../lib/payments';
import { PaymentMethodSheet, PaymentStatusModal } from '../../../components/payments';
import type { PaymentMethod, Payment, PaymentStatus } from '../../../types';

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

export default function VoyageDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [passengers, setPassengers] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  // Payment flow state: opening the method sheet, then the status modal
  // while the provider settles. On 'succeeded' we create the reservation
  // via the existing bookTrajet path.
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [paymentStatusVisible, setPaymentStatusVisible] = useState(false);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [initialPaymentStatus, setInitialPaymentStatus] = useState<PaymentStatus | undefined>(
    undefined
  );
  const [initialPaymentMessage, setInitialPaymentMessage] = useState<string | undefined>(undefined);

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
    immatriculation: String(params.immatriculation || ''),
    modele: String(params.modele || ''),
    couleur: String(params.couleur || ''),
    // Forwarded from the voyages list when the publishing profile has
    // role='agence'. Strings since router params can't carry booleans.
    isAgence: String(params.isAgence || '') === 'true',
    agencyName: String(params.agencyName || ''),
    agencyLogoUrl: String(params.agencyLogoUrl || ''),
  };

  const unitPrice = parseInt(voyage.price.replace(/[^0-9]/g, '')) || 0;
  const totalPrice = unitPrice * passengers;
  const availability = getVoyageAvailability(voyage.availableSeats);
  const dateLabel = formatLongDate(voyage.date);
  const timeLabel = formatTime(voyage.date);
  const vehicleSpecs = [voyage.immatriculation, voyage.modele, voyage.couleur]
    .filter(Boolean)
    .join(' · ');
  const fromCode = cityCode(voyage.from);
  const toCode = cityCode(voyage.to);

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
        toast.success('Le transporteur a été notifié. Réponse à venir bientôt.', {
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
    // New flow (post-payment integration): open the method sheet first.
    // The reservation is only created after the payment 'succeeded'
    // event fires from the status modal (see handlePaymentSuccess).
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
      relatedType: 'trajet_reservation',
      // No reservation row exists yet — we link by trajet id. The reservation
      // row is created on payment success and the inverse lookup uses
      // `payments.related_id = trajetId + status='succeeded'`.
      relatedId: voyage.id,
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

    // For PayPal we'd open the redirectUrl in expo-web-browser here.
    // (Wired in Phase 3 once PayPal credentials are configured.)
    setActivePaymentId(result.paymentId);
    setInitialPaymentStatus(result.status);
    setInitialPaymentMessage(result.message);
    setPaymentStatusVisible(true);

    // If the Edge Function already returned a terminal status (e.g. the
    // auto-succeed test mode returns 'succeeded' immediately), short-circuit
    // the reservation creation right away.
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

  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Floating controls */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 6,
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
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
            }}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
          }}>
          {/* Boarding pass card */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 22,
              borderCurve: 'continuous',
              overflow: 'hidden',
              boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)',
            }}>
            {/* Brand strip */}
            <View
              style={{
                backgroundColor: COLORS.primary,
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
                ZOPGO PASS
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, marginRight: 6 }}>{voyage.icon}</Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: 'rgba(255,255,255,0.95)',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}>
                  {voyage.type}
                </Text>
              </View>
            </View>

            {/* Top section: route */}
            <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#9CA3AF',
                    letterSpacing: 1,
                  }}>
                  DÉPART
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#9CA3AF',
                    letterSpacing: 1,
                  }}>
                  ARRIVÉE
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text
                  selectable
                  style={{
                    fontSize: 34,
                    fontWeight: '800',
                    color: '#0F172A',
                    fontVariant: ['tabular-nums'],
                    letterSpacing: 1,
                  }}>
                  {fromCode}
                </Text>
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      width: '100%',
                    }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                    <View
                      style={{
                        marginHorizontal: 4,
                        height: 24,
                        width: 24,
                        borderRadius: 12,
                        backgroundColor: '#EFF6FF',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                  </View>
                </View>
                <Text
                  selectable
                  style={{
                    fontSize: 34,
                    fontWeight: '800',
                    color: '#0F172A',
                    fontVariant: ['tabular-nums'],
                    letterSpacing: 1,
                  }}>
                  {toCode}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 6,
                }}>
                <Text
                  selectable
                  numberOfLines={1}
                  style={{ flex: 1, fontSize: 13, color: '#6B7280' }}>
                  {voyage.from}
                </Text>
                <Text
                  selectable
                  numberOfLines={1}
                  style={{ flex: 1, fontSize: 13, color: '#6B7280', textAlign: 'right' }}>
                  {voyage.to}
                </Text>
              </View>

              {/* Trip meta: date / time / places */}
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 18,
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
                    DATE
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#0F172A',
                    }}>
                    {dateLabel || '—'}
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
                    HEURE
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#0F172A',
                      fontVariant: ['tabular-nums'],
                    }}>
                    {timeLabel || '—'}
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
                    PLACES
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

            {/* Bottom section: agency identity (when isAgence) or individual
                chauffeur. Agency block trades the round avatar + star rating
                for a squared logo + brand color tag — same hierarchy
                (icon · name · meta · trust signal) but more "company". */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: 14,
                paddingBottom: 18,
              }}>
              {voyage.isAgence ? (
                <>
                  {voyage.agencyLogoUrl ? (
                    <Image
                      source={{ uri: voyage.agencyLogoUrl }}
                      style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: 'white' }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        backgroundColor: '#F0FDFA',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Ionicons name="business" size={24} color="#0D9488" />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 }}>
                      AGENCE
                    </Text>
                    <Text
                      selectable
                      numberOfLines={1}
                      style={{ marginTop: 2, fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                      {voyage.agencyName || voyage.driver}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 12, color: '#6B7280' }}>
                      Vendeur officiel · Partenaire ZopGo
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(13, 148, 136, 0.12)',
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                    }}>
                    <Ionicons name="checkmark-circle" size={12} color="#0D9488" />
                    <Text
                      style={{
                        marginLeft: 3,
                        fontSize: 11,
                        fontWeight: '700',
                        color: '#0D9488',
                        letterSpacing: 0.3,
                      }}>
                      VÉRIFIÉ
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {voyage.driverAvatar ? (
                    <Image
                      source={{ uri: voyage.driverAvatar }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: '#EFF6FF',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Ionicons name="person" size={24} color={COLORS.primary} />
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
                      CONDUCTEUR
                    </Text>
                    <Text
                      selectable
                      numberOfLines={1}
                      style={{ marginTop: 2, fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                      {voyage.driver}
                    </Text>
                    {vehicleSpecs ? (
                      <Text
                        selectable
                        numberOfLines={1}
                        style={{ marginTop: 2, fontSize: 12, color: '#6B7280' }}>
                        {vehicleSpecs}
                      </Text>
                    ) : null}
                  </View>
                  {voyage.driverRating > 0 ? (
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
                        {voyage.driverRating.toFixed(1)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>NOUVEAU</Text>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Booking bar (flat, not in a card) */}
          <View style={{ paddingHorizontal: 4 }}>
            {/* Counter */}
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
                  PASSAGERS
                </Text>
                <Text
                  selectable
                  style={{
                    marginTop: 2,
                    fontSize: 13,
                    color: '#6B7280',
                    fontVariant: ['tabular-nums'],
                  }}>
                  {voyage.price} / personne
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
                    if (passengers > 1) {
                      hapticSelection();
                      animateCounter();
                      setPassengers(passengers - 1);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Réduire le nombre de passagers"
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
                  style={{
                    height: 36,
                    width: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: COLORS.primary,
                  }}>
                  <Ionicons name="add" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Total */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Total</Text>
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

            {/* CTA */}
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
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                borderCurve: 'continuous',
                paddingVertical: 16,
                backgroundColor: COLORS.primary,
                opacity: isBooking || !validation.ok ? 0.5 : 1,
                boxShadow: '0 6px 14px rgba(33, 98, 254, 0.28)',
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
        </View>
      </SafeAreaView>

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
    </View>
  );
}
