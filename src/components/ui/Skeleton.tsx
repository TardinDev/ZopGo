import { View, DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  className?: string;
}

/**
 * Composant Skeleton pour les états de chargement
 */
export const Skeleton = ({ width, height = 100, className }: SkeletonProps) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.3, { duration: 800 })),
      -1
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width || '100%',
          height,
        },
        animatedStyle,
      ]}
      className={`rounded-2xl bg-gray-200 ${className || ''}`}
    />
  );
};

/**
 * Skeleton pour une carte de voyage/hébergement
 */
export const SkeletonCard = () => {
  return (
    <View className="mb-4 rounded-2xl bg-white p-5 shadow-md">
      <Skeleton height={24} className="mb-2" />
      <Skeleton height={16} width="60%" />
    </View>
  );
};

/**
 * Skeleton pour une liste
 */
export const SkeletonList = ({ count = 3 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </>
  );
};
