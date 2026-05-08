import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  iconColor?: string;
  iconSize?: number;
}

/**
 * Empty state with a subtle wiggling icon — used across screens that
 * could otherwise feel dead when there's no content yet.
 */
export const EmptyState = ({
  icon,
  title,
  description,
  iconColor = '#FFFFFF',
  iconSize = 64,
}: EmptyStateProps) => {
  const wiggle = useSharedValue(0);

  useEffect(() => {
    wiggle.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 600 }),
        withTiming(8, { duration: 600 }),
        withTiming(0, { duration: 600 })
      ),
      -1,
      false
    );
  }, [wiggle]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wiggle.value}deg` }],
  }));

  return (
    <View className="items-center justify-center py-20">
      <Animated.View style={iconAnimatedStyle}>
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </Animated.View>
      <Text className="mt-4 text-center text-lg font-semibold text-white">{title}</Text>
      <Text className="mt-2 px-8 text-center text-white/80">{description}</Text>
    </View>
  );
};
