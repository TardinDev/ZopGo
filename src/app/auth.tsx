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
import { useAuthStore, VEHICLE_TYPES } from '../stores/authStore';
import { UserRole, VehicleType } from '../types';
import { ModeTransition } from '../components/ui';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('moto');
  const [showTransition, setShowTransition] = useState(false);

  const { login, register, isLoading } = useAuthStore();

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!isLogin && !formData.name) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      if (isLogin) {
        await login(
          formData.email,
          formData.password,
          selectedRole,
          selectedRole === 'chauffeur' ? selectedVehicle : undefined
        );
      } else {
        await register(
          formData.name,
          formData.email,
          formData.password,
          selectedRole,
          selectedRole === 'chauffeur' ? selectedVehicle : undefined
        );
      }

      // Afficher la transition animée
      setShowTransition(true);
    } catch {
      Alert.alert('Erreur', "Une erreur s'est produite. Veuillez réessayer.");
    }
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    router.replace('/(protected)/(tabs)');
  };

  const vehicleOptions = Object.values(VEHICLE_TYPES);

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#4FA5CF', '#2162FE']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        className="flex-1">
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
                      onPress={() => setSelectedRole('client')}
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
                      onPress={() => setSelectedRole('chauffeur')}
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
          role={selectedRole}
          onComplete={handleTransitionComplete}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}
