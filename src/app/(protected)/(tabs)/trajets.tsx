export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedTabScreen, PickerModal, PickerOption, Confetti, EmptyState, CoachMark } from '../../../components/ui';
import { ChauffeurDashboard, ActiveReservationCard } from '../../../components/chauffeur';
import { shouldCelebrateFirstPublish } from '../../../utils/firstPublishCelebration';
import { shouldShowCoachMark, markCoachMarkSeen } from '../../../utils/coachMarkSeen';
import { COLORS } from '../../../constants';
import { useTrajetsStore } from '../../../stores/trajetsStore';
import { useAuthStore } from '../../../stores/authStore';
import { useReservationsStore } from '../../../stores/reservationsStore';
import { toast } from '../../../stores/toastStore';
import { computeChauffeurStats } from '../../../lib/chauffeurStats';
import {
  VehicleType,
  CHAUFFEUR_ALLOWED_VEHICLES,
  AGENCE_ALLOWED_VEHICLES,
} from '../../../types';

const MARQUES: PickerOption[] = [
  'Toyota', 'Nissan', 'Mitsubishi', 'Hyundai', 'Kia', 'Suzuki', 'Honda',
  'Mercedes', 'Peugeot', 'Renault', 'Ford', 'Volkswagen', 'BMW', 'Chevrolet', 'Isuzu',
].map((m) => ({ value: m, label: m }));

const COULEURS: PickerOption[] = [
  'Blanc', 'Noir', 'Gris', 'Argent', 'Bleu', 'Rouge', 'Vert', 'Jaune', 'Orange', 'Marron', 'Beige',
].map((c) => ({ value: c, label: c }));

const PLACES: PickerOption[] = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} place${i + 1 > 1 ? 's' : ''}`,
}));

function formatDateForDisplay(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} a ${hours}h${minutes}`;
}

// Mirrors the 6 categories exposed in the client-side TypeFilter — emojis
// and labels intentionally identical so a published trajet renders with the
// same icon the voyager filtered for. The visible subset for a given
// transporteur is filtered by role at render time (individual = taxi/voiture,
// agence = bus/train/avion/bateau) via CHAUFFEUR_ALLOWED_VEHICLES /
// AGENCE_ALLOWED_VEHICLES from src/types.
const ALL_VEHICLE_OPTIONS: { type: VehicleType; label: string; icon: string }[] = [
  { type: 'taxi',    label: 'Taxi',    icon: '🚕' },
  { type: 'voiture', label: 'Voiture', icon: '🚙' },
  { type: 'bus',     label: 'Bus',     icon: '🚌' },
  { type: 'train',   label: 'Train',   icon: '🚆' },
  { type: 'avion',   label: 'Avion',   icon: '✈️' },
  { type: 'bateau',  label: 'Bateaux', icon: '🚢' },
];

