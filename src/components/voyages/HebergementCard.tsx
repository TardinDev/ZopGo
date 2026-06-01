import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, TouchableOpacity } from 'react-native';
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
import { useFavoritesStore } from '../../stores/favoritesStore';
import type { Hebergement } from '../../types';

interface HebergementCardProps {
  hebergement: Hebergement;
  onPress: () => void;
  index?: number;
}

export function HebergementCard({ hebergement, onPress, index = 0 }: HebergementCardProps) {
  const ratingDisplay = hebergement.rating > 0 ? hebergement.rating.toFixed(1) : 'N/A';
  const isFavorite = useFavoritesStore((s) => s.favoriteIds.includes(hebergement.supabaseId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  // Press feedback
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
        accessibilityLabel={`${hebergement.name}, ${hebergement.location}, ${hebergement.price}${hebergement.capacite != null ? `, ${hebergement.capacite} personnes` : ''}, note ${ratingDisplay}`}>
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            toggleFavorite(hebergement.supabaseId);
          }}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.favoriteBtn}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? '#EF4444' : COLORS.gray[500]}
          />
        </TouchableOpacity>
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{hebergement.name}</Text>

            {hebergement.type ? (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{hebergement.type}</Text>
              </View>
            ) : null}

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.gray[500]} />
              <Text style={styles.location}>{hebergement.location}</Text>
            </View>

            {/* Host info — rating here makes clear it's the HOST's rating,
                not a per-listing score. */}
            {hebergement.hebergeurName && (
              <View style={styles.creatorRow}>
                <View style={styles.creatorLeft}>
                  {hebergement.hebergeurAvatar ? (
                    <Image source={{ uri: hebergement.hebergeurAvatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={12} color={COLORS.gray[400]} />
                    </View>
                  )}
                  <Text style={styles.creatorName} numberOfLines={1}>{hebergement.hebergeurName}</Text>
                </View>
                {hebergement.rating > 0 && (
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color={COLORS.star} />
                    <Text style={styles.rating}>{ratingDisplay}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.bottomRow}>
              <Text style={styles.price}>{hebergement.price}</Text>
              {hebergement.capacite != null && (
                <View style={styles.capacityBadge}>
                  <Ionicons name="people-outline" size={14} color={COLORS.gray[500]} />
                  <Text style={styles.capacityText}>{hebergement.capacite} pers.</Text>
                </View>
              )}
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
    borderCurve: 'continuous',
    padding: 20,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
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
  typeBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  creatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
