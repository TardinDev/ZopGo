import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { COLORS } from '../../../constants';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useAuthStore } from '../../../stores/authStore';
import { LogoutSheet, ModeTransition } from '../../../components/ui';
import type { UserRole } from '../../../types';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const { user, logout, switchRole } = useAuthStore();
  const { generalSettings, updateGeneralSettings } = useSettingsStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [logoutSheetVisible, setLogoutSheetVisible] = useState(false);
  const [transitionRole, setTransitionRole] = useState<UserRole | null>(null);

  const availableRoles = (user?.roles && user.roles.length > 0
    ? user.roles
    : user
    ? [user.role]
    : []) as UserRole[];

  const openLogoutSheet = () => setLogoutSheetVisible(true);

  const handleSwitchRole = useCallback(
    (newRole: UserRole) => {
      if (!user || newRole === user.role) {
        setLogoutSheetVisible(false);
        return;
      }
      setLogoutSheetVisible(false);
      // Persist to Clerk in background (next-launch source of truth).
      if (clerkUser) {
        clerkUser
          .update({
            unsafeMetadata: {
              ...(clerkUser.unsafeMetadata ?? {}),
              role: newRole,
            },
          })
          .catch((err) => {
            if (__DEV__) console.warn('switchRole clerk persist failed:', err);
          });
      }
      // Local + Supabase switch (sync inside switchRole).
      switchRole(newRole);
      // Show animated overlay; navigation happens on completion.
      setTransitionRole(newRole);
    },
    [user, clerkUser, switchRole]
  );

  const handleTransitionComplete = useCallback(() => {
    setTransitionRole(null);
    router.replace('/(protected)/(tabs)');
  }, [router]);

  const handleLogout = useCallback(async () => {
    setLogoutSheetVisible(false);
    try {
      await signOut();
    } catch (err) {
      if (__DEV__) console.warn('Clerk signOut failed:', err);
    }
    logout();
    router.replace('/auth');
  }, [signOut, logout, router]);

  // The profile soft-delete is handled by supabase/functions/clerk-webhook on
  // user.deleted (sets profiles.deleted_at), then RLS filters the user out of
  // public lists. Mobile just deletes the Clerk user + clears local state.
  const performAccountDeletion = async () => {
    if (!clerkUser) return;
    setIsDeleting(true);
    try {
      await clerkUser.delete();
      logout();
      router.replace('/auth');
    } catch (err) {
      console.warn('[deleteAccount] FAILED', err instanceof Error ? err.message : err);
      const message = err instanceof Error ? err.message : 'Erreur inconnue.';
      Alert.alert(
        'Suppression impossible',
        `Une erreur est survenue : ${message}\n\nVérifiez votre connexion et réessayez.`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    if (isDeleting) return;
    // Step 1 — soft retention: one prompt, no insisting.
    Alert.alert(
      'Avant de partir',
      'ZopGo est gratuit et vous pouvez vous reconnecter quand vous le souhaitez. Souhaitez-vous vraiment supprimer votre compte ?',
      [
        { text: 'Rester', style: 'cancel' },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () => {
            // Step 2 — final destructive confirmation.
            Alert.alert(
              'Supprimer le compte',
              'Cette action est irréversible. Votre profil et vos données associées seront supprimés.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer définitivement',
                  style: 'destructive',
                  onPress: () => {
                    void performAccountDeletion();
                  },
                },
              ]
            );
          },
        },
      ]
    );
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

          {/* Notification Sound */}
          <View className="flex-row items-center justify-between border-b border-gray-100 py-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
              </View>
              <View>
                <Text className="text-base font-semibold text-gray-800">Son des notifications</Text>
                <Text className="text-sm text-gray-500">Jouer un son pour les notifications</Text>
              </View>
            </View>
            <Switch
              value={generalSettings.notificationSound}
              onValueChange={(value) => updateGeneralSettings({ notificationSound: value })}
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

        {/* Logout / switch mode */}
        <TouchableOpacity
          onPress={openLogoutSheet}
          className="items-center rounded-2xl bg-white py-4 shadow-sm"
          activeOpacity={0.8}>
          <View className="flex-row items-center">
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text className="ml-2 text-base font-bold text-red-500">
              {availableRoles.length > 1 ? 'Changer de mode / Se déconnecter' : 'Se déconnecter'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          className="mt-4 items-center rounded-2xl py-4"
          style={{
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: COLORS.error,
            opacity: isDeleting ? 0.5 : 1,
          }}
          activeOpacity={0.8}>
          <View className="flex-row items-center">
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text className="ml-2 text-sm font-semibold text-red-500">
              {isDeleting ? 'Suppression en cours…' : 'Supprimer mon compte'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <LogoutSheet
        visible={logoutSheetVisible}
        onClose={() => setLogoutSheetVisible(false)}
        currentRole={user?.role ?? 'client'}
        availableRoles={availableRoles}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
      />

      <ModeTransition
        visible={transitionRole !== null}
        role={transitionRole ?? 'client'}
        onComplete={handleTransitionComplete}
        quick
      />
    </SafeAreaView>
  );
}
