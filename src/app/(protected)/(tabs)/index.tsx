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
import SearchBar from '../../../components/SearchBar';

export default function HomeTab() {
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
        <View className="mt-8 flex-1 rounded-t-[40px] bg-[#2162FE] px-6 pt-6 pb-24">
          {/* Météo en card */}
          <View className="mb-5 rounded-2xl bg-white/15 px-4 pb-2 pt-1">
            <Text className="text-base font-semibold text-white">
              ☀️ 32°C – Ensoleillé • Libreville, Gabon
            </Text>
          </View>

          {/* Barre de recherche */}
          <View className="mb-6">
            <SearchBar />
          </View>

          {/* === Activités scrollables === */}
          <View className="flex-1">
            <Text className="mb-3 text-xl font-bold text-white">Dernières activités</Text>
            <ScrollView
              className=" -mb-10"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10, }}>
              {[...Array(10)].map((_, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  className="mb-2.5 flex-row items-center rounded-xl bg-white p-3 shadow-md">
                  <View className={`mr-3 h-10 w-10 items-center justify-center rounded-lg ${
                    index % 2 === 0 ? 'bg-blue-100' : 'bg-yellow-100'
                  }`}>
                    <Text className="text-xl">
                      {index % 2 === 0 ? '🚕' : '📦'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900">
                      {index % 2 === 0 ? 'Trajet client' : 'Livraison client'}
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-500">
                      {index % 2 === 0 ? "Aujourd'hui à 13:30" : 'Hier à 18:45'}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-400">›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
