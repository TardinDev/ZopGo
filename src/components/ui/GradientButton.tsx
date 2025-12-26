import { TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface GradientButtonProps extends TouchableOpacityProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  colors?: readonly [string, string, ...string[]];
  onPress: () => void;
  subtitle?: string;
}

/**
 * Bouton avec gradient réutilisable
 */
export const GradientButton = ({
  title,
  subtitle,
  icon,
  colors = COLORS.gradients.blue,
  onPress,
  disabled,
  className,
  ...props
}: GradientButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`overflow-hidden rounded-3xl shadow-xl ${disabled ? 'opacity-50' : ''} ${className || ''}`}
      activeOpacity={0.9}
      {...props}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 24, paddingHorizontal: 24 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">{title}</Text>
            {subtitle && <Text className="mt-1 text-sm text-white/80">{subtitle}</Text>}
          </View>
          {icon && (
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Text className="text-4xl">{icon}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};
