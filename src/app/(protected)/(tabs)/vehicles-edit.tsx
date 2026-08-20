export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../../constants';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useAuthStore, isChauffeur, VEHICLE_TYPES } from '../../../stores/authStore';
import { uploadVehiclePhoto } from '../../../lib/supabaseVehiclePhoto';
import type { VehicleType } from '../../../types';
import type { SettingsVehicle } from '../../../stores/settingsStore';

const VEHICLE_TYPE_OPTIONS: { type: VehicleType; label: string; icon: string }[] = [
  { type: 'velo', label: 'Vélo', icon: '🚲' },
  { type: 'moto', label: 'Moto', icon: '🏍️' },
  { type: 'voiture', label: 'Voiture', icon: '🚗' },
  { type: 'camionnette', label: 'Camionnette', icon: '🚚' },
  { type: 'bus', label: 'Bus', icon: '🚌' },
];

export default function VehiclesEditScreen() {
  const router = useRouter();
  const { vehicles, addVehicle, removeVehicle, setDefaultVehicle } = useSettingsStore();
  const { user, updateProfile, clerkId } = useAuthStore();
  const isDriver = isChauffeur(user);

  const [showForm, setShowForm] = useState(false);
  const [formLabel, setFormLabel] = useState('');
  const [formPlaque, setFormPlaque] = useState('');
  const [formType, setFormType] = useState<VehicleType>('voiture');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Source de vérité unique : le profil. On n'affiche jamais l'URI locale
  // choisie dans la galerie, donc un envoi qui échoue laisse la photo
  // précédente à l'écran au lieu d'afficher une photo qui n'existe pas côté serveur.
  const vehiclePhotoUrl = user?.profile.vehiclePhotoUrl;

  // Même mécanique que l'avatar du profil (voir profil.tsx : permission →
  // picker → upload → persistance), au ratio 16:9 du futur aperçu client.
  const handlePickVehiclePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Nous avons besoin de la permission pour accéder à la galerie.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;

      // Le premier segment du chemin Storage doit être le clerkId (policies
      // RLS du bucket `vehicle-photos`) : sans lui, l'envoi serait rejeté.
      const uploaderId = clerkId || user?.id;
      if (!uploaderId) {
        Alert.alert('Erreur', 'Session introuvable. Reconnectez-vous puis réessayez.');
        return;
      }

      setIsUploadingPhoto(true);
      const publicUrl = await uploadVehiclePhoto(uploaderId, result.assets[0].uri);
      if (publicUrl) {
        updateProfile({ vehiclePhotoUrl: publicUrl });
      } else {
        Alert.alert('Erreur', "Impossible d'envoyer la photo. Veuillez réessayer.");
      }
    } catch {
      Alert.alert('Erreur', "Une erreur s'est produite lors de la sélection de l'image.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAdd = () => {
    if (!formLabel.trim() || !formPlaque.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    const isFirst = vehicles.length === 0;
    addVehicle({
      label: formLabel.trim(),
      plaque: formPlaque.trim().toUpperCase(),
      type: formType,
      isDefault: isFirst,
    });
    if (isFirst && isDriver) {
      updateProfile({ vehicule: VEHICLE_TYPES[formType] });
    }
    setFormLabel('');
    setFormPlaque('');
    setFormType('voiture');
    setShowForm(false);
  };

  const handleSetDefault = (vehicle: SettingsVehicle) => {
    setDefaultVehicle(vehicle.id);
    if (isDriver) {
      updateProfile({ vehicule: VEHICLE_TYPES[vehicle.type] });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer ce véhicule ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeVehicle(id) },
    ]);
  };

  const getIcon = (type: VehicleType) =>
    VEHICLE_TYPE_OPTIONS.find((v) => v.type === type)?.icon || '🚗';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={COLORS.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={{ paddingBottom: 32 }}>
        <View className="flex-row items-center justify-between px-6 pb-6 pt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Mes véhicules</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView className="-mt-4 flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Photo du véhicule (chauffeurs) */}
          {isDriver && (
            <View className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
              <Text className="mb-3 font-semibold text-gray-800">Photo du véhicule</Text>
              <TouchableOpacity
                onPress={handlePickVehiclePhoto}
                disabled={isUploadingPhoto}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ajouter une photo du véhicule"
                accessibilityState={{ disabled: isUploadingPhoto, busy: isUploadingPhoto }}>
                {vehiclePhotoUrl ? (
                  <View
                    className="overflow-hidden rounded-xl bg-gray-100"
                    style={{ width: '100%', aspectRatio: 16 / 9 }}>
                    <Image
                      source={{ uri: vehiclePhotoUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    {isUploadingPhoto ? (
                      <View
                        className="absolute inset-0 items-center justify-center"
                        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                        <ActivityIndicator color="white" />
                      </View>
                    ) : (
                      <View className="absolute bottom-2 right-2 flex-row items-center rounded-lg bg-black/60 px-3 py-1.5">
                        <Ionicons name="camera-outline" size={14} color="white" />
                        <Text className="ml-1 text-xs font-medium text-white">Modifier</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View
                    className="items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50"
                    style={{ width: '100%', aspectRatio: 16 / 9 }}>
                    {isUploadingPhoto ? (
                      <ActivityIndicator color={COLORS.primary} />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
                        <Text className="mt-2 font-semibold text-[#2162FE]">
                          Ajouter une photo
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
              <Text className="mt-3 text-xs text-gray-500">
                Cette photo aide vos passagers à reconnaître votre véhicule.
              </Text>
            </View>
          )}

          {/* Liste des véhicules */}
          {vehicles.length > 0 ? (
            <View className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
              {vehicles.map((vehicle) => (
                <View
                  key={vehicle.id}
                  className="flex-row items-center border-b border-gray-100 py-4">
                  <Text className="mr-3 text-2xl">{getIcon(vehicle.type)}</Text>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-semibold text-gray-800">{vehicle.label}</Text>
                      {vehicle.isDefault && (
                        <View className="ml-2 rounded-full bg-blue-100 px-2 py-0.5">
                          <Text className="text-xs font-medium text-blue-600">Par défaut</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-gray-500">{vehicle.plaque}</Text>
                  </View>
                  {!vehicle.isDefault && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(vehicle)}
                      className="mr-3 rounded-lg bg-gray-100 px-3 py-2">
                      <Text className="text-xs font-medium text-gray-600">Défaut</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(vehicle.id)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View className="mb-6 items-center rounded-2xl bg-white py-12 shadow-sm">
              <Ionicons name="car-outline" size={48} color={COLORS.gray[300]} />
              <Text className="mt-3 text-base text-gray-400">Aucun véhicule enregistré</Text>
            </View>
          )}

          {/* Formulaire d'ajout */}
          {showForm ? (
            <View className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
              <Text className="mb-4 text-lg font-bold text-gray-800">Ajouter un véhicule</Text>

              {/* Sélecteur de type */}
              <Text className="mb-2 text-gray-600">Type de véhicule</Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {VEHICLE_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.type}
                    onPress={() => setFormType(opt.type)}
                    className={`flex-row items-center rounded-xl px-4 py-3 ${
                      formType === opt.type ? 'bg-blue-100' : 'bg-gray-50'
                    }`}>
                    <Text className="mr-1">{opt.icon}</Text>
                    <Text
                      className={`font-medium ${
                        formType === opt.type ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="mb-2 text-gray-600">Nom du véhicule</Text>
              <TextInput
                value={formLabel}
                onChangeText={setFormLabel}
                className="mb-4 rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder="Ex: Ma Toyota Corolla"
              />

              <Text className="mb-2 text-gray-600">Plaque d&apos;immatriculation</Text>
              <TextInput
                value={formPlaque}
                onChangeText={setFormPlaque}
                className="mb-6 rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder="Ex: AB 1234 GA"
                autoCapitalize="characters"
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowForm(false)}
                  className="flex-1 rounded-xl bg-gray-100 py-4">
                  <Text className="text-center font-semibold text-gray-600">Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAdd}
                  className="flex-1 rounded-xl bg-[#2162FE] py-4">
                  <Text className="text-center font-semibold text-white">Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              className="mb-8 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 py-4">
              <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
              <Text className="ml-2 font-semibold text-[#2162FE]">Ajouter un véhicule</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
