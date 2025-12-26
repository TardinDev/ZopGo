import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.location}>{hebergement.location}</Text>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.price}>{hebergement.price}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFA500" />
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
    color: '#1F2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    color: '#6B7280',
    marginLeft: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: {
    color: '#4B5563',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#4B5563',
    marginLeft: 4,
    fontWeight: '600',
  },
  icon: {
    fontSize: 32,
    marginLeft: 16,
  },
});
