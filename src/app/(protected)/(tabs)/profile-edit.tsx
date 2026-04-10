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
  ActionSheetIOS,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../../constants';
import { useAuthStore } from '../../../stores/authStore';
import type { NotificationPreferences } from '../../../types';
import { uploadAvatar, generateAvatarPlaceholder } from '../../../lib/supabaseAvatar';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, updateProfile, notificationPreferences, setNotificationPreferences, clerkId } =
    useAuthStore();

  const profile = user?.profile;

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    emergencyContact: profile?.emergencyContact || '',
  });

  const [avatarUri, setAvatarUri] = useState<string>(profile?.avatar || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(notificationPreferences);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à la caméra.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à la galerie.');
          return;
        }
      }

      // Launch picker
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setAvatarUri(imageUri);

        // Upload immediately
        setIsUploadingAvatar(true);
        const userId = clerkId || user?.id || 'unknown';
        const publicUrl = await uploadAvatar(userId, imageUri);

        if (publicUrl) {
          updateProfile({ avatar: publicUrl });
          Alert.alert('Succès', 'Photo de profil mise à jour !');
        } else {
          Alert.alert('Erreur', "Impossible d'uploader la photo. Veuillez réessayer.");
          setAvatarUri(profile?.avatar || '');
        }
        setIsUploadingAvatar(false);
      }
    } catch (error) {
      setIsUploadingAvatar(false);
      Alert.alert('Erreur', "Une erreur s'est produite lors de la sélection de l'image.");
    }
  };

  const handleChangePhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annuler', 'Prendre une photo', 'Choisir depuis la galerie'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickImage('camera');
          if (buttonIndex === 2) pickImage('library');
        }
      );
    } else {
      Alert.alert(
        'Changer la photo',
        'Choisissez une source',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Prendre une photo', onPress: () => pickImage('camera') },
          { text: 'Galerie', onPress: () => pickImage('library') },
        ]
      );
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      updateProfile({ name: formData.name, phone: formData.phone, address: formData.address, emergencyContact: formData.emergencyContact });
      setNotificationPreferences(localPrefs);

      Alert.alert('Succès', 'Profil mis à jour avec succès !', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={COLORS.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Modifier le profil</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            <Text className={`font-medium text-white ${isLoading ? 'opacity-50' : ''}`}>
              {isLoading ? 'Enregistrement...' : 'Sauver'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView className="-mt-4 flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={{ marginBottom: 24, alignItems: 'center', backgroundColor: 'white', borderRadius: 16, padding: 24 }}>
            <View style={{ width: 132, height: 132 }}>
              <Image
                source={{ uri: avatarUri || generateAvatarPlaceholder(profile?.name || 'User', clerkId || 'default') }}
                style={{ width: 132, height: 132, borderRadius: 66, borderWidth: 4, borderColor: '#F3F4F6' }}
              />
              {isUploadingAvatar && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 66, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color="white" />
                </View>
              )}
              <TouchableOpacity
                onPress={handleChangePhoto}
                disabled={isUploadingAvatar}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: '#2563EB',
                  borderRadius: 50,
                  padding: 10,
                  elevation: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                }}
                activeOpacity={0.7}>
                <Ionicons name="camera" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <Text className="mt-4 text-base font-semibold text-gray-800">{profile?.name}</Text>
            <Text className="text-sm text-gray-500">Appuyez sur l&apos;icône pour changer</Text>
          </View>

          {/* Personal Information */}
          <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <Text className="mb-4 text-lg font-bold text-gray-800">Informations personnelles</Text>

            <View className="mb-4">
              <Text className="mb-2 text-gray-600">Nom complet</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                className="rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder="Votre nom complet"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-gray-600">Email</Text>
              <TextInput
                value={formData.email}
                editable={false}
                className="rounded-xl bg-gray-100 px-4 py-3 text-gray-500"
                placeholder="votre.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text className="mt-1 text-xs text-gray-400">
                {"L'email ne peut pas être modifié ici"}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-gray-600">Téléphone</Text>
              <TextInput
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                className="rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder="+241 06 12 34 56"
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-gray-600">Adresse</Text>
              <TextInput
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                className="rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder="Votre adresse"
                multiline
                numberOfLines={2}
              />
            </View>

            <View>
              <Text className="mb-2 text-gray-600">Contact d&apos;urgence</Text>
              <TextInput
                value={formData.emergencyContact}
                onChangeText={(text) => setFormData({ ...formData, emergencyContact: text })}
                className="rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder="+241 07 98 76 54"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Preferences */}
          <View className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <Text className="mb-4 text-lg font-bold text-gray-800">
              Préférences de notification
            </Text>

            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="font-medium text-gray-800">Courses et livraisons</Text>
                <Text className="text-sm text-gray-500">
                  Demandes, suivi, confirmations
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setLocalPrefs({ ...localPrefs, courses: !localPrefs.courses })
                }
                className={`h-6 w-12 rounded-full ${
                  localPrefs.courses ? 'bg-[#2162FE]' : 'bg-gray-300'
                }`}>
                <View
                  className={`mt-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    localPrefs.courses ? 'ml-6' : 'ml-0.5'
                  }`}
                />
              </TouchableOpacity>
            </View>

            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="font-medium text-gray-800">Trajets</Text>
                <Text className="text-sm text-gray-500">
                  Réservations passagers, nouveaux trajets
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setLocalPrefs({ ...localPrefs, trajets: !localPrefs.trajets })
                }
                className={`h-6 w-12 rounded-full ${
                  localPrefs.trajets ? 'bg-[#2162FE]' : 'bg-gray-300'
                }`}>
                <View
                  className={`mt-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    localPrefs.trajets ? 'ml-6' : 'ml-0.5'
                  }`}
                />
              </TouchableOpacity>
            </View>

            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="font-medium text-gray-800">Hébergements</Text>
                <Text className="text-sm text-gray-500">
                  Réservations, disponibilités, avis
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setLocalPrefs({ ...localPrefs, hebergements: !localPrefs.hebergements })
                }
                className={`h-6 w-12 rounded-full ${
                  localPrefs.hebergements ? 'bg-[#2162FE]' : 'bg-gray-300'
                }`}>
                <View
                  className={`mt-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    localPrefs.hebergements ? 'ml-6' : 'ml-0.5'
                  }`}
                />
              </TouchableOpacity>
            </View>

            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="font-medium text-gray-800">Promotions et infos</Text>
                <Text className="text-sm text-gray-500">Marketing, promos, annonces</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setLocalPrefs({ ...localPrefs, promotions: !localPrefs.promotions })
                }
                className={`h-6 w-12 rounded-full ${
                  localPrefs.promotions ? 'bg-[#2162FE]' : 'bg-gray-300'
                }`}>
                <View
                  className={`mt-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    localPrefs.promotions ? 'ml-6' : 'ml-0.5'
                  }`}
                />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="font-medium text-gray-800">Messages</Text>
                <Text className="text-sm text-gray-500">
                  Messages directs de vos contacts
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setLocalPrefs({ ...localPrefs, messages: !localPrefs.messages })
                }
                className={`h-6 w-12 rounded-full ${
                  localPrefs.messages ? 'bg-[#2162FE]' : 'bg-gray-300'
                }`}>
                <View
                  className={`mt-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    localPrefs.messages ? 'ml-6' : 'ml-0.5'
                  }`}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
