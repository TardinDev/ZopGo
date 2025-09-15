import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileEditScreen() {
  const [formData, setFormData] = useState({
    name: 'Alexandre Dupont',
    email: 'alexandre.dupont@email.com',
    phone: '+33 6 12 34 56 78',
    address: '123 Rue de la Paix, Paris',
    emergencyContact: '+33 6 98 76 54 32',
    preferences: {
      notifications: true,
      sms: false,
      email: true,
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert('Succès', 'Profil mis à jour avec succès !', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
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
        <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Modifier le profil</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            <Text className={`text-white font-medium ${isLoading ? 'opacity-50' : ''}`}>
              {isLoading ? 'Saving...' : 'Sauver'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">

        <ScrollView className="flex-1 px-6 -mt-4" showsVerticalScrollIndicator={false}>
          {/* Personal Information */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">Informations personnelles</Text>

            <View className="mb-4">
              <Text className="text-gray-600 mb-2">Nom complet</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800"
                placeholder="Votre nom complet"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 mb-2">Email</Text>
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800"
                placeholder="votre.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 mb-2">Téléphone</Text>
              <TextInput
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800"
                placeholder="+33 6 12 34 56 78"
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 mb-2">Adresse</Text>
              <TextInput
                value={formData.address}
                onChangeText={(text) => setFormData({...formData, address: text})}
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800"
                placeholder="Votre adresse"
                multiline
                numberOfLines={2}
              />
            </View>

            <View>
              <Text className="text-gray-600 mb-2">Contact d'urgence</Text>
              <TextInput
                value={formData.emergencyContact}
                onChangeText={(text) => setFormData({...formData, emergencyContact: text})}
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800"
                placeholder="+33 6 98 76 54 32"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Preferences */}
          <View className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">Préférences de notification</Text>

            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-gray-800 font-medium">Notifications push</Text>
                <Text className="text-gray-500 text-sm">Recevoir des notifications sur l'app</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFormData({
                  ...formData,
                  preferences: {...formData.preferences, notifications: !formData.preferences.notifications}
                })}
                className={`w-12 h-6 rounded-full ${
                  formData.preferences.notifications ? 'bg-[#2162FE]' : 'bg-gray-300'
                }`}>
                <View className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-all ${
                  formData.preferences.notifications ? 'ml-6' : 'ml-0.5'
                }`} />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-gray-800 font-medium">SMS</Text>
                <Text className="text-gray-500 text-sm">Recevoir des SMS pour les confirmations</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFormData({
                  ...formData,
                  preferences: {...formData.preferences, sms: !formData.preferences.sms}
                })}
                className={`w-12 h-6 rounded-full ${
                  formData.preferences.sms ? 'bg-[#2162FE]' : 'bg-gray-300'
                }`}>
                <View className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-all ${
                  formData.preferences.sms ? 'ml-6' : 'ml-0.5'
                }`} />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-800 font-medium">Email</Text>
                <Text className="text-gray-500 text-sm">Recevoir des emails promotionnels</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFormData({
                  ...formData,
                  preferences: {...formData.preferences, email: !formData.preferences.email}
                })}
                className={`w-12 h-6 rounded-full ${
                  formData.preferences.email ? 'bg-[#2162FE]' : 'bg-gray-300'
                }`}>
                <View className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-all ${
                  formData.preferences.email ? 'ml-6' : 'ml-0.5'
                }`} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}