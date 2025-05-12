/* eslint-disable */

import { View, Text, TouchableOpacity, Image, StatusBar, TextInput, ScrollView, Animated, KeyboardAvoidingView, Platform  } from 'react-native';
// import { useAuth } from '~/context/AuthContext';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
// import SearchBar from '~/components/SearchBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import NavigationBar from '../navigation/NavigationBar';
import SearchBar from '~/src/components/SearchBar';


export default function Home() {
  // const { user, loading } = useAuth();
  const inputWidth = useRef(new Animated.Value(60)).current;
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(inputWidth, {
      toValue: 300,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(inputWidth, {
      toValue: 60,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // if (loading) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
  >
      <SafeAreaView style={{ flex: 1 }} className="bg-[#FFDD5C]">
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* === Header === */}
      <View className="px-6 flex-row justify-between items-center">
        <View className='flex-row items-center gap-3'>
        <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center shadow">
          <Text className="text-xl">🔔</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-3xl font-bold">Bienvenue.</Text>
        </View>
        </View>

        <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center shadow">
          <Text className="text-xl">👤</Text>
        </TouchableOpacity>
      </View>

      {/* === Welcome + météo === */}
      <View className="px-6 mt-6">
        <Text className="text-5xl font-bold text-green-500">ZopGo.</Text>
      </View>

      {/* === Actions principales en gros boutons === */}
      <View className="px-6 mt-8 space-y-4 flex flex-col gap-5">
        <TouchableOpacity
          onPress={() => router.push('../(tab)/Voyage')}
          className="bg-[#F7F7F7] rounded-3xl py-6 px-6 flex-row items-center justify-center shadow-md"
          activeOpacity={0.9}
        >
          <Text className="text-5xl mr-3">🚕</Text>
          <Text className="text-2xl text-blue-600 font-bold">Commencer un voyage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('../(tab)/Delivery')}
          className="bg-[#F7F7F7] rounded-3xl py-6 px-6 flex-row items-center justify-center shadow-md"
          activeOpacity={0.9}
        >
          <Text className="text-5xl mr-3">📦</Text>
          <Text className="text-2xl text-yellow-600 font-bold">Livrer un colis</Text>
        </TouchableOpacity>
      </View>

      {/* === Section bleue avec recherche + activité === */}
      <View className="flex-1 bg-[#2162FE] rounded-t-3xl px-4 py-2 mt-6 min-h-[65%]">
        <Text className="text-white mt-2 text-base">☀️ 37°C – Ensoleillé • Saturday, Jul.03 </Text>
       
       <View className='self-start pt-5'>
          <SearchBar/>
       </View>
      

        {/* === Activités scrollables === */}
        <View className="mt-6 flex-1">
          <Text className="text-white font-bold text-lg mb-4">🕒 Dernières activités</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[...Array(10)].map((_, index) => (
              <View key={index} className="bg-white rounded-xl p-4 mb-3 shadow-md">
                <Text className="text-gray-700 font-medium">
                  {index % 2 === 0 ? '🚕 Trajet client' : '📦 Livraison client'}
                </Text>
                <Text className="text-gray-400 text-sm mt-1">
                  {index % 2 === 0 ? 'Aujourd’hui à 13:30' : 'Hier à 18:45'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
  
    </SafeAreaView>
</KeyboardAvoidingView>

  );
}



