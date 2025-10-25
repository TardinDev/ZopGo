import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../../components/SearchBar';
import { useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const INITIAL_POSITION = SCREEN_HEIGHT * 0.75; // Position de départ (25% de l'écran visible)
const MIN_TRANSLATE_Y = 100; // Position maximale (reste 100px en haut)

export default function HomeTab() {
  const translateY = useSharedValue(INITIAL_POSITION);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newValue = startY.value + event.translationY;
      // Limiter le mouvement entre MIN_TRANSLATE_Y (haut) et INITIAL_POSITION (bas)
      if (newValue >= MIN_TRANSLATE_Y && newValue <= INITIAL_POSITION) {
        translateY.value = newValue;
      }
    })
    .onEnd((event) => {
      // Snap vers le haut ou vers le bas selon la vélocité
      if (event.velocityY < -500) {
        // Glissement rapide vers le haut - montre tout
        translateY.value = withSpring(MIN_TRANSLATE_Y, {
          damping: 50,
          stiffness: 400,
        });
      } else if (event.velocityY > 500) {
        // Glissement rapide vers le bas - position initiale
        translateY.value = withSpring(INITIAL_POSITION, {
          damping: 50,
          stiffness: 400,
        });
      } else {
        // Snap vers la position la plus proche
        const middle = (MIN_TRANSLATE_Y + INITIAL_POSITION) / 2;
        const snapTo = translateY.value < middle ? MIN_TRANSLATE_Y : INITIAL_POSITION;
        translateY.value = withSpring(snapTo, {
          damping: 50,
          stiffness: 400,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1">
      <LinearGradient colors={['#FFDD5C', '#FFE89A']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

          {/* === Header moderne === */}
          <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base text-gray-700">Bonjour,</Text>
                <Text className="text-3xl font-bold text-gray-900">Pierre 👋</Text>
              </View>

              <View className="flex-row items-center gap-3">
                <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-lg">
                  <Ionicons name="notifications-outline" size={24} color="#2162FE" />
                  <View className="absolute -top-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-red-500">
                    <Text className="text-xs font-bold text-white">3</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Logo ZopGo avec effet */}
            <View className="mt-4 mb-2">
              <Text className="text-6xl font-extrabold">
                <Text className="text-green-500">Zop</Text>
                <Text className="text-blue-600">Go</Text>
                <Text className="text-2xl">.</Text>
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Votre partenaire de mobilité</Text>
            </View>
          </View>

          {/* === Cartes statistiques === */}
          <View className="px-6 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
              <View className="mr-3 w-40 rounded-2xl bg-white/90 p-4 shadow-md">
                <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Ionicons name="cash-outline" size={20} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">25,000</Text>
                <Text className="text-xs text-gray-600">FCFA aujourd'hui</Text>
              </View>

              <View className="mr-3 w-40 rounded-2xl bg-white/90 p-4 shadow-md">
                <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Ionicons name="car-outline" size={20} color="#3B82F6" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">12</Text>
                <Text className="text-xs text-gray-600">Courses du jour</Text>
              </View>

              <View className="mr-3 w-40 rounded-2xl bg-white/90 p-4 shadow-md">
                <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                  <Ionicons name="star-outline" size={20} color="#F59E0B" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">4.8</Text>
                <Text className="text-xs text-gray-600">Note moyenne</Text>
              </View>
            </ScrollView>
          </View>

          {/* === Actions principales avec gradients === */}
          <View className="px-6 gap-4 mb-6">
            <TouchableOpacity
              onPress={() => router.push('/(protected)/(tabs)/voyages')}
              activeOpacity={0.9}
              className="overflow-hidden rounded-3xl shadow-xl">
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 24, paddingHorizontal: 24 }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-white">Démarrer</Text>
                    <Text className="text-2xl font-bold text-white">un voyage</Text>
                    <Text className="text-sm text-white/80 mt-1">Transporter des passagers</Text>
                  </View>
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
                    <Text className="text-4xl">🚕</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/delivery/Delivery')}
              activeOpacity={0.9}
              className="overflow-hidden rounded-3xl shadow-xl">
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 24, paddingHorizontal: 24 }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-white">Livraison</Text>
                    <Text className="text-2xl font-bold text-white">express</Text>
                    <Text className="text-sm text-white/80 mt-1">Livrer des colis rapidement</Text>
                  </View>
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
                    <Text className="text-4xl">📦</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* === Section bleue améliorée et déroulable === */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: SCREEN_HEIGHT,
                  zIndex: 10,
                  elevation: 10,
                },
                animatedStyle,
              ]}
              className="rounded-t-[40px] bg-[#2162FE] px-6 pt-3 shadow-2xl">
              {/* Indicateur de glissement */}
              <View className="items-center py-3 mb-2">
                <View className="h-1.5 w-16 rounded-full bg-white/50" />
              </View>

              {/* En-tête de section avec météo */}
            <View className="mb-5 flex-row items-center justify-between rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <View className="flex-row items-center">
                <Text className="text-3xl mr-2">☀️</Text>
                <View>
                  <Text className="text-xl font-bold text-white">32°C</Text>
                  <Text className="text-xs text-white/80">Libreville, Gabon</Text>
                </View>
              </View>
              <View className="rounded-full bg-white/20 px-3 py-1">
                <Text className="text-xs font-semibold text-white">Ensoleillé</Text>
              </View>
            </View>

            {/* Barre de recherche améliorée */}
            <View className="mb-6">
              <SearchBar />
            </View>

            {/* === Activités avec design amélioré === */}
            <View className="flex-1">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-xl font-bold text-white">Activités récentes</Text>
                <TouchableOpacity className="rounded-full bg-white/20 px-3 py-1">
                  <Text className="text-xs font-semibold text-white">Voir tout</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                className="-mb-10"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}>
                {[...Array(10)].map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    className="mb-3 overflow-hidden rounded-2xl bg-white shadow-lg">
                    <View className="flex-row items-center p-4">
                      <View className={`mr-4 h-12 w-12 items-center justify-center rounded-xl ${
                        index % 2 === 0 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}>
                        <Text className="text-2xl">
                          {index % 2 === 0 ? '🚕' : '📦'}
                        </Text>
                      </View>

                      <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900">
                          {index % 2 === 0 ? 'Course vers Akanda' : 'Livraison Glass'}
                        </Text>
                        <Text className="mt-1 text-xs text-gray-500">
                          {index % 2 === 0 ? "Aujourd'hui à 13:30" : 'Hier à 18:45'}
                        </Text>
                      </View>

                      <View className="items-end">
                        <Text className="text-base font-bold text-green-600">
                          {index % 2 === 0 ? '5,000' : '3,500'} F
                        </Text>
                        <View className={`mt-1 rounded-full px-2 py-0.5 ${
                          index % 3 === 0 ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Text className={`text-xs font-semibold ${
                            index % 3 === 0 ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            {index % 3 === 0 ? 'Terminée' : 'En cours'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            </Animated.View>
          </GestureDetector>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
