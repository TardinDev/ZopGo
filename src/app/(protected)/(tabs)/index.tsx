import {
  View,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { userInfo, generateActivities } from '../../../data';
import { COLORS } from '../../../constants';
import SearchBar from '../../../components/SearchBar';

import {
  HomeHeader,
  StatsCards,
  HomeActions,
  WeatherWidget,
  ActivityList,
} from '../../../components/home';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const INITIAL_POSITION = SCREEN_HEIGHT * 0.75; // Position de départ (25% de l'écran visible)
const MIN_TRANSLATE_Y = 100; // Position maximale (reste 100px en haut)

export default function HomeTab() {
  const activities = useMemo(() => generateActivities(10), []);
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
        // Glissement rapide vers le haut
        translateY.value = withSpring(MIN_TRANSLATE_Y, {
          damping: 50,
          stiffness: 400,
        });
      } else if (event.velocityY > 500) {
        // Glissement rapide vers le bas
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
      style={{ flex: 1 }}>
      <LinearGradient colors={COLORS.gradients.yellow} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

          {/* En-tête */}
          <HomeHeader userName={userInfo.name} />

          {/* Statistiques */}
          <StatsCards />

          {/* Actions Principales */}
          <HomeActions />

          {/* Section Déroulable */}
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
                  backgroundColor: 'rgba(33, 98, 254, 0.92)',
                  borderTopLeftRadius: 40,
                  borderTopRightRadius: 40,
                  paddingHorizontal: 24,
                  paddingTop: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -10 },
                  shadowOpacity: 0.1,
                  shadowRadius: 20,
                },
                animatedStyle,
              ]}>
              {/* Indicateur de glissement */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{ height: 6, width: 64, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' }} />
              </View>

              {/* Météo */}
              <WeatherWidget />

              {/* Barre de recherche */}
              <View style={{ marginBottom: 24 }}>
                <SearchBar />
              </View>

              {/* Activités */}
              <ActivityList activities={activities} />

            </Animated.View>
          </GestureDetector>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
