export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { AnimatedTabScreen, PickerModal, PickerOption } from '../../../components/ui';
import { COLORS } from '../../../constants';
import { useTrajetsStore } from '../../../stores/trajetsStore';
import { useAuthStore } from '../../../stores/authStore';
import { VehicleType } from '../../../types';

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

const VEHICLE_OPTIONS: { type: VehicleType; label: string; icon: string }[] = [
  { type: 'moto', label: 'Moto', icon: '🏍️' },
  { type: 'voiture', label: 'Voiture', icon: '🚗' },
  { type: 'camionnette', label: 'Camionnette', icon: '🚚' },
];

export default function TrajetsTab() {
  const { user, supabaseProfileId } = useAuthStore();
  const { trajets, formData, addTrajet, removeTrajet, markEffectue, updateForm, loadTrajets } = useTrajetsStore();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showMarquePicker, setShowMarquePicker] = useState(false);
  const [showCouleurPicker, setShowCouleurPicker] = useState(false);
  const [showPlacesPicker, setShowPlacesPicker] = useState(false);

  // Charger les trajets au montage
  useEffect(() => {
    if (supabaseProfileId) {
      loadTrajets(supabaseProfileId);
    }
  }, [supabaseProfileId, loadTrajets]);

  const mesTrajetsEnAttente = trajets.filter((t) => t.status === 'en_attente');

  const handlePublish = () => {
    if (!formData.villeDepart.trim() || !formData.villeArrivee.trim() || !formData.prix.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir la ville de départ, la ville d\'arrivée et le prix.');
      return;
    }
    if (!user) return;
    addTrajet(user.id, supabaseProfileId || undefined);
    Alert.alert('Trajet publié', 'Votre trajet a été publié avec succès !');
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
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
              Mes trajets
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              Proposez des trajets aux voyageurs
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          >
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
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {VEHICLE_OPTIONS.map((v) => (
                  <TouchableOpacity
                    key={v.type}
                    onPress={() => updateForm('vehicule', v.type)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: formData.vehicule === v.type ? COLORS.primary : COLORS.gray[100],
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{v.icon}</Text>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: formData.vehicule === v.type ? 'white' : '#6B7280',
                      marginTop: 2,
                    }}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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
              <View style={{ alignItems: 'center', marginTop: 32, paddingHorizontal: 20 }}>
                <MaterialCommunityIcons name="road-variant" size={48} color="rgba(255,255,255,0.6)" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 12, textAlign: 'center' }}>
                  Aucun trajet publié
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'center' }}>
                  Remplissez le formulaire ci-dessus pour proposer votre premier trajet
                </Text>
              </View>
            )}
          </ScrollView>
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
