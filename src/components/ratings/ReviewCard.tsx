import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Review } from '../../types';
import { StarRating } from './StarRating';
import { COLORS } from '../../constants';

interface ReviewCardProps {
  review: Review;
}

const tripTypeLabels: Record<Review['tripType'], { label: string; color: string; icon: string }> = {
  voyage: { label: 'Voyage', color: COLORS.primary, icon: '🚕' },
  livraison: { label: 'Livraison', color: COLORS.warning, icon: '📦' },
  location: { label: 'Location', color: COLORS.info, icon: '🔑' },
};

export function ReviewCard({ review }: ReviewCardProps) {
  const tripInfo = tripTypeLabels[review.tripType];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.card}>
      {/* Header avec avatar et infos */}
      <View style={styles.header}>
        <Image source={{ uri: review.authorAvatar }} style={styles.avatar} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{review.authorName}</Text>
          <Text style={styles.date}>{formatDate(review.date)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: tripInfo.color + '20' }]}>
          <Text style={styles.badgeIcon}>{tripInfo.icon}</Text>
          <Text style={[styles.badgeText, { color: tripInfo.color }]}>{tripInfo.label}</Text>
        </View>
      </View>

      {/* Étoiles */}
      <View style={styles.ratingContainer}>
        <StarRating rating={review.rating} size={18} />
      </View>

      {/* Commentaire */}
      {review.comment && <Text style={styles.comment}>{review.comment}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ratingContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  comment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});
