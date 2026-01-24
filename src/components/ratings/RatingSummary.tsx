import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RatingSummaryData } from '../../types';
import { COLORS } from '../../constants';

interface RatingSummaryProps {
  data: RatingSummaryData;
}

export function RatingSummary({ data }: RatingSummaryProps) {
  const maxCount = Math.max(...Object.values(data.distribution));

  return (
    <View style={styles.container}>
      {/* Score principal */}
      <View style={styles.mainScore}>
        <Text style={styles.averageRating}>{data.average.toFixed(1)}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= Math.round(data.average) ? 'star' : 'star-outline'}
              size={20}
              color="#FFD700"
            />
          ))}
        </View>
        <Text style={styles.totalReviews}>{data.total} avis</Text>
      </View>

      {/* Distribution */}
      <View style={styles.distribution}>
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = data.distribution[stars as keyof typeof data.distribution];
          const percentage = maxCount > 0 ? (count / data.total) * 100 : 0;

          return (
            <View key={stars} style={styles.distributionRow}>
              <Text style={styles.starLabel}>{stars}</Text>
              <Ionicons name="star" size={12} color="#FFD700" />
              <View style={styles.barContainer}>
                <View style={[styles.bar, { width: `${percentage}%` }]} />
              </View>
              <Text style={styles.countLabel}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  mainScore: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minWidth: 100,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 4,
    gap: 2,
  },
  totalReviews: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  distribution: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
    gap: 6,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    width: 12,
    textAlign: 'right',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  countLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    width: 28,
    textAlign: 'right',
  },
});
