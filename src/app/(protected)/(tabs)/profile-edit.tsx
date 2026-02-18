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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../stores/authStore';
import type { NotificationPreferences } from '../../../types';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, updateProfile, notificationPreferences, setNotificationPreferences } =
    useAuthStore();

  const profile = user?.profile;

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: '',
    emergencyContact: '',
  });

  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(notificationPreferences);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      updateProfile({ name: formData.name, phone: formData.phone });
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
        colors={['#4FA5CF', '#2162FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        className="pb-8">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Modifier le profil</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            <Text className={`font-medium text-white ${isLoading ? 'opacity-50' : ''}`}>
              {isLoading ? 'Saving...' : 'Sauver'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView className="-mt-4 flex-1 px-6" showsVerticalScrollIndicator={false}>
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
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                className="rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder="votre.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-gray-600">Téléphone</Text>
              <TextInput
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                className="rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder="+33 6 12 34 56 78"
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
                placeholder="+33 6 98 76 54 32"
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

            <View className="flex-row items-center justify-between">
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
