import { useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AnimatedTabScreen } from '../../../components/ui';
import { useTrajetsStore } from '../../../stores/trajetsStore';
import { useAuthStore } from '../../../stores/authStore';
import { VehicleType } from '../../../types';

const VEHICLE_OPTIONS: { type: VehicleType; label: string; icon: string }[] = [
  { type: 'moto', label: 'Moto', icon: '🏍️' },
  { type: 'voiture', label: 'Voiture', icon: '🚗' },
  { type: 'camionnette', label: 'Camionnette', icon: '🚚' },
];

export default function TrajetsTab() {
  const { user, supabaseProfileId } = useAuthStore();
  const { trajets, formData, addTrajet, removeTrajet, markEffectue, updateForm, loadTrajets } = useTrajetsStore();

  // Charger les trajets au montage
  useEffect(() => {
    if (supabaseProfileId) {
      loadTrajets(supabaseProfileId);
    }
  }, [supabaseProfileId]);

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
      <LinearGradient colors={['#4facfe', '#00f2fe']} style={{ flex: 1 }}>
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
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 }}>
                Nouveau trajet
              </Text>

              {/* Ville de départ */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Ville de départ
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F3F4F6',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#1F2937',
                  marginBottom: 12,
                }}
                placeholder="Ex: Lomé"
                placeholderTextColor="#9CA3AF"
                value={formData.villeDepart}
                onChangeText={(v) => updateForm('villeDepart', v)}
              />

              {/* Ville d'arrivée */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Ville d'arrivée
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F3F4F6',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#1F2937',
                  marginBottom: 12,
                }}
                placeholder="Ex: Kara"
                placeholderTextColor="#9CA3AF"
                value={formData.villeArrivee}
                onChangeText={(v) => updateForm('villeArrivee', v)}
              />

              {/* Prix et Places - côte à côte */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                    Prix (FCFA)
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 15,
                      color: '#1F2937',
                    }}
                    placeholder="5000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.prix}
                    onChangeText={(v) => updateForm('prix', v)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                    Places
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 15,
                      color: '#1F2937',
                    }}
                    placeholder="1"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.placesDisponibles}
                    onChangeText={(v) => updateForm('placesDisponibles', v)}
                  />
                </View>
              </View>

              {/* Type de véhicule */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
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
                      backgroundColor: formData.vehicule === v.type ? '#2162FE' : '#F3F4F6',
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

              {/* Date/Heure */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Date et heure
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F3F4F6',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#1F2937',
                  marginBottom: 20,
                }}
                placeholder="Ex: 15/02/2026 à 08h00"
                placeholderTextColor="#9CA3AF"
                value={formData.date}
                onChangeText={(v) => updateForm('date', v)}
              />

              {/* Bouton Publier */}
              <TouchableOpacity
                onPress={handlePublish}
                style={{
                  backgroundColor: '#2162FE',
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
                      padding: 16,
                      marginBottom: 12,
                      shadowColor: '#000',
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 3,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <MaterialCommunityIcons name="map-marker-path" size={22} color="#2162FE" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>
                            {trajet.villeDepart} → {trajet.villeArrivee}
                          </Text>
                          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                            {trajet.placesDisponibles} place{trajet.placesDisponibles > 1 ? 's' : ''} · {trajet.date || 'Date non définie'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleRemove(trajet.id)}>
                        <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 10,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: '#F3F4F6',
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#2162FE' }}>
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
    </AnimatedTabScreen>
  );
}
