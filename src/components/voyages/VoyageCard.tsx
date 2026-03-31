import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Voyage } from '../../types';

interface VoyageCardProps {
  voyage: Voyage;
  onPress: () => void;
}

export function VoyageCard({ voyage, onPress }: VoyageCardProps) {
  const formattedDate = voyage.date
    ? new Date(voyage.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null;

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.8}>
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
                  <Ionicons name="person" size={12} color="#9CA3AF" />
                </View>
              )}
              <Text style={styles.creatorName} numberOfLines={1}>{voyage.chauffeurName}</Text>
              {voyage.chauffeurRating != null && voyage.chauffeurRating > 0 && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#FFA500" />
                  <Text style={styles.ratingText}>{voyage.chauffeurRating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          )}

          {/* Meta info */}
          <View style={styles.metaRow}>
            {voyage.placesDisponibles != null && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color="#6B7280" />
                <Text style={styles.metaText}>{voyage.placesDisponibles} places</Text>
              </View>
            )}
            {formattedDate && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.metaText}>{formattedDate}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.icon}>{voyage.icon}</Text>
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
    color: '#1F2937',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 2,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  icon: {
    fontSize: 32,
  },
});
