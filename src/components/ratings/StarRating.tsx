import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  color?: string;
  editable?: boolean;
  onRatingChange?: (rating: number) => void;
}

interface AnimatedStarProps {
  index: number;
  isFilled: boolean;
  isHalf: boolean;
  size: number;
  color: string;
  editable: boolean;
  onPress: (index: number) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function AnimatedStar({
  index,
  isFilled,
  isHalf,
  size,
  color,
  editable,
  onPress,
}: AnimatedStarProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (!editable) return;

    // Animation de rebond
    scale.value = withSequence(
      withSpring(1.3, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );

    onPress(index);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={!editable}
      activeOpacity={editable ? 0.7 : 1}
      style={[styles.star, animatedStyle]}>
      <Ionicons
        name={isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline'}
        size={size}
        color={isFilled || isHalf ? color : '#D1D5DB'}
      />
    </AnimatedTouchable>
  );
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 24,
  color = '#FFD700',
  editable = false,
  onRatingChange,
}: StarRatingProps) {
  const handleStarPress = (index: number) => {
    onRatingChange?.(index + 1);
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: maxStars }, (_, index) => {
        const isFilled = index < rating;
        const isHalf = index === Math.floor(rating) && rating % 1 >= 0.5;

        return (
          <AnimatedStar
            key={index}
            index={index}
            isFilled={isFilled}
            isHalf={isHalf}
            size={size}
            color={color}
            editable={editable}
            onPress={handleStarPress}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    padding: 2,
  },
});
