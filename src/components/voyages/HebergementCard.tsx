import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import type { Hebergement } from '../../types';

interface HebergementCardProps {
  hebergement: Hebergement;
  onPress: () => void;
}

export function HebergementCard({ hebergement, onPress }: HebergementCardProps) {
  const ratingDisplay = hebergement.rating > 0 ? hebergement.rating.toFixed(1) : 'N/A';

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.8}>
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
                  <Ionicons name="person" size={12} color="#9CA3AF" />
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
        <Text style={styles.icon}>{hebergement.icon}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorName: {
    fontSize: 13,
    color: '#374151',
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
  icon: {
    fontSize: 32,
    marginLeft: 16,
  },
});