export default function TrajetsTab() {
  const { user, supabaseProfileId } = useAuthStore();
  const isAgence = user?.role === 'agence';

  // Whitelist the vehicle picker by role. Individual transporteurs can only
  // publish taxi/voiture; agences are the only ones that can list bus/train/
  // avion/bateau (because operating those requires a real company behind the
  // sale of tickets — gated by an invitation code at signup).
  const VEHICLE_OPTIONS = useMemo(() => {
    const allowed = isAgence ? AGENCE_ALLOWED_VEHICLES : CHAUFFEUR_ALLOWED_VEHICLES;
    return ALL_VEHICLE_OPTIONS.filter((opt) => allowed.includes(opt.type));
  }, [isAgence]);

  const { trajets, formData, addTrajet, removeTrajet, markEffectue, updateForm, loadTrajets } = useTrajetsStore();
  const {
    chauffeurReservations,
    loadChauffeurReservations,
    startTrajet,
    markArrivee,
    completeTrajet,
    expireStale,
  } = useReservationsStore();
  const [busyReservationId, setBusyReservationId] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showMarquePicker, setShowMarquePicker] = useState(false);
  const [showCouleurPicker, setShowCouleurPicker] = useState(false);
  const [showPlacesPicker, setShowPlacesPicker] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [coachVisible, setCoachVisible] = useState(false);

  useEffect(() => {
    shouldShowCoachMark('trajet').then(setCoachVisible);
  }, []);

  // When the user's role changes (e.g. just promoted to agence) the
  // currently-selected vehicle in the draft form may no longer be allowed —
  // snap it to the first option in the new allowed set so the chip row is
  // never rendered with nothing selected.
  useEffect(() => {
    const allowed = VEHICLE_OPTIONS.map((v) => v.type);
    if (allowed.length > 0 && !allowed.includes(formData.vehicule as VehicleType)) {
      updateForm('vehicule', allowed[0]);
    }
  }, [VEHICLE_OPTIONS, formData.vehicule, updateForm]);

  const dismissCoach = () => {
    setCoachVisible(false);
    void markCoachMarkSeen('trajet');
  };

  // Charger les trajets au montage
  useEffect(() => {
    if (supabaseProfileId) {
      loadTrajets(supabaseProfileId);
      loadChauffeurReservations(supabaseProfileId);
    }
  }, [supabaseProfileId, loadTrajets, loadChauffeurReservations]);

  // Refresh + auto-expire on focus.
  useFocusEffect(
    useCallback(() => {
      if (!supabaseProfileId) return;
      loadChauffeurReservations(supabaseProfileId);
      void expireStale();
    }, [supabaseProfileId, loadChauffeurReservations, expireStale])
  );

  const mesTrajetsEnAttente = trajets.filter((t) => t.status === 'en_attente');

  const activeReservations = useMemo(
    () =>
      chauffeurReservations.filter((r) =>
        ['acceptee', 'en_route', 'arrivee'].includes(r.status)
      ),
    [chauffeurReservations]
  );

  const stats = useMemo(
    () => computeChauffeurStats(chauffeurReservations, user?.profile?.rating),
    [chauffeurReservations, user?.profile?.rating]
  );

  const handleReservationAction = useCallback(
    async (reservationId: string, action: 'start' | 'arrive' | 'complete') => {
      if (!supabaseProfileId) return;
      const r = chauffeurReservations.find((x) => x.id === reservationId);
      if (!r) return;
      const chauffeurName = user?.profile?.name || 'Transporteur';
      setBusyReservationId(reservationId);
      try {
        if (action === 'start') {
          const ok = await startTrajet({
            reservationId,
            clientId: r.clientId,
            chauffeurName,
            villeDepart: r.villeDepart,
            villeArrivee: r.villeArrivee,
          });
          if (ok) toast.success('Le client a été notifié 🚗', { title: 'En route' });
        } else if (action === 'arrive') {
          const ok = await markArrivee({
            reservationId,
            clientId: r.clientId,
            chauffeurName,
            villeDepart: r.villeDepart,
            villeArrivee: r.villeArrivee,
          });
          if (ok) toast.success("Position transmise au client", { title: 'Arrivée signalée' });
        } else if (action === 'complete') {
          const ok = await completeTrajet({
            reservationId,
            clientId: r.clientId,
            chauffeurName,
            chauffeurId: supabaseProfileId,
            villeDepart: r.villeDepart,
            villeArrivee: r.villeArrivee,
          });
          if (ok) toast.success("Bravo, course livrée ! 🏁", { title: 'Course terminée' });
        }
      } finally {
        setBusyReservationId(null);
      }
    },
    [supabaseProfileId, chauffeurReservations, user, startTrajet, markArrivee, completeTrajet]
  );

  const handlePublish = async () => {
    if (!formData.villeDepart.trim() || !formData.villeArrivee.trim() || !formData.prix.trim()) {
      toast.error('Remplis la ville de départ, d\'arrivée et le prix.', { title: 'Champs requis' });
      return;
    }
    if (!user) return;
    if (!supabaseProfileId) {
      toast.error('Profil pas encore connecté à la base. Reconnecte-toi puis réessaie.', {
        title: 'Profil non synchronisé',
      });
      return;
    }
    try {
      await addTrajet(user.id, supabaseProfileId);
      if (coachVisible) dismissCoach();
      const isFirst = await shouldCelebrateFirstPublish('trajet');
      if (isFirst) {
        setConfettiVisible(true);
        setTimeout(() => setConfettiVisible(false), 3000);
        toast.success('Premier trajet en ligne ! Bienvenue dans la team ZopGo 🎉', {
          title: 'Bravo !',
          durationMs: 4500,
        });
      } else {
        toast.success('Ton trajet est en ligne, les voyageurs vont le voir 🚗', {
          title: 'Trajet publié',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.';
      toast.error(message, { title: 'Publication échouée', durationMs: 5000 });
    }
  };

  const handleRemove = (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer ce trajet ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeTrajet(id) },
    ]);
  };

  return (
    <AnimatedTabScreen>
      <LinearGradient colors={COLORS.gradients.cyan} style={{ flex: 1 }}>
        <Confetti visible={confettiVisible} />
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
              {isAgence ? 'Mes lignes' : 'Mes trajets'}
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              {isAgence
                ? 'Publiez vos lignes (bus, train, avion, bateaux) pour les voyageurs'
                : 'Proposez des trajets aux voyageurs'}
            </Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            <CoachMark
              visible={coachVisible}
              title="Commence ici !"
              message="Remplis le formulaire ci-dessous et publie ton premier trajet."
              arrowDirection="down"
              onDismiss={dismissCoach}
            />

            {/* Dashboard chauffeur */}
            <ChauffeurDashboard stats={stats} />

            {/* Courses actives (acceptées / en route / arrivé) */}
            {activeReservations.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: 'white', marginBottom: 10 }}>
                  Courses en cours ({activeReservations.length})
                </Text>
                {activeReservations.map((r) => (
                  <ActiveReservationCard
                    key={r.id}
                    reservation={r}
                    busy={busyReservationId === r.id}
                    onAction={(action) => handleReservationAction(r.id, action)}
                  />
                ))}
              </View>
            )}

            {/* Formulaire */}
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              borderCurve: 'continuous',
              padding: 20,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.10)',
            }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.gray[800], marginBottom: 16 }}>
                Nouveau trajet
              </Text>

              {/* Ville de départ */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.gray[500], marginBottom: 6 }}>
                Ville de départ
              </Text>
              <TextInput
                style={{
                  backgroundColor: COLORS.gray[100],
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: COLORS.gray[800],
                  marginBottom: 12,
                }}
                placeholder="Ex: Lomé"
                placeholderTextColor={COLORS.gray[400]}
                value={formData.villeDepart}
                onChangeText={(v) => updateForm('villeDepart', v)}
              />

              {/* Ville d'arrivée */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.gray[500], marginBottom: 6 }}>
                Ville d&apos;arrivée
              </Text>
              <TextInput
                style={{
                  backgroundColor: COLORS.gray[100],
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: COLORS.gray[800],
                  marginBottom: 12,
                }}
                placeholder="Ex: Kara"
                placeholderTextColor={COLORS.gray[400]}
                value={formData.villeArrivee}
                onChangeText={(v) => updateForm('villeArrivee', v)}
              />

              {/* Prix et Places - côte à côte */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.gray[500], marginBottom: 6 }}>
                    Prix (FCFA)
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: COLORS.gray[100],
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 15,
                      color: COLORS.gray[800],
                    }}
                    placeholder="5000"
                    placeholderTextColor={COLORS.gray[400]}
                    keyboardType="numeric"
                    value={formData.prix}
                    onChangeText={(v) => updateForm('prix', v)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.gray[500], marginBottom: 6 }}>
                    Places
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowPlacesPicker(true)}
                    style={{
                      backgroundColor: COLORS.gray[100],
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  >
                    <Text style={{
                      fontSize: 15,
                      color: formData.placesDisponibles ? COLORS.gray[800] : COLORS.gray[400],
                    }}>
                      {formData.placesDisponibles
                        ? `${formData.placesDisponibles} place${Number(formData.placesDisponibles) > 1 ? 's' : ''}`
                        : 'Choisir'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Type de véhicule */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.gray[500], marginBottom: 8 }}>
                Type de véhicule
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingVertical: 2, paddingRight: 4 }}
                style={{ marginBottom: 12, marginHorizontal: -2 }}
              >
                {VEHICLE_OPTIONS.map((v) => {
                  const isActive = formData.vehicule === v.type;
                  return (
                    <TouchableOpacity
                      key={v.type}
                      activeOpacity={0.85}
                      onPress={() => updateForm('vehicule', v.type)}
                      accessibilityRole="button"
                      accessibilityLabel={v.label}
                      accessibilityState={{ selected: isActive }}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 16,
                        borderWidth: 2,
                        borderColor: isActive ? COLORS.primary : 'transparent',
                        backgroundColor: isActive ? '#EEF4FF' : COLORS.gray[100],
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                        gap: 2,
                        transform: isActive ? [{ scale: 1.04 }] : undefined,
                      }}
                    >
                      <Text style={{
                        fontSize: Platform.OS === 'ios' ? 26 : 24,
                        lineHeight: Platform.OS === 'ios' ? 30 : 28,
                      }}>
                        {v.icon}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: isActive ? COLORS.primary : COLORS.gray[600],
                        }}
                      >
                        {v.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Marque et Modèle - côte à côte */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.gray[500], marginBottom: 6 }}>
                    Marque
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowMarquePicker(true)}
                    style={{
                      backgroundColor: COLORS.gray[100],
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  >
                    <Text style={{
                      fontSize: 15,
                      color: formData.marque ? COLORS.gray[800] : COLORS.gray[400],
                    }}>
                      {formData.marque || 'Choisir'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.gray[500], marginBottom: 6 }}>
                    Modèle
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: COLORS.gray[100],
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 15,
                      color: COLORS.gray[800],
                    }}
                    placeholder="Ex: Corolla"
                    placeholderTextColor={COLORS.gray[400]}
                    value={formData.modele}
                    onChangeText={(v) => updateForm('modele', v)}
                  />
                </View>
              </View>

              {/* Couleur */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.gray[500], marginBottom: 6 }}>
                Couleur
              </Text>
              <TouchableOpacity
                onPress={() => setShowCouleurPicker(true)}
                style={{
                  backgroundColor: COLORS.gray[100],
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 12,
                }}
              >
                <Text style={{
                  fontSize: 15,
                  color: formData.couleur ? COLORS.gray[800] : COLORS.gray[400],
                }}>
                  {formData.couleur || 'Choisir une couleur'}
                </Text>
              </TouchableOpacity>

              {/* Date/Heure */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.gray[500], marginBottom: 6 }}>
                Date et heure
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  backgroundColor: COLORS.gray[100],
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: Platform.OS === 'ios' && showDatePicker ? 8 : 20,
                }}
              >
                <Text style={{
                  fontSize: 15,
                  color: selectedDate ? COLORS.gray[800] : COLORS.gray[400],
                }}>
                  {selectedDate ? formatDateForDisplay(selectedDate) : 'Choisir une date et heure'}
                </Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && showDatePicker && (
                <View style={{ marginBottom: 12 }}>
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="datetime"
                    display="spinner"
                    minimumDate={new Date()}
                    locale="fr-FR"
                    onChange={(_event: DateTimePickerEvent, date?: Date) => {
                      if (date) {
                        setSelectedDate(date);
                        updateForm('date', date.toISOString());
                      }
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={{
                      alignSelf: 'center',
                      backgroundColor: COLORS.primary,
                      borderRadius: 10,
                      paddingHorizontal: 24,
                      paddingVertical: 8,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Valider</Text>
                  </TouchableOpacity>
                </View>
              )}

              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={(_event: DateTimePickerEvent, date?: Date) => {
                    setShowDatePicker(false);
                    if (_event.type === 'dismissed') return;
                    if (date) {
                      setSelectedDate(date);
                      setShowTimePicker(true);
                    }
                  }}
                />
              )}

              {Platform.OS === 'android' && showTimePicker && (
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="time"
                  display="spinner"
                  onChange={(_event: DateTimePickerEvent, date?: Date) => {
                    setShowTimePicker(false);
                    if (_event.type === 'dismissed') return;
                    if (date) {
                      setSelectedDate(date);
                      updateForm('date', date.toISOString());
                    }
                  }}
                />
              )}

              {/* Bouton Publier */}
              <TouchableOpacity
                onPress={handlePublish}
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <MaterialCommunityIcons name="send" size={20} color="white" />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                  Publier le trajet
                </Text>
              </TouchableOpacity>
            </View>

            {/* Liste des trajets en attente */}
            {mesTrajetsEnAttente.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: 'white', marginBottom: 12 }}>
                  Trajets en attente ({mesTrajetsEnAttente.length})
                </Text>
                {mesTrajetsEnAttente.map((trajet) => (
                  <View
                    key={trajet.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 16,
                      borderCurve: 'continuous',
                      padding: 16,
                      marginBottom: 12,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <MaterialCommunityIcons name="map-marker-path" size={22} color={COLORS.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.gray[800] }}>
                            {trajet.villeDepart} → {trajet.villeArrivee}
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.gray[500], marginTop: 2 }}>
                            {trajet.placesDisponibles} place{trajet.placesDisponibles > 1 ? 's' : ''} · {trajet.date ? new Date(trajet.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date non définie'}
                          </Text>
                          {[trajet.marque, trajet.modele, trajet.couleur].filter(Boolean).length > 0 && (
                            <Text style={{ fontSize: 12, color: COLORS.gray[400], marginTop: 2 }}>
                              {[trajet.marque, trajet.modele, trajet.couleur].filter(Boolean).join(' · ')}
                            </Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleRemove(trajet.id)}>
                        <MaterialCommunityIcons name="delete-outline" size={22} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 10,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: COLORS.gray[100],
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>
                        {trajet.prix.toLocaleString()} FCFA
                      </Text>
                      <TouchableOpacity
                        onPress={() => markEffectue(trajet.id)}
                        style={{
                          backgroundColor: '#ECFDF5',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MaterialCommunityIcons name="check-circle-outline" size={14} color="#059669" />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#059669' }}>
                          Marquer effectué
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Empty state */}
            {mesTrajetsEnAttente.length === 0 && (
              <EmptyState
                icon="car-sport-outline"
                title="Aucun trajet en route"
                description="Remplis le formulaire ci-dessus pour proposer ton premier trajet"
                iconSize={56}
              />
            )}
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      <PickerModal
        visible={showMarquePicker}
        title="Marque du véhicule"
        options={MARQUES}
        selectedValue={formData.marque}
        onSelect={(v) => updateForm('marque', v)}
        onClose={() => setShowMarquePicker(false)}
      />

      <PickerModal
        visible={showCouleurPicker}
        title="Couleur du véhicule"
        options={COULEURS}
        selectedValue={formData.couleur}
        onSelect={(v) => updateForm('couleur', v)}
        onClose={() => setShowCouleurPicker(false)}
      />

      <PickerModal
        visible={showPlacesPicker}
        title="Nombre de places"
        options={PLACES}
        selectedValue={formData.placesDisponibles}
        onSelect={(v) => updateForm('placesDisponibles', v)}
        onClose={() => setShowPlacesPicker(false)}
      />
    </AnimatedTabScreen>
  );
}
