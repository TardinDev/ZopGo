import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface CoachMarkProps {
  visible: boolean;
  message: string;
  title?: string;
  onDismiss: () => void;
  /** chevron points to the element below by default; flip to "up" to point above */
  arrowDirection?: 'down' | 'up';
}

/**
 * One-shot floating hint with a bouncing arrow that points to a target
 * element. Tap-to-dismiss. Caller is responsible for persisting the
 * "seen" flag (utils/coachMarkSeen).
 */
export function CoachMark({
  visible,
  message,
  title,
  onDismiss,
  arrowDirection = 'down',
}: CoachMarkProps) {
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    bounce.value = withRepeat(
      withSequence(
        withTiming(arrowDirection === 'down' ? 6 : -6, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      false
    );
  }, [visible, arrowDirection, bounce]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15)}
      exiting={FadeOutUp.duration(200)}
      style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <Pressable
        onPress={onDismiss}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFBEB',
          borderColor: '#FCD34D',
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 12,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}>
        <Ionicons name="sparkles-outline" size={22} color="#B45309" />
        <View style={{ flex: 1 }}>
          {title && (
            <Text style={{ fontWeight: '700', color: '#92400E', fontSize: 14 }}>{title}</Text>
          )}
          <Text style={{ color: '#78350F', fontSize: 13, marginTop: title ? 2 : 0 }}>
            {message}
          </Text>
        </View>
        <Animated.View style={arrowStyle}>
          <Ionicons
            name={arrowDirection === 'down' ? 'chevron-down' : 'chevron-up'}
            size={22}
            color="#B45309"
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
