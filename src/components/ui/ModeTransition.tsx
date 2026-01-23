import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../../types';

const { width, height } = Dimensions.get('window');

interface ModeTransitionProps {
  visible: boolean;
  role: UserRole;
  onComplete: () => void;
  quick?: boolean; // Animation plus rapide pour le changement de rôle
}

export function ModeTransition({ visible, role, onComplete, quick = false }: ModeTransitionProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const rotation = useSharedValue(0);
  const checkScale = useSharedValue(0);

  // Durées selon le mode
  const spinDuration = quick ? 600 : 1000;
  const spinCount = quick ? 1 : 2;
  const checkDelay = quick ? 600 : 2000;
  const dismissDelay = quick ? 1200 : 2800;

  const isClient = role === 'client';
  const icon = isClient ? 'person' : 'car-sport';
  const title = isClient ? 'Mode Client' : 'Mode Chauffeur';
  const subtitle = isClient
    ? 'Commandez vos trajets et livraisons'
    : 'Acceptez des courses et gagnez de l\'argent';
  const gradientColors: readonly [string, string] = isClient
    ? ['#4F46E5', '#7C3AED'] as const // Indigo to purple for client
    : ['#F59E0B', '#EF4444'] as const; // Amber to red for driver

  useEffect(() => {
    if (visible) {
      // Fade in and scale up
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) });

      // Spin the icon
      rotation.value = withRepeat(
        withTiming(360, { duration: spinDuration, easing: Easing.linear }),
        spinCount,
        false
      );

      // Show checkmark after spinning
      checkScale.value = withDelay(
        checkDelay,
        withSequence(
          withTiming(1.2, { duration: 200, easing: Easing.out(Easing.back(2)) }),
          withTiming(1, { duration: 150 })
        )
      );

      // Auto dismiss after animation
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(onComplete)();
        });
        scale.value = withTiming(0.8, { duration: 300 });
      }, dismissDelay);

      return () => clearTimeout(timer);
    } else {
      opacity.value = 0;
      scale.value = 0.8;
      rotation.value = 0;
      checkScale.value = 0;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

      <Animated.View style={[styles.container, containerStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          {/* Icon container */}
          <View style={styles.iconContainer}>
            <Animated.View style={iconStyle}>
              <View style={styles.iconCircle}>
                <Ionicons name={icon} size={48} color="white" />
              </View>
            </Animated.View>

            {/* Checkmark overlay */}
            <Animated.View style={[styles.checkContainer, checkStyle]}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={32} color="#10B981" />
              </View>
            </Animated.View>
          </View>

          {/* Text content */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Decorative dots */}
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: width * 0.85,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  gradient: {
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  checkContainer: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
