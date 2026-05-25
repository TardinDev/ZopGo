export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { useEffect, useMemo } from 'react';
import { View, StatusBar, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useAuthStore } from '../../../stores/authStore';
import { useReservationsStore } from '../../../stores/reservationsStore';
import { useLivraisonsStore } from '../../../stores/livraisonsStore';
import { COLORS } from '../../../constants';
import type {
  Activity,
  Reservation,
  HebergementReservation,
  Livraison,
  ReservationStatus,
  LivraisonStatus,
} from '../../../types';
import SearchBar from '../../../components/SearchBar';
import { AnimatedTabScreen } from '../../../components/ui';

import {
  HomeHeader,
  StatsCards,
  HomeActions,
  WeatherWidget,
  ActivityList,
} from '../../../components/home';

const MAX_ACTIVITIES = 5;

const COMPLETED_RESERVATION_STATUSES: ReservationStatus[] = ['terminee'];
const COMPLETED_LIVRAISON_STATUSES: LivraisonStatus[] = ['livree'];

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount);
}

function reservationToActivity(r: Reservation): Activity {
  const route = r.villeDepart && r.villeArrivee
    ? `${r.villeDepart} → ${r.villeArrivee}`
    : 'Réservation trajet';
  return {
    id: r.id,
    type: 'course',
    title: route,
    time: formatRelativeTime(r.createdAt),
    price: formatPrice(r.prixTotal),
    status: COMPLETED_RESERVATION_STATUSES.includes(r.status) ? 'completed' : 'in_progress',
    icon: '🚗',
  };
}

function livraisonToActivity(l: Livraison): Activity {
  return {
    id: l.id,
    type: 'delivery',
    title: l.pickupLocation && l.dropoffLocation
      ? `${l.pickupLocation} → ${l.dropoffLocation}`
      : 'Livraison',
    time: formatRelativeTime(l.createdAt),
    price: formatPrice(l.prixEstime),
    status: COMPLETED_LIVRAISON_STATUSES.includes(l.status) ? 'completed' : 'in_progress',
    icon: '📦',
  };
}

