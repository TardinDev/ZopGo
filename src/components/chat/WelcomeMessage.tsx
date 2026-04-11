import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserRole } from '../../types';
import { hapticLight } from '../../utils/haptics';
import { AIAvatar } from './AIAvatar';

interface WelcomeMessageProps {
  userRole: UserRole;
  userName: string;
  onSuggestionPress: (text: string) => void;
}

interface Suggestion {
  text: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  gradient: [string, string];
}

const SUGGESTIONS: Record<UserRole, Suggestion[]> = {
  client: [
    {
      text: 'Comment réserver un voyage ?',
      icon: 'car-outline',
      gradient: ['#EEF4FF', '#DBEAFE'],
    },
    {
      text: 'Comment suivre ma livraison ?',
      icon: 'package-variant',
      gradient: ['#FFF7ED', '#FED7AA'],
    },
    {
      text: 'Quels hébergements sont disponibles ?',
      icon: 'bed-outline',
      gradient: ['#F5F3FF', '#DDD6FE'],
    },
  ],
  chauffeur: [
    {
      text: 'Comment créer un nouveau trajet ?',
      icon: 'map-marker-path',
      gradient: ['#EEF4FF', '#DBEAFE'],
    },
    {
      text: 'Comment augmenter ma note ?',
      icon: 'star-outline',
      gradient: ['#FFFBEB', '#FDE68A'],
    },
    {
      text: 'Comment voir mes revenus ?',
      icon: 'chart-line',
      gradient: ['#ECFDF5', '#A7F3D0'],
    },
  ],
  hebergeur: [
    {
      text: 'Comment ajouter une annonce ?',
      icon: 'plus-circle-outline',
      gradient: ['#F5F3FF', '#DDD6FE'],
    },
    {
      text: 'Comment fixer mes tarifs ?',
      icon: 'cash-multiple',
      gradient: ['#ECFDF5', '#A7F3D0'],
    },
    {
      text: 'Comment gérer mes réservations ?',
      icon: 'calendar-check-outline',
      gradient: ['#EEF4FF', '#DBEAFE'],
    },
  ],
};

const WELCOME_TEXT: Record<UserRole, string> = {
  client:
    'Je peux vous aider à réserver des voyages, suivre vos livraisons, trouver des hébergements et bien plus.',
  chauffeur:
    'Je peux vous aider à gérer vos trajets, optimiser vos revenus et améliorer votre profil.',
  hebergeur:
    'Je peux vous aider à gérer vos annonces, optimiser vos tarifs et améliorer vos avis.',
};

const ROLE_BADGE: Record<UserRole, { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  client: { label: 'Mode client', icon: 'account-outline' },
  chauffeur: { label: 'Mode chauffeur', icon: 'steering' },
  hebergeur: { label: 'Mode hébergeur', icon: 'bed-outline' },
};

function PulsingRing({ delay, size }: { delay: number; size: number }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, {
        duration: 2400,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, {
        duration: 2400,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );
  }, [delay, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    />
  );
}

export function WelcomeMessage({ userRole, userName, onSuggestionPress }: WelcomeMessageProps) {
  const firstName = userName.split(' ')[0];
  const suggestions = SUGGESTIONS[userRole];
  const welcomeText = WELCOME_TEXT[userRole];
  const badge = ROLE_BADGE[userRole];

  const handlePress = (suggestion: string) => {
    hapticLight();
    onSuggestionPress(suggestion);
  };

  return (
    <View style={styles.container}>
      {/* Hero avec anneaux pulsants */}
      <Animated.View
        entering={FadeInDown.duration(500).springify().damping(14)}
        style={styles.heroWrapper}>
        <PulsingRing delay={0} size={120} />
        <PulsingRing delay={800} size={120} />
        <AIAvatar size={92} showStatus={false} />
      </Animated.View>

      {/* Sparkle label */}
      <Animated.View
        entering={FadeInDown.delay(60).duration(400)}
        style={styles.sparkleRow}>
        <MaterialCommunityIcons name="creation" size={12} color="#4facfe" />
        <Text style={styles.sparkleText}>Propulsé par Gemini 2.5 Flash</Text>
        <MaterialCommunityIcons name="creation" size={12} color="#4facfe" />
      </Animated.View>

      {/* Badge de rôle */}
      <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.badge}>
        <MaterialCommunityIcons name={badge.icon} size={12} color="#2162FE" />
        <Text style={styles.badgeText}>{badge.label}</Text>
      </Animated.View>

      {/* Greeting */}
      <Animated.Text
        entering={FadeInDown.delay(180).duration(400)}
        style={styles.greeting}>
        Bonjour {firstName} ! 👋
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(240).duration(400)}
        style={styles.subtitle}>
        {welcomeText}
      </Animated.Text>

      {/* Suggestions */}
      <View style={styles.suggestionsContainer}>
        <Animated.Text
          entering={FadeInDown.delay(320).duration(400)}
          style={styles.suggestionsTitle}>
          Questions rapides
        </Animated.Text>

        {suggestions.map((suggestion, i) => (
          <Animated.View
            key={suggestion.text}
            entering={FadeInUp.delay(380 + i * 90)
              .duration(400)
              .springify()
              .damping(18)}>
            <TouchableOpacity
              onPress={() => handlePress(suggestion.text)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Suggestion : ${suggestion.text}`}>
              <LinearGradient
                colors={suggestion.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chip}>
                <View style={styles.chipIconWrap}>
                  <MaterialCommunityIcons
                    name={suggestion.icon}
                    size={18}
                    color="#2162FE"
                  />
                </View>
                <Text style={styles.chipText}>{suggestion.text}</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#2162FE" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
  },
  heroWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(79, 172, 254, 0.55)',
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sparkleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4facfe',
    letterSpacing: 0.3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(33, 98, 254, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2162FE',
    letterSpacing: 0.3,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
  },
  chipIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
});
