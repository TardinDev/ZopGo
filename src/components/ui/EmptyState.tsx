import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  iconColor?: string;
  iconSize?: number;
}

/**
 * Composant pour afficher un état vide
 */
export const EmptyState = ({
  icon,
  title,
  description,
  iconColor = '#FFFFFF',
  iconSize = 64,
}: EmptyStateProps) => {
  return (
    <View className="items-center justify-center py-20">
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      <Text className="mt-4 text-center text-lg font-semibold text-white">{title}</Text>
      <Text className="mt-2 px-8 text-center text-white/80">{description}</Text>
    </View>
  );
};
