import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

type OnboardingStep = {
  id: number;
  gate: string;
  title: string;
  titleLine2?: string;
  subtitle: string;
  cta: string;
  image: ImageSourcePropType;
};

const onboardingData: OnboardingStep[] = [
  {
    id: 1,
    gate: 'GATE A1',
    title: 'BIENVENUE',
    titleLine2: 'À BORD',
    subtitle: 'Transport · Livraison · Hébergement, partout au Gabon.',
    cta: 'Continuer',
    image: require('../../assets/auth/nairobi_city.jpg'),
  },
  {
    id: 2,
    gate: 'GATE A2',
    title: 'TRANSPORT',
    titleLine2: 'RAPIDE',
    subtitle: 'Voitures, camionnettes, bus — conducteurs vérifiés, à tout moment.',
    cta: 'Continuer',
    image: require('../../assets/auth/city_traffic.jpg'),
  },
  {
    id: 3,
    gate: 'GATE A3',
    title: 'LIVRAISON',
    titleLine2: 'EXPRESS',
    subtitle: 'Envoyez vos colis dans tout le Gabon, en quelques minutes.',
    cta: 'Embarquer',
    image: require('../../assets/auth/gabon_road.jpg'),
  },
];

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(0);
  const currentData = onboardingData[currentStep];
  const isLastStep = currentStep === onboardingData.length - 1;

  // Subtle pulse on the CTA so it draws the eye without being annoying.
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 900 }),
        withTiming(1, { duration: 900 })
      ),
      -1,
      false
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/auth');
    }
  };

  const handleSkip = () => {
    router.replace('/auth');
  };

  return (
    <View style={styles.container}>
      {/* Background image (re-mounted per step so the entering animation
          gives a subtle crossfade between gates) */}
      <Animated.View
        key={`bg-${currentStep}`}
        entering={FadeInUp.duration(450)}
        style={[StyleSheet.absoluteFillObject, { width, height }]}
        pointerEvents="none">
        <Image
          source={currentData.image}
          style={[styles.backgroundImage, { width, height }]}
        />
      </Animated.View>

      {/* Gradient overlay (lighter on top, darker on bottom for legibility) */}
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.40)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.flex1}>
        {/* Top row: step indicator + skip */}
        <View style={styles.topRow}>
          <View style={styles.dotsRow}>
            {onboardingData.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
          {!isLastStep && (
            <TouchableOpacity
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Passer l'introduction"
              style={styles.skipButton}>
              <Text style={styles.skipText}>Passer</Text>
              <Ionicons name="chevron-forward" size={14} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Spacer pushes content to lower-middle */}
        <View style={styles.flex1} />

        {/* Content — gate + title + subtitle */}
        <Animated.View
          key={`content-${currentStep}`}
          entering={FadeInDown.duration(500).springify().damping(18)}
          style={styles.contentSection}>
          <View style={styles.gatePill}>
            <View style={styles.gateDot} />
            <Text style={styles.gateText}>{currentData.gate}</Text>
          </View>
          <Text selectable style={styles.title}>
            {currentData.title}
          </Text>
          {currentData.titleLine2 ? (
            <Text selectable style={styles.title}>
              {currentData.titleLine2}
            </Text>
          ) : null}
          <Text style={styles.subtitle}>{currentData.subtitle}</Text>
        </Animated.View>

        {/* Bottom: perforation + CTA */}
        <View style={styles.bottomSection}>
          {/* Dashed perforation to suggest the boarding-pass coupon edge */}
          <View style={styles.perforationRow}>
            {Array.from({ length: 22 }).map((_, i) => (
              <View key={i} style={styles.perfDash} />
            ))}
          </View>

          <Animated.View style={pulseStyle}>
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={
                isLastStep ? "Commencer l'expérience ZopGo" : 'Étape suivante'
              }
              style={styles.nextButton}>
              <Text style={styles.nextText}>{currentData.cta.toUpperCase()}</Text>
              <View style={styles.nextIconCircle}>
                <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  flex1: { flex: 1 },
  backgroundImage: {
    position: 'absolute',
    resizeMode: 'cover',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 4,
    borderRadius: 2,
    marginRight: 6,
  },
  dotActive: {
    width: 28,
    backgroundColor: 'white',
  },
  dotInactive: {
    width: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderCurve: 'continuous',
    gap: 2,
  },
  skipText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
    marginRight: 2,
  },
  contentSection: {
    paddingHorizontal: 28,
    marginBottom: 36,
  },
  gatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderCurve: 'continuous',
    marginBottom: 18,
  },
  gateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 6,
  },
  gateText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
    lineHeight: 48,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: 36,
  },
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  perfDash: {
    flex: 1,
    height: 1.5,
    marginRight: 4,
    borderRadius: 0.75,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: COLORS.primary,
    boxShadow: '0 8px 22px rgba(33, 98, 254, 0.40)',
  },
  nextText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'white',
    marginRight: 14,
    letterSpacing: 2,
  },
  nextIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
