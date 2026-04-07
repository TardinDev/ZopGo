import React, { useEffect } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LAYOUT } from '../../constants';
import { SPRING_CONFIG, TIMING_CONFIG } from '../../constants/animations';
import { hapticLight } from '../../utils/haptics';
import type { Hebergement } from '../../types';

interface HebergementCardProps {
  hebergement: Hebergement;
  onPress: () => void;
  index?: number;
}

export function HebergementCard({ hebergement, onPress, index = 0 }: HebergementCardProps) {
  const ratingDisplay = hebergement.rating > 0 ? hebergement.rating.toFixed(1) : 'N/A';

  // Press animation
  const scale = useSharedValue(1);

  // Stagger entrance animation
  const translateY = useSharedValue(20);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    const delay = Math.min(index, 10) * 80;
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIG.default));
    cardOpacity.value = withDelay(delay, withTiming(1, TIMING_CONFIG.normal));
  }, [index, translateY, cardOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, SPRING_CONFIG.fast); hapticLight(); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING_CONFIG.bouncy); }}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`${hebergement.name}, ${hebergement.location}, ${hebergement.price}${hebergement.capacite != null ? `, ${hebergement.capacite} personnes` : ''}, note ${ratingDisplay}`}>
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{hebergement.name}</Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.gray[500]} />
              <Text style={styles.location}>{hebergement.location}</Text>
            </View>

            {/* Creator info */}
            {hebergement.hebergeurName && (
              <View style={styles.creatorRow}>
                {hebergement.hebergeurAvatar ? (
                  <Image source={{ uri: hebergement.hebergeurAvatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={12} color={COLORS.gray[400]} />
                  </View>
                )}
                <Text style={styles.creatorName} numberOfLines={1}>{hebergement.hebergeurName}</Text>
              </View>
            )}

            <View style={styles.bottomRow}>
              <Text style={styles.price}>{hebergement.price}</Text>
              {hebergement.capacite != null && (
                <View style={styles.capacityBadge}>
                  <Ionicons name="people-outline" size={14} color={COLORS.gray[500]} />
                  <Text style={styles.capacityText}>{hebergement.capacite}</Text>
                </View>
              )}
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={COLORS.star} />
                <Text style={styles.rating}>{ratingDisplay}</Text>
              </View>
            </View>
          </View>
          {hebergement.images && hebergement.images.length > 0 ? (
            <Image source={{ uri: hebergement.images[0] }} style={styles.hebergementImage} />
          ) : (
            <Text style={styles.icon}>{hebergement.icon}</Text>
          )}
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
    padding: 20,
    ...LAYOUT.shadows.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[800],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    color: COLORS.gray[500],
    marginLeft: 4,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
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
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: {
    color: COLORS.gray[600],
    fontWeight: '600',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: COLORS.gray[600],
    marginLeft: 4,
    fontWeight: '600',
  },
  hebergementImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginLeft: 16,
  },
  icon: {
    fontSize: 32,
    marginLeft: 16,
  },
});