function hebergementResToActivity(h: HebergementReservation): Activity {
  const place = h.hebergementNom || 'Hébergement';
  const city = h.hebergementVille ? ` · ${h.hebergementVille}` : '';
  return {
    id: h.id,
    type: 'hebergement',
    title: `${place}${city}`,
    time: formatRelativeTime(h.createdAt),
    price: formatPrice(h.prixTotal),
    status: COMPLETED_RESERVATION_STATUSES.includes(h.status) ? 'completed' : 'in_progress',
    icon: '🏠',
  };
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const INITIAL_POSITION = SCREEN_HEIGHT * 0.75; // Position de départ (25% de l'écran visible)
const MIN_TRANSLATE_Y = 100; // Position maximale (reste 100px en haut)

export default function HomeTab() {
  const { user, supabaseProfileId } = useAuthStore();
  const userName = user?.profile?.name || 'Utilisateur';
  const role = user?.role;

  const clientReservations = useReservationsStore((s) => s.clientReservations);
  const chauffeurReservations = useReservationsStore((s) => s.chauffeurReservations);
  const clientHebergementReservations = useReservationsStore(
    (s) => s.clientHebergementReservations
  );
  const hebergeurHebergementReservations = useReservationsStore(
    (s) => s.hebergeurHebergementReservations
  );
  const loadClientReservations = useReservationsStore((s) => s.loadClientReservations);
  const loadChauffeurReservations = useReservationsStore((s) => s.loadChauffeurReservations);
  const loadClientHebergementReservations = useReservationsStore(
    (s) => s.loadClientHebergementReservations
  );
  const loadHebergeurHebergementReservations = useReservationsStore(
    (s) => s.loadHebergeurHebergementReservations
  );

  const clientLivraisons = useLivraisonsStore((s) => s.clientLivraisons);
  const livreurLivraisons = useLivraisonsStore((s) => s.livreurLivraisons);
  const loadClientLivraisons = useLivraisonsStore((s) => s.loadClientLivraisons);
  const loadLivreurLivraisons = useLivraisonsStore((s) => s.loadLivreurLivraisons);

  useEffect(() => {
    if (!supabaseProfileId || !role) return;
    if (role === 'client') {
      loadClientReservations(supabaseProfileId);
      loadClientLivraisons(supabaseProfileId);
      loadClientHebergementReservations(supabaseProfileId);
    } else if (role === 'chauffeur') {
      loadChauffeurReservations(supabaseProfileId);
      loadLivreurLivraisons(supabaseProfileId);
    } else if (role === 'hebergeur') {
      loadHebergeurHebergementReservations(supabaseProfileId);
    }
  }, [
    supabaseProfileId,
    role,
    loadClientReservations,
    loadClientLivraisons,
    loadClientHebergementReservations,
    loadChauffeurReservations,
    loadLivreurLivraisons,
    loadHebergeurHebergementReservations,
  ]);

  const activities: Activity[] = useMemo(() => {
    const items: { activity: Activity; ts: number }[] = [];
    const push = (a: Activity, iso: string) =>
      items.push({ activity: a, ts: new Date(iso).getTime() });

    if (role === 'client') {
      clientReservations.forEach((r) => push(reservationToActivity(r), r.createdAt));
      clientLivraisons.forEach((l) => push(livraisonToActivity(l), l.createdAt));
      clientHebergementReservations.forEach((h) => push(hebergementResToActivity(h), h.createdAt));
    } else if (role === 'chauffeur') {
      chauffeurReservations.forEach((r) => push(reservationToActivity(r), r.createdAt));
      livreurLivraisons.forEach((l) => push(livraisonToActivity(l), l.createdAt));
    } else if (role === 'hebergeur') {
      hebergeurHebergementReservations.forEach((h) =>
        push(hebergementResToActivity(h), h.createdAt)
      );
    }

    return items
      .sort((a, b) => b.ts - a.ts)
      .slice(0, MAX_ACTIVITIES)
      .map((i) => i.activity);
  }, [
    role,
    clientReservations,
    clientLivraisons,
    clientHebergementReservations,
    chauffeurReservations,
    livreurLivraisons,
    hebergeurHebergementReservations,
  ]);

  const translateY = useSharedValue(INITIAL_POSITION);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newValue = startY.value + event.translationY;
      // Limiter le mouvement entre MIN_TRANSLATE_Y (haut) et INITIAL_POSITION (bas)
      if (newValue >= MIN_TRANSLATE_Y && newValue <= INITIAL_POSITION) {
        translateY.value = newValue;
      }
    })
    .onEnd((event) => {
      // Snap vers le haut ou vers le bas selon la vélocité
      if (event.velocityY < -500) {
        // Glissement rapide vers le haut
        translateY.value = withSpring(MIN_TRANSLATE_Y, {
          damping: 50,
          stiffness: 400,
        });
      } else if (event.velocityY > 500) {
        // Glissement rapide vers le bas
        translateY.value = withSpring(INITIAL_POSITION, {
          damping: 50,
          stiffness: 400,
        });
      } else {
        // Snap vers la position la plus proche
        const middle = (MIN_TRANSLATE_Y + INITIAL_POSITION) / 2;
        const snapTo = translateY.value < middle ? MIN_TRANSLATE_Y : INITIAL_POSITION;
        translateY.value = withSpring(snapTo, {
          damping: 50,
          stiffness: 400,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <AnimatedTabScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <LinearGradient colors={COLORS.gradients.home} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* En-tête */}
            <HomeHeader userName={userName} />

            {/* Statistiques */}
            <StatsCards
              totalTrips={user?.profile?.totalTrips || 0}
              rating={user?.profile?.rating || 0}
              totalDeliveries={user?.profile?.totalDeliveries || 0}
              role={user?.role}
            />

            {/* Actions Principales */}
            <HomeActions />

            {/* Section Déroulable */}
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: SCREEN_HEIGHT,
                    zIndex: 10,
                    elevation: 10,
                    backgroundColor: 'rgba(33, 98, 254, 0.92)',
                    borderTopLeftRadius: 40,
                    borderTopRightRadius: 40,
                    paddingHorizontal: 24,
                    paddingTop: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                  },
                  animatedStyle,
                ]}>
                {/* Indicateur de glissement */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View
                    style={{
                      height: 6,
                      width: 64,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.5)',
                    }}
                  />
                </View>

                {/* Météo */}
                <WeatherWidget />
                    
                {/* Barre de recherche */}
                <View style={{ marginBottom: 24 }}>
                  <SearchBar />
                </View>

                {/* Activités */}
                <ActivityList activities={activities} />
              </Animated.View>
            </GestureDetector>
          </SafeAreaView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </AnimatedTabScreen>
  );
}
