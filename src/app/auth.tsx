import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { useAuthStore, VEHICLE_TYPES } from '../stores/authStore';
import { UserRole, VehicleType } from '../types';
import { ModeTransition } from '../components/ui';

export default function AuthScreen() {
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  const { setupProfile } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('moto');
  const [showTransition, setShowTransition] = useState(false);
  const [transitionRole, setTransitionRole] = useState<UserRole>('client');
  const [isRoleSwitch, setIsRoleSwitch] = useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole !== selectedRole) {
      setTransitionRole(newRole);
      setIsRoleSwitch(true);
      setShowTransition(true);
    }
  };

  const handleRoleSwitchComplete = () => {
    setSelectedRole(transitionRole);
    setShowTransition(false);
    setIsRoleSwitch(false);
  };

  const handleSubmit = async () => {
    // TODO: Réactiver la validation quand Clerk sera intégré
    // if (!formData.email || !formData.password) {
    //   Alert.alert('Erreur', 'Veuillez remplir tous les champs');
    //   return;
    // }
    // if (!isLogin && !formData.name) {
    //   Alert.alert('Erreur', 'Veuillez entrer votre nom');
    //   return;
    // }
    // if (!isLogin && formData.password !== formData.confirmPassword) {
    //   Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
    //   return;
    // }

    // Pour le moment, on configure le profil localement et on navigue
    const name = formData.name || formData.email.split('@')[0] || 'Utilisateur';
    const email = formData.email || 'demo@zopgo.com';
    setupProfile(
      selectedRole,
      name,
      email,
      selectedRole === 'chauffeur' ? selectedVehicle : undefined
    );

    setTransitionRole(selectedRole);
    setIsRoleSwitch(false);
    setShowTransition(true);
  };

  const handleVerifyEmail = async () => {
    if (!isSignUpLoaded || !signUp) return;

    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });

        // Configurer le profil local
        setupProfile(
          selectedRole,
          formData.name,
          formData.email,
          selectedRole === 'chauffeur' ? selectedVehicle : undefined
        );

        // Afficher la transition animée
        setTransitionRole(selectedRole);
        setIsRoleSwitch(false);
        setShowTransition(true);
      }
    } catch (err: any) {
      const errorMessage =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        'Code de vérification invalide';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    router.replace('/(protected)/(tabs)');
  };

  const vehicleOptions = Object.values(VEHICLE_TYPES);

  // --- Écran de vérification email ---
  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1">
        <LinearGradient
          colors={['#4FA5CF', '#2162FE']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1">
            <View className="flex-1 items-center justify-center px-6">
              <View className="w-full rounded-3xl bg-white/10 p-6 backdrop-blur">
                <View className="mb-6 items-center">
                  <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white/20">
                    <Ionicons name="mail-outline" size={32} color="white" />
                  </View>
                  <Text className="mb-2 text-center text-2xl font-bold text-white">
                    Vérification email
                  </Text>
                  <Text className="text-center text-base text-white/80">
                    Un code a été envoyé à{'\n'}
                    <Text className="font-semibold">{formData.email}</Text>
                  </Text>
                </View>

                <View className="mb-5">
                  <Text className="mb-2 text-base text-white/90">Code de vérification</Text>
                  <View className="flex-row items-center rounded-2xl bg-white/20 px-4 py-3">
                    <Ionicons name="key-outline" size={20} color="white" />
                    <TextInput
                      placeholder="123456"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      keyboardType="number-pad"
                      className="ml-3 flex-1 text-center text-xl tracking-widest text-white"
                      maxLength={6}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleVerifyEmail}
                  disabled={isLoading || verificationCode.length < 6}
                  className={`mb-4 rounded-2xl bg-white py-4 ${
                    isLoading || verificationCode.length < 6 ? 'opacity-50' : ''
                  }`}>
                  <Text className="text-center text-lg font-bold text-[#2162FE]">
                    {isLoading ? 'Vérification...' : 'Vérifier'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setPendingVerification(false);
                    setVerificationCode('');
                  }}>
                  <Text className="text-center text-white/80">
                    <Text className="font-bold text-white">Retour</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>

        <ModeTransition
          visible={showTransition}
          role={selectedRole}
          onComplete={handleTransitionComplete}
          quick={false}
        />
      </SafeAreaView>
    );
  }

  // --- Écran principal login/register ---
  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#4FA5CF', '#2162FE']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            {/* Header */}
            <View className="px-8 pb-6 pt-12">
              <Text className="mb-2 text-center text-4xl font-bold text-white">ZopGo</Text>
              <Text className="text-center text-lg text-white/80">
                {isLogin ? 'Bon retour parmi nous' : 'Créez votre compte'}
              </Text>
            </View>

            {/* Form */}
            <View className="flex-1 px-6 pb-8">
              <View className="rounded-3xl bg-white/10 p-6 backdrop-blur">
                {/* Sélecteur de rôle */}
                <View className="mb-6">
                  <Text className="mb-3 text-lg font-semibold text-white">Je suis</Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => handleRoleChange('client')}
                      className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
                        selectedRole === 'client' ? 'bg-white' : 'bg-white/20'
                      }`}>
                      <Ionicons
                        name="person"
                        size={22}
                        color={selectedRole === 'client' ? '#2162FE' : 'white'}
                      />
                      <Text
                        className={`text-base font-semibold ${
                          selectedRole === 'client' ? 'text-[#2162FE]' : 'text-white'
                        }`}>
                        Client
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRoleChange('chauffeur')}
                      className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
                        selectedRole === 'chauffeur' ? 'bg-white' : 'bg-white/20'
                      }`}>
                      <Ionicons
                        name="car"
                        size={22}
                        color={selectedRole === 'chauffeur' ? '#2162FE' : 'white'}
                      />
                      <Text
                        className={`text-base font-semibold ${
                          selectedRole === 'chauffeur' ? 'text-[#2162FE]' : 'text-white'
                        }`}>
                        Chauffeur
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sélecteur de véhicule (uniquement pour chauffeur) */}
                {selectedRole === 'chauffeur' && (
                  <View className="mb-6">
                    <Text className="mb-3 text-lg font-semibold text-white">Mon véhicule</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {vehicleOptions.map((vehicle) => (
                        <TouchableOpacity
                          key={vehicle.type}
                          onPress={() => setSelectedVehicle(vehicle.type)}
                          className={`flex-row items-center gap-2 rounded-xl px-4 py-3 ${
                            selectedVehicle === vehicle.type ? 'bg-white' : 'bg-white/20'
                          }`}>
                          <Text className="text-lg">{vehicle.icon}</Text>
                          <Text
                            className={`font-medium ${
                              selectedVehicle === vehicle.type ? 'text-[#2162FE]' : 'text-white'
                            }`}>
                            {vehicle.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Name field (only for register) */}
                {!isLogin && (
                  <View className="mb-5">
                    <Text className="mb-2 text-base text-white/90">Nom complet</Text>
                    <View className="flex-row items-center rounded-2xl bg-white/20 px-4 py-3">
                      <Ionicons name="person-outline" size={20} color="white" />
                      <TextInput
                        placeholder="Votre nom"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        className="ml-3 flex-1 text-base text-white"
                      />
                    </View>
                  </View>
                )}

                {/* Email */}
                <View className="mb-5">
                  <Text className="mb-2 text-base text-white/90">Email</Text>
                  <View className="flex-row items-center rounded-2xl bg-white/20 px-4 py-3">
                    <Ionicons name="mail-outline" size={20} color="white" />
                    <TextInput
                      placeholder="votre.email@example.com"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="ml-3 flex-1 text-base text-white"
                    />
                  </View>
                </View>

                {/* Password */}
                <View className="mb-5">
                  <Text className="mb-2 text-base text-white/90">Mot de passe</Text>
                  <View className="flex-row items-center rounded-2xl bg-white/20 px-4 py-3">
                    <Ionicons name="lock-closed-outline" size={20} color="white" />
                    <TextInput
                      placeholder="********"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      secureTextEntry
                      className="ml-3 flex-1 text-base text-white"
                    />
                  </View>
                </View>

                {/* Confirm Password (only for register) */}
                {!isLogin && (
                  <View className="mb-6">
                    <Text className="mb-2 text-base text-white/90">Confirmer le mot de passe</Text>
                    <View className="flex-row items-center rounded-2xl bg-white/20 px-4 py-3">
                      <Ionicons name="lock-closed-outline" size={20} color="white" />
                      <TextInput
                        placeholder="********"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.confirmPassword}
                        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                        secureTextEntry
                        className="ml-3 flex-1 text-base text-white"
                      />
                    </View>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  className={`mb-5 rounded-2xl bg-white py-4 ${isLoading ? 'opacity-50' : ''}`}>
                  <Text className="text-center text-lg font-bold text-[#2162FE]">
                    {isLoading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer le compte'}
                  </Text>
                </TouchableOpacity>

                {/* Toggle */}
                <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                  <Text className="text-center text-white/80">
                    {isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                    <Text className="font-bold text-white">
                      {isLogin ? 'Créer un compte' : 'Se connecter'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Mode Transition Overlay */}
        <ModeTransition
          visible={showTransition}
          role={isRoleSwitch ? transitionRole : selectedRole}
          onComplete={isRoleSwitch ? handleRoleSwitchComplete : handleTransitionComplete}
          quick={isRoleSwitch}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}
