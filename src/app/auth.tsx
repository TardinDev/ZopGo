import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      // Simulation d'authentification
      await new Promise(resolve => setTimeout(resolve, 1500));

      // En vraie app, ici on ferait l'authentification réelle
      // Sauvegarder le token d'auth, etc.

      Alert.alert(
        'Succès',
        isLogin ? 'Connexion réussie !' : 'Compte créé avec succès !',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(protected)/(tabs)')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

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

          {/* Header */}
          <View className="pt-16 pb-8 px-8">
            <Text className="text-4xl font-bold text-white text-center mb-2">ZopGo</Text>
            <Text className="text-lg text-white/80 text-center">
              {isLogin ? 'Bon retour parmi nous' : 'Créez votre compte'}
            </Text>
          </View>

          {/* Form */}
          <View className="flex-1 px-8">
            <View className="bg-white/10 backdrop-blur rounded-3xl p-8">

              {/* Name field (only for register) */}
              {!isLogin && (
                <View className="mb-6">
                  <Text className="text-white/90 text-lg mb-2">Nom complet</Text>
                  <View className="bg-white/20 rounded-2xl px-4 py-4 flex-row items-center">
                    <Ionicons name="person-outline" size={20} color="white" />
                    <TextInput
                      placeholder="Votre nom"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={formData.name}
                      onChangeText={(text) => setFormData({...formData, name: text})}
                      className="flex-1 ml-3 text-white text-lg"
                    />
                  </View>
                </View>
              )}

              {/* Email */}
              <View className="mb-6">
                <Text className="text-white/90 text-lg mb-2">Email</Text>
                <View className="bg-white/20 rounded-2xl px-4 py-4 flex-row items-center">
                  <Ionicons name="mail-outline" size={20} color="white" />
                  <TextInput
                    placeholder="votre.email@example.com"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={formData.email}
                    onChangeText={(text) => setFormData({...formData, email: text})}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 ml-3 text-white text-lg"
                  />
                </View>
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className="text-white/90 text-lg mb-2">Mot de passe</Text>
                <View className="bg-white/20 rounded-2xl px-4 py-4 flex-row items-center">
                  <Ionicons name="lock-closed-outline" size={20} color="white" />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={formData.password}
                    onChangeText={(text) => setFormData({...formData, password: text})}
                    secureTextEntry
                    className="flex-1 ml-3 text-white text-lg"
                  />
                </View>
              </View>

              {/* Confirm Password (only for register) */}
              {!isLogin && (
                <View className="mb-8">
                  <Text className="text-white/90 text-lg mb-2">Confirmer le mot de passe</Text>
                  <View className="bg-white/20 rounded-2xl px-4 py-4 flex-row items-center">
                    <Ionicons name="lock-closed-outline" size={20} color="white" />
                    <TextInput
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={formData.confirmPassword}
                      onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                      secureTextEntry
                      className="flex-1 ml-3 text-white text-lg"
                    />
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                className={`bg-white rounded-2xl py-4 mb-6 ${
                  isLoading ? 'opacity-50' : ''
                }`}>
                <Text className="text-[#2162FE] text-lg font-bold text-center">
                  {isLoading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer le compte'}
                </Text>
              </TouchableOpacity>

              {/* Toggle */}
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text className="text-white/80 text-center">
                  {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
                  <Text className="font-bold text-white">
                    {isLogin ? "Créer un compte" : "Se connecter"}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}