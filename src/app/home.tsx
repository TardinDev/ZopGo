import '../../global.css';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import SearchBar from '../components/SearchBar';

export default function Home() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1">
      <SafeAreaView style={{ flex: 1 }} className="bg-[#FFDD5C]">
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

        {/* === Header === */}
        <View className="flex-row items-center justify-between px-6">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-white shadow">
              <Text className="text-xl">🔔</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-3xl font-bold">Bienvenue.</Text>
            </View>
          </View>

          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-white shadow">
            <Text className="text-xl">👤</Text>
          </TouchableOpacity>
        </View>

        {/* === Welcome + météo === */}
        <View className="mt-6 px-6">
          <Text className="text-5xl font-bold text-green-500">ZopGo.</Text>
        </View>

        {/* === Actions principales en gros boutons === */}
        <View className="mt-8 flex flex-col gap-5 space-y-4 px-6">
          <TouchableOpacity
            onPress={() => router.push('/course/Voyage')}
            className="flex-row items-center justify-center rounded-3xl bg-[#F7F7F7] px-6 py-6 shadow-md"
            activeOpacity={0.9}>
            <Text className="mr-3 text-5xl">🚕</Text>
            <Text className="text-2xl font-bold text-blue-600">Commencer un voyage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/delivery/Delivery')}
            className="flex-row items-center justify-center rounded-3xl bg-[#F7F7F7] px-6 py-6 shadow-md"
            activeOpacity={0.9}>
            <Text className="mr-3 text-5xl">📦</Text>
            <Text className="text-2xl font-bold text-yellow-600">Livrer un colis</Text>
          </TouchableOpacity>
        </View>

        {/* === Section bleue avec recherche + activité === */}
        <View className="mt-6 flex-1 rounded-t-3xl bg-[#2162FE] p-6">
          <Text className="mt-2 text-base text-white">
            ☀️ 37°C – Ensoleillé • Saturday, Jul.03{' '}
          </Text>

          <View className="self-start pt-5">
            <SearchBar />
          </View>

          {/* === Activités scrollables === */}
          <View className="mt-6 flex-1">
            <Text className="mb-4 text-lg font-bold text-white">🕒 Dernières activités</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[...Array(10)].map((_, index) => (
                <View key={index} className="mb-3 rounded-xl bg-white p-4 shadow-md">
                  <Text className="font-medium text-gray-700">
                    {index % 2 === 0 ? '🚕 Trajet client' : '📦 Livraison client'}
                  </Text>
                  <Text className="mt-1 text-sm text-gray-400">
                    {index % 2 === 0 ? 'Aujourd&apos;hui à 13:30' : 'Hier à 18:45'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* === Navigation en bas (tab style) === */}
        <View className="flex-row justify-around border-t border-blue-300 bg-[#2162FE] py-4">
          {[
            { icon: '🏠', label: 'Accueil' },
            { icon: '💬', label: 'Message' },
            { icon: '💰', label: 'Gain' },
            { icon: '💡', label: 'Ideas' },
            { icon: '⚙️', label: 'Réglage' },
          ].map(({ icon, label }, idx) => (
            <TouchableOpacity key={idx} className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F7] shadow-md">
                <Text className="text-lg">{icon}</Text>
              </View>
              <Text className="mt-1 text-xs text-white">{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
