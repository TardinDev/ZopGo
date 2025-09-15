import { useEffect, useState } from 'react';
import { View, Image, Text } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler une vérification d'authentification
    const checkAuth = async () => {
      try {
        // Ici on simule une vérification d'auth
        // En vraie app, on vérifierait un token, AsyncStorage, etc.
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Pour cette démo, on considère l'utilisateur comme connecté
        const isAuthenticated = true; // Simulé

        if (isAuthenticated) {
          router.replace('/(protected)/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/onboarding');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#4FA5CF', '#FCA91A']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        className="flex-1">
        <BlurView intensity={20} tint="light" className="absolute inset-0 z-10" />

        <View className="flex-1 items-center justify-center z-20">
          <Image
            source={require('../../assets/zopgopro.jpeg')}
            className="h-48 w-48 rounded-2xl"
            resizeMode="contain"
          />

          <Text className="mt-8 text-6xl font-bold text-white">ZopGo</Text>
          <Text className="mt-2 text-xl text-white/80">Transport & Livraison</Text>

          {isLoading && (
            <View className="mt-8">
              <Text className="text-white/60">Chargement...</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
