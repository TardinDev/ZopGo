import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { COLORS } from '../../../constants';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useAuthStore } from '../../../stores/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { logout } = useAuthStore();
  const { generalSettings, updateGeneralSettings } = useSettingsStore();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            logout();
            router.replace('/auth');
          } catch {
            logout();
            router.replace('/auth');
          }
        },
      },
    ]);
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
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Paramètres</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView
        className="-mt-4 flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Language */}
        <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <View className="mb-5 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <Ionicons name="language-outline" size={20} color={COLORS.primary} />
            </View>
            <Text className="text-lg font-bold text-gray-800">Langue</Text>
          </View>

          <View className="flex-row rounded-xl bg-gray-50 p-1">
            <TouchableOpacity
              onPress={() => updateGeneralSettings({ language: 'fr' })}
              className={`flex-1 items-center rounded-lg py-3 ${
                generalSettings.language === 'fr' ? 'bg-blue-600' : ''
              }`}
              activeOpacity={0.7}>
              <Text
                className={`text-base font-semibold ${
                  generalSettings.language === 'fr' ? 'text-white' : 'text-gray-600'
                }`}>
                Français
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => updateGeneralSettings({ language: 'en' })}
              className={`flex-1 items-center rounded-lg py-3 ${
                generalSettings.language === 'en' ? 'bg-blue-600' : ''
              }`}
              activeOpacity={0.7}>
              <Text
                className={`text-base font-semibold ${
                  generalSettings.language === 'en' ? 'text-white' : 'text-gray-600'
                }`}>
                English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences */}
        <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <View className="mb-5 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <Ionicons name="options-outline" size={20} color={COLORS.primary} />
            </View>
            <Text className="text-lg font-bold text-gray-800">Préférences</Text>
          </View>

          {/* Dark Mode */}
          <View className="flex-row items-center justify-between border-b border-gray-100 py-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="moon-outline" size={20} color={COLORS.gray[600]} />
              </View>
              <View>
                <Text className="text-base font-semibold text-gray-800">Mode sombre</Text>
                <Text className="text-sm text-gray-500">Thème sombre pour l'application</Text>
              </View>
            </View>
            <Switch
              value={generalSettings.darkMode}
              onValueChange={(value) => updateGeneralSettings({ darkMode: value })}
              trackColor={{ false: COLORS.gray[200], true: COLORS.primary }}
              thumbColor="white"
            />
          </View>

          {/* Share Location */}
          <View className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-green-50">
                <Ionicons name="location-outline" size={20} color={COLORS.success} />
              </View>
              <View>
                <Text className="text-base font-semibold text-gray-800">
                  Partage de localisation
                </Text>
                <Text className="text-sm text-gray-500">
                  Partager votre position avec les chauffeurs
                </Text>
              </View>
            </View>
            <Switch
              value={generalSettings.shareLocation}
              onValueChange={(value) => updateGeneralSettings({ shareLocation: value })}
              trackColor={{ false: COLORS.gray[200], true: COLORS.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* App Info */}
        <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <View className="mb-2 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            </View>
            <Text className="text-lg font-bold text-gray-800">À propos</Text>
          </View>

          <View className="flex-row items-center justify-between border-b border-gray-100 py-4">
            <Text className="text-base text-gray-600">Version de l'application</Text>
            <Text className="text-base font-medium text-gray-800">1.0.0</Text>
          </View>

          <View className="flex-row items-center justify-between py-4">
            <Text className="text-base text-gray-600">Plateforme</Text>
            <Text className="text-base font-medium text-gray-800">ZopGo</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="items-center rounded-2xl bg-white py-4 shadow-sm"
          activeOpacity={0.8}>
          <View className="flex-row items-center">
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text className="ml-2 text-base font-bold text-red-500">Se déconnecter</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
