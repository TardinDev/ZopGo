import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { COLORS } from '../../constants';
import { Stat } from '../../types';

// Le rideau commence en couvrant 4/5 de la carte (96px sur 120px)
// revealOffset: 0 = rideau en position haute (4/5 couvert), 96 = rideau complètement descendu (tout révélé)
const INITIAL_OFFSET = 0; // Position initiale
const MAX_OFFSET = 96; // Maximum de déplacement vers le bas

// Composant pour la carte avec le rideau flou
function RevenueCard({ stat }: { stat: Stat }) {
  const offset = useSharedValue(INITIAL_OFFSET);
  const startOffset = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startOffset.value = offset.value;
    })
    .onUpdate((event) => {
      // Glisser vers le bas = augmenter l'offset (révéler plus)
      const newValue = startOffset.value + event.translationY;
      offset.value = Math.max(0, Math.min(MAX_OFFSET, newValue));
    })
    .onEnd(() => {
      // Retour à la position initiale (4/5 couvert)
      offset.value = withSpring(INITIAL_OFFSET, {
        damping: 20,
        stiffness: 300,
      });
    });

  // Le rideau flou se déplace vers le bas
  const animatedBlurStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <View style={[styles.card, styles.revenueCard]}>
      {/* Contenu de la carte */}
      <View style={[styles.iconContainer, { backgroundColor: getBgColor(stat.color) }]}>
        <Ionicons name={stat.icon as any} size={20} color={getColor(stat.color)} />
      </View>
      <Text style={styles.value}>{stat.value}</Text>
      <Text style={styles.subtitle}>{stat.subtitle}</Text>

      {/* Rideau flou - couvre le haut de la carte */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.blurContainer, animatedBlurStyle]}>
          <BlurView
            intensity={80}
            tint="light"
            experimentalBlurMethod="dimezisBlurView"
            style={styles.blurView}>
            <View style={styles.blurOverlay}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFD700' }}>$</Text>
              <Text style={styles.blurText}>↓ Glisser</Text>
              <View style={styles.dragHandle} />
            </View>
          </BlurView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

interface StatsCardsProps {
  totalTrips: number;
  rating: number;
  totalDeliveries: number;
}

export function StatsCards({ totalTrips, rating, totalDeliveries }: StatsCardsProps) {
  const stats: Stat[] = [
    {
      id: 1,
      title: 'Gains',
      value: '0',
      subtitle: "FCFA aujourd'hui",
      icon: 'cash-outline',
      color: 'green',
    },
    {
      id: 2,
      title: 'Courses',
      value: totalTrips.toString(),
      subtitle: 'Courses totales',
      icon: 'car-outline',
      color: 'blue',
    },
    {
      id: 3,
      title: 'Note',
      value: rating.toFixed(1),
      subtitle: 'Note moyenne',
      icon: 'star-outline',
      color: 'yellow',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {stats.map((stat) =>
          stat.id === 1 ? (
            <RevenueCard key={stat.id} stat={stat} />
          ) : (
            <View key={stat.id} style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: getBgColor(stat.color) }]}>
                <Ionicons name={stat.icon as any} size={20} color={getColor(stat.color)} />
              </View>
              <Text style={styles.value}>{stat.value}</Text>
              <Text style={styles.subtitle}>{stat.subtitle}</Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

function getBgColor(color: string) {
  switch (color) {
    case 'green':
      return '#DCFCE7';
    case 'blue':
      return '#DBEAFE';
    case 'yellow':
      return '#FEF9C3';
    default:
      return '#F3F4F6';
  }
}

function getColor(color: string) {
  switch (color) {
    case 'green':
      return COLORS.success;
    case 'blue':
      return COLORS.info;
    case 'yellow':
      return COLORS.warning;
    default:
      return '#374151';
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  scrollContent: {
    gap: 12,
  },
  card: {
    marginRight: 8,
    width: 150,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 8,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  value: {
    fontSize: 24, // text-2xl
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12, // text-xs
    color: '#4B5563',
  },
  revenueCard: {
    overflow: 'hidden',
    position: 'relative',
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 96, // 4/5 de la carte (couvre 80%)
    borderRadius: 16,
    overflow: 'hidden',
  },
  blurView: {
    flex: 1,
    borderRadius: 16,
  },
  blurOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  blurText: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 4,
  },
});
