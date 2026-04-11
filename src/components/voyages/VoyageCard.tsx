import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import Animated, {
  FadeInUp,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LAYOUT } from '../../constants';
import { SPRING_CONFIG } from '../../constants/animations';
import { hapticLight } from '../../utils/haptics';
import type { Voyage } from '../../types';

interface VoyageCardProps {
  voyage: Voyage;
  onPress: () => void;
  index?: number;
}

function getAvailabilityStyle(count: number) {
  if (count <= 0) return { color: COLORS.error, bg: `${COLORS.error}26`, label: 'Complet' };
  if (count <= 2) return { color: COLORS.warning, bg: `${COLORS.warning}26`, label: `Plus que ${count} !` };
  return { color: COLORS.success, bg: `${COLORS.success}26`, label: `${count} places` };
}

export function VoyageCard({ voyage, onPress, index = 0 }: VoyageCardProps) {
  const formattedDate = voyage.date
    ? new Date(voyage.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null;

  const vehicleDetails = [voyage.marque, voyage.modele, voyage.couleur]
    .filter(Boolean)
    .join(' · ') || null;

  // Press feedback (imperative for onPressIn/Out)
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const availability = voyage.placesDisponibles != null
    ? getAvailabilityStyle(voyage.placesDisponibles)
    : null;

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 10) * 60).springify().damping(18).stiffness(180)}
      layout={LinearTransition.springify().damping(20).stiffness(200)}
      style={pressStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, SPRING_CONFIG.fast); hapticLight(); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING_CONFIG.bouncy); }}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`Voyage ${voyage.from} vers ${voyage.to}, ${voyage.price}, ${voyage.type}${voyage.placesDisponibles != null ? `, ${voyage.placesDisponibles} places` : ''}`}>
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {voyage.from} ➔ {voyage.to}
            </Text>
            <Text style={styles.subtitle}>
              {voyage.type} • {voyage.price}
            </Text>

            {/* Creator info */}
            {voyage.chauffeurName && (
              <View style={styles.creatorRow}>
                {voyage.chauffeurAvatar ? (
                  <Image source={{ uri: voyage.chauffeurAvatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={12} color={COLORS.gray[400]} />
                  </View>
                )}
                <Text style={styles.creatorName} numberOfLines={1}>{voyage.chauffeurName}</Text>
                {voyage.chauffeurRating != null && voyage.chauffeurRating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={COLORS.star} />
                    <Text style={styles.ratingText}>{voyage.chauffeurRating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Meta info */}
            <View style={styles.metaRow}>
              {availability && (
                <View style={[styles.availabilityBadge, { backgroundColor: availability.bg }]}>
                  <Ionicons name="people-outline" size={13} color={availability.color} />
                  <Text style={[styles.availabilityText, { color: availability.color }]}>
                    {availability.label}
                  </Text>
                </View>
              )}
              {formattedDate && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.gray[500]} />
                  <Text style={styles.metaText}>{formattedDate}</Text>
                </View>
              )}
              {vehicleDetails && (
                <View style={styles.metaItem}>
                  <Ionicons name="car-outline" size={14} color={COLORS.gray[500]} />
                  <Text style={styles.metaText}>{vehicleDetails}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.icon}>{voyage.icon}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: LAYOUT.borderRadius.large,
    borderCurve: 'continuous',
    padding: 20,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: { flex: 1 },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[800],
  },
  subtitle: { color: COLORS.gray[500], marginTop: 4 },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: { width: 24, height: 24, borderRadius: 12 },
  avatarPlaceholder: {
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorName: {
    fontSize: 13,
    color: COLORS.gray[700],
    marginLeft: 6,
    flexShrink: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginLeft: 2,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: { fontSize: 12, color: COLORS.gray[500] },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LAYOUT.borderRadius.full,
  },
  availabilityText: { fontSize: 12, fontWeight: '700' },
  icon: { fontSize: 32 },
});
