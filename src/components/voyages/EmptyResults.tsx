import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LAYOUT } from '../../constants';
import { SPRING_CONFIG, TIMING_CONFIG } from '../../constants/animations';

interface EmptyResultsProps {
  message: string;
  subMessage?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyResults({
  message,
  subMessage,
  icon = 'search-outline',
  actionLabel,
  onAction,
}: EmptyResultsProps) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, SPRING_CONFIG.default);
    opacity.value = withTiming(1, TIMING_CONFIG.normal);
  }, [translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Ionicons name={icon} size={64} color="white" />
      <Text style={styles.message}>{message}</Text>
      {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.actionButton} activeOpacity={0.8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  message: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  subMessage: {
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: LAYOUT.borderRadius.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  actionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
});
