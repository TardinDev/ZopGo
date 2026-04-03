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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { COLORS } from '../../../constants';
import { useAuthStore } from '../../../stores/authStore';

export default function SecurityScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { signOut } = useAuth();
  const { logout } = useAuthStore();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    if (!clerkUser) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await clerkUser.updatePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert('Succès', 'Votre mot de passe a été mis à jour.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Impossible de changer le mot de passe.';
      Alert.alert('Erreur', message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation',
              'Êtes-vous vraiment sûr ? Cette action ne peut pas être annulée.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Oui, supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      if (clerkUser) {
                        await clerkUser.delete();
                      }
                      logout();
                      router.replace('/auth');
                    } catch {
                      Alert.alert('Erreur', 'Impossible de supprimer le compte.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

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
          <Text className="text-xl font-bold text-white">Sécurité</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="-mt-4 flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Change Password Section */}
          <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <View className="mb-5 flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
              </View>
              <Text className="text-lg font-bold text-gray-800">Changer le mot de passe</Text>
            </View>

            {/* Current Password */}
            <View className="mb-4">
              <Text className="mb-1.5 text-sm font-medium text-gray-500">Mot de passe actuel</Text>
              <View className="flex-row items-center rounded-xl bg-gray-50 px-4">
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  placeholder="Entrez votre mot de passe actuel"
                  placeholderTextColor={COLORS.gray[300]}
                  className="flex-1 py-3.5 text-base text-gray-800"
                />
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View className="mb-4">
              <Text className="mb-1.5 text-sm font-medium text-gray-500">
                Nouveau mot de passe
              </Text>
              <View className="flex-row items-center rounded-xl bg-gray-50 px-4">
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  placeholder="Minimum 8 caractères"
                  placeholderTextColor={COLORS.gray[300]}
                  className="flex-1 py-3.5 text-base text-gray-800"
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons
                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View className="mb-5">
              <Text className="mb-1.5 text-sm font-medium text-gray-500">
                Confirmer le mot de passe
              </Text>
              <View className="flex-row items-center rounded-xl bg-gray-50 px-4">
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Confirmez le nouveau mot de passe"
                  placeholderTextColor={COLORS.gray[300]}
                  className="flex-1 py-3.5 text-base text-gray-800"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={isChangingPassword}
              className="items-center rounded-xl bg-blue-600 py-4"
              activeOpacity={0.8}>
              {isChangingPassword ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-base font-bold text-white">Mettre à jour</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center"
              activeOpacity={0.7}>
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                <Ionicons name="log-out-outline" size={20} color={COLORS.orange} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">Déconnexion</Text>
                <Text className="text-sm text-gray-500">Se déconnecter de votre compte</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>

          {/* Delete Account Section */}
          <View className="rounded-2xl bg-white p-6 shadow-sm">
            <TouchableOpacity
              onPress={handleDeleteAccount}
              className="flex-row items-center"
              activeOpacity={0.7}>
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-red-500">Supprimer mon compte</Text>
                <Text className="text-sm text-gray-500">
                  Action irréversible, toutes vos données seront supprimées
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
