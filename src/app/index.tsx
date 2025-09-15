import { useEffect, useState } from 'react';
import { View, Image, Text, Animated, Dimensions, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Simuler une vérification d'authentification avec barre de progression
    const checkAuth = async () => {
      try {
        // Simulation du chargement avec progression
        for (let i = 0; i <= 100; i += 10) {
          setLoadingProgress(i);
          Animated.timing(progressAnim, {
            toValue: i / 100,
            duration: 200,
            useNativeDriver: false,
          }).start();
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Pause finale
        await new Promise(resolve => setTimeout(resolve, 500));

        // Pour cette démo, on considère l'utilisateur comme connecté
        const isAuthenticated = true; // Simulé

        // Animation de sortie avant navigation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          if (isAuthenticated) {
            router.replace('/(protected)/(tabs)');
          } else {
            router.replace('/onboarding');
          }
        });
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
    <View className="flex-1 bg-white">
      <StatusBar hidden />

      {/* Image de fond */}
      <Image
        source={require('../../assets/zopgopro.jpeg')}
        style={{
          position: 'absolute',
          width: width,
          height: height,
          top: 0,
          left: 0,
        }}
        resizeMode="cover"
      />

      {/* Overlay avec dégradé subtil */}
      <View
        style={{
          position: 'absolute',
          width: width,
          height: height,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}
      />

      <SafeAreaView className="flex-1">
        <Animated.View
          className="flex-1 items-center justify-center px-8"
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}>

          {/* Logo et texte superposés */}
          <View className="items-center mb-16">
            <View className="bg-white/10 backdrop-blur rounded-3xl p-8 items-center shadow-2xl">
              <Text className="text-7xl font-black text-white mb-2" style={{
                textShadowColor: 'rgba(0, 0, 0, 0.5)',
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 8,
              }}>
                ZopGo
              </Text>
              <Text className="text-xl text-white/90 font-medium tracking-wide" style={{
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 4,
              }}>
                Transport & Livraison
              </Text>
            </View>
          </View>

          {/* Indicateur de chargement avec barre de progression */}
          {isLoading && (
            <View className="items-center w-full max-w-xs">
              <View className="bg-white/20 backdrop-blur rounded-2xl px-6 py-4 w-full">
                <Text className="text-white/80 text-lg font-medium text-center mb-3">
                  Chargement...
                </Text>

                {/* Barre de progression */}
                <View className="bg-white/20 rounded-full h-2 mb-2">
                  <Animated.View
                    className="bg-white rounded-full h-2"
                    style={{
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    }}
                  />
                </View>

                <Text className="text-white/60 text-sm text-center">
                  {loadingProgress}%
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Badge en bas */}
        <View className="absolute bottom-8 left-0 right-0 items-center">
          <View className="bg-white/10 backdrop-blur rounded-full px-4 py-2">
            <Text className="text-white/70 text-sm font-medium">
              Votre solution de mobilité
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
