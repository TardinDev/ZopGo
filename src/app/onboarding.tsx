import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Bienvenue sur ZopGo',
    subtitle: 'Votre solution de transport et livraison',
    description: 'Commandez facilement vos trajets et livraisons en quelques clics',
    image: require('../../assets/auth/luxury_cars.jpg'),
    overlay: ['rgba(0, 0, 0, 0.25)', 'rgba(0, 0, 0, 0.65)'] as [string, string],
  },
  {
    id: 2,
    title: 'Transport Rapide',
    subtitle: 'Voyagez en toute sécurité',
    description: 'Des conducteurs vérifiés et des véhicules de qualité à votre service',
    image: require('../../assets/auth/nairobi_city.jpg'),
    overlay: ['rgba(0, 0, 0, 0.25)', 'rgba(0, 0, 0, 0.65)'] as [string, string],
  },
  {
    id: 3,
    title: 'Livraison Express',
    subtitle: 'Envoyez vos colis partout',
    description: 'Service de livraison rapide et sécurisé dans tout le Gabon',
    image: require('../../assets/auth/libreville_street.jpg'),
    overlay: ['rgba(0, 0, 0, 0.25)', 'rgba(0, 0, 0, 0.65)'] as [string, string],
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const currentData = onboardingData[currentStep];
  const isLastStep = currentStep === onboardingData.length - 1;

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
      {/* Background image */}
      <Image
        source={currentData.image as ImageSourcePropType}
        style={styles.backgroundImage}
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.15)', currentData.overlay[0], currentData.overlay[1]]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.overlay}
      />

      <SafeAreaView style={styles.flex1}>
        {/* Top Row: Skip button */}
        <View style={styles.topRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{currentStep + 1}/{onboardingData.length}</Text>
          </View>
          {!isLastStep && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Passer</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Spacer */}
        <View style={styles.flex1} />

        {/* Content — bottom half */}
        <View style={styles.contentSection}>
          {/* Text */}
          <Text style={styles.title}>{currentData.title}</Text>
          <Text style={styles.subtitle}>{currentData.subtitle}</Text>
          <Text style={styles.description}>{currentData.description}</Text>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Pagination Dots */}
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

          {/* Main Button */}
          <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
            <LinearGradient
              colors={isLastStep ? [COLORS.primary, '#1E40AF'] : ['#FFFFFF', '#F3F4F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButton}
            >
              <Text style={[styles.nextText, isLastStep && styles.nextTextWhite]}>
                {isLastStep ? 'Commencer' : 'Suivant'}
              </Text>
              <View style={[styles.nextIconCircle, isLastStep && styles.nextIconCircleWhite]}>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={isLastStep ? COLORS.primary : COLORS.white}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
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
  flex1: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  stepBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stepBadgeText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '700',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  skipText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  contentSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 32,
    backgroundColor: COLORS.white,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  nextText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 12,
    letterSpacing: 0.3,
  },
  nextTextWhite: {
    color: COLORS.white,
  },
  nextIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextIconCircleWhite: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
