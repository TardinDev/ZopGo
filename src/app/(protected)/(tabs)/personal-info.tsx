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
import { uploadAvatar, generateAvatarPlaceholder } from '../../../lib/supabaseAvatar';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateProfile, clerkId } = useAuthStore();
  const profile = user?.profile;

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string>(profile?.avatar || '');

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    emergencyContact: profile?.emergencyContact || '',
  });

  const avatarSource = avatarUri || generateAvatarPlaceholder(profile?.name || 'User', clerkId || 'default');

  const pickImage = async (source: 'camera' | 'library') => {
    try {
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

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.8 });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setAvatarUri(imageUri);

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
    } catch {
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
      Alert.alert('Changer la photo', 'Choisissez une source', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Prendre une photo', onPress: () => pickImage('camera') },
        { text: 'Galerie', onPress: () => pickImage('library') },
      ]);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire.');
      return;
    }

    setIsLoading(true);
    try {
      updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
      });

      setIsEditing(false);
      Alert.alert('Succès', 'Vos informations ont été mises à jour.');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      emergencyContact: profile?.emergencyContact || '',
    });
    setIsEditing(false);
  };

  const fields = [
    { key: 'name', label: 'Nom complet', icon: 'person-outline' as const, editable: true, keyboard: 'default' as const },
    { key: 'email', label: 'Email', icon: 'mail-outline' as const, editable: false, keyboard: 'email-address' as const },
    { key: 'phone', label: 'Téléphone', icon: 'call-outline' as const, editable: true, keyboard: 'phone-pad' as const },
    { key: 'address', label: 'Adresse', icon: 'location-outline' as const, editable: true, keyboard: 'default' as const, multiline: true },
    { key: 'emergencyContact', label: "Contact d'urgence", icon: 'medkit-outline' as const, editable: true, keyboard: 'phone-pad' as const },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={COLORS.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-4">
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Informations personnelles</Text>
          {isEditing ? (
            <TouchableOpacity onPress={handleSave} disabled={isLoading}>
              <Text className={`font-semibold text-white ${isLoading ? 'opacity-50' : ''}`}>
                {isLoading ? '...' : 'Sauver'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView className="-mt-4 flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Avatar Section */}
          <View className="mb-6 items-center rounded-2xl bg-white p-6 shadow-sm">
            <View style={{ width: 120, height: 120 }}>
              <Image
                source={{ uri: avatarSource }}
                style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: COLORS.gray[100] }}
              />
              {isUploadingAvatar && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 60, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color="white" />
                </View>
              )}
              {isEditing && (
                <TouchableOpacity
                  onPress={handleChangePhoto}
                  disabled={isUploadingAvatar}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: COLORS.primary,
                    borderRadius: 50,
                    padding: 10,
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                  }}
                  activeOpacity={0.7}>
                  <Ionicons name="camera" size={18} color="white" />
                </TouchableOpacity>
              )}
            </View>
            <Text className="mt-3 text-lg font-bold text-gray-800">{profile?.name}</Text>
            <Text className="text-sm text-gray-400">{profile?.email}</Text>
          </View>

          {/* Fields */}
          <View className="rounded-2xl bg-white shadow-sm">
            {fields.map((field, index) => {
              const value = formData[field.key as keyof typeof formData];
              const isLast = index === fields.length - 1;

              return (
                <View
                  key={field.key}
                  className={`flex-row items-center px-5 py-4 ${!isLast ? 'border-b border-gray-100' : ''}`}>
                  <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                    <Ionicons name={field.icon} size={20} color={COLORS.primary} />
                  </View>

                  <View className="flex-1">
                    <Text className="mb-1 text-xs font-medium text-gray-400">{field.label}</Text>
                    {isEditing && field.editable ? (
                      <TextInput
                        value={value}
                        onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                        className="rounded-lg bg-gray-50 px-3 py-2 text-base text-gray-800"
                        placeholder={`Votre ${field.label.toLowerCase()}`}
                        placeholderTextColor={COLORS.gray[300]}
                        keyboardType={field.keyboard}
                        multiline={field.multiline}
                        autoCapitalize={field.key === 'email' ? 'none' : 'sentences'}
                      />
                    ) : (
                      <Text className={`text-base ${value ? 'text-gray-800' : 'text-gray-300'}`}>
                        {value || 'Non renseigné'}
                      </Text>
                    )}
                  </View>

                  {!isEditing && field.editable && (
                    <TouchableOpacity onPress={() => setIsEditing(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.gray[300]} />
                    </TouchableOpacity>
                  )}

                  {!field.editable && (
                    <View className="rounded-full bg-gray-100 px-2 py-1">
                      <Text className="text-xs text-gray-400">Vérifié</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Action buttons */}
          {isEditing && (
            <View className="mt-6 space-y-3">
              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading}
                className="items-center rounded-2xl bg-blue-600 py-4 shadow-sm"
                activeOpacity={0.8}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-base font-bold text-white">Enregistrer les modifications</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancel}
                className="items-center rounded-2xl bg-white py-4 shadow-sm"
                activeOpacity={0.8}>
                <Text className="text-base font-medium text-gray-500">Annuler</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
