export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Switch, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AnimatedTabScreen } from '../../../components/ui';
import { useHebergementsStore } from '../../../stores/hebergementsStore';
import { useAuthStore, ACCOMMODATION_TYPES } from '../../../stores/authStore';
import { uploadHebergementImage } from '../../../lib/supabaseHebergementImages';
import { AccommodationType } from '../../../types';

const ACCOMMODATION_OPTIONS: { type: AccommodationType; label: string; icon: string }[] = [
  { type: 'hotel', label: 'Hôtel', icon: '🏨' },
  { type: 'auberge', label: 'Auberge', icon: '🏠' },
  { type: 'appartement', label: 'Appart.', icon: '🏢' },
  { type: 'maison', label: 'Maison', icon: '🏡' },
  { type: 'chambre', label: 'Chambre', icon: '🛏️' },
];

export default function MesHebergementsTab() {
  const { user, supabaseProfileId } = useAuthStore();
  const { listings, formData, addListing, removeListing, toggleStatus, updateForm, addFormImage, removeFormImage, loadListings } = useHebergementsStore();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (supabaseProfileId) {
      loadListings(supabaseProfileId);
    }
  }, [supabaseProfileId, loadListings]);

  const activeListings = listings.filter((l) => l.status === 'actif');

  const pickImage = async () => {
    if (formData.images.length >= 5) {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 5 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      addFormImage(result.assets[0].uri);
    }
  };

  const handlePublish = async () => {
    if (!formData.nom.trim() || !formData.ville.trim() || !formData.prixParNuit.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir le nom, la ville et le prix par nuit.');
      return;
    }
    if (!user) return;

    let imageUrls: string[] = [];
    if (formData.images.length > 0 && supabaseProfileId) {
      setIsUploading(true);
      try {
        const tempId = Date.now().toString();
        const uploads = await Promise.all(
          formData.images.map((uri) => uploadHebergementImage(tempId, uri))
        );
        imageUrls = uploads.filter((url): url is string => url !== null);
      } catch {
        // continue without images on error
      } finally {
        setIsUploading(false);
      }
    }

    addListing(user.id, supabaseProfileId || undefined, imageUrls);
    Alert.alert('Logement ajouté', 'Votre logement a été publié avec succès !');
  };

  const handleRemove = (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer ce logement ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeListing(id) },
    ]);
  };

  return (
    <AnimatedTabScreen>
      <LinearGradient colors={['#8B5CF6', '#A855F7']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
              Mes logements
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              Gérez vos hébergements
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
                Nouveau logement
              </Text>

              {/* Nom */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Nom du logement
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
                placeholder="Ex: Villa Soleil"
                placeholderTextColor="#9CA3AF"
                value={formData.nom}
                onChangeText={(v) => updateForm('nom', v)}
              />

              {/* Type d'hébergement */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
                {"Type d'hébergement"}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {ACCOMMODATION_OPTIONS.map((a) => (
                  <TouchableOpacity
                    key={a.type}
                    onPress={() => updateForm('type', a.type)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 12,
                      backgroundColor: formData.type === a.type ? '#8B5CF6' : '#F3F4F6',
                      alignItems: 'center',
                      flexDirection: 'row',
                      gap: 6,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{a.icon}</Text>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: formData.type === a.type ? 'white' : '#6B7280',
                    }}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Ville */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Ville
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
                value={formData.ville}
                onChangeText={(v) => updateForm('ville', v)}
              />

              {/* Adresse */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Adresse
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
                placeholder="Ex: Quartier Bè, Rue 45"
                placeholderTextColor="#9CA3AF"
                value={formData.adresse}
                onChangeText={(v) => updateForm('adresse', v)}
              />

              {/* Prix et Capacité - côte à côte */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                    Prix/nuit (FCFA)
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
                    placeholder="15000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.prixParNuit}
                    onChangeText={(v) => updateForm('prixParNuit', v)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                    Capacité
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
                    placeholder="2"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.capacite}
                    onChangeText={(v) => updateForm('capacite', v)}
                  />
                </View>
              </View>

              {/* Description */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Description
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
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Décrivez votre logement..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={formData.description}
                onChangeText={(v) => updateForm('description', v)}
              />

              {/* Photos */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
                Photos ({formData.images.length}/5)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
                contentContainerStyle={{ gap: 8 }}
              >
                {formData.images.map((uri, index) => (
                  <View key={index} style={{ position: 'relative' }}>
                    <Image
                      source={{ uri }}
                      style={{ width: 80, height: 80, borderRadius: 10 }}
                    />
                    <TouchableOpacity
                      onPress={() => removeFormImage(index)}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        backgroundColor: '#EF4444',
                        borderRadius: 10,
                        width: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name="close" size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                {formData.images.length < 5 && (
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 10,
                      backgroundColor: '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: '#D1D5DB',
                      borderStyle: 'dashed',
                    }}
                  >
                    <MaterialCommunityIcons name="camera-plus" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* Disponibilité toggle */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                backgroundColor: '#F3F4F6',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: formData.disponible ? '#059669' : '#DC2626',
                }}>
                  {formData.disponible ? 'Disponible' : 'Indisponible'}
                </Text>
                <Switch
                  value={formData.disponible}
                  onValueChange={(v) => updateForm('disponible', v)}
                  trackColor={{ false: '#FCA5A5', true: '#6EE7B7' }}
                  thumbColor={formData.disponible ? '#059669' : '#DC2626'}
                />
              </View>

              {/* Nombre de disponibilités */}
              {formData.disponible && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                    Nombre de disponibilites
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
                    value={formData.disponibilite}
                    onChangeText={(v) => updateForm('disponibilite', v)}
                  />
                </View>
              )}

              {!formData.disponible && <View style={{ marginBottom: 20 }} />}

              {/* Bouton Publier */}
              <TouchableOpacity
                onPress={handlePublish}
                disabled={isUploading}
                style={{
                  backgroundColor: isUploading ? '#C4B5FD' : '#8B5CF6',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons name="plus-circle" size={20} color="white" />
                )}
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                  {isUploading ? 'Upload en cours...' : 'Ajouter le logement'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Liste des logements actifs */}
            {activeListings.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: 'white', marginBottom: 12 }}>
                  Logements actifs ({activeListings.length})
                </Text>
                {activeListings.map((listing) => (
                  <View
                    key={listing.id}
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
                        {listing.images && listing.images.length > 0 ? (
                          <Image
                            source={{ uri: listing.images[0] }}
                            style={{ width: 40, height: 40, borderRadius: 8 }}
                          />
                        ) : (
                          <Text style={{ fontSize: 20 }}>
                            {ACCOMMODATION_TYPES[listing.type]?.icon || '🏠'}
                          </Text>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>
                            {listing.nom}
                          </Text>
                          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                            {listing.ville} · {listing.capacite} pers. max · {listing.disponibilite} dispo.
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleRemove(listing.id)}>
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
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#8B5CF6' }}>
                        {listing.prixParNuit.toLocaleString()} FCFA/nuit
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleStatus(listing.id)}
                        style={{
                          backgroundColor: listing.status === 'actif' ? '#ECFDF5' : '#FEF2F2',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MaterialCommunityIcons
                          name={listing.status === 'actif' ? 'check-circle-outline' : 'close-circle-outline'}
                          size={14}
                          color={listing.status === 'actif' ? '#059669' : '#DC2626'}
                        />
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: listing.status === 'actif' ? '#059669' : '#DC2626',
                        }}>
                          {listing.status === 'actif' ? 'Actif' : 'Inactif'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Empty state */}
            {activeListings.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: 32, paddingHorizontal: 20 }}>
                <MaterialCommunityIcons name="home-city-outline" size={48} color="rgba(255,255,255,0.6)" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 12, textAlign: 'center' }}>
                  Aucun logement publié
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'center' }}>
                  Remplissez le formulaire ci-dessus pour ajouter votre premier logement
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </AnimatedTabScreen>
  );
}
