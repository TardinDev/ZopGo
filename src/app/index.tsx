import { useEffect, useState, useRef } from 'react';
import { View, Image, Text, Animated, Dimensions, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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

    // Barre de progression
    const runProgress = async () => {
      for (let i = 0; i <= 100; i += 10) {
        setLoadingProgress(i);
        Animated.timing(progressAnim, {
          toValue: i / 100,
          duration: 200,
          useNativeDriver: false,
        }).start();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAnimationDone(true);
    };

    runProgress();
  }, [fadeAnim, progressAnim, scaleAnim]);

  // Naviguer une fois l'animation terminée ET Clerk chargé
  useEffect(() => {
    if (!animationDone || !isLoaded) return;

    setIsLoading(false);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      if (isSignedIn) {
        router.replace('/(protected)/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    });
  }, [animationDone, isLoaded, isSignedIn, fadeAnim]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar hidden />

      {/* Image de fond */}
      <Image
        source={require('../../assets/splashScreen.jpg')}
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
          <View className="mb-16 items-center">
            <View className="items-center rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur">
              <Text
                className="mb-2 text-7xl font-black text-white"
                style={{
                  textShadowColor: 'rgba(0, 0, 0, 0.5)',
                  textShadowOffset: { width: 2, height: 2 },
                  textShadowRadius: 8,
                }}>
                ZopGo
              </Text>
              <Text
                className="text-xl font-medium tracking-wide text-white/90"
                style={{
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
            <View className="w-full max-w-xs items-center">
              <View className="w-full rounded-2xl bg-white/20 px-6 py-4 backdrop-blur">
                <Text className="mb-3 text-center text-lg font-medium text-white/80">
                  Chargement...
                </Text>

                {/* Barre de progression */}
                <View className="mb-2 h-2 rounded-full bg-white/20">
                  <Animated.View
                    className="h-2 rounded-full bg-white"
                    style={{
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    }}
                  />
                </View>

                <Text className="text-center text-sm text-white/60">{loadingProgress}%</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Badge en bas */}
        <View className="absolute bottom-8 left-0 right-0 items-center">
          <View className="rounded-full bg-white/10 px-4 py-2 backdrop-blur">
            <Text className="text-sm font-medium text-white/70">Votre solution de mobilité</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
